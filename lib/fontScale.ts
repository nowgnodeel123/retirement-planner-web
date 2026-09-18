// lib/fontScale.ts — 사용자가 고르는 글자 크기(작게/보통/크게).
// theme.ts와 같은 방식(localStorage + useSyncExternalStore)으로 맞춰, 화면 설정이
// 저장되는 경로를 두 가지로 늘리지 않는다.
//
// 값을 <html data-font-scale>에 얹고 실제 크기는 globals.css의 --fs-scale이 계산한다 —
// 크기를 쓰는 쪽(.fs-* / .fs-px-* 클래스)이 전부 그 변수를 거치므로 화면 코드는
// 이 설정을 몰라도 된다.
import { useSyncExternalStore } from "react";

const FONT_SCALE_KEY = "nest_font_scale";

export type FontScale = "small" | "normal" | "large";

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  small: "작게",
  normal: "보통",
  large: "크게",
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function read(): FontScale {
  // 사파리 프라이빗 모드 등에서 localStorage 접근 자체가 던질 수 있다.
  // 글자 크기 때문에 화면이 통째로 안 뜨는 건 말이 안 되므로 기본값으로 흡수한다.
  try {
    const raw = window.localStorage.getItem(FONT_SCALE_KEY);
    return raw === "small" || raw === "large" ? raw : "normal";
  } catch {
    return "normal";
  }
}

function getServerSnapshot(): FontScale {
  return "normal";
}

function apply(scale: FontScale) {
  // "보통"은 속성을 아예 지운다 — :root 기본값(--fs-scale: 1)이 그대로 쓰이게 해서
  // 기본 상태에서 계산이 한 겹 더 끼지 않도록.
  if (scale === "normal") {
    document.documentElement.removeAttribute("data-font-scale");
  } else {
    document.documentElement.setAttribute("data-font-scale", scale);
  }
}

export function useFontScale(): FontScale {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

export function setFontScale(scale: FontScale) {
  try {
    window.localStorage.setItem(FONT_SCALE_KEY, scale);
  } catch {
    // 저장이 안 돼도 이번 세션에는 적용해준다.
  }
  apply(scale);
  notify();
}

/** 앱 시작 시 1회 저장된 값을 <html>에 반영 (ThemeInit에서 호출) */
export function applyStoredFontScale() {
  apply(read());
}
