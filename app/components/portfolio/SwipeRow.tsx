// SwipeRow.tsx — 좌측 스와이프로 수정·삭제 원형 버튼을 노출한다.
// 계좌 목록과 계좌 안 자산(종목) 목록이 함께 쓴다(원래 SwipeAccountRow였으나
// 구현이 계좌에 의존하는 데가 없어 기능 중립 이름으로 바꿨다).
// D-201: 세 가지 입력을 모두 받는다 —
//   1) 터치 드래그(모바일, 1차 표면)
//   2) 마우스 클릭-드래그(데스크톱)
//   3) 트랙패드 두 손가락 가로 스와이프(맥) = wheel 이벤트의 deltaX
// 포인터/휠 리스너를 전부 네이티브(addEventListener)로 붙인다 — React 합성 onPointerDown이
// 이 트리(안쪽 Next <Link>)에서 신뢰성 있게 안 불리는 경우가 있었고, wheel은 passive라
// preventDefault가 안 먹어서다. setPointerCapture는 쓰지 않는다(캡처 시 안쪽 <a>가
// click을 못 받아 상세 진입 불가, D-184). 안쪽 <a>의 기본 draggable도 꺼야 마우스
// 드래그가 "링크 드래그"로 새지 않는다.
// 실제 가로 이동이 확인되기 전엔 아무것도 안 건드려 평범한 탭/세로 스크롤은 무간섭.
// 드래그/스와이프 직후 350ms만 click을 캡처 단계에서 막는다.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACTION_WIDTH = 128;
const DRAG_THRESHOLD = 10;
const WHEEL_SETTLE_MS = 180;

const openRowClosers = new Set<() => void>();

const clamp = (v: number) => Math.min(0, Math.max(-ACTION_WIDTH, v));

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
    </svg>
  );
}

export function SwipeRow({
  children,
  onEdit,
  onDelete,
  editLabel = "수정",
  deleteLabel = "삭제",
}: {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  const [tx, setTx] = useState(0);
  const [animate, setAnimate] = useState(true);
  const txRef = useRef(0);

  const fgRef = useRef<HTMLDivElement>(null);
  const justInteractedRef = useRef(false);

  const closeSelf = useCallback(() => {
    setAnimate(true);
    setTx(0);
  }, []);
  const closeRef = useRef(closeSelf);
  const stableClose = useRef(() => closeRef.current());

  // 네이티브 리스너가 최신 값을 읽어야 해서 ref로 들고 있지만, 대입은 렌더가 아니라
  // 커밋 이후에 한다 — 렌더 중 ref를 건드리면 React가 렌더를 버릴 때 값이 어긋난다.
  useEffect(() => {
    txRef.current = tx;
    closeRef.current = closeSelf;
  });

  const markInteracted = useCallback(() => {
    justInteractedRef.current = true;
    window.setTimeout(() => {
      justInteractedRef.current = false;
    }, 350);
  }, []);

  const snap = useCallback((from: number) => {
    const open = from < -ACTION_WIDTH / 2;
    if (open) {
      openRowClosers.forEach((fn) => {
        if (fn !== stableClose.current) fn();
      });
    }
    setAnimate(true);
    setTx(open ? -ACTION_WIDTH : 0);
  }, []);

  useEffect(() => {
    const el = fgRef.current;
    if (!el) return;
    const c = stableClose.current;
    openRowClosers.add(c);

    const st = { startX: 0, startY: 0, startTx: 0, tracking: false, active: false };
    let wheelTimer: number | null = null;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      st.startX = e.clientX;
      st.startY = e.clientY;
      st.startTx = txRef.current;
      st.tracking = true;
      st.active = false;
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }
    function onPointerMove(e: PointerEvent) {
      if (!st.tracking) return;
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (!st.active) {
        if (Math.abs(dy) > DRAG_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
          st.tracking = false;
          detach();
          return;
        }
        if (Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          st.active = true;
          setAnimate(false);
        } else {
          return;
        }
      }
      e.preventDefault();
      setTx(clamp(st.startTx + dx));
    }
    function onPointerUp() {
      const wasActive = st.active;
      st.tracking = false;
      st.active = false;
      detach();
      if (wasActive) {
        markInteracted();
        snap(txRef.current);
      }
    }
    function detach() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return;
      e.preventDefault();
      setAnimate(false);
      setTx(clamp(txRef.current - e.deltaX));
      if (wheelTimer) window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        markInteracted();
        snap(txRef.current);
      }, WHEEL_SETTLE_MS);
    }

    function onDragStart(e: DragEvent) {
      e.preventDefault();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dragstart", onDragStart);

    return () => {
      openRowClosers.delete(c);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dragstart", onDragStart);
      detach();
      if (wheelTimer) window.clearTimeout(wheelTimer);
    };
  }, [markInteracted, snap]);

  function handleClickCapture(e: React.MouseEvent) {
    if (justInteractedRef.current || txRef.current !== 0) {
      e.preventDefault();
      e.stopPropagation();
      if (txRef.current !== 0) closeSelf();
    }
  }

  const progress = Math.min(1, Math.abs(tx) / ACTION_WIDTH);

  return (
    // 바깥 래퍼: 카드 그림자 담당(안쪽 overflow-hidden에 잘리지 않게).
    <div style={{ borderRadius: 20, boxShadow: "var(--card-shadow)" }}>
    {/* 안쪽: 스와이프로 카드가 왼쪽으로 밀려 나가는 부분을 클립 */}
    <div className="relative overflow-hidden" style={{ borderRadius: 20 }}>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-3"
        style={{ width: ACTION_WIDTH }}
      >
        {[
          { label: editLabel, onClick: onEdit, Icon: PencilIcon, bg: "var(--surface-pressed)", fg: "var(--text-sub)" },
          { label: deleteLabel, onClick: onDelete, Icon: TrashIcon, bg: "var(--error)", fg: "#fff" },
        ].map(({ label, onClick, Icon, bg, fg }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => {
              closeSelf();
              onClick();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center pressable"
            style={{
              background: bg,
              color: fg,
              transform: `scale(${0.6 + 0.4 * progress})`,
              opacity: progress,
              transition: animate
                ? "transform 0.22s cubic-bezier(0.32,0.72,0,1), opacity 0.22s ease"
                : "none",
            }}
          >
            <Icon />
          </button>
        ))}
      </div>

      <div
        ref={fgRef}
        onClickCapture={handleClickCapture}
        style={{
          transform: `translateX(${tx}px)`,
          transition: animate
            ? "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          background: "var(--surface)",
          borderRadius: 20,
        }}
      >
        {children}
      </div>
    </div>
    </div>
  );
}
