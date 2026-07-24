// format.ts — 계좌 상세 화면에 있던 금액 포맷 유틸을 M9 대시보드 컴포넌트와 공유하기 위해 추출.
export function formatMoney(value: number, currency: string) {
  if (currency === "KRW") return `${Math.round(value).toLocaleString()}원`;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString()}원`;
}

export function signed(value: number, formatted: string) {
  return `${value >= 0 ? "+" : "-"}${formatted.replace(/^-/, "")}`;
}
