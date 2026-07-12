// lib/devAuth.ts
// WHY: 프론트-로그인 연동은 M12 스코프. 그 전까지는 카카오 로그인 성공 후
// 리다이렉트 주소창(app.frontend-callback-url)에 노출되는 accessToken을 수동으로
// 붙여넣어 로컬에 저장해두고 포트폴리오 API를 테스트한다.
// M12에서 실제 OAuth 콜백 라우트(/auth/callback)가 이 역할을 대체하면 이 파일은 삭제한다.
import { useSyncExternalStore } from "react";

const TOKEN_KEY = "nest_dev_token";
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

/** 컴포넌트에서 토큰 유무를 구독한다. SSR에서는 항상 null(비로그인)로 렌더된다. */
export function useDevToken() {
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
