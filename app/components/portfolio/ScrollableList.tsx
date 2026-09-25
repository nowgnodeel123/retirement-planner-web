// ScrollableList.tsx — 목록이 길어지면 목록 안에서만 스크롤되게 감싼다.
//
// 왜: 종목이 늘어나면 화면 위쪽 요약(총평가금액·손익)이 전부 밀려 올라가서, 목록을 보려면
// 매번 페이지를 길게 스크롤해야 했다. 요약은 고정해두고 목록만 움직이는 게 훑어보기에 낫다.
//
// 쓰는 곳은 계좌 상세의 보유 자산 목록 하나다. 포트폴리오 메인의 계좌 목록도 예전엔 이걸
// 썼는데, 사용자 요청으로 걷어냈다 — 한 화면에 세로 스크롤 영역이 둘이면 어느 쪽이 움직이는지
// 손가락을 대보기 전엔 알 수 없다.
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
// - maxItems: "N개까지만 보이고 그 다음부터는 목록 안에서 스크롤". 화면에 남은 높이가
//   아니라 실제 항목 높이를 재서 자른다 — 항목 높이는 손익 줄 유무나 긴 종목명 줄바꿈으로
//   행마다 다르고, 기기 폭에 따라서도 달라져서 상수로 박으면 N번째 항목이 어중간하게
//   잘린다. 남은 화면 높이 제한과는 둘 중 작은 쪽을 쓴다(작은 화면에서 목록이 탭바를
//   덮지 않게). 항목이 N개 이하면 아무것도 자르지 않는다 — 이때 스크롤 컨테이너로
//   만들어두면 마지막 카드의 그림자가 잘린다.
"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollableList({
  children,
  className,
  style,
  /** 하단 탭바 + 숨 쉴 여백. 목록 바닥이 탭바에 가리지 않도록 빼둔다. */
  bottomInset = 104,
  minHeight = 260,
  /** N개까지만 보이게 높이를 자른다. 넘기지 않으면 화면에 남은 높이만 제한한다. */
  maxItems,
  /** 위쪽 콘텐츠 높이가 바뀌는 값(로딩 완료 등)을 넘기면 다시 잰다. */
  recomputeKey,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  bottomInset?: number;
  minHeight?: number;
  maxItems?: number;
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
      const remaining = Math.max(
        minHeight,
        window.innerHeight - docTop - bottomInset,
      );

      if (!maxItems) {
        setMaxHeight(remaining);
        return;
      }

      const items = Array.from(el.children) as HTMLElement[];
      if (items.length <= maxItems) {
        // 자를 것이 없다 — 제한을 걸지 않아야 카드 그림자가 온전히 보인다.
        setMaxHeight(null);
        return;
      }

      // 실제 항목 높이 + 사이 간격. gap은 인라인 style로 --rhythm-* 토큰이 들어오므로
      // 계산된 값을 읽는다(px로 해석된 뒤라 parseFloat로 바로 쓸 수 있다).
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      let itemsHeight = 0;
      for (let i = 0; i < maxItems; i++) {
        itemsHeight += items[i].getBoundingClientRect().height;
      }
      itemsHeight += gap * (maxItems - 1);
      // 다음 항목이 살짝 걸쳐 보이게 gap의 절반을 더한다 — 딱 맞게 자르면 아래에 더
      // 있다는 신호가 사라져서 스크롤할 생각을 안 하게 된다.
      itemsHeight += gap / 2;

      setMaxHeight(Math.min(remaining, Math.round(itemsHeight)));
    };

    compute();
    // 항목 높이는 시세·요약이 늦게 도착하면서 바뀐다. resize만 듣고 있으면 처음 잰
    // 높이에 그대로 머물러 3번째 카드가 잘린 채로 남는다.
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(compute) : null;
    if (ro && ref.current) {
      ro.observe(ref.current);
      for (const child of Array.from(ref.current.children)) ro.observe(child);
    }
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("resize", compute);
      ro?.disconnect();
    };
  }, [bottomInset, minHeight, maxItems, recomputeKey]);

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
        ...style,
      }}
    >
      {children}
    </div>
  );
}
