// app/auth/callback/page.tsx — 카카오 OAuth2 콜백 (M12)
// 백엔드 OAuth2SuccessHandler가 app.frontend-callback-url(=/auth/callback)로
// accessToken을 쿼리파라미터에 실어 리다이렉트한다. 여기서 저장만 하고 이동시킨다.
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    if (accessToken) {
      setToken(accessToken);
      router.replace("/portfolio");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-24 text-center">
      <p className="text-sm text-[var(--text-faint)]">로그인 처리 중이에요...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
