// lib/api.ts — 공용 fetch 래퍼. 매 API 호출마다 인증 헤더/에러 파싱을 반복하지 않게 한다.
// RTR 도입(D-161/M14) — accessToken이 15분으로 짧아진 대신, 401을 만나면 이 레이어가
// refreshToken으로 조용히 갱신 후 원래 요청을 1회 재시도한다(백로그 "401 전역 처리" 해소).
// 갱신도 실패하면(리프레시 토큰 만료/탈취 감지 등) 토큰을 지우고 /login으로 보낸다.
import { getToken, getRefreshToken, setTokens, clearTokens } from "./auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// 동시에 여러 요청이 401을 만나도 refresh는 한 번만 — RTR은 refreshToken을 1회용으로
// 소진하므로, 두 요청이 동시에 갱신을 시도하면 뒤의 요청이 "재사용"으로 오판정되어
// 세션 전체가 끊길 수 있다. 진행 중인 갱신 Promise를 공유해서 이를 막는다.
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (!res.ok) return false;

      const body = await res.json();
      setTokens(body.accessToken, body.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 갱신 자체가 401을 반환하는 경우(리프레시 토큰도 만료/탈취) 무한 재시도를 막는다.
  const isRefreshCall = path === "/api/auth/refresh";

  if (res.status === 401 && token && !isRetry && !isRefreshCall) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    // 백엔드 에러 응답 필드명이 핸들러별로 다르다(GlobalExceptionHandler={error,fields},
    // AuthExceptionHandler={message}) — 통일은 백로그, 우선 둘 다 흡수.
    const message =
      body?.message ?? body?.error ?? "요청 처리 중 문제가 발생했어요.";
    throw new ApiError(res.status, message, body?.fields);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
