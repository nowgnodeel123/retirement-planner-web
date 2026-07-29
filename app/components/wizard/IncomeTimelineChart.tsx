// IncomeTimelineChart.tsx
// 다크모드: 그래프 데이터 색상은 의도적으로 고정 유지(데이터 시각화 팔레트는
// 라이트/다크 공통이 관례). 배경·테두리·축·범례 텍스트만 토큰으로 전환.
// WHY(소득원별 재구성): "목표 생활비 vs 소득" 단일 비교로 축소했다가(D-128),
// (1) 소득원(국민연금/연금/주식)별 구성과 시기별 합계를 보고 싶다는 요청
// (2) 명목 금액을 그대로 그리면 물가상승 때문에 은퇴 후에도 소득이 계속
// 늘어나는 것처럼 보여 헷갈린다는 지적을 받아, 두 가지를 함께 반영했다.
// 오늘 가치(실질) 기준으로 환산해서 그리면 목표 생활비 선이 평평해지고,
// "인플레이션 때문에 늘어나 보이는 착시"가 사라진다(D-129).
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
  currentAge: number;
  inflationRate: number;
}

const COLORS = {
  national: "#34d399", // emerald-400
  mid: "#60a5fa", // blue-400
  liquid: "#fbbf24", // amber-400
  target: "#a3a3a3", // neutral-400
};

interface ChartPoint {
  age: number;
  national: number;
  mid: number;
  liquid: number;
  total: number;
  targetExpense: number;
}

export default function IncomeTimelineChart({
  timeline,
  currentAge,
  inflationRate,
}: Props) {
  if (timeline.length === 0) return null;

  // WHY: 백엔드는 명목(nominal) 금액을 그대로 내려준다(시뮬레이터 전체 원칙).
  // 오늘 가치로 보여주려면 프론트에서 그 해까지의 물가상승률만큼 역할인한다.
  const toReal = (nominal: number, age: number) => {
    const yearsFromNow = age - currentAge;
    return nominal / Math.pow(1 + inflationRate, yearsFromNow);
  };

  const data: ChartPoint[] = timeline.map((p) => {
    const national = Math.round(toReal(p.nationalAfterTax, p.age));
    const mid = Math.round(toReal(p.midAfterTax, p.age));
    const liquid = Math.round(toReal(p.liquidWithdrawalAfterTax, p.age));
    return {
      age: p.age,
      national,
      mid,
      liquid,
      total: national + mid + liquid,
      targetExpense: Math.round(toReal(p.targetExpense, p.age)),
    };
  });

  // recharts는 매 몇 년마다 눈금을 자동으로 못 골라주므로 5년 단위로 직접 지정
  const tickAges = data
    .map((p) => p.age)
    .filter((age) => age % 5 === 0 || age === data[0].age);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-semibold tracking-wide"
          style={{ color: "var(--text-faint)" }}
        >
          은퇴 후 월 소득 구성 (오늘 가치 기준)
        </p>
        <Legend />
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="fillNational" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.national} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.national} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.mid} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.mid} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.liquid} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.liquid} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="age"
            ticks={tickAges}
            tickFormatter={(age) => `${age}세`}
            tick={{ fontSize: 11, fill: "var(--text-faint)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 10000 ? `${Math.round(v / 10000)}억` : v.toLocaleString()
            }
            tick={{ fontSize: 11, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={ChartTooltip} />

          <Area
            type="monotone"
            dataKey="liquid"
            name="주식/ETF"
            stackId="income"
            stroke={COLORS.liquid}
            fill="url(#fillLiquid)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="mid"
            name="퇴직연금+IRP+연금저축"
            stackId="income"
            stroke={COLORS.mid}
            fill="url(#fillMid)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="national"
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

      <p className="text-[11px] mt-2" style={{ color: "var(--text-faint)" }}>
        색이 쌓인 높이가 그 나이의 총소득(오늘 가치 기준)이에요. 물가상승분을
        미리 제해서, 점선(목표 생활비)은 지금 입력하신 금액 그대로 평평해요.
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
          className="inline-flex items-center gap-1 text-[10px]"
          style={{ color: "var(--text-faint)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
      <span
        className="inline-flex items-center gap-1 text-[10px]"
        style={{ color: "var(--text-faint)" }}
      >
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
    payload?: ChartPoint;
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
  const total = payload[0]?.payload?.total ?? 0;

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-sm text-xs"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
        {label}세
      </p>
      {sorted.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: "var(--text-sub)" }}>{entry.name}</span>
          <span style={{ color: "var(--text)" }}>
            {formatManwon(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
      <div
        className="flex justify-between gap-4 mt-1 pt-1 border-t font-semibold"
        style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
      >
        <span>합계</span>
        <span>{formatManwon(total)}</span>
      </div>
    </div>
  );
}
