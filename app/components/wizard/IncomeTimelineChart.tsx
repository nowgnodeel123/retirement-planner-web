// IncomeTimelineChart.tsx
// 다크모드: 그래프 데이터 색상은 의도적으로 고정 유지(데이터 시각화 팔레트는
// 라이트/다크 공통이 관례). 배경·테두리·축·범례 텍스트만 토큰으로 전환.
// WHY(단순화): 원래 국민연금/연금/주식·ETF 3색 스택 영역 차트였다. "몇 살에 은퇴
// 가능한지"라는 단순한 질문에 소득원 구성 디테일까지 보여주는 건 과했다는
// 피드백에 따라, 소득원 구분 없이 "총 소득이 목표 생활비 위에 계속 있는지"
// 하나만 보여주는 단일 그래프로 축소했다(D-128).
// WHY(선 대신 영역): 이 시뮬레이션은 매년 목표 생활비를 정확히 채우도록 인출액을
// 역산하므로, 연금만으로 목표를 넘어서기 전까지는 "예상 소득"과 "목표 생활비"가
// 수학적으로 완전히 같은 값이다. 두 선을 겹쳐 그리면 점선에 실선이 완전히
// 가려져 차트가 빈 것처럼 보인다(실제로 확인함). 소득을 영역(면)으로 채워서
// 겹치는 구간에도 항상 시각적으로 존재가 드러나게 한다.
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
  income: "#3182f6",
  target: "#a3a3a3",
};

interface ChartPoint {
  age: number;
  income: number;
  targetExpense: number;
}

export default function IncomeTimelineChart({ timeline }: Props) {
  if (timeline.length === 0) return null;

  const data: ChartPoint[] = timeline.map((p) => ({
    age: p.age,
    income: p.nationalAfterTax + p.midAfterTax + p.liquidWithdrawalAfterTax,
    targetExpense: p.targetExpense,
  }));

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
          은퇴 후 월 소득 vs 목표 생활비
        </p>
        <Legend />
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.income} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.income} stopOpacity={0.05} />
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
            dataKey="income"
            name="예상 소득"
            stroke={COLORS.income}
            fill="url(#fillIncome)"
            strokeWidth={2}
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
        색칠된 영역이 예상 소득, 점선이 목표 생활비예요. 영역 높이가 점선과
        같으면 목표를 정확히 채우고 있는 거예요.
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-2.5 justify-end">
      <span
        className="inline-flex items-center gap-1 text-[10px]"
        style={{ color: "var(--text-faint)" }}
      >
        <span
          className="w-2 h-2 rounded-sm"
          style={{ backgroundColor: COLORS.income }}
        />
        예상 소득
      </span>
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
  }>;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-sm text-xs"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
        {label}세
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: "var(--text-sub)" }}>{entry.name}</span>
          <span style={{ color: "var(--text)" }}>
            {formatManwon(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}
