// types.ts — 백엔드 DTO(AccountDtos, AssetDtos)와 1:1로 맞춘 타입 + 표시용 라벨/색상 맵

export type InstitutionType = "SECURITIES" | "EXCHANGE";
export type AccountDetailType = "NORMAL" | "ISA" | "IRP" | "PENSION_SAVINGS";

// M3 매수 거래 폼은 거래 기반 자산(주식/코인)만 다룬다 — 수량*단가로 평가금액이 나오는 것들.
export type TradableAssetCategory =
  | "DOMESTIC_STOCK"
  | "FOREIGN_STOCK"
  | "CRYPTO";

// 현금·외화는 거래가 아니라 잔액을 그대로 입력받는다(백엔드 POST /api/assets/cash).
// 수량·평단·손익이 없으므로 TradableAssetCategory와 구분해 둔다 — 매매 폼·수익 탭은
// 여전히 TradableAssetCategory만 받고, 표시 계열(뱃지·라벨·색)만 이 넓은 타입을 쓴다.
export type AssetCategory = TradableAssetCategory | "CASH";

// 현금 자산이 지원하는 통화. symbol 컬럼에 그대로 저장돼 계좌당 통화별 1건의 키가 된다.
export type CashCurrency = "KRW" | "USD";

export const cashCurrencyLabel: Record<CashCurrency, string> = {
  KRW: "원화 현금",
  USD: "미국 달러",
};

export interface AccountResponse {
  id: number;
  name: string;
  institutionType: InstitutionType;
  detailType: AccountDetailType;
  // 사용자가 끌어서 정한 순서. 아직 지정한 적 없으면 null → 목록에서 뒤로 간다.
  sortOrder: number | null;
  createdAt: string;
}

export interface AccountCreateRequest {
  name: string;
  institutionType: InstitutionType;
  detailType?: AccountDetailType | null;
}

export interface AssetHoldingResponse {
  assetId: number;
  accountId: number;
  symbol: string;
  name: string;
  category: string;
  currency: string;
  // 현금(CASH)은 quantity에 잔액이 들어오고 averagePrice는 null이다 —
  // 거래에서 파생되는 값이 아니라 사용자가 입력한 잔액 자체다.
  quantity: number;
  averagePrice: number | null;
  // M4(뒤늦은 프론트 반영): 시세 조회 실패 시 null — D-058, 화면은 그대로 정상 렌더
  currentPrice: number | null;
  evaluationAmount: number | null;
  profitAmount: number | null;
  profitRate: number | null;
  // M5: 원화가 아닌 자산(해외주식·외화 현금)만 값 존재, 그 외는 항상 null
  exchangeRate: number | null;
  krwEvaluationAmount: number | null;
  exchangeRateBaseDate: string | null;
  // 사용자가 끌어서 정한 순서. 아직 지정한 적 없으면 null → 목록에서 뒤로 간다.
  sortOrder: number | null;
}

// GET /api/domestic-stocks/search 응답 — DomesticStock 엔티티 그대로 직렬화됨
export interface DomesticStockSearchResult {
  symbolCode: string;
  name: string;
  market: string;
}

// GET /api/foreign-stocks/search 응답 — ForeignStockSearchResult 그대로 직렬화됨
export interface ForeignStockSearchResult {
  symbol: string;
  name: string;
  type: string;
}

// GET /api/crypto/search 응답 — CryptoSearchResult 그대로 직렬화됨
export interface CryptoSearchResult {
  symbol: string;
  name: string;
}

export interface AssetBuyRequest {
  accountId: number;
  symbol: string;
  name: string;
  category: TradableAssetCategory;
  quantity: number;
  unitPrice: number;
  currency?: string;
  fx?: number;
  tradeDate: string; // YYYY-MM-DD
}

export const institutionLabel: Record<InstitutionType, string> = {
  SECURITIES: "증권사",
  EXCHANGE: "거래소",
};

export const detailTypeLabel: Record<AccountDetailType, string> = {
  NORMAL: "일반",
  ISA: "ISA",
  IRP: "IRP",
  PENSION_SAVINGS: "연금저축",
};

export const categoryLabel: Record<AssetCategory, string> = {
  DOMESTIC_STOCK: "국내주식",
  FOREIGN_STOCK: "해외주식",
  CRYPTO: "암호화폐",
  CASH: "현금",
};

// globals.css의 --category-* 변수와 동일한 값. JS 쪽에서 인라인 스타일로 써야 하는
// 곳(뱃지 dot 등)이 있어 문자열로도 들고 있는다 — 값 자체의 출처는 CSS 변수가 원본.
export const categoryColor: Record<AssetCategory, string> = {
  DOMESTIC_STOCK: "#A78BFA",
  FOREIGN_STOCK: "#2DD4BF",
  CRYPTO: "#E879A8",
  CASH: "#94A3B8",
};

// D-062: 코인=개, 주식=주. 현금은 잔액 자체가 금액이라 단위를 붙이지 않는다.
export const categoryUnit: Record<AssetCategory, string> = {
  DOMESTIC_STOCK: "주",
  FOREIGN_STOCK: "주",
  CRYPTO: "개",
  CASH: "",
};

// M6: 거래내역
export type TransactionType = "BUY" | "SELL";

export interface TransactionResponse {
  transactionId: number;
  type: TransactionType;
  tradeDate: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  fx: number | null;
}

export interface AssetSellRequest {
  assetId: number;
  quantity: number;
  unitPrice: number;
  fx?: number;
  tradeDate: string; // YYYY-MM-DD
}

export const transactionTypeLabel: Record<TransactionType, string> = {
  BUY: "매수",
  SELL: "매도",
};

