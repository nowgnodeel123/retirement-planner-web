// lib/api.ts — 공용 fetch 래퍼. 매 API 호출마다 인증 헤더/에러 파싱을 반복하지 않게 한다.
// RTR 도입(D-161/M14) — accessToken이 15분으로 짧아진 대신, 401을 만나면 이 레이어가
// refreshToken으로 조용히 갱신 후 원래 요청을 1회 재시도한다(백로그 "401 전역 처리" 해소).
// 갱신도 실패하면(리프레시 토큰 만료/탈취 감지 등) 토큰을 지우고 /login으로 보낸다.
import { getToken, getRefreshToken, setTokens, clearTokens } from "./auth";
import { getCached, setCached, clearCache, dedupe } from "./cache";

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

/**
 * 한 요청이 여기까지만 기다린다.
 *
 * WHY: 원래 타임아웃이 아예 없었다. 서버가 죽은 게 아니라 **응답만 안 하는** 상태
 * (Railway 콜드스타트, DB 커넥션 고갈, 네트워크 블랙홀)에서는 fetch가 브라우저 기본
 * 한계까지 매달려 있고, 그동안 화면은 스켈레톤만 계속 돌린다. 실제로 백엔드를 멈춰놓고
 * 확인해 보니 포트폴리오 화면이 오류도 재시도 버튼도 없이 12초 넘게 껍데기만 뛰었다.
 * 사용자 입장에선 "고장"과 구분이 안 되는데, 앱은 자기가 실패했다는 걸 모른다.
 *
 * 15초인 이유: 콜드스타트가 있는 백엔드를 한 번은 기다려 줄 만큼 길고,
 * "이건 안 되는구나"를 알려주기에는 충분히 짧은 선.
 *
 * AbortSignal.timeout() 대신 AbortController를 쓰는 건 구형 iOS 사파리 대응이다.
 */
const TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 네트워크 단계에서 끝난 실패(응답 자체가 없음)를 화면이 다룰 수 있는 에러로 바꾼다.
 * status 0은 "HTTP 응답이 없었다"는 뜻으로 쓴다 — 어떤 상태코드와도 겹치지 않는다.
 */
function toNetworkError(e: unknown): ApiError {
  const aborted = e instanceof DOMException && e.name === "AbortError";
  return new ApiError(
    0,
    aborted
      ? "서버가 응답하지 않아요. 잠시 후 다시 시도해주세요."
      : "연결에 실패했어요. 네트워크 상태를 확인해주세요.",
  );
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
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/refresh`, {
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

  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (e) {
    // 여기서 ApiError로 바꿔야 화면들의 `e instanceof ApiError` 분기가 작동해서
    // 기존 오류 배너·재시도 버튼이 그대로 뜬다. 날것의 TypeError로 새어나가면
    // 각 화면이 "저장에 실패했어요" 같은 기본 문구로 뭉개거나 아무것도 안 한다.
    throw toNetworkError(e);
  }

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

// 변경 요청은 성공한 뒤 캐시를 통째로 비운다 — 어느 키가 영향받는지 고르지 않는다(lib/cache.ts 참고).
async function mutate<T>(path: string, options: RequestInit): Promise<T> {
  const result = await request<T>(path, options);
  clearCache();
  return result;
}

export const api = {
  /**
   * 조회는 30초 캐시를 탄다(lib/cache.ts). 화면을 오갈 때 같은 조회를 반복하지 않기 위한 것이다.
   * 저장 직후처럼 반드시 최신이어야 하는 자리는 `fresh: true`로 건너뛸 수 있지만,
   * 변경 요청이 이미 캐시를 비우므로 보통은 필요 없다.
   */
  get: async <T>(path: string, options?: { fresh?: boolean }): Promise<T> => {
    if (!options?.fresh) {
      const hit = getCached<T>(path);
      if (hit !== undefined) return hit;
    }
    // 같은 조회가 이미 떠 있으면 새로 보내지 않고 그 결과를 함께 기다린다.
    return dedupe(path, async () => {
      const data = await request<T>(path);
      // 204(본문 없음)는 캐시하지 않는다 — undefined는 "캐시 없음"과 구분되지 않는다.
      if (data !== undefined) setCached(path, data);
      return data;
    });
  },
  post: <T>(path: string, body: unknown) =>
    mutate<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    mutate<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string, body?: unknown) =>
    mutate<void>(path, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};
