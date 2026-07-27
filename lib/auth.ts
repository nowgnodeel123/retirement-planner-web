// lib/auth.ts — accessToken 저장/구독. 카카오 OAuth 콜백(/auth/callback)과
// 이메일 로그인/회원가입 응답 양쪽 모두 이 모듈을 통해 토큰을 저장한다.
import { useSyncExternalStore } from "react";

const TOKEN_KEY = "nest_access_token";
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

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  notify();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  notify();
}
