// lib/api.ts — 공용 fetch 래퍼. 매 API 호출마다 인증 헤더/에러 파싱을 반복하지 않게 한다.
import { getToken } from "./auth";

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

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
