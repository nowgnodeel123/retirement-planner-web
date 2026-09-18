// IncomeTimelineChart.tsx
// 다크모드: 그래프 데이터 색상은 의도적으로 고정 유지(데이터 시각화 팔레트는
// 라이트/다크 공통이 관례). 배경·테두리·축·범례 텍스트만 토큰으로 전환.
// WHY(소득원별 재구성): "목표 생활비 vs 소득" 단일 비교로 축소했다가(D-128),
// 소득원별 구성과 시기별 합계를 보고 싶다는 요청을 반영했다.
// WHY(명목 금액으로 환원, D-254 — D-129를 뒤집음): 한동안 오늘 가치(실질)로
// 환산해 그렸다. 목표선이 평평해져 착시가 없다는 이유였는데, 실제로는 입력한
// 금액이 그대로 보여서 "정말 그 금액만 받나"로 읽혔다. 명목으로 그려도 스택과
// 목표선이 함께 올라가므로 목표를 채우는지 비교는 그대로 성립하고, 대신
// "그때 실제로 얼마 받는지"가 축에서 바로 읽힌다. 물가로 커지는 것처럼 보이는
// 부분은 목표선이 같이 올라가는 것으로 상쇄된다.
// WHY(퇴직연금/사적연금 분리): 퇴직연금(DB/DC)은 근속연수·급여만으로
// 자동 계산되고 IRP·연금저축은 사용자가 직접 납입액을 넣어야 하는 별개
// 상품인데, 하나로 합쳐서 보여주면 "IRP를 안 넣었는데 왜 연금이 나오냐"는
// 혼란을 일으킨다. 네 소득원(국민연금/퇴직연금/IRP+연금저축/주식·ETF)을
// 각각 다른 계열로 분리했다(D-131).
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
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
  feasible: boolean;
}

// D-181: 브랜드 포인트 컬러가 파랑→틸로 바뀌면서, 국민연금(가장 기초가 되는
// 소득원)을 틸 계열로 맞춰 브랜드와 자연스럽게 이어지도록 재구성했다.
const COLORS = {
  national: "#14b8a6", // teal-500 — 국민연금
  retirementPension: "#64748b", // slate-500 — 퇴직연금(DB/DC)
  privatePension: "#a78bfa", // violet-400 — IRP+연금저축
  liquid: "#f59e0b", // amber-500 — 주식/ETF
  target: "#a3a3a3", // neutral-400
};

interface ChartPoint {
  age: number;
  national: number;
  retirementPension: number;
  privatePension: number;
  liquid: number;
  total: number;
  targetExpense: number;
  nominalTotal: number;
}