// M8: 배당 추적 (D-067)
export type DividendEligibleCategory = "DOMESTIC_STOCK" | "FOREIGN_STOCK";

export interface DividendResponse {
  dividendId: number;
  assetId: number;
  payDate: string; // YYYY-MM-DD
  exDividendDate: string | null; // YYYY-MM-DD, 선택 입력(자동조회 대신 수동입력으로 대체, R-018)
  amount: number; // 국내: 세후 원화 / 해외: USD
  fx: number | null; // 해외주식만 값 존재
}

export interface DividendCreateRequest {
  payDate: string;
  exDividendDate?: string;
  amount: number;
  fx?: number;
}

// M9: 포트폴리오 대시보드 (D-066/D-069/D-071~D-074)
export interface CategorySummary {
  category: string;
  totalKrw: number;
  assetCount: number;
}

// 계좌 목록에 계좌별 평가금액/손익을 함께 보여주기 위한 집계(D-066 확장)
export interface AccountSummary {
  accountId: number;
  totalKrw: number;
  profitKrw: number;
  profitRate: number;
}

// 메인 파이차트를 카테고리가 아니라 종목별로 보여주기 위한 집계(같은 종목은 계좌 무관하게 합산)
export interface HoldingSummary {
  symbol: string;
  name: string;
  category: string;
  totalKrw: number;
}

export interface PortfolioSummaryResponse {
  totalKrw: number | null; // 보유자산이 전부 시세 미조회로 제외되면 null
  profitKrw: number;
  profitRate: number;
  excludedCount: number;
  categories: CategorySummary[];
  accounts: AccountSummary[];
  holdings: HoldingSummary[];
}

export interface MonthlyInsightResponse {
  buyCount: number;
  buyAmountKrw: number;
  sellCount: number;
  sellAmountKrw: number;
  dividendCount: number;
  dividendAmountKrw: number;
}

// M10: 수익 탭 (D-065)
export type ProfitPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL";

export const profitPeriodLabel: Record<ProfitPeriod, string> = {
  DAY: "일",
  WEEK: "주",
  MONTH: "월",
  YEAR: "년",
  ALL: "전체",
};

export type ProfitItemKind = "REALIZED_SELL" | "DIVIDEND";

export interface ProfitItem {
  kind: ProfitItemKind;
  sourceId: number;
  assetId: number;
  assetName: string;
  category: string; // TradableAssetCategory 문자열
  date: string; // YYYY-MM-DD
  amountKrw: number;
}

export interface ProfitSummaryResponse {
  realizedProfitKrw: number;
  dividendKrw: number;
  totalProfitKrw: number;
  sellCount: number;
  dividendCount: number;
  items: ProfitItem[];
  // D-237: 서버가 계산한 기간 경계(ALL이면 null)와, 기간과 무관한 전체 내역 건수.
  // 기간 의미를 프론트에서 다시 계산하지 않기 위해 서버 값을 그대로 쓴다.
  rangeStart: string | null;
  rangeEnd: string | null;
  allTimeItemCount: number;
}

// M11: 세금 탭 (D-064 양도소득세 추정 / D-068 배당소득세 판정)
// 세금계산기 완전판이 아니라 추정·판정만 제공 — 실제 세액이 아니다.
export type DividendTaxJudgement =
  | "SEPARATE_TAXATION_FINAL"
  | "COMPREHENSIVE_FILING_POSSIBLE";

export const dividendJudgementLabel: Record<DividendTaxJudgement, string> = {
  SEPARATE_TAXATION_FINAL: "분리과세로 종결돼요",
  COMPREHENSIVE_FILING_POSSIBLE: "종합소득 신고 대상일 수 있어요",
};

export interface CapitalGainsEstimate {
  realizedProfitKrw: number; // 해외주식 연간 실현손익 합(D-107)
  basicDeductionKrw: number; // 250만원 고정
  taxableBaseKrw: number; // max(0, realizedProfitKrw - basicDeductionKrw)
  taxRate: number; // 0.22 고정
  estimatedTaxKrw: number;
  sellCount: number;
}

export interface DividendIncomeJudgement {
  totalDividendKrw: number; // 세전 환산 추정치(국내주식은 15.4% 원천징수율로 역환산, R-016)
  thresholdKrw: number; // 2000만원 고정
  exceedsThreshold: boolean;
  judgement: DividendTaxJudgement;
  interestIncomeNotTracked: boolean; // 항상 true — 이자소득 미추적 캐비트
  dividendGrossedUp: boolean; // 항상 true — 국내주식 배당 세전 역환산 적용 캐비트(R-016)
  dividendCount: number;
}

// M15(D-232): 이 집계가 어떤 계좌를 보고 어떤 계좌를 뺐는지. 백엔드 TaxDtos.TaxScope와 매칭.
export interface TaxScope {
  taxableAccountCount: number;
  excludedAccountCount: number;
  excludedAccountNames: string[];
}

export interface TaxSummaryResponse {
  year: number;
  capitalGains: CapitalGainsEstimate;
  dividendIncome: DividendIncomeJudgement;
  scope: TaxScope;
}

// D-219: 포트폴리오 메인 "은퇴 가능 나이" 카드. 백엔드 RetirementAgeCardDto와 매칭.
// 시뮬레이터를 한 번도 안 돌렸으면 hasProfile=false이고 나머지는 전부 null이다.
export interface RetirementAgeCardResponse {
  hasProfile: boolean;
  estimatedRetirementAge: number | null;
  feasible: boolean | null;
  targetMonthlyExpense: number | null;
  excludedCount: number;
}
