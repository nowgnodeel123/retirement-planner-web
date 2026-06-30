"use client";

import { useState } from "react";

interface SimulationResult {
  summary: {
    totalMonthlyIncome: number;
    totalMonthlyIncomeGross: number;
    targetMonthlyExpense: number;
    monthlyShortfall: number;
    estimatedRetirementAge: number;
    message: string;
    shareMessage: string;
  };
  breakdown: {
    nationalPension: number;
    retirementPension: number;
    retirementPensionGross: number;
    irp: number;
    irpGross: number;
    pensionSavings: number;
    pensionSavingsGross: number;
    pensionSavingsTaxBenefit: number;
    stockAsset: number;
  };
  taxDetail: {
    pensionIncomeTaxRate: number;
    healthInsuranceRate: number;
    monthlyPensionTax: number;
    monthlyHealthInsurance: number;
    totalMonthlyTax: number;
    isPreciseHealthInsurance: boolean;
    healthInsuranceIncomePart: number;
    healthInsurancePropertyPart: number;
    propertyDeductionApplied: number;
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
    salaryGrowthRate: number;
    postRetirementReturnRate: number;
    lifeExpectancy: number;
    nationalPensionReceiptAge: number;
    pensionType: string;
    militaryServiceMonths: number;
    childrenCount: number;
  };
}

interface FormState {
  currentAge: string;
  retirementAge: string;
  monthlyIncome: string;
  pensionYearsPaid: string;
  pensionType: "DB" | "DC";
  nationalPensionReceiptType: "NORMAL" | "EARLY" | "LATE";
  nationalPensionReceiptAge: string;
  militaryServiceMonths: string;
  childrenCount: string;
  monthlyIrpContribution: string;
  currentIrpBalance: string;
  monthlyPensionSavingsContribution: string;
  currentPensionSavingsBalance: string;
  targetMonthlyExpense: string;
  irpReturnRate: string;
  pensionReturnRate: string;
  pensionSavingsReturnRate: string;
  stockAssetBalance: string;
  stockReturnRate: string;
  monthlyStockInvestment: string;
  usePreciseHealthInsurance: boolean;
  realEstateValue: string;
  financialAssetValue: string;
}

interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

const RETURN_PRESETS = [
  {
    label: "보수형 📦",
    desc: "안정 위주",
    irp: "3",
    pension: "3",
    savings: "4",
    stock: "5",
  },
  {
    label: "중립형 ⚖️",
    desc: "균형 추천",
    irp: "5",
    pension: "4",
    savings: "6",
    stock: "7",
  },
  {
    label: "공격형 🚀",
    desc: "수익 추구",
    irp: "7",
    pension: "5",
    savings: "8",
    stock: "10",
  },
];

const STEPS = ["기본 정보", "연금 납입", "투자 자산", "수익률"];
const MAX_MILITARY_MONTHS = 12;
const IRP_ANNUAL_LIMIT = 300;
const PENSION_SAVINGS_ANNUAL_LIMIT = 600;
const PRIVATE_PENSION_COMBINED_LIMIT = 900;

const Tooltip2 = ({ text }: { text: string }) => (
  <span className="group relative inline-block ml-1">
    <span className="text-gray-400 cursor-help text-xs border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">
      ?
    </span>
    <span className="absolute left-0 bottom-6 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 w-52 z-10 leading-relaxed">
      {text}
    </span>
  </span>
);

