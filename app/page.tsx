"use client";

import { useState } from "react";

interface SimulationResult {
  summary: {
    totalMonthlyIncome: number;
    targetMonthlyExpense: number;
    monthlyShortfall: number;
    estimatedRetirementAge: number;
    message: string;
    shareMessage: string;
  };
  breakdown: {
    nationalPension: number;
    retirementPension: number;
    irp: number;
    pensionSavings: number;
    pensionSavingsTaxBenefit: number;
  };
  taxBenefit: {
    taxCreditRate: number;
    incomeLevel: string;
    annualIncome: number;
    currentAnnualContribution: number;
    irpCurrentAnnual: number;
    irpAnnualLimit: number;
    irpRemainingLimit: number;
    pensionSavingsCurrentAnnual: number;
    pensionSavingsAnnualLimit: number;
    pensionSavingsRemainingLimit: number;
    currentTaxCredit: number;
    maxTaxCredit: number;
    additionalPossibleCredit: number;
    recommendedMonthlyIrp: number;
    recommendedMonthlyPensionSavings: number;
    optimizationTip: string;
  };
  meta: {
    yearsUntilRetirement: number;
    totalPensionYears: number;
    inflationRate: number;
  };
}

interface FormState {
  currentAge: string;
  retirementAge: string;
  monthlyIncome: string;
  pensionYearsPaid: string;
  pensionType: "DB" | "DC";
  monthlyIrpContribution: string;
  monthlyPensionSavingsContribution: string;
  targetMonthlyExpense: string;
  irpReturnRate: string;
  pensionReturnRate: string;
  pensionSavingsReturnRate: string;
}

const RETURN_PRESETS = [
  {
    label: "보수형 📦",
    desc: "안정 위주",
    irp: "3",
    pension: "3",
    savings: "4",
  },
  {
    label: "중립형 ⚖️",
    desc: "균형 추천",
    irp: "5",
    pension: "4",
    savings: "6",
  },
  {
    label: "공격형 🚀",
    desc: "수익 추구",
    irp: "7",
    pension: "5",
    savings: "8",
  },
];

const STEPS = ["기본 정보", "연금 납입", "수익률"];

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1">
    <span className="text-gray-400 cursor-help text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">
      ?
    </span>
    <div className="absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 w-52 z-10 leading-relaxed">
      {text}
    </div>
  </div>
);

