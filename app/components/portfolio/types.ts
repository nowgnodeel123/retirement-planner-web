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
