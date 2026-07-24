// app/components/portfolio/CategoryFilterChips.tsx
// M10(D-065): 수익 탭 카테고리 필터. 옵션이 4개(전체+3종)뿐이라 드롭다운 대신
// 칩 로우로 구현 — 모바일 웹 1차 표면 원칙(터치 타겟, hover 비의존).
"use client";

import { categoryLabel, TradableAssetCategory } from "@/app/components/portfolio/types";

const OPTIONS: { key: TradableAssetCategory | null; label: string }[] = [
  { key: null, label: "전체" },
  { key: "DOMESTIC_STOCK", label: categoryLabel.DOMESTIC_STOCK },
  { key: "FOREIGN_STOCK", label: categoryLabel.FOREIGN_STOCK },
  { key: "CRYPTO", label: categoryLabel.CRYPTO },
];

export function CategoryFilterChips({
  value,
  onChange,
}: {
  value: TradableAssetCategory | null;
  onChange: (value: TradableAssetCategory | null) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key ?? "ALL"}
            type="button"
            onClick={() => onChange(opt.key)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
            style={
              active
                ? { color: "var(--accent)", background: "var(--accent-soft)" }
                : { color: "var(--text-sub)", background: "var(--border)" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
