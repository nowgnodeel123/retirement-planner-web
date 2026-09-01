// app/components/portfolio/PeriodFilterModal.tsx
// M10(D-065): 수익 탭 기간 필터. SortModal(M7/D-094)과 동일한 앵커드 드롭다운 셸
// (버튼 바로 아래, 선택 즉시 적용, 바깥클릭/ESC로 닫힘) 재사용.
"use client";

import { useEffect, useRef } from "react";
import { ProfitPeriod, profitPeriodLabel } from "@/app/components/portfolio/types";

const PERIODS: ProfitPeriod[] = ["DAY", "WEEK", "MONTH", "YEAR", "ALL"];

export function PeriodFilterModal({
  period,
  onApply,
  onClose,
}: {
  period: ProfitPeriod;
  onApply: (period: ProfitPeriod) => void;
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
      className="absolute left-0 top-full mt-1.5 z-30 w-[120px] rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {PERIODS.map((p) => {
        const active = p === period;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onApply(p)}
            className="w-full text-left px-3.5 py-2.5 fs-body font-medium transition-colors"
            style={
              active
                ? { color: "var(--accent)", background: "var(--accent-soft)" }
                : { color: "var(--text)" }
            }
          >
            {profitPeriodLabel[p]}
          </button>
        );
      })}
    </div>
  );
}
