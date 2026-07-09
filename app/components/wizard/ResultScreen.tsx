// ResultScreen.tsx
"use client";

import { useState } from "react";
import { SimulationResponseDto, formatManwon } from "./types";
import { SecondaryButton, WizardCard } from "./Ui";
import IncomeTimelineChart from "./IncomeTimelineChart";

interface Props {
  result: SimulationResponseDto;
  onRestart: () => void;
}

const MID_UNLOCK_AGE = 55;

export default function ResultScreen({ result, onRestart }: Props) {
  const { summary, taxDetail, meta, incomeTimeline } = result;
  const [copied, setCopied] = useState(false);

  const retirementAge = summary.estimatedRetirementAge;
  const receiptAge = meta.nationalPensionReceiptAge;
  const isShortfallPositive = summary.monthlyShortfall >= 0;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(summary.shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 미지원 환경에서는 조용히 무시
    }
  }

  return (
    <WizardCard>
      {/* ── 히어로: feasible이면 축하 톤, 아니면 경고 톤 ── */}
      {summary.feasible ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-center mb-5 shadow-[0_8px_24px_rgba(59,130,246,0.25)]">
          <p className="text-[13px] text-blue-100 mb-1.5 font-medium">
            예상 은퇴 가능 나이
          </p>
          <p className="text-6xl font-bold text-white tracking-tight">
            {retirementAge}
            <span className="text-2xl font-semibold text-blue-100 ml-1">
              세
            </span>
          </p>
          <p className="text-[13px] text-blue-50 mt-2.5">
            지금부터{" "}
            <span className="font-semibold text-white">
              {meta.yearsUntilRetirement}년
            </span>{" "}
            뒤예요
          </p>
          <p className="text-xs text-blue-100/90 mt-2">{summary.message}</p>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 text-center mb-5">
          <p className="text-[13px] text-amber-700 mb-1.5 font-medium">
            시뮬레이션 결과
          </p>
          <p className="text-xl font-bold text-amber-700 leading-snug">
            지금 페이스로는 {retirementAge}세까지도
            <br />
            목표를 채우기 어려워요
          </p>
          <p className="text-[13px] text-neutral-500 mt-3 leading-relaxed">
            납입액을 늘리거나 목표 생활비를 낮춰서 다시 계산해보세요. 아래
            그래프에서 어느 시점부터 부족해지는지 볼 수 있어요.
          </p>
        </div>
      )}

      {/* ── 3구간 타임라인 배지 ── */}
      <p className="text-[13px] font-semibold text-neutral-500 mb-2.5">
        은퇴 후 소득 구간
      </p>
      <PhaseTimeline
        retirementAge={retirementAge}
        receiptAge={receiptAge}
        lifeExpectancy={meta.lifeExpectancy}
      />

      {/* ── 연도별 소득 구성 차트 ── */}
      {incomeTimeline.length > 0 && (
        <div className="mt-4">
          <IncomeTimelineChart timeline={incomeTimeline} />
        </div>
      )}

      {/* ── 소득 요약 (합계만 — 항목별 상세는 위 차트가 담당) ──
          WHY: 차트는 정보 밀도가 높아 훑어보는 데 시간이 걸린다.
          "결론(합계·목표대비)"은 차트를 안 봐도 바로 눈에 들어와야 하므로
          가볍게 한 줄 요약으로 유지한다. */}
      <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50/60 px-4 py-3.5 mt-4 mb-5">
        <div>
          <p className="text-[11px] text-neutral-400">
            월 예상 수입 (세후, 은퇴 1년차)
          </p>
          <p className="text-base font-bold text-neutral-800 mt-0.5">
            {formatManwon(summary.totalMonthlyIncome)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-neutral-400">목표 대비</p>
          <p
            className={`text-base font-bold mt-0.5 ${
              isShortfallPositive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {isShortfallPositive ? "+" : ""}
            {formatManwon(summary.monthlyShortfall)}
          </p>
        </div>
      </div>

      {/* ── 세금 · 건강보험료 ── */}
      <p className="text-[13px] font-semibold text-neutral-500 mb-2.5">
        세금 · 건강보험료
      </p>
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4 mb-5 space-y-2 text-sm">
        <PlainRow
          label="연금소득세율"
          value={`${taxDetail.pensionIncomeTaxRate.toFixed(1)}%`}
        />
        <PlainRow
          label="월 연금세금"
          value={formatManwon(taxDetail.monthlyPensionTax)}
        />
        <PlainRow
          label="월 건강보험료"
          value={formatManwon(taxDetail.monthlyHealthInsurance)}
        />
      </div>

      {/* ── 액션 ── */}
      <div className="space-y-2.5">
        <div className="flex gap-2.5">
          {summary.feasible && (
            <SecondaryButton onClick={handleShare} className="flex-1">
              {copied ? "복사됐어요 ✓" : "결과 공유하기"}
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onRestart} className="flex-1">
            다시 계산하기
          </SecondaryButton>
        </div>
        <p className="text-[10px] text-neutral-400 text-center pt-2 leading-relaxed">
          본 서비스는 투자자문이나 금융상품 권유가 아닌 정보 제공 목적이에요.
          결과는 입력하신 가정에 따른 예상치로, 실제와 다를 수 있어요.
          <br />
          국민연금은 간이 산식으로 계산한 근사치예요. 정확한 예상 수령액은
          국민연금공단 &lsquo;내 연금 알아보기&rsquo;에서 확인할 수 있어요.
          <br />
          주식/ETF 세금은 해외주식 기준(양도세 22%, 연 250만원 공제)으로
          계산돼요.
        </p>
      </div>
    </WizardCard>
  );
}

/**
 * 은퇴~55세(주식만) / 55~수령개시(연금 합류) / 수령개시~90(전체) 3구간을
 * 가로 막대로 보여준다. 은퇴나이가 55세 이후면 앞 구간은 자동으로 사라진다.
 */
function PhaseTimeline({
  retirementAge,
  receiptAge,
  lifeExpectancy,
}: {
  retirementAge: number;
  receiptAge: number;
  lifeExpectancy: number;
}) {
  const totalYears = lifeExpectancy - retirementAge;
  if (totalYears <= 0) return null;

  const phases: { label: string; from: number; to: number; color: string }[] =
    [];

  const bridgeEnd = Math.min(MID_UNLOCK_AGE, receiptAge);
  if (retirementAge < bridgeEnd) {
    phases.push({
      label: "주식/ETF",
      from: retirementAge,
      to: bridgeEnd,
      color: "bg-amber-400",
    });
  }
  const midStart = Math.max(retirementAge, MID_UNLOCK_AGE);
  if (midStart < receiptAge) {
    phases.push({
      label: "+ 연금 개시",
      from: midStart,
      to: receiptAge,
      color: "bg-blue-400",
    });
  }
  const fullStart = Math.max(retirementAge, receiptAge);
  phases.push({
    label: "+ 국민연금",
    from: fullStart,
    to: lifeExpectancy,
    color: "bg-emerald-400",
  });

  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {phases.map((p) => (
          <div
            key={p.label}
            className={p.color}
            style={{ width: `${((p.to - p.from) / totalYears) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-400 mt-2">
        <span>{retirementAge}세 은퇴</span>
        <span>{lifeExpectancy}세</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
        {phases.map((p) => (
          <span
            key={p.label}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-500"
          >
            <span className={`w-2 h-2 rounded-full ${p.color}`} />
            {p.from}세~ {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlainRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-700">{value}</span>
    </div>
  );
}
