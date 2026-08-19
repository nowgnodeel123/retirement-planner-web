// RetirementWizard.tsx
"use client";

import { useState } from "react";
import {
  initialFormState,
  RetirementFormState,
  SimulationRequestPayload,
  SimulationResponseDto,
  toRequestPayload,
} from "./types";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2PensionInfo from "./Step2PensionInfo";
import Step3InvestmentAssets from "./Step3InvestmentAssets";
import AnalyzingScreen from "./AnalyzingScreen";
import ResultScreen from "./ResultScreen";
import { api, ApiError } from "@/lib/api";

type WizardStep = 1 | 2 | 3 | "analyzing" | "result";

// WHY: 실제 계산은 순식간에 끝나지만, AnalyzingScreen의 단계별 연출이 다
// 보이기 전에 결과가 바뀌면 어색하다. API 응답이 이보다 빨라도 최소 이만큼은
// 분석 화면을 유지해 연출이 끊기지 않게 한다(AnalyzingScreen의 4단계 ×
// STEP_INTERVAL_MS와 대략 맞춘 값).
const MIN_ANALYZING_MS = 2200;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RetirementWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<RetirementFormState>(initialFormState);
  const [result, setResult] = useState<SimulationResponseDto | null>(null);
  const [submittedPayload, setSubmittedPayload] =
    useState<SimulationRequestPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // WHY: 3단계에서 제출 실패로 에러가 뜬 채로 "이전"을 눌러 필드를 고치고
  // 다시 3단계로 돌아오면, 아직 재제출 전인데도 방금 고친 게 안 먹힌 것처럼
  // 보이는 낡은 에러 배너가 그대로 남아있던 버그가 있었다(실제 QA에서 발견).
  // 스텝을 옮길 때는 항상 에러를 함께 지운다.
  function goToStep(next: WizardStep) {
    setError(null);
    setStep(next);
  }

  function handleChange<K extends keyof RetirementFormState>(
    key: K,
    value: RetirementFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRestart() {
    // WHY: 입력값을 유지한다. 가장 흔한 재사용 패턴은 "수익률 하나만 바꿔서
    // 다시 계산"인데, 15개 필드를 다시 입력하게 하면 재계산을 포기한다. (검토 U-3)
    setResult(null);
    setError(null);
    setStep(1);
  }

  function validateBeforeSubmit(form: RetirementFormState): string | null {
    // WHY: Step2/Step3는 Step1과 달리 필수값 체크 없이 다음으로 넘어갈 수 있어서,
    // 빈 값이 0으로 변환되어 서버에 전송되면 @Min 검증에 걸려 400이 난다.
    // 서버까지 왕복하지 않고 여기서 바로 어떤 값이 비었는지 알려준다.
    if (!form.currentAge || form.currentAge < 20)
      return "현재 나이를 20세 이상으로 입력해주세요.";
    if (form.currentAge > 74) return "현재 나이는 74세 이하로 입력해주세요.";
    if (!form.monthlyIncome) return "현재 월 소득을 입력해주세요.";
    if (!form.targetMonthlyExpense) return "목표 은퇴 생활비를 입력해주세요.";
    if (form.pensionYearsPaid === "")
      return "국민연금 납입 기간을 입력해주세요.";
    if (
      typeof form.currentAge === "number" &&
      typeof form.pensionYearsPaid === "number" &&
      form.pensionYearsPaid > form.currentAge - 18
    ) {
      return `국민연금 납입 기간이 나이에 비해 너무 길어요. (최대 ${form.currentAge - 18}년)`;
    }
    // WHY: HTML min="0"만으로는 스피너/직접 타이핑으로 음수가 들어가는 걸
    // 완전히 막지 못한다(브라우저마다 동작이 다름). 값 자체를 한 번 더 검증한다.
    const nonNegativeFields: {
      key: keyof RetirementFormState;
      label: string;
    }[] = [
      { key: "yearsOfService", label: "근속연수" },
      { key: "dcCurrentBalance", label: "DC 현재 잔액" },
      { key: "irpCurrentBalance", label: "IRP 기존 잔액" },
      { key: "pensionSavingsCurrentBalance", label: "연금저축 기존 잔액" },
      { key: "stockEtfCurrentBalance", label: "주식/ETF 현재 잔액" },
    ];
    for (const { key, label } of nonNegativeFields) {
      const value = form[key];
      if (typeof value === "number" && value < 0) {
        return `${label}은 0 이상으로 입력해주세요.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    const validationError = validateBeforeSubmit(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setStep("analyzing");
    try {
      const payload = toRequestPayload(form);
      const [data] = await Promise.all([
        api.post<SimulationResponseDto>("/api/v1/simulation/calculate", payload),
        wait(MIN_ANALYZING_MS),
      ]);
      setResult(data);
      setSubmittedPayload(payload);
      setStep("result");
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        const detail = Object.entries(e.fields)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(", ");
        setError(`${e.message} (${detail})`);
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("계산 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      }
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-8 px-4">
      {step === 1 && (
        <Step1BasicInfo
          form={form}
          onChange={handleChange}
          onNext={() => goToStep(2)}
        />
      )}
      {step === 2 && (
        <Step2PensionInfo
          form={form}
          onChange={handleChange}
          onNext={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />
      )}
      {step === 3 && (
        <Step3InvestmentAssets
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onBack={() => goToStep(2)}
          submitting={submitting}
          error={error}
        />
      )}
      {step === "analyzing" && <AnalyzingScreen />}
      {step === "result" && result && submittedPayload && (
        <ResultScreen
          result={result}
          onRestart={handleRestart}
          basePayload={submittedPayload}
        />
      )}
    </div>
  );
}
