// ResultScreen.tsx
// 다크모드: 히어로(파란 그라데이션)와 미달성 경고(호박색) 카드는 의도적 강조색이라
// 유지. 그 외 중립 배경/텍스트만 토큰으로 전환.
// WHY(최종 단순화, D-128): 이 화면이 답해야 하는 질문은 "몇 살에 은퇴 가능한지"
// 하나다. 월 예상 수입·목표 대비 숫자, 절세 팁까지 있던 이전 버전은 그 답의
// "근거 자료"를 계속 덧붙인 것이었는데, 사용자 피드백에 따라 근거 자료보다
// 답 자체가 화면을 지배해야 한다고 판단해 히어로(나이) + 소득 구성 차트만
// 남겼다. 절세 팁(taxBenefit)은 "언제 은퇴 가능한지"와 무관한 별개 질문이라
// 이 화면에서 완전히 제거했다. 차트는 이후 D-129에서 소득원별 구성+오늘
// 가치 기준으로 다시 확장됨(IncomeTimelineChart.tsx 참고).
"use client";

import { useEffect, useState } from "react";
import { SimulationRequestPayload, SimulationResponseDto } from "./types";
import { PrimaryButton, SecondaryButton, WizardCard } from "./Ui";
import IncomeTimelineChart from "./IncomeTimelineChart";
import WhatIfSlider from "./WhatIfSlider";

interface Props {
  result: SimulationResponseDto;
  onRestart: () => void;
  basePayload: SimulationRequestPayload;
}

