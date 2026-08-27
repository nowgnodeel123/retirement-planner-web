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

  return null;
}
