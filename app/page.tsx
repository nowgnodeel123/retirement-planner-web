// app/page.tsx — 앱 진입점(/). 로그인은 무조건 필수이고, 로그인하면 기본 화면인
// 포트폴리오 탭으로 보낸다. 비로그인이면 로그인 화면으로 보낸다(D-201).
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/portfolio" : "/login");
  }, [router]);

  // 판정이 끝나기 전 한 프레임 동안 흰 화면이 보이던 자리 — 스피너로 메운다.
  return (
    <div className="flex justify-center pt-32">
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
      />
    </div>
  );
}
