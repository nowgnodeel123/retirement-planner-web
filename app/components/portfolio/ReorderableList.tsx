// ReorderableList.tsx — 손잡이(≡)를 잡고 끌어 목록 순서를 바꾼다.
//
// 순서 편집 전용 화면(/portfolio/order, /portfolio/accounts/[id]/order)에서만 쓴다.
// 목록 화면에 인라인으로 넣었다가 걷어냈다 — 계좌 행은 이미 가로 스와이프(수정/삭제)와
// 탭(상세 진입), 세로 스크롤을 쓰고 있어서 드래그까지 얹으면 한 요소에서 네 제스처가
// 경합했다. 전용 화면으로 빼면 그 충돌이 아예 없고, 행을 이름만 남긴 얇은 줄로 그릴 수
// 있어 한 화면에 다 들어오므로 드래그 이동 거리도 짧아진다.
//
// 손잡이는 각 행이 [data-drag-handle] 요소로 직접 그린다.
// 순서는 상위가 관리한다(이 컴포넌트는 저장하지 않는다) — 확인 버튼을 눌러야 저장된다.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

const EDGE = 72; // 화면 위아래 이 거리 안으로 들어오면 자동 스크롤
const EDGE_SPEED = 12;

type Rect = { top: number; height: number };

export function DragHandle() {
  return (
    <span
      data-drag-handle
      aria-label="순서 옮기기"
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{
        width: 40,
        height: 40,
        marginRight: -8,
        color: "var(--text-faint)",
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M4 9h16M4 15h16" />
      </svg>
    </span>
  );
}

export function ReorderableList<T>({
  items,
  getId,
  onOrderChange,
  renderItem,
}: {
  items: T[];
  getId: (item: T) => number;
  /** 드롭 시점의 새 순서. 저장은 상위가 확인 버튼에서 한다. */
  onOrderChange: (next: T[]) => void;
  renderItem: (item: T, state: { dragging: boolean }) => React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  // 자리를 비켜줄 거리. 드래그 시작 시점에 확정해 두면 렌더 중 ref를 읽지 않아도 된다.
  const [activeHeight, setActiveHeight] = useState(0);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rectsRef = useRef<Rect[]>([]);
  const overRef = useRef<number | null>(null);
  // 햅틱용 — overRef는 이펙트로 갱신돼 같은 틱 안에서는 이전 값이라
  // "방금 한 칸 넘어갔는지" 판정에 쓸 수 없다. 여기서 동기적으로 들고 간다.
  const lastOverRef = useRef<number | null>(null);
  useEffect(() => {
    overRef.current = overIndex;
  }, [overIndex]);

  // 드래그 중 setState로 리렌더가 계속 일어난다. 이 값들이 이펙트 의존성에 들어가면
  // 리스너가 드래그 도중 재부착되어 제스처가 끊기므로 전부 ref로만 읽는다.
  // 대입은 렌더가 아니라 커밋 이후에 한다(렌더를 순수하게 유지 — react-hooks/refs).
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onOrderChange);
  useEffect(() => {
    itemsRef.current = items;
    onChangeRef.current = onOrderChange;
  });

  // 순서가 바뀌면 행 index ↔ DOM 매핑이 달라지므로 리스너를 다시 붙여야 한다.
  const idsKey = useMemo(() => items.map(getId).join(","), [items, getId]);

  useEffect(() => {
    const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];
    if (rows.length < 2) return;

    const st = { startY: 0, lastY: 0, index: -1, active: false, raf: 0 };

    function blockTouchMove(e: TouchEvent) {
      e.preventDefault();
    }

    /** 화면 가장자리에 오래 머물면 목록을 따라 스크롤한다(긴 목록 대응). */
    function edgeScroll() {
      if (!st.active) return;
      const y = st.lastY;
      let dy = 0;
      if (y < EDGE) dy = -EDGE_SPEED * (1 - y / EDGE);
      else if (y > window.innerHeight - EDGE) {
        dy = EDGE_SPEED * (1 - (window.innerHeight - y) / EDGE);
      }
      if (dy !== 0) {
        window.scrollBy(0, dy);
        // 스크롤하면 화면상 좌표가 밀리므로 기준 사각형도 같이 민다.
        rectsRef.current = rectsRef.current.map((r) => ({ ...r, top: r.top - dy }));
        recompute();
      }
      st.raf = requestAnimationFrame(edgeScroll);
    }

    function recompute() {
      const rects = rectsRef.current;
      const active = st.index;
      if (!rects[active]) return;
      const dy = st.lastY - st.startY;
      setOffsetY(dy);
      const activeMid = rects[active].top + rects[active].height / 2;
      const center = activeMid + dy;

      let over = active;
      if (center < activeMid) {
        for (let i = 0; i < active; i++) {
          if (center < rects[i].top + rects[i].height / 2) {
            over = i;
            break;
          }
        }
      } else {
        for (let i = rects.length - 1; i > active; i--) {
          if (center > rects[i].top + rects[i].height / 2) {
            over = i;
            break;
          }
        }
      }
      if (over !== lastOverRef.current) {
        lastOverRef.current = over;
        haptic("step");
      }
      setOverIndex(over);
    }

    function onPointerMove(e: PointerEvent) {
      if (!st.active) return;
      e.preventDefault();
      st.lastY = e.clientY;
      recompute();
    }

    function finish(commit: boolean) {
      const wasActive = st.active;
      const from = st.index;
      const to = overRef.current;
      st.active = false;
      cancelAnimationFrame(st.raf);
      document.removeEventListener("touchmove", blockTouchMove);
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);

      if (commit && wasActive && to !== null && from !== to) {
        const next = [...itemsRef.current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChangeRef.current(next);
        // 순서가 실제로 바뀐 경우에만 — 제자리에 놓았는데 확정감을 주면 거짓 신호다.
        haptic("drop");
      }
      lastOverRef.current = null;
      setActiveIndex(null);
      setOverIndex(null);
      setOffsetY(0);
    }

    function onPointerUp() {
      finish(true);
    }
    function onPointerCancel() {
      finish(false);
    }

    const bound: { el: Element; fn: (e: Event) => void }[] = [];
    rows.forEach((row, index) => {
      const handle = row.querySelector("[data-drag-handle]");
      if (!handle) return;

      const fn = (ev: Event) => {
        const e = ev as PointerEvent;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        st.startY = e.clientY;
        st.lastY = e.clientY;
        st.index = index;
        st.active = true;

        rectsRef.current = (
          rowRefs.current.filter(Boolean) as HTMLDivElement[]
        ).map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, height: r.height };
        });

        document.addEventListener("touchmove", blockTouchMove, { passive: false });
        document.body.style.userSelect = "none";
        window.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerCancel);

        lastOverRef.current = index;
        haptic("grab");

        setActiveIndex(index);
        setOverIndex(index);
        setOffsetY(0);
        setActiveHeight(rectsRef.current[index]?.height ?? 0);
        st.raf = requestAnimationFrame(edgeScroll);
      };

      handle.addEventListener("pointerdown", fn);
      bound.push({ el: handle, fn });
    });

    return () => {
      bound.forEach(({ el, fn }) => el.removeEventListener("pointerdown", fn));
      cancelAnimationFrame(st.raf);
      document.removeEventListener("touchmove", blockTouchMove);
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [idsKey]);

  /** 드래그 중인 행이 지나간 자리를 다른 행들이 비켜준다. */
  function shiftFor(index: number) {
    if (activeIndex === null || overIndex === null || index === activeIndex) {
      return 0;
    }
    const gap = 8;
    const h = activeHeight;
    if (overIndex > activeIndex && index > activeIndex && index <= overIndex) {
      return -(h + gap);
    }
    if (overIndex < activeIndex && index >= overIndex && index < activeIndex) {
      return h + gap;
    }
    return 0;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const dragging = index === activeIndex;
        return (
          <div
            key={getId(item)}
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            style={{
              transform: dragging
                ? `translateY(${offsetY}px) scale(1.02)`
                : `translateY(${shiftFor(index)}px)`,
              transition: dragging
                ? "none"
                : "transform 0.2s cubic-bezier(0.32,0.72,0,1)",
              position: dragging ? "relative" : undefined,
              zIndex: dragging ? 20 : undefined,
              borderRadius: dragging ? 16 : undefined,
              boxShadow: dragging ? "0 10px 24px rgba(15,23,42,0.22)" : undefined,
              opacity: activeIndex !== null && !dragging ? 0.6 : 1,
            }}
          >
            {renderItem(item, { dragging })}
          </div>
        );
      })}
    </div>
  );
}
