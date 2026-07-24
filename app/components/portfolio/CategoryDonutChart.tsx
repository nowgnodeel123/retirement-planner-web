// CategoryDonutChart.tsx — M9 대시보드 카테고리별 도넛차트.
// D-071(상위 5개 색상표시 + 나머지 "기타"로 묶기) / D-072("외 N건" 라벨) /
// D-073(순수 빨강·파랑 제외 채도 상향 팔레트, categoryColor와 동일) /
// D-074(hover 대신 탭으로 하이라이트 — 모바일 대응) 반영.
// 카테고리는 현재 최대 5종(AssetCategory enum)이라 "상위 5+기타" 그룹핑은
// 사실상 no-op이지만, 카테고리가 늘어나도 깨지지 않도록 범용으로 구현한다.
"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatKrw } from "./format";
import { CategorySummary } from "./types";

const CATEGORY_LABEL: Record<string, string> = {
  DOMESTIC_STOCK: "국내주식",
  FOREIGN_STOCK: "해외주식",
  CRYPTO: "암호화폐",
  FUND: "펀드",
  CASH: "현금",
};

const CATEGORY_COLOR: Record<string, string> = {
  DOMESTIC_STOCK: "#A78BFA",
  FOREIGN_STOCK: "#2DD4BF",
  CRYPTO: "#E879A8",
  FUND: "#FBBF24",
  CASH: "#94A3B8",
};

const OTHER_COLOR = "#B0B8C1";

interface Slice {
  key: string;
  label: string;
  color: string;
  value: number;
  count: number;
}

function buildSlices(categories: CategorySummary[]): Slice[] {
  const sorted = [...categories].sort((a, b) => b.totalKrw - a.totalKrw);
  const toSlice = (c: CategorySummary): Slice => ({
    key: c.category,
    label: CATEGORY_LABEL[c.category] ?? c.category,
    color: CATEGORY_COLOR[c.category] ?? OTHER_COLOR,
    value: c.totalKrw,
    count: c.assetCount,
  });

  if (sorted.length <= 5) return sorted.map(toSlice);

  const top5 = sorted.slice(0, 5).map(toSlice);
  const rest = sorted.slice(5);
  const restValue = rest.reduce((sum, c) => sum + c.totalKrw, 0);
  const restCount = rest.reduce((sum, c) => sum + c.assetCount, 0);

  return [
    ...top5,
    {
      key: "OTHER",
      label: `외 ${rest.length}건`,
      color: OTHER_COLOR,
      value: restValue,
      count: restCount,
    },
  ];
}

export function CategoryDonutChart({
  categories,
}: {
  categories: CategorySummary[] | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (categories === null) {
    return (
      <div
        className="mb-7 rounded-full animate-pulse mx-auto"
        style={{ width: 180, height: 180, background: "var(--border)" }}
      />
    );
  }

  if (categories.length === 0) return null;

  const slices = buildSlices(categories);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const active = activeIndex !== null ? slices[activeIndex] : null;

  function handleClick(index: number) {
    setActiveIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="mb-7 rise-in">
      <p
        className="text-[13px] font-semibold mb-2.5 px-1"
        style={{ color: "var(--text-sub)" }}
      >
        비중
      </p>

      <div className="relative" style={{ width: 200, height: 200, margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
              onClick={(_, index) => handleClick(index)}
            >
              {slices.map((s, i) => (
                <Cell
                  key={s.key}
                  fill={s.color}
                  className="cursor-pointer"
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* 도넛 중앙 라벨 — 탭한 조각이 있으면 해당 카테고리, 없으면 총합 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
          {active ? (
            <>
              <p className="text-[12px] font-medium" style={{ color: "var(--text-sub)" }}>
                {active.label}
              </p>
              <p
                className="amount text-[15px] font-bold mt-0.5"
                style={{ color: "var(--text-strong)" }}
              >
                {formatKrw(active.value)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                {total > 0 ? `${((active.value / total) * 100).toFixed(1)}%` : "0%"}
              </p>
            </>
          ) : (
            <>
              <p className="text-[12px]" style={{ color: "var(--text-sub)" }}>
                총 비중
              </p>
              <p
                className="amount text-[15px] font-bold mt-0.5"
                style={{ color: "var(--text-strong)" }}
              >
                {formatKrw(total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 범례 — 탭으로도 하이라이트 가능(작은 조각은 직접 탭하기 어려움을 보완) */}
      <div className="mt-4 space-y-2">
        {slices.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => handleClick(i)}
            className="w-full flex items-center justify-between px-1 py-0.5 rounded-lg transition-opacity"
            style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.45 }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="text-[13px] font-medium truncate"
                style={{ color: "var(--text-strong)" }}
              >
                {s.label}
              </span>
              <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                {s.count}건
              </span>
            </span>
            <span
              className="amount text-[13px] flex-shrink-0"
              style={{ color: "var(--text-sub)" }}
            >
              {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