const ProgressBar = ({
  current,
  limit,
}: {
  current: number;
  limit: number;
}) => (
  <div className="w-full bg-blue-100 rounded-full h-2">
    <div
      className="bg-blue-500 h-2 rounded-full transition-all"
      style={{ width: `${Math.min(100, (current / limit) * 100)}%` }}
    />
  </div>
);

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    currentAge: "",
    retirementAge: "",
    monthlyIncome: "",
    pensionYearsPaid: "",
    pensionType: "DC",
    monthlyIrpContribution: "",
    monthlyPensionSavingsContribution: "",
    targetMonthlyExpense: "",
    irpReturnRate: "",
    pensionReturnRate: "",
    pensionSavingsReturnRate: "",
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isActive = (value: string) => Number(value) > 0;
  const isDC = form.pensionType === "DC";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "monthlyIrpContribution" && Number(value) === 0)
        updated.irpReturnRate = "";
      if (name === "monthlyPensionSavingsContribution" && Number(value) === 0)
        updated.pensionSavingsReturnRate = "";
      return updated;
    });
    if (
      [
        "irpReturnRate",
        "pensionReturnRate",
        "pensionSavingsReturnRate",
      ].includes(name)
    ) {
      setSelectedPreset(null);
    }
  };

  const handlePensionTypeChange = (type: "DB" | "DC") => {
    setForm((prev) => ({
      ...prev,
      pensionType: type,
      pensionReturnRate: type === "DB" ? "0" : "",
    }));
    setSelectedPreset(null);
  };

  const applyPreset = (index: number) => {
    const preset = RETURN_PRESETS[index];
    setSelectedPreset(index);
    setForm((prev) => ({
      ...prev,
      irpReturnRate: isActive(prev.monthlyIrpContribution) ? preset.irp : "",
      pensionReturnRate: prev.pensionType === "DC" ? preset.pension : "0",
      pensionSavingsReturnRate: isActive(prev.monthlyPensionSavingsContribution)
        ? preset.savings
        : "",
    }));
  };

  const applyMaxTaxCredit = () => {
    setForm((prev) => ({
      ...prev,
      monthlyIrpContribution: "25",
      monthlyPensionSavingsContribution: "50",
    }));
  };

  const applyIncomeBased = () => {
    const income = Number(form.monthlyIncome);
    if (!income) return alert("먼저 월 소득을 입력해주세요.");
    const contribution = Math.round(income * 0.1);
    setForm((prev) => ({
      ...prev,
      monthlyIrpContribution: String(Math.round(contribution * 0.33)),
      monthlyPensionSavingsContribution: String(
        Math.round(contribution * 0.67),
      ),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulation/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentAge: Number(form.currentAge),
            retirementAge: Number(form.retirementAge),
            monthlyIncome: Number(form.monthlyIncome),
            pensionYearsPaid: Number(form.pensionYearsPaid),
            monthlyIrpContribution: Number(form.monthlyIrpContribution),
            monthlyPensionSavingsContribution: Number(
              form.monthlyPensionSavingsContribution,
            ),
            targetMonthlyExpense: Number(form.targetMonthlyExpense),
            irpReturnRate: Number(form.irpReturnRate) / 100,
            pensionReturnRate: Number(form.pensionReturnRate) / 100,
            pensionSavingsReturnRate:
              Number(form.pensionSavingsReturnRate) / 100,
          }),
        },
      );
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("서버 연결 실패. Spring Boot가 실행 중인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-28 text-right border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300";
  const disabledInputClass =
    "w-28 text-right border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-300 cursor-not-allowed";
  const labelClass = "text-sm text-gray-600 flex items-center";
  const disabledLabelClass = "text-sm text-gray-300 flex items-center";

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 은퇴 플래너
          </h1>
          <p className="text-gray-500">나는 몇 살에 은퇴할 수 있을까?</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === i
                    ? "bg-blue-600 text-white"
                    : i < step
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    step === i
                      ? "bg-white text-blue-600"
                      : i < step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-white"
                  }`}
                >
                  {i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              기본 정보를 입력해주세요
            </h2>
            {[
              {
                label: "현재 나이",
                name: "currentAge",
                unit: "세",
                placeholder: "예) 28",
                tooltip: null,
              },
              {
                label: "목표 은퇴 나이",
                name: "retirementAge",
                unit: "세",
                placeholder: "예) 60",
                tooltip: "몇 살에 은퇴하고 싶으신가요?",
              },
              {
                label: "현재 월 소득",
                name: "monthlyIncome",
                unit: "만원",
                placeholder: "예) 300",
                tooltip: "세전 월급을 입력해주세요.",
              },
              {
                label: "목표 은퇴 생활비",
                name: "targetMonthlyExpense",
                unit: "만원/월",
                placeholder: "예) 300",
                tooltip: "은퇴 후 매달 필요한 생활비입니다.",
              },
            ].map(({ label, name, unit, placeholder, tooltip }) => (
              <div key={name} className="flex items-center justify-between">
                <label className={labelClass}>
                  {label}
                  {tooltip && <Tooltip text={tooltip} />}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name={name}
                    value={form[name as keyof FormState]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-400 w-14">{unit}</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => setStep(1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              다음 →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              연금 납입 정보를 입력해주세요
            </h2>

            {/* 국민연금 가입 기간 */}
            <div className="flex items-center justify-between">
              <label className={labelClass}>
                국민연금 가입 기간
                <Tooltip text="취업 후 지금까지 국민연금을 낸 기간입니다. 예) 22세 취업 → 28세 현재 = 6년" />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="pensionYearsPaid"
                  value={form.pensionYearsPaid}
                  onChange={handleChange}
                  placeholder="예) 6"
                  className={inputClass}
                />
                <span className="text-sm text-gray-400 w-14">년</span>
              </div>
            </div>

            {/* 퇴직연금 유형 선택 */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 flex items-center">
                퇴직연금 유형
                <Tooltip text="회사 HR팀이나 급여명세서에서 확인할 수 있습니다." />
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    type: "DB",
                    title: "DB형 (확정급여형)",
                    desc: "회사가 운용",
                    detail:
                      "퇴직 시 받는 금액이 미리 정해져 있습니다. 수익률과 관계없이 일정 금액을 받습니다. 대기업·공기업에 많습니다.",
                  },
                  {
                    type: "DC",
                    title: "DC형 (확정기여형)",
                    desc: "내가 직접 운용",
                    detail:
                      "회사가 매년 월급 1개월치를 적립하고, 내가 직접 펀드·ETF로 운용합니다. 수익률에 따라 받는 금액이 달라집니다.",
                  },
                ].map(({ type, title, desc, detail }) => (
                  <button
                    key={type}
                    onClick={() => handlePensionTypeChange(type as "DB" | "DC")}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      form.pensionType === type
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-0.5">{title}</div>
                    <div
                      className={`text-xs font-medium mb-1 ${form.pensionType === type ? "text-blue-100" : "text-blue-500"}`}
                    >
                      {desc}
                    </div>
                    <div
                      className={`text-xs leading-relaxed ${form.pensionType === type ? "text-blue-100" : "text-gray-400"}`}
                    >
                      {detail}
                    </div>
                  </button>
                ))}
              </div>

              {/* 선택한 유형 안내 */}
              {form.pensionType === "DB" && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
                  ℹ️ DB형은 회사가 운용하므로 수익률을 따로 입력하지 않아도
                  됩니다. 월 소득 기준으로 자동 계산됩니다.
                </div>
              )}
              {form.pensionType === "DC" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  ℹ️ DC형은 다음 단계에서 퇴직연금 수익률을 직접 설정할 수
                  있습니다.
                </div>
              )}
            </div>

            {/* IRP / 연금저축 */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                IRP / 연금저축 납입액
                <Tooltip text="IRP와 연금저축을 합쳐 연 900만원까지 세액공제 혜택을 받을 수 있습니다." />
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={applyMaxTaxCredit}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl py-2 px-3 transition-colors text-left"
                >
                  💰 세액공제 최대화
                  <br />
                  <span className="text-gray-400">
                    IRP 25 + 연금저축 50만원
                  </span>
                </button>
                <button
                  onClick={applyIncomeBased}
                  className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl py-2 px-3 transition-colors text-left"
                >
                  📊 월 소득의 10%
                  <br />
                  <span className="text-gray-400">소득 기준 자동 계산</span>
                </button>
              </div>
            </div>

            {[
              {
                label: "월 IRP 납입액",
                name: "monthlyIrpContribution",
                placeholder: "예) 25",
                tooltip: "개인형 퇴직연금. 연 300만원까지 세액공제.",
              },
              {
                label: "월 연금저축 납입액",
                name: "monthlyPensionSavingsContribution",
                placeholder: "예) 50",
                tooltip: "연금저축펀드/보험. 연 600만원까지 세액공제.",
              },
            ].map(({ label, name, placeholder, tooltip }) => (
              <div key={name} className="flex items-center justify-between">
                <label className={labelClass}>
                  {label}
                  <Tooltip text={tooltip} />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name={name}
                    value={form[name as keyof FormState]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-400 w-14">만원</span>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              예상 수익률을 선택해주세요
            </h2>
            <p className="text-xs text-gray-400">
              잘 모르겠다면 중립형을 선택하세요.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {RETURN_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    selectedPreset === i
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {preset.label}
                  </div>
                  <div
                    className={`text-xs ${selectedPreset === i ? "text-blue-100" : "text-gray-400"}`}
                  >
                    {preset.desc}
                  </div>
                  <div
                    className={`text-xs mt-1 ${selectedPreset === i ? "text-blue-100" : "text-gray-400"}`}
                  >
                    IRP {preset.irp}% / 연금저축 {preset.savings}%
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">직접 수정할 수 있습니다.</p>

              {/* 퇴직연금 수익률 */}
              <div className="flex items-center justify-between">
                <label className={isDC ? labelClass : disabledLabelClass}>
                  퇴직연금 수익률
                  {!isDC && (
                    <span className="ml-2 text-xs text-gray-300">
                      DB형은 자동 계산
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="pensionReturnRate"
                    value={form.pensionReturnRate}
                    onChange={handleChange}
                    placeholder="예) 4"
                    disabled={!isDC}
                    className={isDC ? inputClass : disabledInputClass}
                  />
                  <span
                    className={`text-sm w-14 ${isDC ? "text-gray-400" : "text-gray-200"}`}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* IRP 수익률 */}
              <div className="flex items-center justify-between">
                <label
                  className={
                    isActive(form.monthlyIrpContribution)
                      ? labelClass
                      : disabledLabelClass
                  }
                >
                  IRP 수익률
                  {!isActive(form.monthlyIrpContribution) && (
                    <span className="ml-2 text-xs text-gray-300">
                      IRP 납입액 입력 시 활성화
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="irpReturnRate"
                    value={form.irpReturnRate}
                    onChange={handleChange}
                    placeholder="예) 5"
                    disabled={!isActive(form.monthlyIrpContribution)}
                    className={
                      isActive(form.monthlyIrpContribution)
                        ? inputClass
                        : disabledInputClass
                    }
                  />
                  <span
                    className={`text-sm w-14 ${isActive(form.monthlyIrpContribution) ? "text-gray-400" : "text-gray-200"}`}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* 연금저축 수익률 */}
              <div className="flex items-center justify-between">
                <label
                  className={
                    isActive(form.monthlyPensionSavingsContribution)
                      ? labelClass
                      : disabledLabelClass
                  }
                >
                  연금저축 수익률
                  {!isActive(form.monthlyPensionSavingsContribution) && (
                    <span className="ml-2 text-xs text-gray-300">
                      연금저축 납입액 입력 시 활성화
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="pensionSavingsReturnRate"
                    value={form.pensionSavingsReturnRate}
                    onChange={handleChange}
                    placeholder="예) 6"
                    disabled={!isActive(form.monthlyPensionSavingsContribution)}
                    className={
                      isActive(form.monthlyPensionSavingsContribution)
                        ? inputClass
                        : disabledInputClass
                    }
                  />
                  <span
                    className={`text-sm w-14 ${isActive(form.monthlyPensionSavingsContribution) ? "text-gray-400" : "text-gray-200"}`}
                  >
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "계산 중..." : "은퇴 나이 계산하기 🚀"}
              </button>
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-blue-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-80 mb-1">예상 은퇴 가능 나이</p>
              <p className="text-6xl font-bold mb-1">
                {result.summary.estimatedRetirementAge}
                <span className="text-2xl">세</span>
              </p>
              <p className="text-sm opacity-80">
                {result.meta.yearsUntilRetirement}년 후
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-gray-800 mb-4">
                월 예상 은퇴 소득
              </h2>
              {[
                { label: "국민연금", value: result.breakdown.nationalPension },
                {
                  label: `퇴직연금 (${form.pensionType}형)`,
                  value: result.breakdown.retirementPension,
                },
                { label: "IRP", value: result.breakdown.irp },
                { label: "연금저축", value: result.breakdown.pensionSavings },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value}만원</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>합계</span>
                <span>{result.summary.totalMonthlyIncome}만원</span>
              </div>
              <div
                className={`flex justify-between text-sm font-medium ${result.summary.monthlyShortfall >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                <span>목표 대비</span>
                <span>
                  {result.summary.monthlyShortfall >= 0 ? "+" : ""}
                  {result.summary.monthlyShortfall}만원
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                {result.summary.message}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
              <p className="text-sm text-green-800">
                💰 연금저축 세액공제 혜택: 연간{" "}
                {result.breakdown.pensionSavingsTaxBenefit}만원 절세
              </p>
              <p className="text-xs text-green-600">
                ※ 물가상승률 {(result.meta.inflationRate * 100).toFixed(1)}%를
                반영한 실질 수령액 기준입니다.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900">
                  🧾 세액공제 혜택 분석
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  {result.taxBenefit.incomeLevel}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-blue-700 mb-1">
                    <span>IRP 납입 한도</span>
                    <span>
                      {result.taxBenefit.irpCurrentAnnual}만원 /{" "}
                      {result.taxBenefit.irpAnnualLimit}만원
                    </span>
                  </div>
                  <ProgressBar
                    current={result.taxBenefit.irpCurrentAnnual}
                    limit={result.taxBenefit.irpAnnualLimit}
                  />
                  {result.taxBenefit.irpRemainingLimit > 0 && (
                    <p className="text-xs text-blue-500 mt-1">
                      연 {result.taxBenefit.irpRemainingLimit}만원 더 납입 가능
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-blue-700 mb-1">
                    <span>연금저축 납입 한도</span>
                    <span>
                      {result.taxBenefit.pensionSavingsCurrentAnnual}만원 /{" "}
                      {result.taxBenefit.pensionSavingsAnnualLimit}만원
                    </span>
                  </div>
                  <ProgressBar
                    current={result.taxBenefit.pensionSavingsCurrentAnnual}
                    limit={result.taxBenefit.pensionSavingsAnnualLimit}
                  />
                  {result.taxBenefit.pensionSavingsRemainingLimit > 0 && (
                    <p className="text-xs text-blue-500 mt-1">
                      연 {result.taxBenefit.pensionSavingsRemainingLimit}만원 더
                      납입 가능
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-blue-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-blue-700">현재 세액공제액</span>
                  <span className="font-medium text-blue-900">
                    연 {result.taxBenefit.currentTaxCredit}만원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">최대 세액공제액</span>
                  <span className="font-medium text-blue-900">
                    연 {result.taxBenefit.maxTaxCredit}만원
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                  <span className="text-blue-700">
                    추가로 받을 수 있는 공제
                  </span>
                  <span
                    className={
                      result.taxBenefit.additionalPossibleCredit > 0
                        ? "text-red-500"
                        : "text-green-600"
                    }
                  >
                    {result.taxBenefit.additionalPossibleCredit > 0
                      ? `연 ${result.taxBenefit.additionalPossibleCredit}만원 미활용`
                      : "최대 활용 중 ✅"}
                  </span>
                </div>
              </div>

              <div className="bg-blue-100 rounded-xl p-3 text-xs text-blue-800">
                💡 {result.taxBenefit.optimizationTip}
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(result.summary.shareMessage);
                alert("클립보드에 복사됐습니다!");
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-4 rounded-2xl transition-colors"
            >
              친구에게 공유하기 🔗
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
