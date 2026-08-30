// app/components/portfolio/SortModal.tsx
// M7: D-054 — 보유자산 정렬. 실제 증권사 앱처럼 정렬 버튼 바로 아래 작은 드롭다운으로
// 표시(기존 큰 바텀시트 모달에서 변경 — 사용자 실기기 검증 중 피드백 반영).
// 옵션 선택 즉시 적용 후 닫힘(별도 "적용" 버튼 없음) — 드롭다운 관례.
// "사용자 설정"을 고르면 각 행에 손잡이(≡)가 나타나고, 그걸 잡고 끌어 순서를 바꾼다.
"use client";

import { useEffect, useRef } from "react";

// "manual" = 사용자가 끌어서 직접 정한 순서(서버 sort_order). 다른 키는 전부 조회 시점 계산.
export type HoldingSortKey = "value" | "profitRate" | "name" | "manual";
export type SortDirection = "desc" | "asc";

const SORT_OPTIONS: {
  key: HoldingSortKey;
  dir: SortDirection;
  label: string;
}[] = [
  { key: "value", dir: "desc", label: "평가금액 높은순" },
  { key: "value", dir: "asc", label: "평가금액 낮은순" },
  { key: "profitRate", dir: "desc", label: "수익률 높은순" },
  { key: "profitRate", dir: "asc", label: "수익률 낮은순" },
  { key: "name", dir: "asc", label: "이름순" },
  { key: "manual", dir: "asc", label: "사용자 설정" },
];

export function SortModal({
  sortKey,
  sortDir,
  onApply,
  onClose,
}: {
  sortKey: HoldingSortKey;
  sortDir: SortDirection;
  onApply: (key: HoldingSortKey, dir: SortDirection) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 z-30 w-[168px] rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {SORT_OPTIONS.map((opt) => {
        const active = opt.key === sortKey && opt.dir === sortDir;
        return (
          <button
            key={`${opt.key}-${opt.dir}`}
            type="button"
            onClick={() => onApply(opt.key, opt.dir)}
            className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium transition-colors"
            style={
              active
                ? { color: "var(--accent)", background: "var(--accent-soft)" }
                : { color: "var(--text)" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
