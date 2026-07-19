// lib/theme.ts — 라이트/다크 테마. devAuth.ts와 동일하게 localStorage + useSyncExternalStore.
import { useSyncExternalStore } from "react";

const THEME_KEY = "nest_theme";
type Theme = "light" | "dark";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  return (window.localStorage.getItem(THEME_KEY) as Theme) ?? "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return theme;
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  notify();
}

// 앱 시작 시 1회 저장된 테마를 <html>에 반영 (layout.tsx에서 호출)
export function applyStoredTheme() {
  const theme = getSnapshot();
  document.documentElement.classList.toggle("dark", theme === "dark");
}
