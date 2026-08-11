// types.ts — 백엔드 DTO(AccountDtos, AssetDtos)와 1:1로 맞춘 타입 + 표시용 라벨/색상 맵

export type InstitutionType = "BANK" | "SECURITIES" | "EXCHANGE";
export type AccountDetailType = "NORMAL" | "ISA" | "IRP" | "PENSION_SAVINGS";

// M3 매수 거래 폼은 거래 기반 자산(주식/코인)만 다룬다.
// 펀드/현금은 D-060/8장 기준 별도 입력 방식(평가금액 직접입력/입금 히스토리)이라
// 백엔드 buy() 엔드포인트 대상이 아니다 — 추후 별도 화면에서 지원.
export type TradableAssetCategory =
  | "DOMESTIC_STOCK"
  | "FOREIGN_STOCK"
  | "CRYPTO";

export interface AccountResponse {
  id: number;
  name: string;
  institutionType: InstitutionType;
  detailType: AccountDetailType;
  createdAt: string;
}

export interface AccountCreateRequest {
  name: string;
  institutionType: InstitutionType;
  detailType?: AccountDetailType | null;
}

export interface AssetHoldingResponse {
  assetId: number;
  symbol: string;
  name: string;
  category: string;
  currency: string;
  quantity: number;
  averagePrice: number;
  // M4(뒤늦은 프론트 반영): 시세 조회 실패 시 null — D-058, 화면은 그대로 정상 렌더
  currentPrice: number | null;
  evaluationAmount: number | null;
  profitAmount: number | null;
  profitRate: number | null;
  // M5: 해외주식만 값 존재(D-063), 그 외 카테고리는 항상 null
  exchangeRate: number | null;
  krwEvaluationAmount: number | null;
  exchangeRateBaseDate: string | null;
}

// GET /api/domestic-stocks/search 응답 — DomesticStock 엔티티 그대로 직렬화됨
export interface DomesticStockSearchResult {
  symbolCode: string;
  name: string;
  market: string;
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
  BANK: "은행",
  SECURITIES: "증권사",
  EXCHANGE: "거래소",
};

export const detailTypeLabel: Record<AccountDetailType, string> = {
  NORMAL: "일반",
  ISA: "ISA",
  IRP: "IRP",
  PENSION_SAVINGS: "연금저축",
};

export const categoryLabel: Record<TradableAssetCategory, string> = {
  DOMESTIC_STOCK: "국내주식",
  FOREIGN_STOCK: "해외주식",
  CRYPTO: "암호화폐",
};

// globals.css의 --category-* 변수와 동일한 값. JS 쪽에서 인라인 스타일로 써야 하는
// 곳(뱃지 dot 등)이 있어 문자열로도 들고 있는다 — 값 자체의 출처는 CSS 변수가 원본.
export const categoryColor: Record<TradableAssetCategory, string> = {
  DOMESTIC_STOCK: "#A78BFA",
  FOREIGN_STOCK: "#2DD4BF",
  CRYPTO: "#E879A8",
};

// D-062: 코인=개, 주식=주
export const categoryUnit: Record<TradableAssetCategory, string> = {
  DOMESTIC_STOCK: "주",
  FOREIGN_STOCK: "주",
  CRYPTO: "개",
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
  amount: number; // 국내: 세후 원화 / 해외: USD
  fx: number | null; // 해외주식만 값 존재
}

export interface DividendCreateRequest {
  payDate: string;
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
  totalDividendKrw: number;
  thresholdKrw: number; // 2000만원 고정
  exceedsThreshold: boolean;
  judgement: DividendTaxJudgement;
  interestIncomeNotTracked: boolean; // 항상 true — 이자소득 미추적 캐비트
  dividendCount: number;
}

export interface TaxSummaryResponse {
  year: number;
  capitalGains: CapitalGainsEstimate;
  dividendIncome: DividendIncomeJudgement;
}
