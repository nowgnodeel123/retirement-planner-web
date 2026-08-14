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
  const { summary, meta, incomeTimeline } = result;
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
      {summary.feasible ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-center mb-5 shadow-[0_8px_24px_rgba(59,130,246,0.25)]">
          <p className="text-[13px] text-blue-100 mb-1.5 font-medium">
            예상 은퇴 가능 나이
          </p>
          <p className="text-6xl font-bold text-white tracking-tight tabular-nums">
            {animatedAge}
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

      {/* ── 목표 유지 여부만 보여주는 단순 라인 차트 ── */}
      {incomeTimeline.length > 0 && (
        <div
          className="rounded-2xl border p-4 mb-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <IncomeTimelineChart
            timeline={incomeTimeline}
            currentAge={currentAge}
            inflationRate={meta.inflationRate}
          />
        </div>
      )}

      {/* ── What-if: "그럼 뭘 바꾸면 나아지는지"에 답하는 인터랙션 ── */}
      <WhatIfSlider basePayload={basePayload} baseRetirementAge={retirementAge} />

      {/* ── 액션 ── */}
      {/* WHY(위계): 두 버튼이 똑같은 아웃라인 스타일이라 뭐가 주 행동인지
          구분이 안 됐다. feasible이면 "공유하기"가 이 화면의 보상 행동이자
          공유를 통한 유입 통로라 Primary로, 아니면 유일한 다음 행동인
          "다시 계산하기"가 Primary가 된다. */}
      <div className="space-y-2.5">
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
