// RequireAuth.tsx — 로그인 필요 화면 진입 전 로그인 여부를 확인한다.
// 비로그인 상태면 /login으로 보낸다. (M12: DevTokenGate 대체, M13: 포트폴리오 전용에서
// 기능 중립 위치로 이동해 은퇴시뮬레이터 화면과 공유)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // getToken()을 useSyncExternalStore(useToken) 대신 여기서 직접 읽는 이유:
  // 새로고침 직후에는 SSR 스냅샷(null)과 실제 localStorage 값이 어긋나는
  // 순간이 있어, 그 값을 그대로 리다이렉트 조건으로 쓰면 로그인 상태인데도
  // /login으로 튕기는 경쟁 상태가 생긴다. mount 후 1회 직접 읽어 확정한다.
  useEffect(() => {
    if (getToken() === null) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
