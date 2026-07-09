// IncomeTimelineChart.tsx
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IncomeTimelinePoint, formatManwon } from "./types";

interface Props {
  timeline: IncomeTimelinePoint[];
}

const COLORS = {
  national: "#34d399", // emerald-400 — 소득 구성 카드와 동일 색
  mid: "#60a5fa", // blue-400
  liquid: "#fbbf24", // amber-400
  target: "#a3a3a3", // neutral-400
};

export default function IncomeTimelineChart({ timeline }: Props) {
  if (timeline.length === 0) return null;

  // recharts는 매 몇 년마다 눈금을 자동으로 못 골라주므로 5년 단위로 직접 지정
  const tickAges = timeline
    .map((p) => p.age)
    .filter((age) => age % 5 === 0 || age === timeline[0].age);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-neutral-500">
          연도별 소득 구성 (세후, 월)
        </p>
        <Legend />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={timeline}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillNational" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={COLORS.national}
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor={COLORS.national}
                stopOpacity={0.05}
              />
            </linearGradient>
            <linearGradient id="fillMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.mid} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.mid} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.liquid} stopOpacity={0.35} />
              <stop
                offset="100%"
                stopColor={COLORS.liquid}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="age"
            ticks={tickAges}
            tickFormatter={(age) => `${age}세`}
            tick={{ fontSize: 11, fill: "#a3a3a3" }}
            axisLine={{ stroke: "#e5e5e5" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 10000 ? `${Math.round(v / 10000)}억` : `${v}`
            }
            tick={{ fontSize: 11, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={ChartTooltip} />

          <Area
            type="monotone"
            dataKey="liquidWithdrawalAfterTax"
            name="주식/ETF"
            stackId="income"
            stroke={COLORS.liquid}
            fill="url(#fillLiquid)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="midAfterTax"
            name="퇴직연금+IRP+연금저축"
            stackId="income"
            stroke={COLORS.mid}
            fill="url(#fillMid)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="nationalAfterTax"
            name="국민연금"
            stackId="income"
            stroke={COLORS.national}
            fill="url(#fillNational)"
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="targetExpense"
            name="목표 생활비"
            stroke={COLORS.target}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-neutral-400 mt-2">
        색이 쌓인 높이가 그 나이의 소득, 점선이 목표 생활비예요. 색이 점선에
        닿으면 목표를 채운 거예요.
      </p>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "국민연금", color: COLORS.national },
    { label: "연금", color: COLORS.mid },
    { label: "주식/ETF", color: COLORS.liquid },
  ];
  return (
    <div className="flex flex-wrap gap-2.5 justify-end">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1 text-[10px] text-neutral-400"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
      {/* WHY: 점선의 의미를 범례에 점선 모양 그대로 보여줘야
          "이 선이 뭐지?"라는 질문이 안 생긴다. */}
      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
        <span
          className="w-3 border-t-2 border-dashed"
          style={{ borderColor: COLORS.target }}
        />
        목표 생활비
      </span>
    </div>
  );
}

// WHY: recharts는 메이저 버전마다 TooltipProps 제네릭 구조가 바뀐다
// (2.x → 3.x에서 payload/label 위치가 달라짐). 라이브러리 타입에
// 의존하지 않고 실제로 쓰는 필드만 자체 타입으로 선언해 버전 업그레이드에
// 안전하게 만든다.
interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string | number;
    value?: unknown;
    color?: string;
  }>;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // stackId를 쓰면 payload 순서가 역순으로 오므로, 항상 같은 순서로 재정렬
  const order = [
    "국민연금",
    "퇴직연금+IRP+연금저축",
    "주식/ETF",
    "목표 생활비",
  ];
  const sorted = [...payload].sort(
    (a, b) => order.indexOf(String(a.name)) - order.indexOf(String(b.name)),
  );

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-neutral-700 mb-1">{label}세</p>
      {sorted.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span className="text-neutral-500">{entry.name}</span>
          <span className="text-neutral-700">
            {formatManwon(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}
