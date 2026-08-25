// HoldingsDonutChart.tsx — M9 대시보드 도넛차트, 카테고리가 아니라 종목별 비중으로 표시.
// (구 CategoryDonutChart.tsx를 대체 — "국내주식 40%"가 아니라 "삼성전자 20%"처럼 보여달라는
// 요청 반영) D-071(상위 5개 색상표시 + 나머지 "기타") / D-072("외 N건" 라벨) /
// D-073(순수 빨강·파랑 제외 채도 상향 팔레트) / D-074(탭으로 하이라이트) 원칙은 그대로 유지.
// 범례를 차트 아래가 아니라 오른쪽에 배치.
"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatKrw } from "./format";
import { HoldingSummary } from "./types";

// D-073: 손익 색상(빨강/파랑)과 혼동되지 않는 채도 상향 팔레트. 카테고리 배지와 같은 5색을
// 종목 슬라이스에도 순환 적용 — 의미는 "카테고리"에서 "종목 순서"로 바뀌었지만 톤은 유지.
const PALETTE = ["#A78BFA", "#2DD4BF", "#E879A8", "#FBBF24", "#94A3B8"];
const OTHER_COLOR = "#B0B8C1";

interface Slice {
  key: string;
  label: string;
  symbol?: string; // "외 N건" 합산 조각은 단일 티커가 없어 undefined
  color: string;
  value: number;
}

function buildSlices(holdings: HoldingSummary[]): Slice[] {
  const sorted = [...holdings].sort((a, b) => b.totalKrw - a.totalKrw);
  const toSlice = (h: HoldingSummary, i: number): Slice => ({
    key: h.symbol,
    label: h.name,
    symbol: h.symbol,
    color: PALETTE[i % PALETTE.length],
    value: h.totalKrw,
  });

  if (sorted.length <= 5) return sorted.map(toSlice);

  const top5 = sorted.slice(0, 5).map(toSlice);
  const rest = sorted.slice(5);
  const restValue = rest.reduce((sum, h) => sum + h.totalKrw, 0);

  return [
    ...top5,
    {
      key: "OTHER",
      label: `외 ${rest.length}건`,
      color: OTHER_COLOR,
      value: restValue,
    },
  ];
}

export function HoldingsDonutChart({
  holdings,
}: {
  holdings: HoldingSummary[] | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (holdings === null) {
    return (
      <div className="mb-7 flex items-center gap-4">
        <div
          className="rounded-full animate-pulse flex-shrink-0"
          style={{ width: 140, height: 140, background: "var(--border)" }}
        />
        <div className="flex-1 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-4 rounded animate-pulse"
              style={{ background: "var(--border)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // D-192: 보유 종목이 하나도 없어도(계좌 미등록 또는 자산 미등록) 차트 자체는
  // 기본으로 노출한다 — 빈 회색 링 + "0원"만 다르고 레이아웃은 데이터가 있을 때와 동일.
  if (holdings.length === 0) {
    return (
      <div className="mb-7 rise-in">
        <p
          className="text-[13px] font-semibold mb-2.5 px-1"
          style={{ color: "var(--text-sub)" }}
        >
          비중
        </p>
        <div className="flex items-center gap-4">
          <div
            className="relative flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: 140,
              height: 140,
              border: "14px solid var(--border)",
            }}
          >
            <div className="flex flex-col items-center px-3 text-center">
              <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                총 비중
              </p>
              <p
                className="amount text-[11px] font-bold mt-0.5"
                style={{ color: "var(--text-strong)" }}
              >
                {formatKrw(0)}
              </p>
            </div>
          </div>
          <p
            className="flex-1 text-[13px] leading-relaxed"
            style={{ color: "var(--text-faint)" }}
          >
            아직 등록된 보유 자산이 없어요
          </p>
        </div>
      </div>
    );
  }

  const slices = buildSlices(holdings);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const active = activeIndex !== null ? slices[activeIndex] : null;

  // WHY: 슬라이스가 하나뿐이면(보유 종목 1개, 신규 가입자에게 흔한 경우) 도넛
  // 전체가 정확히 360도짜리 단일 arc가 되는데, 이때 시작점과 끝점 좌표가
  // 똑같아져 SVG arc 경로가 퇴화하면서 링 전체가 아니라 작은 조각만 그려지는
  // 알려진 recharts/d3 렌더링 버그가 있다. 같은 값을 반씩 나눈 두 조각(둘 다
  // 같은 색)으로 쪼개면 각각 180도 arc가 되어 이 문제를 피할 수 있다 — 화면에
  // 보이는 색·비중·클릭 동작은 원래 한 조각일 때와 동일하다.
  const pieData =
    slices.length === 1
      ? [
          { ...slices[0], value: slices[0].value / 2 },
          { ...slices[0], value: slices[0].value / 2 },
        ]
      : slices;

  function pieIndexToSliceIndex(pieIndex: number) {
    return slices.length === 1 ? 0 : pieIndex;
  }

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

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={slices.length > 1 ? 2 : 0}
                stroke="none"
                onClick={(_, i) => handleClick(pieIndexToSliceIndex(i))}
              >
                {pieData.map((s, i) => (
                  <Cell
                    key={`${s.key}-${i}`}
                    fill={s.color}
                    className="cursor-pointer"
                    opacity={
                      activeIndex === null || activeIndex === pieIndexToSliceIndex(i)
                        ? 1
                        : 0.35
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* 도넛 중앙 라벨 — 탭한 조각이 있으면 해당 종목, 없으면 총합 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3 text-center">
            {active ? (
              <>
                <p
                  className="text-[11px] font-medium truncate w-full"
                  style={{ color: "var(--text-sub)" }}
                >
                  {active.label}
                </p>
                <p
                  className="amount text-[12px] font-bold mt-0.5"
                  style={{ color: "var(--text-strong)" }}
                >
                  {total > 0 ? `${((active.value / total) * 100).toFixed(1)}%` : "0%"}
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>
                  총 비중
                </p>
                <p
                  className="amount text-[11px] font-bold mt-0.5 truncate w-full"
                  style={{ color: "var(--text-strong)" }}
                >
                  {formatKrw(total)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 범례 — 차트 오른쪽 배치. 탭으로도 하이라이트 가능(작은 조각은 직접 탭하기 어려움 보완) */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {slices.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => handleClick(i)}
              className="w-full flex items-center justify-between px-1 py-0.5 rounded-lg transition-opacity"
              style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.45 }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {s.label}
                  </span>
                  {s.symbol && (
                    <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {" "}
                      {s.symbol}
                    </span>
                  )}
                </span>
              </span>
              <span
                className="amount text-[12px] flex-shrink-0"
                style={{ color: "var(--text-sub)" }}
              >
                {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
