// ScrollableList.tsx — 목록이 길어지면 목록 안에서만 스크롤되게 감싼다.
//
// 왜: 계좌나 종목이 늘어나면 화면 위쪽 요약(총자산·도넛·기간 필터)이 전부 밀려 올라가서,
// 목록을 보려면 매번 페이지를 길게 스크롤해야 했다. 요약은 고정해두고 목록만 움직이는 게
// 훑어보기에 낫다.
//
// 높이를 왜 재는가: 처음엔 `max(320px, 52vh)` 같은 고정 비율로 잡았는데, 위쪽 요약이
// 얼마나 차지하는지를 모르니 목록 아래쪽이 그대로 화면 밖으로 나갔다. 그래서 이 요소의
// 문서상 위치를 재서 "화면에 남은 높이"를 직접 계산한다. 남는 높이가 너무 작아지면
// minHeight로 바닥을 깔고, 그때는 페이지가 조금 스크롤되는 걸 받아들인다 —
// 목록이 두어 줄로 쪼그라드는 것보다 낫다.
//
// 설계 메모
// - overscrollBehavior: "contain" — 목록 끝까지 스크롤했을 때 페이지가 이어서 딸려
//   움직이는 것(스크롤 체이닝)을 막는다. 이게 없으면 목록을 넘길 때마다 화면이 튄다.
// - overflowX는 hidden. 안쪽 SwipeRow가 가로로 밀리는 걸 자기 안에서 이미 클립하지만,
//   둥근 모서리를 유지하려면 두 축 모두 잘라야 한다.
// - padded: 카드가 개별로 떠 있는 목록(계좌)은 그림자가 잘리지 않게 안쪽 여백을 주고
//   같은 크기의 음수 마진으로 상쇄한다. 한 장짜리 카드(보유 자산)는 필요 없다.
"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollableList({
  children,
  className,
  style,
  padded = false,
  /** 하단 탭바 + 숨 쉴 여백. 목록 바닥이 탭바에 가리지 않도록 빼둔다. */
  bottomInset = 104,
  minHeight = 260,
  /** 위쪽 콘텐츠 높이가 바뀌는 값(로딩 완료 등)을 넘기면 다시 잰다. */
  recomputeKey,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padded?: boolean;
  bottomInset?: number;
  minHeight?: number;
  recomputeKey?: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const el = ref.current;
      if (!el) return;
      // 문서 기준 위치로 남은 높이를 잡는다.
      // (getBoundingClientRect().top + scrollY라 페이지가 스크롤돼 있어도 같은 값이 나온다)
      const docTop = el.getBoundingClientRect().top + window.scrollY;
      setMaxHeight(
        Math.max(minHeight, window.innerHeight - docTop - bottomInset),
      );
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [bottomInset, minHeight, recomputeKey]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        // 재기 전(첫 페인트)에는 제한을 걸지 않는다. 잘못된 높이로 한 번 그렸다가
        // 바로잡히면 목록이 눈에 띄게 튄다.
        ...(maxHeight !== null
          ? {
              maxHeight,
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
            }
          : null),
        ...(padded ? { padding: "4px 6px", margin: "-4px -6px" } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
