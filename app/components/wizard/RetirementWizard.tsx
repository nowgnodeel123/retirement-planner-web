// RetirementWizard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyPrefill,
  initialFormState,
  PrefilledField,
  RetirementFormState,
  SimulationPrefillResponse,
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

  // D-218: 포트폴리오에서 채워진 필드와, 채우면서 빠진 금액에 대한 안내.
  const [prefilled, setPrefilled] = useState<PrefilledField[]>([]);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  // 프리필 응답이 도착한 시점의 최신 폼을 읽기 위한 미러. setForm 업데이터 안에서
  // setPrefilled를 부르면 상태 업데이터가 부수효과를 갖게 되므로(StrictMode 이중 호출)
  // 폼 스냅샷을 ref로 따로 들고 있는다.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });

  // WHY 실패해도 아무것도 안 하는가: 프리필은 편의 기능이지 필수 경로가 아니다.
  // 시세 서버가 죽어도 위저드는 지금까지처럼 빈 폼으로 그냥 동작해야 한다(조용히 degrade).
  // 반대로 "성공했는데 일부가 빠진" 경우는 조용히 넘어가면 안 된다 — 아래 notice 참조.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefill = await api.get<SimulationPrefillResponse>(
          "/api/v1/simulation/prefill",
        );
        if (cancelled) return;
        const { form: next, prefilled: filled } = applyPrefill(
          formRef.current,
          prefill,
        );
        setForm(next);
        setPrefilled(filled);
        setPrefillNotice(buildPrefillNotice(prefill));
      } catch {
        // 무시 — 수기 입력으로 진행
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    // WHY: 국민연금 납입 기간을 비워두면 다른 연금 필드(IRP/연금저축)처럼
    // 0으로 변환돼 전송된다(toRequestPayload). "0년 납입"은 유효한 값이라
    // 이 필드만 별도로 필수 처리하지 않는다 — 이전에는 비워도 2단계에서는
    // 넘어가지고 3단계 제출 시점에야 에러가 떴는데, 정작 고쳐야 할 필드는
    // 2단계에 있어서 혼란스러웠다.
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
          prefilled={prefilled}
        />
      )}
      {step === 2 && (
        <Step2PensionInfo
          form={form}
          onChange={handleChange}
          onNext={() => goToStep(3)}
          onBack={() => goToStep(1)}
          prefilled={prefilled}
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
          prefilled={prefilled}
          prefillNotice={prefillNotice}
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

/**
 * D-218: 프리필 금액이 실제보다 작을 수 있는 두 가지 사유를 사용자에게 그대로 알린다.
 * 여기서 침묵하면 사용자는 "내 자산 다 반영됐구나" 하고 넘어가고, 그 결과 은퇴 가능
 * 나이가 실제보다 늦게 나온다 — 시뮬레이터에서 가장 나쁜 실패 방식이다.
 */
function buildPrefillNotice(prefill: SimulationPrefillResponse): string | null {
  const parts: string[] = [];
  if (prefill.excludedCount > 0) {
    parts.push(
      `시세를 가져오지 못한 자산 ${prefill.excludedCount}건이 빠져 있어요`,
    );
  }
  if (prefill.excludedCashAmount > 0) {
    parts.push(
      `현금 ${prefill.excludedCashAmount.toLocaleString()}만원은 투자수익률이 붙지 않도록 빼고 채웠어요`,
    );
  }
  if (parts.length === 0) return null;
  return `${parts.join(", ")}. 실제와 다르면 직접 고쳐주세요.`;
}
