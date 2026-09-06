// lib/auth.ts — accessToken/refreshToken 저장/구독. 카카오 OAuth 콜백(/auth/callback)과
// 이메일 로그인/회원가입 응답 양쪽 모두 이 모듈을 통해 토큰을 저장한다.
// RTR 도입(D-161/M14) — accessToken은 15분으로 짧아졌고, refreshToken 회전으로
// 세션을 이어간다(lib/api.ts가 401 시 자동 갱신). 매 회전마다 refreshToken도 바뀌므로
// 두 토큰은 항상 쌍으로 저장/갱신한다.
import { useSyncExternalStore } from "react";
import { clearCache } from "./cache";

const TOKEN_KEY = "nest_access_token";
const REFRESH_TOKEN_KEY = "nest_refresh_token";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function getServerSnapshot() {
  return null;
}

/** 컴포넌트에서 로그인 여부를 구독한다. SSR에서는 항상 null(비로그인)로 렌더된다. */
export function useToken() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// api.ts처럼 훅을 쓸 수 없는 곳(fetch 래퍼)에서 쓰는 일회성 읽기.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** 로그인/회원가입/카카오 콜백/토큰 갱신 — 항상 두 토큰을 쌍으로 저장한다. */
export function setTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // 로그아웃을 거치지 않고 다른 계정으로 로그인하는 경로가 있어, 저장 시점에도 캐시를 버린다.
  // 토큰 갱신(RTR)에서도 불리지만 캐시를 한 번 더 비우는 비용은 무시할 만하고,
  // 반대로 남겨서 앞 사람 데이터가 보이는 쪽이 훨씬 나쁘다.
  clearCache();
  notify();
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  // 조회 캐시도 함께 버린다 — 성능이 아니라 프라이버시다. 같은 브라우저에서 다른 계정으로
  // 로그인했을 때 앞 사람의 잔액이 잠깐이라도 보이면 안 된다.
  clearCache();
  notify();
}
