// AnalyzingScreen.tsx
// WHY: 계산 자체는 순식간에 끝나지만, 버튼 스피너 하나만 돌면 "그냥 로딩"으로
// 느껴진다. 실제로 거치는 계산 단계(국민연금/퇴직연금/물가반영/시뮬레이션)를
// 순서대로 보여주면 같은 결과라도 "여러 데이터를 분석해서 만든 답"으로 읽힌다.
// 실제 API 응답 속도와 무관하게 최소 노출 시간을 보장하는 건 RetirementWizard의
// 몫이고, 이 컴포넌트는 그 시간 동안 보여줄 연출만 담당한다.
"use client";

import { useEffect, useState } from "react";
import { WizardCard } from "./Ui";

const STEPS = [
  "입력하신 데이터 확인하는 중",
  "국민연금·퇴직연금 수령액 계산하는 중",
  "물가상승률 반영해 오늘 가치로 환산하는 중",
  "은퇴 후 자산 흐름 시뮬레이션하는 중",
];

const STEP_INTERVAL_MS = 550;

export default function AnalyzingScreen() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => setActiveStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <WizardCard>
      <div className="py-6">
        <div className="flex justify-center mb-6">
          <div
            className="w-10 h-10 rounded-full border-[3px] animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
          />
        </div>
        <div className="space-y-3 max-w-[280px] mx-auto">
          {STEPS.map((label, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            if (i > activeStep) return null;
            return (
              <div
                key={label}
                className="flex items-center gap-2 rise-in"
                style={{
                  color: done || active ? "var(--text-strong)" : "var(--text-faint)",
                }}
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center fs-caption"
                  style={{
                    background: done ? "var(--accent)" : "var(--surface-pressed)",
                    color: done ? "#fff" : "var(--text-faint)",
                    border: active ? "2px solid var(--accent)" : "none",
                  }}
                >
                  {done ? "✓" : ""}
                </span>
                <p className="fs-body">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </WizardCard>
  );
}