const LimitProgressBar = ({
  current,
  limit,
  label,
  unit = "만원",
  colorClass = "bg-blue-500",
  bgClass = "bg-blue-100",
}: {
  current: number;
  limit: number;
  label: string;
  unit?: string;
  colorClass?: string;
  bgClass?: string;
}) => {
  const percent = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const isOver = current > limit;
  const isFull = current === limit;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span
          className={isOver ? "text-red-500 font-semibold" : "text-gray-600"}
        >
          {current.toLocaleString()}
          {unit} / {limit.toLocaleString()}
          {unit}
          {isFull && <span className="text-green-600 ml-1">달성! ✅</span>}
        </span>
      </div>
      <div className={`w-full ${bgClass} rounded-full h-2 overflow-hidden`}>
        <div
          className={`${isOver ? "bg-red-500" : colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

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

const DEFAULT_FORM: FormState = {
  currentAge: "",
  retirementAge: "",
  monthlyIncome: "",
  pensionYearsPaid: "",
  pensionType: "DC",
  nationalPensionReceiptType: "NORMAL",
  nationalPensionReceiptAge: "",
  militaryServiceMonths: "0",
  childrenCount: "0",
  monthlyIrpContribution: "",
  currentIrpBalance: "",
  monthlyPensionSavingsContribution: "",
  currentPensionSavingsBalance: "",
  targetMonthlyExpense: "",
  irpReturnRate: "",
  pensionReturnRate: "",
  pensionSavingsReturnRate: "",
  stockAssetBalance: "",
  stockReturnRate: "",
  monthlyStockInvestment: "",
  usePreciseHealthInsurance: false,
  realEstateValue: "",
  financialAssetValue: "",
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showHealthInsuranceForm, setShowHealthInsuranceForm] = useState(false);

  const showToast = (message: string, type: "error" | "success" = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  const isActive = (value: string) => Number(value) > 0;
  const isDC = form.pensionType === "DC";

  const irpAnnual = Number(form.monthlyIrpContribution || 0) * 12;
  const psAnnual = Number(form.monthlyPensionSavingsContribution || 0) * 12;
  const privatePensionTotalAnnual = irpAnnual + psAnnual;
  const taxCreditEligible = Math.min(
    Math.min(psAnnual, PENSION_SAVINGS_ANNUAL_LIMIT) + irpAnnual,
    PRIVATE_PENSION_COMBINED_LIMIT,
  );

  const clampToLimit = (monthlyValue: string, annualLimit: number) => {
    const annual = Number(monthlyValue || 0) * 12;
    if (annual > annualLimit) return String(Math.floor(annualLimit / 12));
    return monthlyValue;
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (!form.currentAge) return "현재 나이를 입력해주세요.";
      if (!form.retirementAge) return "목표 은퇴 나이를 입력해주세요.";
      if (!form.monthlyIncome) return "현재 월 소득을 입력해주세요.";
      if (!form.targetMonthlyExpense) return "목표 은퇴 생활비를 입력해주세요.";
      if (Number(form.currentAge) >= Number(form.retirementAge))
        return "목표 은퇴 나이는 현재 나이보다 커야 합니다.";
    }
    if (currentStep === 1) {
      if (!form.pensionYearsPaid) return "국민연금 가입 기간을 입력해주세요.";
      if (
        form.nationalPensionReceiptType !== "NORMAL" &&
        !form.nationalPensionReceiptAge
      )
        return "국민연금 수령 시작 나이를 입력해주세요.";
    }
    if (currentStep === 3) {
      if (isDC && !form.pensionReturnRate)
        return "퇴직연금 수익률을 입력해주세요.";
      if (isActive(form.monthlyIrpContribution) && !form.irpReturnRate)
        return "IRP 수익률을 입력해주세요.";
      if (
        isActive(form.monthlyPensionSavingsContribution) &&
        !form.pensionSavingsReturnRate
      )
        return "연금저축 수익률을 입력해주세요.";
      if (isActive(form.stockAssetBalance) && !form.stockReturnRate)
        return "주식/ETF 수익률을 입력해주세요.";
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "militaryServiceMonths") {
      const num = Number(value || 0);
      if (num > MAX_MILITARY_MONTHS) {
        showToast(
          `군복무 크레딧은 최대 ${MAX_MILITARY_MONTHS}개월까지만 인정됩니다.`,
        );
        setForm((prev) => ({
          ...prev,
          militaryServiceMonths: String(MAX_MILITARY_MONTHS),
        }));
        return;
      }
    }

    if (name === "monthlyIrpContribution") {
      const annual = Number(value || 0) * 12;
      if (annual > IRP_ANNUAL_LIMIT) {
        showToast(
          "IRP는 법정 연간 납입 한도(300만원)를 초과했습니다. 최대치로 조정됩니다.",
        );
        setForm((prev) => ({
          ...prev,
          monthlyIrpContribution: String(Math.floor(IRP_ANNUAL_LIMIT / 12)),
        }));
        return;
      }
    }

    if (name === "monthlyPensionSavingsContribution") {
      const annual = Number(value || 0) * 12;
      if (annual > PENSION_SAVINGS_ANNUAL_LIMIT) {
        showToast(
          "연금저축은 법정 연간 납입 한도(600만원)를 초과했습니다. 최대치로 조정됩니다.",
        );
        setForm((prev) => ({
          ...prev,
          monthlyPensionSavingsContribution: String(
            Math.floor(PENSION_SAVINGS_ANNUAL_LIMIT / 12),
          ),
        }));
        return;
      }
    }

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "monthlyIrpContribution" && Number(value) === 0)
        updated.irpReturnRate = "";
      if (name === "monthlyPensionSavingsContribution" && Number(value) === 0)
        updated.pensionSavingsReturnRate = "";
      if (name === "stockAssetBalance" && Number(value) === 0) {
        updated.stockReturnRate = "";
        updated.monthlyStockInvestment = "";
      }
      return updated;
    });
    if (
      [
        "irpReturnRate",
        "pensionReturnRate",
        "pensionSavingsReturnRate",
        "stockReturnRate",
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
      stockReturnRate:
        isActive(prev.stockAssetBalance) ||
        isActive(prev.monthlyStockInvestment)
          ? preset.stock
          : "",
    }));
  };

  const applyMaxTaxCredit = () =>
    setForm((prev) => ({
      ...prev,
      monthlyIrpContribution: "25",
      monthlyPensionSavingsContribution: "50",
    }));

  const applyIncomeBased = () => {
    const income = Number(form.monthlyIncome);
    if (!income) return showToast("먼저 월 소득을 입력해주세요.");
    const contribution = Math.round(income * 0.1);
    setForm((prev) => ({
      ...prev,
      monthlyIrpContribution: clampToLimit(
        String(Math.round(contribution * 0.33)),
        IRP_ANNUAL_LIMIT,
      ),
      monthlyPensionSavingsContribution: clampToLimit(
        String(Math.round(contribution * 0.67)),
        PENSION_SAVINGS_ANNUAL_LIMIT,
      ),
    }));
  };

  const buildRequestBody = () => ({
    currentAge: Number(form.currentAge),
    retirementAge: Number(form.retirementAge),
    monthlyIncome: Number(form.monthlyIncome),
    pensionYearsPaid: Number(form.pensionYearsPaid),
    pensionType: form.pensionType,
    nationalPensionReceiptType: form.nationalPensionReceiptType,
    nationalPensionReceiptAge: form.nationalPensionReceiptAge
      ? Number(form.nationalPensionReceiptAge)
      : null,
    militaryServiceMonths: Number(form.militaryServiceMonths),
    childrenCount: Number(form.childrenCount),
    monthlyIrpContribution: Number(form.monthlyIrpContribution),
    currentIrpBalance: Number(form.currentIrpBalance),
    monthlyPensionSavingsContribution: Number(
      form.monthlyPensionSavingsContribution,
    ),
    currentPensionSavingsBalance: Number(form.currentPensionSavingsBalance),
    targetMonthlyExpense: Number(form.targetMonthlyExpense),
    irpReturnRate: Number(form.irpReturnRate) / 100,
    pensionReturnRate: Number(form.pensionReturnRate) / 100,
    pensionSavingsReturnRate: Number(form.pensionSavingsReturnRate) / 100,
    stockAssetBalance: Number(form.stockAssetBalance),
    stockReturnRate: Number(form.stockReturnRate) / 100,
    monthlyStockInvestment: Number(form.monthlyStockInvestment),
    usePreciseHealthInsurance: form.usePreciseHealthInsurance,
    realEstateValue: Number(form.realEstateValue || 0),
    financialAssetValue: Number(form.financialAssetValue || 0),
  });

  const handleSubmit = async () => {
    const error = validateStep(3);
    if (error) return showToast(error);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulation/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildRequestBody()),
        },
      );
      if (!res.ok) {
        showToast("입력값을 확인해주세요.");
        return;
      }
      const data = await res.json();
      if (!data.summary) {
        showToast("계산 결과를 받아오지 못했습니다.");
        return;
      }
      setResult(data);
    } catch {
      showToast("서버 연결 실패. Spring Boot가 실행 중인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreciseHealthInsurance = () =>
    setShowHealthInsuranceForm((prev) => !prev);

  const handleRecalculateWithPreciseHealthInsurance = async () => {
    setForm((prev) => ({ ...prev, usePreciseHealthInsurance: true }));
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulation/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildRequestBody(),
            usePreciseHealthInsurance: true,
          }),
        },
      );
      if (!res.ok) {
        showToast("입력값을 확인해주세요.");
        return;
      }
      const data = await res.json();
      setResult(data);
      showToast("정확한 건보료가 반영됐습니다.", "success");
    } catch {
      showToast("재계산 실패. 다시 시도해주세요.");
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
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏦 은퇴 플래너
          </h1>
          <p className="text-gray-500">나는 몇 살에 은퇴할 수 있을까?</p>
        </div>

        {!result && (
          <div className="flex items-center justify-center mb-8 gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-colors ${step === i ? "bg-blue-600 text-white" : i < step ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${step === i ? "bg-white text-blue-600" : i < step ? "bg-blue-600 text-white" : "bg-gray-300 text-white"}`}
                  >
                    {i + 1}
                  </span>
                  {s}
                </button>
                {i < STEPS.length - 1 && (
                  <div className="w-3 h-px bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        )}

        {!result && step === 0 && (
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
                tooltip:
                  "비교용 참고값입니다. 실제 가능 나이는 시뮬레이션으로 계산됩니다.",
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
                  {tooltip && <Tooltip2 text={tooltip} />}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name={name}
                    value={form[name as keyof FormState] as string}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-400 w-14">{unit}</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                const e = validateStep(0);
                if (e) return showToast(e);
                setStep(1);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              다음 →
            </button>
          </div>
        )}

        {!result && step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              연금 납입 정보를 입력해주세요
            </h2>

            <div className="flex items-center justify-between">
              <label className={labelClass}>
                국민연금 가입 기간
                <Tooltip2 text="취업 후 지금까지 국민연금을 낸 기간입니다." />
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

            <div className="space-y-2">
              <label className={labelClass}>
                국민연금 수령 방식
                <Tooltip2 text="기본 65세 수령(1969년생 이후 기준). 조기수령 시 연 6% 감액, 연기수령 시 연 7.2% 증액." />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "NORMAL", label: "일반 수령", desc: "65세 수령" },
                  { type: "EARLY", label: "조기 수령", desc: "연 6% 감액" },
                  { type: "LATE", label: "연기 수령", desc: "연 7.2% 증액" },
                ].map(({ type, label, desc }) => (
                  <button
                    key={type}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        nationalPensionReceiptType: type as
                          | "NORMAL"
                          | "EARLY"
                          | "LATE",
                        nationalPensionReceiptAge: "",
                      }))
                    }
                    className={`rounded-xl border p-2 text-center transition-colors ${form.nationalPensionReceiptType === type ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50"}`}
                  >
                    <div className="font-semibold text-xs">{label}</div>
                    <div
                      className={`text-xs mt-0.5 ${form.nationalPensionReceiptType === type ? "text-blue-100" : "text-gray-400"}`}
                    >
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
              {form.nationalPensionReceiptType !== "NORMAL" && (
                <div className="flex items-center justify-between">
                  <label className={labelClass}>
                    {form.nationalPensionReceiptType === "EARLY"
                      ? "조기"
                      : "연기"}{" "}
                    수령 시작 나이
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="nationalPensionReceiptAge"
                      value={form.nationalPensionReceiptAge}
                      onChange={handleChange}
                      placeholder={
                        form.nationalPensionReceiptType === "EARLY"
                          ? "60~64"
                          : "66~70"
                      }
                      className={inputClass}
                    />
                    <span className="text-sm text-gray-400 w-14">세</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`${labelClass} mb-1`}>
                  군복무 크레딧
                  <Tooltip2
                    text={`군복무 기간이 최대 ${MAX_MILITARY_MONTHS}개월까지 국민연금 가입기간으로 인정됩니다.`}
                  />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="militaryServiceMonths"
                    value={form.militaryServiceMonths}
                    onChange={handleChange}
                    placeholder="0"
                    max={MAX_MILITARY_MONTHS}
                    className="w-16 text-right border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">개월</span>
                </div>
              </div>
              <div>
                <label className={`${labelClass} mb-1`}>
                  자녀 수
                  <Tooltip2 text="첫째아부터 출산 크레딧 적용. 가입기간이 추가로 인정됩니다." />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="childrenCount"
                    value={form.childrenCount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-16 text-right border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">명</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                퇴직연금 유형
                <Tooltip2 text="회사 HR팀이나 급여명세서에서 확인하세요." />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    type: "DB",
                    title: "DB형 (확정급여형)",
                    desc: "회사가 운용",
                    detail:
                      "최종 월급 × 근속연수로 계산. 연 5% 임금 상승 반영.",
                  },
                  {
                    type: "DC",
                    title: "DC형 (확정기여형)",
                    desc: "내가 직접 운용",
                    detail: "매년 월급 1개월치 적립. 수익률에 따라 달라짐.",
                  },
                ].map(({ type, title, desc, detail }) => (
                  <button
                    key={type}
                    onClick={() => handlePensionTypeChange(type as "DB" | "DC")}
                    className={`rounded-xl border p-3 text-left transition-colors ${form.pensionType === type ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50"}`}
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
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                IRP / 연금저축 납입액
                <Tooltip2 text="IRP와 연금저축을 합쳐 연 900만원까지 세액공제 혜택을 받을 수 있습니다." />
              </label>
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

            {/* IRP: 월납입 + 기존잔액 + 프로그레스바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClass}>
                  월 IRP 납입액
                  <Tooltip2 text="개인형 퇴직연금. 연 300만원이 법정 납입 한도입니다." />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="monthlyIrpContribution"
                    value={form.monthlyIrpContribution}
                    onChange={handleChange}
                    placeholder="예) 25"
                    className={
                      irpAnnual > IRP_ANNUAL_LIMIT
                        ? "w-28 text-right border-2 border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        : inputClass
                    }
                  />
                  <span className="text-sm text-gray-400 w-14">만원</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 ml-1">
                  현재 IRP 잔액
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="currentIrpBalance"
                    value={form.currentIrpBalance}
                    onChange={handleChange}
                    placeholder="기존 잔액"
                    className="w-28 text-right border border-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-gray-300"
                  />
                  <span className="text-xs text-gray-400 w-14">만원</span>
                </div>
              </div>
              {isActive(form.monthlyIrpContribution) && (
                <LimitProgressBar
                  current={irpAnnual}
                  limit={IRP_ANNUAL_LIMIT}
                  label="IRP 연간 납입"
                />
              )}
            </div>

            {/* 연금저축: 월납입 + 기존잔액 + 프로그레스바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClass}>
                  월 연금저축 납입액
                  <Tooltip2 text="연금저축펀드/보험. 연 600만원이 법정 납입 한도입니다." />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="monthlyPensionSavingsContribution"
                    value={form.monthlyPensionSavingsContribution}
                    onChange={handleChange}
                    placeholder="예) 50"
                    className={
                      psAnnual > PENSION_SAVINGS_ANNUAL_LIMIT
                        ? "w-28 text-right border-2 border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        : inputClass
                    }
                  />
                  <span className="text-sm text-gray-400 w-14">만원</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 ml-1">
                  현재 연금저축 잔액
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="currentPensionSavingsBalance"
                    value={form.currentPensionSavingsBalance}
                    onChange={handleChange}
                    placeholder="기존 잔액"
                    className="w-28 text-right border border-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-gray-300"
                  />
                  <span className="text-xs text-gray-400 w-14">만원</span>
                </div>
              </div>
              {isActive(form.monthlyPensionSavingsContribution) && (
                <LimitProgressBar
                  current={psAnnual}
                  limit={PENSION_SAVINGS_ANNUAL_LIMIT}
                  label="연금저축 연간 납입"
                />
              )}
            </div>

            {privatePensionTotalAnnual > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                <LimitProgressBar
                  current={taxCreditEligible}
                  limit={PRIVATE_PENSION_COMBINED_LIMIT}
                  label="🎯 IRP+연금저축 합산 세액공제 한도"
                  colorClass="bg-purple-500"
                  bgClass="bg-purple-100"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={() => {
                  const e = validateStep(1);
                  if (e) return showToast(e);
                  setStep(2);
                }}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 투자 자산 — 주식/ETF만 */}
        {!result && step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              투자 자산을 입력해주세요
            </h2>
            <p className="text-xs text-gray-400">
              주식/ETF가 없다면 건너뛰세요.
            </p>

            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                📈 주식 / ETF
                <Tooltip2 text="금투세 적용: 연 수익 250만원 초과분에 22% 과세." />
              </label>
              {[
                {
                  label: "현재 잔액",
                  name: "stockAssetBalance",
                  placeholder: "예) 2000",
                },
                {
                  label: "월 투자액",
                  name: "monthlyStockInvestment",
                  placeholder: "예) 50",
                },
              ].map(({ label, name, placeholder }) => (
                <div key={name} className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name={name}
                      value={form[name as keyof FormState] as string}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                    <span className="text-sm text-gray-400 w-14">만원</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {!result && step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">
              예상 수익률을 선택해주세요
            </h2>
            <p className="text-xs text-gray-400">
              잘 모르겠다면 중립형을 선택하세요. (적립 기간에만 적용되며, 은퇴
              후 인출 시에는 보수적 수익률이 별도로 적용됩니다)
            </p>

            <div className="grid grid-cols-3 gap-3">
              {RETURN_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  className={`rounded-xl border p-3 text-center transition-colors ${selectedPreset === i ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50"}`}
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
                    주식 {preset.stock}% / IRP {preset.irp}%
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">직접 수정할 수 있습니다.</p>

              <div className="flex items-center justify-between">
                <label className={isDC ? labelClass : disabledLabelClass}>
                  퇴직연금 수익률
                  {!isDC && (
                    <span className="ml-2 text-xs text-gray-300">
                      DB형 자동 계산
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
                      납입액 입력 시 활성화
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

              <div className="flex items-center justify-between">
                <label
                  className={
                    isActive(form.stockAssetBalance) ||
                    isActive(form.monthlyStockInvestment)
                      ? labelClass
                      : disabledLabelClass
                  }
                >
                  주식/ETF 수익률
                  {!(
                    isActive(form.stockAssetBalance) ||
                    isActive(form.monthlyStockInvestment)
                  ) && (
                    <span className="ml-2 text-xs text-gray-300">
                      자산 입력 시 활성화
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="stockReturnRate"
                    value={form.stockReturnRate}
                    onChange={handleChange}
                    placeholder="예) 7"
                    disabled={
                      !(
                        isActive(form.stockAssetBalance) ||
                        isActive(form.monthlyStockInvestment)
                      )
                    }
                    className={
                      isActive(form.stockAssetBalance) ||
                      isActive(form.monthlyStockInvestment)
                        ? inputClass
                        : disabledInputClass
                    }
                  />
                  <span
                    className={`text-sm w-14 ${isActive(form.stockAssetBalance) || isActive(form.monthlyStockInvestment) ? "text-gray-400" : "text-gray-200"}`}
                  >
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
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

        {result && (
          <div className="space-y-4">
            <div className="bg-blue-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-80 mb-1">예상 은퇴 가능 나이</p>
              <p className="text-6xl font-bold mb-1">
                {result.summary.estimatedRetirementAge}
                <span className="text-2xl">세</span>
              </p>
              <p className="text-sm opacity-80">
                {result.meta.yearsUntilRetirement}년 후 · 기대수명{" "}
                {result.meta.lifeExpectancy}세 기준
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-gray-800">
                  월 예상 은퇴 소득
                </h2>
                <span className="text-xs text-gray-400">세후 기준</span>
              </div>
              {[
                {
                  label: "국민연금",
                  value: result.breakdown.nationalPension,
                  gross: null,
                },
                {
                  label: `퇴직연금 (${result.meta.pensionType}형)`,
                  value: result.breakdown.retirementPension,
                  gross: result.breakdown.retirementPensionGross,
                },
                {
                  label: "IRP",
                  value: result.breakdown.irp,
                  gross: result.breakdown.irpGross,
                },
                {
                  label: "연금저축",
                  value: result.breakdown.pensionSavings,
                  gross: result.breakdown.pensionSavingsGross,
                },
                ...(result.breakdown.stockAsset > 0
                  ? [
                      {
                        label: "주식/ETF",
                        value: result.breakdown.stockAsset,
                        gross: null,
                      },
                    ]
                  : []),
              ].map(({ label, value, gross }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <div className="text-right">
                    <span className="font-medium">{value}만원</span>
                    {gross !== null && gross > 0 && gross !== value && (
                      <span className="text-xs text-gray-400 ml-1">
                        (세전 {gross}만원)
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>합계 (세후)</span>
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

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-red-900 text-sm">
                💸 월 세금 / 보험료 내역
              </h3>
              <div className="space-y-1 text-xs text-red-800">
                <div className="flex justify-between">
                  <span>연금소득세</span>
                  <span>{result.taxDetail.monthlyPensionTax}만원</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    건강보험료
                    {result.taxDetail.isPreciseHealthInsurance && (
                      <span className="ml-1 text-red-500">(정밀 계산)</span>
                    )}
                  </span>
                  <span>{result.taxDetail.monthlyHealthInsurance}만원</span>
                </div>
                {result.taxDetail.isPreciseHealthInsurance && (
                  <div className="pl-3 space-y-0.5 text-red-600">
                    <div className="flex justify-between">
                      <span>· 소득 기준분</span>
                      <span>
                        {result.taxDetail.healthInsuranceIncomePart}만원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>· 재산 기준분</span>
                      <span>
                        {result.taxDetail.healthInsurancePropertyPart}만원
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-red-200 pt-1">
                  <span>합계</span>
                  <span>{result.taxDetail.totalMonthlyTax}만원/월</span>
                </div>
              </div>

              {!result.taxDetail.isPreciseHealthInsurance && (
                <div className="bg-white rounded-xl border border-red-200 p-3">
                  <button
                    onClick={handleTogglePreciseHealthInsurance}
                    className="w-full text-left text-xs text-red-700 font-medium flex items-center justify-between"
                  >
                    <span>🏠 더 정확한 건보료가 궁금하다면?</span>
                    <span>{showHealthInsuranceForm ? "▲" : "▼"}</span>
                  </button>
                  {showHealthInsuranceForm && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-red-100">
                      <p className="text-xs text-gray-500">
                        건보료는 국민연금 소득뿐 아니라 보유 재산도 반영됩니다.
                        (재산 1억원까지 공제, 자동차는 미반영)
                      </p>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">
                          부동산 가액
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            name="realEstateValue"
                            value={form.realEstateValue}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                realEstateValue: e.target.value,
                              }))
                            }
                            placeholder="예) 30000"
                            className="w-28 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
                          />
                          <span className="text-xs text-gray-400 w-10">
                            만원
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">
                          금융재산
                          <br />
                          <span className="text-gray-400">
                            (ISA/IRP/연금저축 제외)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            name="financialAssetValue"
                            value={form.financialAssetValue}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                financialAssetValue: e.target.value,
                              }))
                            }
                            placeholder="예) 3000"
                            className="w-28 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
                          />
                          <span className="text-xs text-gray-400 w-10">
                            만원
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRecalculateWithPreciseHealthInsurance}
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading
                          ? "계산 중..."
                          : "정확한 건보료로 다시 계산하기"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {result.taxDetail.isPreciseHealthInsurance && (
                <p className="text-xs text-red-600">
                  ✅ 재산 {result.taxDetail.propertyDeductionApplied}만원 공제
                  적용된 정밀 건보료입니다.
                </p>
              )}
              {!result.taxDetail.isPreciseHealthInsurance && (
                <p className="text-xs text-red-500">
                  ※ 기본값은 국민연금 소득 기준만 반영한 추산입니다.
                </p>
              )}
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
                ※ 적립 기간엔 입력하신 수익률, 은퇴 후 인출 기간엔 보수적
                수익률(연{" "}
                {(result.meta.postRetirementReturnRate * 100).toFixed(0)}%)을
                적용한 실질 수령액입니다.
              </p>
              <p className="text-xs text-green-600">
                ※ 정확한 상담은 세무·재무 전문가에게 문의하세요.
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

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setStep(0);
                  setForm(DEFAULT_FORM);
                  setShowHealthInsuranceForm(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-2xl transition-colors"
              >
                🔄 다시 계산하기
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.summary.shareMessage);
                  showToast("클립보드에 복사됐습니다!", "success");
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-4 rounded-2xl transition-colors"
              >
                친구에게 공유하기 🔗
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 pb-4">
              ※ 본 결과는 단순 추산이며 실제 수령액과 다를 수 있습니다. 정확한
              상담은 전문가에게 문의하세요.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