// WHY: 결과 화면에 처음 진입할 때 나이가 0에서 목표 숫자까지 차오르는 연출.
// 은퇴 나이가 바뀔 때마다(예: What-if 슬라이더) 다시 재생되진 않도록 헤드라인
// 숫자 전용으로만 쓴다 — 슬라이더 쪽 숫자는 즉시 갱신되는 게 더 자연스럽다.
// 적립 총액은 억 단위가 되기 쉬워 만원 그대로 찍으면 자릿수를 세게 된다.
// 억 미만은 만원으로, 억 이상은 "N억 M,MMM만원"으로 끊어 읽게 한다.
function formatEok(manwon: number) {
  if (manwon < 10000) return `${manwon.toLocaleString()}만원`;
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString()}만원`;
}

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export default function ResultScreen({ result, onRestart, basePayload }: Props) {
  const { summary, meta, incomeTimeline, dependentStatusWarning, monteCarloResult, accumulatedAssets } =
    result;
  const [copied, setCopied] = useState(false);

  const retirementAge = summary.estimatedRetirementAge;
  const currentAge = retirementAge - meta.yearsUntilRetirement;
  const animatedAge = useCountUp(retirementAge);

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
      {/* WHY(순차 등장, D-157 후속): 네 블록(히어로/차트/What-if/액션)이 한번에
          툭 뜨면 "결과 페이지"로 소비되고 끝난다. 짧게 순서대로 나타나게 하면
          같은 정보라도 화면이 답을 "차례로 밝혀주는" 느낌을 준다. 기존 rise-in
          keyframe(D-093)을 블록마다 지연시켜 재사용 — 새 애니메이션 추가 없음. */}
      {summary.feasible ? (
        <div className="text-center mb-5 pt-4 rise-in">
          <p
            className="fs-body font-bold tracking-wide"
            style={{ color: "var(--accent)" }}
          >
            예상 은퇴 가능 나이
          </p>
          <p
            className="text-7xl font-extrabold tracking-tight tabular-nums mt-2.5"
            style={{ color: "var(--text-strong)" }}
          >
            {animatedAge}
            <span
              className="text-2xl font-bold ml-1"
              style={{ color: "var(--text-sub)" }}
            >
              세
            </span>
          </p>
          <p
            className="fs-body font-semibold mt-3.5"
            style={{ color: "var(--text-sub)" }}
          >
            지금부터{" "}
            <span style={{ color: "var(--text-strong)" }}>
              {meta.yearsUntilRetirement}년
            </span>{" "}
            뒤예요
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
            {summary.message}
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 text-center mb-5 rise-in">
          <p className="fs-body text-amber-700 mb-1.5 font-medium">
            시뮬레이션 결과
          </p>
          <p className="text-xl font-bold text-amber-700 leading-snug">
            지금 페이스로는 {retirementAge}세까지도
            <br />
            목표를 채우기 어려워요
          </p>
          <p className="fs-body text-neutral-500 mt-3 leading-relaxed">
            납입액을 늘리거나 목표 생활비를 낮춰서 다시 계산해보세요. 아래
            그래프에서 어느 시점부터 부족해지는지 볼 수 있어요.
          </p>
        </div>
      )}

      {/* M15/D-168: 건강보험 피부양자 자격 상실 가능성 — 위험할 때만 노출(미니멀 원칙,
          D-127~D-128 연장). 히어로의 "몇 살에 은퇴 가능한지" 답과 직결된 실질적
          리스크 고지라 D-126에서 제거했던 "절세 팁"류 부가정보와는 다르게 유지한다. */}
      {summary.feasible && dependentStatusWarning?.atRisk && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-5 text-[12px] leading-relaxed rise-in"
          style={{
            background: "var(--warning-soft)",
            color: "var(--warning)",
            animationDelay: "60ms",
          }}
        >
          {dependentStatusWarning.message}
        </div>
      )}

      {/* ── 은퇴 시점에 모이는 총액 ──
          이 앱의 질문은 "그 자산이 은퇴 시점에 충분한가"(D-017)인데, 정작 화면에
          "얼마가 모이는지"가 없었다. 월 수령액만으로는 규모가 잡히지 않는다. */}
      {accumulatedAssets && accumulatedAssets.total > 0 && (
        <div
          className="rounded-2xl border p-4 mb-5 rise-in"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            animationDelay: "60ms",
          }}
        >
          <p className="fs-caption" style={{ color: "var(--text-sub)" }}>
            {retirementAge}세까지 모이는 돈
          </p>
          <p
            className="amount mt-1 font-bold"
            style={{ fontSize: 28, color: "var(--text-strong)" }}
          >
            {formatEok(accumulatedAssets.total)}
          </p>

          <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
            {[
              ["퇴직연금", accumulatedAssets.retirementPensionLumpSum],
              ["IRP", accumulatedAssets.irpBalance],
              ["연금저축", accumulatedAssets.pensionSavingsBalance],
              ["주식·ETF", accumulatedAssets.liquidBalance],
            ]
              .filter(([, v]) => (v as number) > 0)
              .map(([label, v]) => (
                <div key={label as string} className="flex justify-between fs-body">
                  <span style={{ color: "var(--text-sub)" }}>{label}</span>
                  <span className="amount" style={{ color: "var(--text-strong)" }}>
                    {formatEok(v as number)}
                  </span>
                </div>
              ))}
          </div>

          <p className="fs-caption mt-3 leading-relaxed" style={{ color: "var(--text-faint)" }}>
            물가상승을 반영하지 않은 그때의 금액이에요.
            {accumulatedAssets.pensionUnlockAge > retirementAge && (
              <>
                {" "}연금 계열은 인출이 열리는 {accumulatedAssets.pensionUnlockAge}세 기준이라
                주식·ETF와 기준 시점이 달라요.
              </>
            )}
          </p>
        </div>
      )}

      {/* ── 목표 유지 여부만 보여주는 단순 라인 차트 ── */}
      {incomeTimeline.length > 0 && (
        <div
          className="rounded-2xl border p-4 mb-5 rise-in"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            animationDelay: "120ms",
          }}
        >
          <IncomeTimelineChart
            timeline={incomeTimeline}
            currentAge={currentAge}
            inflationRate={meta.inflationRate}
            feasible={summary.feasible}
          />

          {/* M16/D-169: 결정론적 모델은 은퇴 후 수익률을 고정값(3%)으로 가정하지만,
              실제로는 해마다 오르내린다. 그 변동성까지 반영하면 이 추정이 얼마나
              탄탄한지를 한 줄로 보여준다 — 새 카드를 만들지 않고 차트 카드 안에
              작은 보조 지표로만 붙여서 미니멀 원칙(D-127~D-128)을 유지한다. */}
          {monteCarloResult && (
            <p
              className="fs-caption mt-3 pt-3 border-t leading-relaxed"
              style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
            >
              수익률 변동까지 감안한 몬테카를로 시뮬레이션(1,000회) 기준, 90세까지
              자산이 버틸 확률은{" "}
              <span style={{ color: "var(--text-sub)", fontWeight: 600 }}>
                {monteCarloResult.successRatePercent}%
              </span>
              예요. 참고용 추정치이며 실제 시장 상황에 따라 달라질 수 있어요.
            </p>
          )}
        </div>
      )}

      {/* ── What-if: "그럼 뭘 바꾸면 나아지는지"에 답하는 인터랙션 ── */}
      <div className="rise-in" style={{ animationDelay: "240ms" }}>
        <WhatIfSlider
          basePayload={basePayload}
          baseRetirementAge={retirementAge}
          baseFeasible={summary.feasible}
        />
      </div>

      {/* ── 액션 ── */}
      {/* WHY(위계): 두 버튼이 똑같은 아웃라인 스타일이라 뭐가 주 행동인지
          구분이 안 됐다. feasible이면 "공유하기"가 이 화면의 보상 행동이자
          공유를 통한 유입 통로라 Primary로, 아니면 유일한 다음 행동인
          "다시 계산하기"가 Primary가 된다. */}
      <div className="space-y-2.5 rise-in" style={{ animationDelay: "360ms" }}>
        <div className="flex gap-2.5">
          {summary.feasible ? (
            <>
              <PrimaryButton onClick={handleShare} className="flex-1">
                {copied ? "복사됐어요 ✓" : "결과 공유하기"}
              </PrimaryButton>
              <SecondaryButton onClick={onRestart} className="flex-1">
                다시 계산하기
              </SecondaryButton>
            </>
          ) : (
            <PrimaryButton onClick={onRestart} className="flex-1">
              다시 계산하기
            </PrimaryButton>
          )}
        </div>
        <p
          className="text-[10px] text-center pt-2 leading-relaxed"
          style={{ color: "var(--text-faint)" }}
        >
          본 서비스는 투자자문이나 금융상품 권유가 아닌 정보 제공 목적이에요.
          결과는 입력하신 가정에 따른 예상치로, 실제와 다를 수 있어요.
          <br />
          국민연금은 간이 산식으로 계산한 근사치예요. 정확한 예상 수령액은
          국민연금공단 &lsquo;내 연금 알아보기&rsquo;에서 확인할 수 있어요.
        </p>
      </div>
    </WizardCard>
  );
}
