// SwipeableRow.tsx — iOS 메일/설정 앱 스타일 좌측 스와이프로 수정·삭제 노출.
// D-175: 기존엔 화면 상단 "관리" 버튼을 눌러 전체 목록을 편집모드로 바꾸고
// 카드마다 연필/휴지통 아이콘이 항상 붙어있는 방식이었다. 목록 전체 상태를
// 하나 더 두지 않고, 각 행이 자기 스와이프 상태만 갖는 iOS 네이티브 패턴이
// 훨씬 직접적이라고 판단해 교체 — "편집하고 싶은 항목만" 바로 반응한다.
"use client";

import { useEffect, useRef, useState } from "react";

const ACTION_WIDTH = 128; // 액션 2개 × 64px(터치 타겟)

// 여러 행 중 하나가 열리면 나머지는 자동으로 닫히게 하는 공유 레지스트리.
// 컨텍스트/상태관리 없이도 iOS 리스트처럼 "한 번에 하나만 열려있는" 느낌을 낸다.
const openRowClosers = new Set<() => void>();

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
    </svg>
  );
}

export function SwipeableRow({
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
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  // WHY ref: setDragging(true) 직후 같은 이벤트 틱에서 pointermove가 바로 이어지면
  // (특히 프로그래밍적으로 빠르게 발생하는 드래그 시뮬레이션에서) React state 업데이트가
  // 아직 반영되기 전이라 handlePointerMove의 `dragging` 클로저 값이 여전히 false라
  // 조기 리턴되는 레이스 컨디션이 실제 QA에서 발견됐다 — "드래그를 크게 해도 거의
  // 안 움직인다"는 증상. ref는 즉시 반영되므로 이 문제가 없다. dragging state는
  // CSS transition on/off 스위치 용도로만 남겨둔다.
  const draggingActiveRef = useRef(false);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const draggedRef = useRef(false);
  // WHY: 이미 열려 있던 행을 다시 탭해 "닫기"로 취급해야 하는 경우와, 방금
  // 이 제스처의 드래그로 막 열린 행에 뒤이어 오는 마무리 클릭을 구분하기 위한
  // 값. 제스처 시작 시점(pointerdown)의 열림 상태를 기억해둔다 — 자세한 이유는
  // handleForegroundClick 주석 참고.
  const wasOpenAtGestureStartRef = useRef(false);

  const close = () => setTranslateX(0);

  // WHY ref: `close`는 매 렌더마다 새로 생성되는 함수라서, openRowClosers Set에
  // 마운트 시점(빈 deps effect)에 등록해둔 참조와 finishDrag가 실행되는 시점(나중
  // 렌더)의 `close`가 서로 다른 함수 인스턴스가 된다. 그러면 "내 것만 빼고 닫기"
  // 비교(`fn !== close`)가 항상 실패해 자기 자신도 같이 닫아버리는 버그가 있었다
  // — 실제 QA에서 "드래그는 -128까지 정확히 계산되는데 최종적으로 항상 0으로
  // 되돌아간다"는 증상으로 발견됨. Set에는 마운트 시 단 한 번 생성한 안정적인
  // 래퍼(stableCloseRef.current)만 등록하고, 비교도 그 참조로 한다.
  const closeRef = useRef(close);
  closeRef.current = close;
  const stableCloseRef = useRef(() => closeRef.current());

  useEffect(() => {
    const stableClose = stableCloseRef.current;
    openRowClosers.add(stableClose);
    return () => {
      openRowClosers.delete(stableClose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clamp(x: number) {
    return Math.min(0, Math.max(-ACTION_WIDTH, x));
  }

  function handlePointerDown(e: React.PointerEvent) {
    // WHY: capture 없이는 드래그 도중 포인터가 액션 버튼 같은 자식 위로
    // 지나가는 순간 move/up이 그쪽으로 라우팅돼 부모(이 행)가 놓칠 수 있다 —
    // 실제 QA에서 큰 폭 드래그가 절반도 인식 안 되는 것으로 발견됨. try-catch:
    // 일부 환경(예: 이미 해제된 포인터 id)에서 setPointerCapture가 예외를
    // 던지는 경우가 있는데, 여기서 죽으면 이하 드래그 로직 전체가 먹통이 되므로
    // capture 실패 자체는 무시하고 드래그는 계속 진행한다.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // no-op — capture 실패해도 드래그 트래킹은 계속
    }
    // WHY(수정): 이전엔 여기서 e.preventDefault()로 네이티브 링크 드래그를
    // 막았는데, 이게 마우스 포인터에 setPointerCapture와 겹치면서 뒤따르는
    // click 이벤트의 타깃까지 이 wrapper로 강제되는 브라우저 부작용을 일으켜
    // 평범한 탭조차 <Link> 네비게이션이 아예 안 일어나는 회귀가 있었다(실사용
    // 리포트로 발견). 네이티브 드래그 자체는 아래 style의
    // WebkitUserDrag:"none"으로 막고, 여기선 preventDefault를 호출하지 않는다.
    startXRef.current = e.clientX;
    startTranslateRef.current = translateX;
    draggedRef.current = false;
    draggingActiveRef.current = true;
    wasOpenAtGestureStartRef.current = translateX !== 0;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingActiveRef.current) return;
    const delta = e.clientX - startXRef.current;
    // WHY: 6px는 트랙패드로 "그냥 클릭"할 때도 흔히 발생하는 커서 미세 이동
    // 범위 안에 들어와서, 실제로는 스와이프 의도가 없는데도 draggedRef가
    // true가 돼 클릭 후 계좌 상세로 안 들어가지는 문제가 있었다(실사용
    // 리포트로 발견). 진짜 스와이프 의도만 걸러지도록 여유를 더 뒀다.
    if (Math.abs(delta) > 10) draggedRef.current = true;
    setTranslateX(clamp(startTranslateRef.current + delta));
  }

  function finishDrag(e: React.PointerEvent) {
    if (!draggingActiveRef.current) return;
    draggingActiveRef.current = false;
    setDragging(false);
    // WHY: 캡처를 여기서 명시적으로 풀어둔다 — pointerup 이후 곧바로 오는
    // 마우스 호환 이벤트(click 포함)가 이 시점 이후의 캡처 상태를 기준으로
    // 타깃을 다시 계산하게 해서, 클릭 타깃이 실제 커서 위치가 아니라 이
    // wrapper로 강제 고정되는 부작용을 줄인다.
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
    setTranslateX((prev) => {
      const shouldOpen = prev < -ACTION_WIDTH / 2;
      if (shouldOpen) {
        openRowClosers.forEach((fn) => {
          if (fn !== stableCloseRef.current) fn();
        });
      }
      return shouldOpen ? -ACTION_WIDTH : 0;
    });
  }

  // 스와이프로 "이미" 열려있던 행을 다시 탭한 경우만 "닫기"로 취급한다.
  // WHY: 예전엔 draggedRef.current(방금 이 제스처에서 드래그가 있었는지)만
  // 봐서, 행을 여는 바로 그 드래그가 끝난 직후 뒤따르는 마무리 클릭까지
  // "닫기"로 처리해버려 — 스와이프로 열자마자 바로 다시 닫혀서 수정/삭제
  // 버튼을 누를 새가 없는 버그가 있었다(실사용 리포트로 발견). 제스처
  // "시작 시점"에 이미 열려 있었는지(wasOpenAtGestureStartRef)만 닫기
  // 기준으로 삼고, 방금 막 연 제스처의 마무리 클릭은 내비게이션만 막아둔다
  // (finishDrag가 이미 정한 열림 상태를 그대로 둔다).
  function handleForegroundClick(e: React.MouseEvent) {
    if (wasOpenAtGestureStartRef.current) {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // WHY 20px: globals.css .card의 실제 반경(20px)과 정확히 맞춘다. 여기(부모
  // 클리핑)만 16px(rounded-2xl)로 뒀더니 사각형 액션 레이어의 모서리가 카드의
  // 둥근 모서리 바깥으로 1px씩 새어나와 보이는 렌더링 버그가 있었다(실제 QA에서
  // 발견) — 액션 레이어 자체에도 같은 반경을 이중으로 줘서 클리핑에만 기대지 않는다.
  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 20 }}>
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: ACTION_WIDTH, borderTopRightRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" }}
      >
        <button
          type="button"
          aria-label={editLabel}
          onClick={() => {
            close();
            onEdit();
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ background: "var(--surface-pressed)", color: "var(--text-sub)" }}
        >
          <PencilIcon />
          <span className="text-[11px] font-medium">{editLabel}</span>
        </button>
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={() => {
            close();
            onDelete();
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors text-white"
          style={{ background: "var(--error)" }}
        >
          <TrashIcon />
          <span className="text-[11px] font-medium">{deleteLabel}</span>
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={handleForegroundClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          touchAction: "pan-y",
          // WHY: 이 wrapper 자체엔 배경이 없어서, 안쪽 .card가 :active로
          // scale(0.98) 눌림 효과를 낼 때 바로 뒤에 있는 삭제 액션(빨강)이
          // 오른쪽 가장자리로 살짝 비쳐 보이는 버그가 있었다(실제 QA에서
          // 발견 — 스와이프와 무관하게 그냥 탭만 해도 매번 발생). 카드와 같은
          // 배경·반경을 여기 미리 깔아서 눌림 시 드러나는 배경이 항상 카드
          // 표면색이 되도록 한다.
          background: "var(--surface)",
          borderRadius: 20,
          // WHY: 텍스트가 있는 카드를 클릭+드래그하면 브라우저 기본 텍스트
          // 선택 제스처가 우리 pointermove와 경합해 트랙패드에서 스와이프가
          // 잘 안 먹히는 원인 중 하나였다(맥북 실사용 리포트로 발견).
          userSelect: "none",
          WebkitUserSelect: "none",
          // WHY: 이전엔 pointerdown에서 e.preventDefault()로 네이티브 링크 드래그
          // (고스트 이미지)를 막았는데, click 이벤트 타깃을 이 wrapper로 고정시키는
          // 부작용이 있었다. CSS만으로 네이티브 드래그를 막으면 그 부작용 없이
          // 같은 효과를 낸다.
          WebkitUserDrag: "none",
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