export default function IncomeTimelineChart({
  timeline,
  currentAge,
  inflationRate,
  feasible,
}: Props) {
  if (timeline.length === 0) return null;

  // 백엔드가 내려주는 값이 이미 명목(그 나이에 실제로 받는 금액)이라 그대로 쓴다.
  // 오늘 가치가 궁금한 경우를 위해 차트 아래에 은퇴 첫해 기준 환산액을 한 줄 적는다.
  const toReal = (nominal: number, age: number) => {
    const yearsFromNow = age - currentAge;
    return nominal / Math.pow(1 + inflationRate, yearsFromNow);
  };

  const data: ChartPoint[] = timeline.map((p) => {
    const national = p.nationalAfterTax;
    const retirementPension = p.retirementPensionAfterTax;
    const privatePension = p.privatePensionAfterTax;
    const liquid = p.liquidWithdrawalAfterTax;
    return {
      age: p.age,
      national,
      retirementPension,
      privatePension,
      liquid,
      total: national + retirementPension + privatePension + liquid,
      targetExpense: p.targetExpense,
      nominalTotal: national + retirementPension + privatePension + liquid,
    };
  });

  const retirementAge = data[0].age;
  // WHY: 시뮬레이터가 가정하는 기대수명(90세, 백엔드 LIFE_EXPECTANCY)까지만 계산해
  // 내려주므로 데이터의 마지막 지점은 89세다. 5년 단위 눈금만 찍으면(85세까지) 차트가
  // 마지막에 아무 라벨 없이 뚝 끊긴 것처럼 보인다는 지적이 있어, 마지막 지점을 항상
  // 눈금으로 명시해 "여기가 가정한 생애의 끝"이라는 게 보이게 한다.
  const lastAge = data[data.length - 1].age;

  // recharts는 매 몇 년마다 눈금을 자동으로 못 골라주므로 5년 단위로 직접
  // 지정한다. feasible이면 은퇴 나이를 아래 ReferenceLine이 라벨로 따로
  // 표시하므로, 5년 눈금과 너무 가까워 겹쳐 보이지 않도록 축 눈금에서는 뺀다.
  const tickAges = [
    ...data
      .map((p) => p.age)
      .filter(
        (age) =>
          age % 5 === 0 &&
          (!feasible || Math.abs(age - retirementAge) >= 2) &&
          Math.abs(age - lastAge) >= 2,
      ),
    lastAge,
  ].sort((a, b) => a - b);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p
          className="fs-body font-semibold tracking-wide"
          style={{ color: "var(--text-faint)" }}
        >
          은퇴 후 월 소득 구성 (실제 받는 금액)
        </p>
      </div>
      <Legend />

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="fillNational" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.national} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.national} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillRetirementPension" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.retirementPension} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.retirementPension} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillPrivatePension" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.privatePension} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.privatePension} stopOpacity={0.05} />
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
          {/* WHY: infeasible이면 retirementAge는 실제 은퇴 나이가 아니라 탐색 상한(75세)을
              참고용으로 돌려준 값이다(SimulationService MAX_SEARCH_AGE). 이 경우에도
              "OO세 은퇴"라고 확정 라벨을 붙이면 히어로의 "목표를 채우기 어려워요" 경고와
              모순돼 보인다 — feasible일 때만 표시한다. */}
          {feasible && (
            <ReferenceLine
              x={retirementAge}
              stroke="var(--accent)"
              strokeWidth={1.5}
              label={{
                value: `${retirementAge}세 은퇴`,
                position: "insideTopLeft",
                fill: "var(--accent)",
                fontSize: 11,
                fontWeight: 600,
                offset: 8,
              }}
            />
          )}
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
            dataKey="privatePension"
            name="IRP+연금저축"
            stackId="income"
            stroke={COLORS.privatePension}
            fill="url(#fillPrivatePension)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="retirementPension"
            name="퇴직연금"
            stackId="income"
            stroke={COLORS.retirementPension}
            fill="url(#fillRetirementPension)"
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

      <p
        className="fs-body mt-3 font-medium"
        style={{ color: "var(--text-sub)" }}
      >
        {retirementAge}세에 실제로 받는 금액은 월{" "}
        <span style={{ color: "var(--text-strong)", fontWeight: 700 }}>
          {data[0].nominalTotal.toLocaleString()}만원
        </span>
        이에요.
      </p>
      <p className="fs-caption mt-2 leading-relaxed" style={{ color: "var(--text-faint)" }}>
        차트의 높이는 그 나이에 <b>실제로 받는 금액</b>이에요. 물가가 오르는 만큼
        점선(목표 생활비)도 함께 올라가니, 두 선의 높이를 견주면 해마다 목표를
        채우는지 그대로 보여요. 지금 물가로 치면 월{" "}
        {Math.round(toReal(data[0].nominalTotal, retirementAge)).toLocaleString()}만원이에요.
      </p>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "국민연금", color: COLORS.national },
    { label: "퇴직연금", color: COLORS.retirementPension },
    { label: "IRP+연금저축", color: COLORS.privatePension },
    { label: "주식/ETF", color: COLORS.liquid },
  ];
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1 fs-caption"
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
        className="inline-flex items-center gap-1 fs-caption"
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
    "퇴직연금",
    "IRP+연금저축",
    "주식/ETF",
    "목표 생활비",
  ];
  const sorted = [...payload].sort(
    (a, b) => order.indexOf(String(a.name)) - order.indexOf(String(b.name)),
  );
  const total = payload[0]?.payload?.total ?? 0;

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-sm fs-body"
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
