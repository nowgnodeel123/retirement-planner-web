// Toast.tsx — D-059: 저장/삭제 액션 피드백. 4초 후 자동 소멸(D-056 타이밍과 통일).
// 다크모드 예외(D-172): bg-neutral-800 고정 — iOS/Android 시스템 토스트처럼 테마와
// 무관하게 항상 어두운 칩으로 고정해야 두 테마 모두에서 배경과 확실히 분리되고
// 눈에 띈다. --surface로 바꾸면 다크모드에서 페이지 배경과 거의 같은 톤이 되어
// (surface #1b1c1f vs bg #101013) 토스트가 있는지조차 알아채기 어려워진다.
"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[calc(420px-40px)] w-[calc(100%-40px)]">
      <div className="flex items-center gap-2 bg-neutral-800 text-white fs-body font-medium rounded-2xl px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          className="flex-shrink-0 text-emerald-400"
        >
          <path
            d="M4 10.5l3.5 3.5L16 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
