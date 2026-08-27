// app/components/portfolio/CategoryFilterChips.tsx
// M10(D-065): 수익 탭 카테고리 필터. 옵션이 4개(전체+3종)뿐이라 드롭다운 대신
// 칩 로우로 구현 — 모바일 웹 1차 표면 원칙(터치 타겟, hover 비의존).
"use client";

import { categoryLabel, TradableAssetCategory } from "@/app/components/portfolio/types";

const ALL_CATEGORIES: TradableAssetCategory[] = [
  "DOMESTIC_STOCK",
  "FOREIGN_STOCK",
  "CRYPTO",
];

export function CategoryFilterChips({
  value,
  onChange,
  allowed,
}: {
  value: TradableAssetCategory | null;
  onChange: (value: TradableAssetCategory | null) => void;
  // 계좌가 다루는 카테고리로 필터를 좁힌다(증권사 → 국내/해외만 등). 생략 시 전체.
  allowed?: TradableAssetCategory[];
}) {
  const categories = (allowed ?? ALL_CATEGORIES).filter((c) =>
    ALL_CATEGORIES.includes(c),
  );
  // 카테고리가 1종뿐이면 필터가 의미 없으므로 칩 로우 자체를 숨긴다.
  if (categories.length <= 1) return null;

  const options: { key: TradableAssetCategory | null; label: string }[] = [
    { key: null, label: "전체" },
    ...categories.map((c) => ({ key: c, label: categoryLabel[c] })),
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {options.map((opt) => {
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
