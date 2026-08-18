// types.ts
export type RetirementPensionType = "DB" | "DC";

export interface RetirementFormState {
  currentAge: number | "";
  monthlyIncome: number | "";
  targetMonthlyExpense: number | "";

  pensionYearsPaid: number | "";

  retirementPensionType: RetirementPensionType;
  yearsOfService: number | ""; // DB형: 입사 후 지금까지 근속연수
  dcCurrentBalance: number | ""; // DC형: 현재까지 적립된 잔액
  dcReturnRate: number | "";

  irpMonthlyContribution: number | "";
  irpReturnRate: number | "";
  irpCurrentBalance: number | "";

  pensionSavingsMonthlyContribution: number | "";
  pensionSavingsReturnRate: number | "";
  pensionSavingsCurrentBalance: number | "";

  stockEtfMonthlyContribution: number | "";
  stockEtfReturnRate: number | "";
  stockEtfCurrentBalance: number | "";
}

export const initialFormState: RetirementFormState = {
  currentAge: "",
  monthlyIncome: "",
  targetMonthlyExpense: "",
  pensionYearsPaid: "",
  retirementPensionType: "DB",
  yearsOfService: "",
  dcCurrentBalance: "",
  dcReturnRate: "",
  irpMonthlyContribution: "",
  irpReturnRate: "",
  irpCurrentBalance: "",
  pensionSavingsMonthlyContribution: "",
  pensionSavingsReturnRate: "",
  pensionSavingsCurrentBalance: "",
  stockEtfMonthlyContribution: "",
  stockEtfReturnRate: "",
  stockEtfCurrentBalance: "",
};

// ── 백엔드 SimulationRequestDto와 정확히 매칭되는 전송용 타입 ──
export interface SimulationRequestPayload {
  currentAge: number;
  monthlyIncome: number;
  pensionYearsPaid: number;
  pensionType: RetirementPensionType;
  yearsOfService: number;
  dcCurrentBalance: number;
  monthlyIrpContribution: number;
  currentIrpBalance: number;
  monthlyPensionSavingsContribution: number;
  currentPensionSavingsBalance: number;
  targetMonthlyExpense: number;
  irpReturnRate: number;
  pensionReturnRate: number;
  pensionSavingsReturnRate: number;
  stockAssetBalance: number;
  stockReturnRate: number;
  monthlyStockInvestment: number;
}

const toNumber = (v: number | ""): number => (v === "" ? 0 : v);
// 폼은 "5"(=5%)로 받고, 백엔드는 0.05를 기대하므로 반드시 100으로 나눠야 함
const toDecimalRate = (v: number | ""): number => (v === "" ? 0 : v / 100);

/** 폼 상태 → 백엔드 요청 바디로 변환. 필드명·단위 불일치를 여기서 전부 해소한다. */
export function toRequestPayload(
  form: RetirementFormState,
): SimulationRequestPayload {
  return {
    currentAge: toNumber(form.currentAge),
    monthlyIncome: toNumber(form.monthlyIncome),
    pensionYearsPaid: toNumber(form.pensionYearsPaid),
    pensionType: form.retirementPensionType,
    // DB형이면 dcCurrentBalance는 백엔드에서 무시되고, DC형이면 yearsOfService가 0이어도 무해함
    yearsOfService: toNumber(form.yearsOfService),
    dcCurrentBalance: toNumber(form.dcCurrentBalance),
    monthlyIrpContribution: toNumber(form.irpMonthlyContribution),
    currentIrpBalance: toNumber(form.irpCurrentBalance),
    monthlyPensionSavingsContribution: toNumber(
      form.pensionSavingsMonthlyContribution,
    ),
    currentPensionSavingsBalance: toNumber(form.pensionSavingsCurrentBalance),
    targetMonthlyExpense: toNumber(form.targetMonthlyExpense),
    irpReturnRate: toDecimalRate(form.irpReturnRate),
    // DB형이면 이 값은 백엔드에서 아예 안 쓰이지만, 필드 자체는 항상 보냄
    pensionReturnRate: toDecimalRate(form.dcReturnRate),
    pensionSavingsReturnRate: toDecimalRate(form.pensionSavingsReturnRate),
    stockAssetBalance: toNumber(form.stockEtfCurrentBalance),
    stockReturnRate: toDecimalRate(form.stockEtfReturnRate),
    monthlyStockInvestment: toNumber(form.stockEtfMonthlyContribution),
  };
}

// ── 결과 화면 타임라인 차트 한 점 ──
// 퇴직연금(DB/DC)과 IRP+연금저축은 서로 다른 입력 경로를 가진 별개
// 상품이라 분리해서 내려온다(D-131) — 합쳐서 보여주면 "IRP를 안 넣었는데
// 왜 연금이 나오냐"처럼 어느 쪽에서 온 금액인지 헷갈릴 수 있다.
export interface IncomeTimelinePoint {
  age: number;
  nationalAfterTax: number;
  retirementPensionAfterTax: number;
  privatePensionAfterTax: number;
  liquidWithdrawalAfterTax: number;
  targetExpense: number;
}

// ── 백엔드 SimulationResponseDto와 정확히 매칭되는 응답 타입 ──
export interface SimulationResponseDto {
  summary: {
    totalMonthlyIncome: number;
    totalMonthlyIncomeGross: number;
    targetMonthlyExpense: number;
    monthlyShortfall: number;
    estimatedRetirementAge: number;
    feasible: boolean;
    message: string;
    shareMessage: string;
  };
  breakdown: {
    nationalPension: number;
    retirementPension: number; // 퇴직연금+IRP+연금저축 합산 (55세 전이면 0)
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
    monthlyStockTax: number;
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
  // M15/D-168: 건강보험 피부양자 자격 상실 가능성 추정(연금 정상 수령 시점 기준, 확정 판정 아님)
  dependentStatusWarning: {
    atRisk: boolean;
    estimatedAnnualIncome: number;
    thresholdAnnualIncome: number;
    message: string;
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
  incomeTimeline: IncomeTimelinePoint[];
}

// ── 금액 표시 헬퍼 ──
/** 만원 단위 숫자를 "1억 2,300만원" 형태로 사람이 읽기 쉽게 변환 */
export function formatManwon(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10000) {
    const eok = Math.floor(abs / 10000);
    const man = Math.round(abs % 10000);
    return man > 0
      ? `${sign}${eok}억 ${man.toLocaleString()}만원`
      : `${sign}${eok}억원`;
  }
  return `${sign}${abs.toLocaleString()}만원`;
}
