// HoldingsDonutChart.tsx — M9 대시보드 도넛차트, 종목별 비중.
// D-073(순수 빨강·파랑 제외 팔레트) / D-074(탭으로 하이라이트) 유지.
// D-201: 범례는 차트 오른쪽에 두 열로. 도넛 가운데는 금액 대신 등급 엠블럼(TierEmblem).
// 11개 이상이면 상위 9개 + "외 N개". 열 배분은 아래 legendGridStyle 주석 참고.
"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { HoldingSummary } from "./types";
import { tierOf } from "./tier";
import { TierEmblem } from "./TierEmblem";

// 범례는 두 열, 위→아래로 채우고 넘치면 오른쪽 열로(열 우선). 이름이 길면 truncate된다.
// 행 수를 5로 고정하지 않고 개수의 절반으로 잡는 이유: 7개일 때 고정 5행이면 5/2로 갈려
// 오른쪽 열 아래가 휑하게 빈다. 절반이면 4/3으로 나뉘어 두 열 높이가 맞는다.
// (10개일 때는 5/5로 같은 결과라 상한 케이스는 달라지지 않는다.)
const legendRowsFor = (count: number) => Math.max(1, Math.ceil(count / 2));
const legendGridStyle = (count: number): React.CSSProperties => ({
  display: "grid",
  gridTemplateRows: `repeat(${legendRowsFor(count)}, auto)`,
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(0, 1fr)",
});

// D-073: 손익 색상(순수 빨강/파랑)과 혼동되지 않는 채도 상향 팔레트. 범례를 최대 9종목까지
// 보여주므로(그 이상은 "외 N건"), 5색 순환으로는 인접 슬라이스 색이 겹쳐 10색으로 확장했다.
const PALETTE = [
  "#A78BFA", // 보라
  "#2DD4BF", // 청록
  "#E879A8", // 분홍
  "#FBBF24", // 노랑
  "#94A3B8", // 회청
  "#818CF8", // 남보라
  "#34D399", // 초록
  "#F472B6", // 진분홍
  "#FB923C", // 주황
  "#22D3EE", // 하늘
];
const OTHER_COLOR = "#B0B8C1";
const MAX_NAMED_SLICES = 9;

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

  // 종목 10개 이하면 전부 표시, 11개 이상이면 상위 9개 + "외 N건"(합계 10칸 = 범례 5×2).
  if (sorted.length <= MAX_NAMED_SLICES + 1) return sorted.map(toSlice);

  const top = sorted.slice(0, MAX_NAMED_SLICES).map(toSlice);
  const rest = sorted.slice(MAX_NAMED_SLICES);
  const restValue = rest.reduce((sum, h) => sum + h.totalKrw, 0);

  return [
    ...top,
    {
      key: "OTHER",
      label: `외 ${rest.length}개`,
      color: OTHER_COLOR,
      value: restValue,
    },
  ];
}

// 도넛 가운데 — 등급을 광물 아이콘 + 그 아래 색깔 있는 등급 이름으로. 금액은 넣지 않는다
// (상단 총자산과 중복). "등급"이라는 글자도 뺀다(D-201).
function TierCenter({ totalAssetKrw }: { totalAssetKrw: number | null }) {
  return <TierEmblem tier={tierOf(totalAssetKrw)} />;
}

export function HoldingsDonutChart({
  holdings,
  totalAssetKrw = null,
}: {
  holdings: HoldingSummary[] | null;
  totalAssetKrw?: number | null;
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

  // D-192: 보유 종목이 하나도 없어도 차트는 기본 노출 — 빈 회색 링 + 등급(언랭크)만
  // 다르고 레이아웃은 데이터가 있을 때와 동일. 신규 사용자에게 "언랭크"가 온보딩 신호가 된다.
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
              <TierCenter totalAssetKrw={totalAssetKrw} />
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
        <div
          className="relative flex-shrink-0 fade-in"
          style={{ width: 140, height: 140 }}
        >
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
                // 등장 애니메이션 비활성화 — 리사이즈/측정 타이밍과 겹치면 슬라이스가
                // 0도 근처에서 얼어붙어 링이 안 그려지는 recharts 버그가 있었다(D-201).
                isAnimationActive={false}
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
              <TierCenter totalAssetKrw={totalAssetKrw} />
            )}
          </div>
        </div>

        {/* 범례 — 차트 오른쪽 배치, 두 열 열 우선. 탭으로도 하이라이트 가능.
            종목명이 길면 truncate, 티커는 공간상 생략. */}
        <div
          className="flex-1 min-w-0 gap-x-2.5 gap-y-1"
          style={legendGridStyle(slices.length)}
        >
          {slices.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => handleClick(i)}
              className="flex items-center gap-1 min-w-0 py-0.5 rounded transition-opacity"
              style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.4 }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="text-[11px] font-medium truncate min-w-0 flex-1 text-left"
                style={{ color: "var(--text-strong)" }}
              >
                {s.label}
              </span>
              <span
                className="amount text-[10px] flex-shrink-0"
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
