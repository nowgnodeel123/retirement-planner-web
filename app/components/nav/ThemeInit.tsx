// 저장된 화면 설정(테마 + 글자 크기)을 앱 시작 시 <html>에 한 번 반영한다.
// 이름은 ThemeInit 그대로 두되 다루는 범위가 "화면 설정"으로 넓어졌다 —
// 둘 다 <html> 속성으로 적용되고 같은 시점에 필요해서 진입점을 나눌 이유가 없다.
"use client";
import { useEffect } from "react";
import { applyStoredTheme } from "@/lib/theme";
import { applyStoredFontScale } from "@/lib/fontScale";

export default function ThemeInit() {
  useEffect(() => {
    applyStoredTheme();
    applyStoredFontScale();
  }, []);
  return null;
}
