// format.ts — 계좌 상세 화면에 있던 금액 포맷 유틸을 M9 대시보드 컴포넌트와 공유하기 위해 추출.
// 값이 null이면 "—". 현금 자산의 평단처럼 애초에 개념이 없는 필드가 있어서,
// 호출부마다 분기하는 대신 포맷터가 흡수한다(가격 필드는 항상 nullable — 레포 규칙).
export function formatMoney(value: number | null, currency: string) {
  if (value === null) return "—";
  if (currency === "KRW") return `${Math.round(value).toLocaleString()}원`;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 수량 표시. 정수면 천 단위 콤마를, 소수면 입력한 자릿수를 그대로 보여준다.
 * 코인처럼 소수 수량이 있어 자릿수를 임의로 고정하지 않는다.
 */
export function formatQuantity(qty: number) {
  return qty % 1 === 0 ? qty.toLocaleString() : qty.toString();
}

export function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString()}원`;
}

/**
 * 손익 색. 0은 이익이 아니다 — 빨강(이익)으로 칠하면 아무 일도 없었는데 벌었다고 읽힌다.
 * 정확히 0일 때만 중립색으로 두고, 아주 작은 값은 실제 손익이므로 색을 유지한다.
 * eps를 주면 그 이하를 0으로 본다(퍼센트처럼 표시 정밀도가 다른 값용).
 */
export function profitColor(value: number | null, eps = 0): string {
  if (value === null || Math.abs(value) <= eps) return "var(--text-sub)";
  return value > 0 ? "var(--gain)" : "var(--loss)";
}

/** 0에는 부호를 붙이지 않는다("+0원"은 이익처럼 읽힌다). */
export function signed(value: number, formatted: string, eps = 0) {
  const bare = formatted.replace(/^[+-]/, "");
  if (Math.abs(value) <= eps) return bare;
  return `${value > 0 ? "+" : "-"}${bare}`;
}
