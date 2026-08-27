// accountRules.ts — 계좌 기관유형·상세유형에 따라 어떤 자산 카테고리를 다룰 수 있는지의 단일 출처.
// 자산 등록 화면(assets/new)과 수익 탭 카테고리 필터(ProfitTab)가 공유한다.
import {
  AccountDetailType,
  InstitutionType,
  TradableAssetCategory,
} from "@/app/components/portfolio/types";

// D-037: 계좌 기관유형이 허용하는 자산 카테고리만 남긴다.
// D-198(★핵심): 연금저축·IRP는 세제혜택계좌라 지정 상품(ETF·펀드 등)만 거래 가능하고
// 개별주 매수 자체가 안 된다 — 두 유형 모두 매수 대상 카테고리를 비운다(백엔드
// AssetService.buy()에도 동일 제약).
// 은행 계좌는 예적금(D-060 별도 입력 방식)만이라 이 목록도 비어 있다.
export function allowedCategories(
  institutionType: InstitutionType,
  detailType: AccountDetailType,
): TradableAssetCategory[] {
  if (detailType === "IRP" || detailType === "PENSION_SAVINGS") return [];
  switch (institutionType) {
    case "SECURITIES":
      return ["DOMESTIC_STOCK", "FOREIGN_STOCK"];
    case "EXCHANGE":
      return ["CRYPTO"];
    case "BANK":
      return [];
  }
}
