// accountRules.ts — 계좌 기관유형·상세유형에 따라 어떤 자산 카테고리를 다룰 수 있는지의 단일 출처.
// 자산 등록 화면(assets/new)과 수익 탭 카테고리 필터(ProfitTab)가 공유한다.
import {
  AccountDetailType,
  CashCurrency,
  InstitutionType,
  TradableAssetCategory,
} from "@/app/components/portfolio/types";

// D-037: 계좌 기관유형이 허용하는 자산 카테고리만 남긴다.
// D-198(★핵심): 연금저축·IRP는 세제혜택계좌라 지정 상품만 거래 가능하다.
// 원래 의도는 개별주 차단이었는데 구현이 매수 자체를 전부 막고 있었다 — 이 계좌들에서
// 실제로 담는 ETF는 허용해야 맞다. 그래서 국내주식 카테고리는 열어두되, 검색을
// ETF로만 제한하고(etfOnly) 백엔드 AssetService.buy()가 ETF 여부를 다시 검증한다.
// 은행 계좌 유형은 제거했다(V17) — 예적금 입력이 끝내 구현되지 않아 자산을 아무것도
// 담을 수 없는 빈 계좌였고, 적금 만기·금리 계산은 이 앱의 범위가 아니라고 판단했다.
export function allowedCategories(
  institutionType: InstitutionType,
  detailType: AccountDetailType,
): TradableAssetCategory[] {
  if (detailType === "IRP" || detailType === "PENSION_SAVINGS") {
    return ["DOMESTIC_STOCK"];
  }
  switch (institutionType) {
    case "SECURITIES":
      return ["DOMESTIC_STOCK", "FOREIGN_STOCK"];
    case "EXCHANGE":
      return ["CRYPTO"];
  }
}

// 현금·외화는 거래가 아니라 잔액 입력이라 allowedCategories와 규칙이 다르다.
// 증권사 예수금과 거래소 원화/달러 예수금 모두
// 실제로 존재하는 잔액이다. 연금저축·IRP도 D-198이 막는 건 "지정 상품 개별 매수"이지
// 예수금 잔액이 아니다(백엔드 AssetService.upsertCash와 동일 규칙 — 거기도 분기 없음).
export const CASH_CURRENCIES: CashCurrency[] = ["KRW", "USD"];
