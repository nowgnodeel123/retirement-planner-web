// types.ts
export type RetirementPensionType = "DB" | "DC";

export interface RetirementFormState {
  currentAge: number | "";
  /** 세전 **연봉**(만원). 백엔드는 월소득을 받으므로 전송 직전에 12로 나눈다 —
      이름을 monthlyIncome 그대로 두면 단위를 착각해 12배 틀린 값이 들어간다. */
  annualIncome: number | "";
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
  annualIncome: "",
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
// 폼은 "5"(=5%)로 받고, 백엔드는 0.05를 기대하므로 반드시 100으로 나눠야 함.
// WHY(defaultPercent): 예전엔 비워두면 0%(수익률 없음)로 전송돼, 화면엔 "모르겠다면
// 연 7% 정도가 무난해요" 같은 안내가 있으면서도 실제로는 정반대로 가장 비관적인
// 값이 계산에 들어가던 버그였다 — 자기소개/은퇴가능나이가 실제보다 훨씬 늦게 나오거나
// 아예 infeasible로 나오는 원인이 될 수 있었다(실제 QA로 재현). 안내 문구가 말하는
// 값(백엔드 SimulationRequestDto의 기본값과 동일)을 빈 값의 실제 기본값으로 쓴다.
const toDecimalRate = (v: number | "", defaultPercent: number): number =>
  v === "" ? defaultPercent / 100 : v / 100;

/** 폼 상태 → 백엔드 요청 바디로 변환. 필드명·단위 불일치를 여기서 전부 해소한다. */
export function toRequestPayload(
  form: RetirementFormState,
): SimulationRequestPayload {
  return {
    currentAge: toNumber(form.currentAge),
    // 화면은 연봉으로 받고 백엔드는 월소득을 기대한다. 이 한 줄이 단위 경계다 —
    // 여기가 빠지면 화면·DB·계산이 전부 정상으로 보이면서 답만 12배 틀린다.
    monthlyIncome: toNumber(form.annualIncome) / 12,
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
    // 기본값은 백엔드 SimulationRequestDto의 필드 기본값과 동일하게 맞춘다(IRP 6 / DC 4 /
    // 연금저축 8 / 주식 10%). 입력칸 placeholder에도 같은 숫자를 적어둔다 — 셋이 어긋나면
    // "화면이 말하는 값"과 "실제 계산에 들어가는 값"이 달라진다.
    irpReturnRate: toDecimalRate(form.irpReturnRate, 6),
    // DB형이면 이 값은 백엔드에서 아예 안 쓰이지만, 필드 자체는 항상 보냄
    pensionReturnRate: toDecimalRate(form.dcReturnRate, 4),
    pensionSavingsReturnRate: toDecimalRate(form.pensionSavingsReturnRate, 8),
    stockAssetBalance: toNumber(form.stockEtfCurrentBalance),
    stockReturnRate: toDecimalRate(form.stockEtfReturnRate, 10),
    monthlyStockInvestment: toNumber(form.stockEtfMonthlyContribution),
  };
}

// ── D-218: 포트폴리오 프리필 ──
// 백엔드 SimulationPrefillResponseDto와 정확히 매칭. 금액은 전부 만원 단위로
// 내려오므로(서버에서 한 번만 환산) 폼에 그대로 넣으면 된다.
export interface SimulationPrefillResponse {
  currentAge: number | null;
  currentIrpBalance: number;
  currentPensionSavingsBalance: number;
  stockAssetBalance: number;
  excludedCount: number;
  excludedCashAmount: number;
  /** 지난번 시뮬레이션 때 사용자가 직접 입력한 값. 한 번도 안 돌렸으면 null. */
  savedProfile: SavedSimulationProfile | null;
}

/**
 * 백엔드 SimulationPrefillResponseDto.SavedProfile과 정확히 매칭.
 * 수익률은 소수(0.07)로 내려온다 — 폼은 %(7)를 쓰므로 여기서 100을 곱한다.
 */
export interface SavedSimulationProfile {
  monthlyIncome: number | null;
  targetMonthlyExpense: number | null;
  pensionYearsPaid: number | null;
  pensionType: string | null;
  yearsOfService: number | null;
  monthlyIrpContribution: number | null;
  monthlyPensionSavingsContribution: number | null;
  monthlyStockInvestment: number | null;
  irpReturnRate: number | null;
  pensionReturnRate: number | null;
  pensionSavingsReturnRate: number | null;
  stockReturnRate: number | null;
  dcCurrentBalance: number | null;
  irpBalanceManual: number | null;
  pensionSavingsBalanceManual: number | null;
  stockAssetBalanceManual: number | null;
}

/**
 * 프리필로 채워진 필드 — 각 입력 옆에 "불러옴" 배지를 붙이는 데 쓴다.
 * 숫자 필드로만 좁힌다: 퇴직연금 유형(DB/DC) 같은 문자열 필드에 금액을 넣는 실수를
 * 타입 단계에서 막는다.
 */
export type PrefilledField = {
  [K in keyof RetirementFormState]: RetirementFormState[K] extends number | ""
    ? K
    : never;
}[keyof RetirementFormState];

/**
 * 프리필 응답을 폼 상태에 반영한다.
 *
 * WHY 0은 채우지 않는가: 포트폴리오에 IRP 계좌가 아예 없으면 0이 내려온다. 그걸 "0"으로
 * 찍어두면 사용자가 다른 데서 굴리는 IRP가 있어도 이미 입력된 것처럼 보여 그냥 넘어가게
 * 된다. 빈칸으로 두면 placeholder 안내가 보이고 직접 입력하게 된다.
 *
 * WHY 이미 입력된 값은 덮지 않는가: 프리필은 마운트 시 1회지만, 응답이 늦게 도착하는
 * 동안 사용자가 이미 타이핑을 시작했을 수 있다. 사용자가 친 값이 항상 이긴다.
 */
export function applyPrefill(
  form: RetirementFormState,
  prefill: SimulationPrefillResponse,
): { form: RetirementFormState; prefilled: PrefilledField[] } {
  const next: RetirementFormState = { ...form };
  const numericFields = next as Record<PrefilledField, number | "">;
  const prefilled: PrefilledField[] = [];

  const fill = (key: PrefilledField, value: number | null) => {
    if (value === null || value <= 0) return;
    if (numericFields[key] !== "") return;
    numericFields[key] = value;
    prefilled.push(key);
  };

  // 순서가 규칙이다: 포트폴리오에서 나온 값을 먼저 채우고, 그 다음에 저장된 손입력이
  // 남은 빈칸을 채운다. fill이 이미 값이 있는 칸을 건드리지 않으므로 결과적으로
  // "포트폴리오 우선, 없으면 저장값"이 되고, 이는 대시보드 카드가 쓰는 규칙
  // (RetirementProfileService.resolveBalance)과 정확히 같다 — 두 경로가 갈라지면
  // 카드에 뜬 은퇴 나이와 위저드를 열어 그대로 제출한 답이 서로 달라진다.
  fill("currentAge", prefill.currentAge);
  fill("irpCurrentBalance", prefill.currentIrpBalance);
  fill("pensionSavingsCurrentBalance", prefill.currentPensionSavingsBalance);
  fill("stockEtfCurrentBalance", prefill.stockAssetBalance);

  const saved = prefill.savedProfile;
  if (saved) {
    // 수익률은 소수 → %. 0%는 사용자가 실제로 0을 고른 것일 수 있어 의미가 있는 값이라,
    // 금액과 달리 0도 그대로 복원한다(fillRate는 0을 허용한다).
    const fillRate = (key: PrefilledField, rate: number | null) => {
      if (rate === null) return;
      if (numericFields[key] !== "") return;
      numericFields[key] = Math.round(rate * 1000) / 10;
      prefilled.push(key);
    };

    // 저장된 값은 월소득이므로 연봉으로 되돌려 채운다(위 나눗셈의 역방향).
    fill("annualIncome", saved.monthlyIncome === null ? null : saved.monthlyIncome * 12);
    fill("targetMonthlyExpense", saved.targetMonthlyExpense);
    fill("pensionYearsPaid", saved.pensionYearsPaid);
    fill("yearsOfService", saved.yearsOfService);
    fill("irpMonthlyContribution", saved.monthlyIrpContribution);
    fill("pensionSavingsMonthlyContribution", saved.monthlyPensionSavingsContribution);
    fill("stockEtfMonthlyContribution", saved.monthlyStockInvestment);
    fill("dcCurrentBalance", saved.dcCurrentBalance);
    fill("irpCurrentBalance", saved.irpBalanceManual);
    fill("pensionSavingsCurrentBalance", saved.pensionSavingsBalanceManual);
    fill("stockEtfCurrentBalance", saved.stockAssetBalanceManual);

    fillRate("irpReturnRate", saved.irpReturnRate);
    fillRate("dcReturnRate", saved.pensionReturnRate);
    fillRate("pensionSavingsReturnRate", saved.pensionSavingsReturnRate);
    fillRate("stockEtfReturnRate", saved.stockReturnRate);

    // 퇴직연금 유형은 숫자가 아니라 PrefilledField에 들어가지 않는다("불러옴" 배지 없음).
    // 값 자체는 복원해야 한다 — DB/DC에 따라 2단계에서 묻는 항목이 통째로 달라진다.
    if (saved.pensionType === "DB" || saved.pensionType === "DC") {
      next.retirementPensionType = saved.pensionType;
    }
  }

  return { form: next, prefilled };
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
    // 입력한 목표(오늘 기준)를 은퇴 시점 물가로 환산한 값. totalMonthlyIncome이 명목이라
    // 비교는 이쪽과 해야 한다 — 예전엔 명목 소득에서 오늘 목표를 빼 없는 여유가 보였다.
    targetMonthlyExpenseAtRetirement: number;
    monthlyShortfall: number;
    estimatedRetirementAge: number;
    feasible: boolean;
    message: string;
    shareMessage: string;
  };
  breakdown: {
    nationalPension: number;
    retirementPension: number; // 퇴직연금(DB/DC)만. 55세 전 은퇴면 0
    retirementPensionGross: number;
    irp: number;
    irpGross: number;
    pensionSavings: number;
    pensionSavingsGross: number;
    pensionSavingsTaxBenefit: number;
    stockAsset: number;
  };
  // 은퇴 시점에 모여 있는 자산(만원). 월 수령액만으로는 규모가 안 잡힌다.
  // pensionUnlockAge는 연금 계열 잔액의 기준 나이(55세 전 은퇴면 주식과 시점이 다르다).
  accumulatedAssets: {
    retirementPensionLumpSum: number;
    irpBalance: number;
    pensionSavingsBalance: number;
    liquidBalance: number;
    total: number;
    pensionUnlockAge: number;
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
  // M16/D-169: 은퇴 후 주식/ETF 수익률만 확률분포로 대체해 1,000회 반복 — infeasible이면 null
  monteCarloResult: {
    successRatePercent: number;
    p10EndingBalance: number;
    p50EndingBalance: number;
    p90EndingBalance: number;
    runs: number;
    assumedReturnStddev: number;
  } | null;
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
