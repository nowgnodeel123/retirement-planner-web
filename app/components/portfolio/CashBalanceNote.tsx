// CashBalanceNote.tsx — 매수·매도 폼 아래에 "이 계좌의 해당 통화 예수금"과
// 거래 후 잔액을 한 줄로 보여준다.
//
// 왜 필요한가: D-240으로 매매가 예수금을 직접 깎게 되면서, 잔액보다 큰 매수는
// 서버가 400으로 거절한다. 예수금이 화면 어디에도 안 보이면 사용자는 제출을 누른
// 뒤에야 "부족하다"는 말을 듣게 된다 — 막을 거면 막히기 전에 보여줘야 한다.
//
// 예수금이 등록되지 않은 계좌(balance === null)면 아무것도 그리지 않는다.
// 그런 계좌는 매매가 예수금을 건드리지 않으므로(D-240 규칙 1) 보여줄 값 자체가 없고,
// "예수금 없음" 같은 문구를 띄우면 등록을 강요받는 것처럼 읽힌다.
import { formatMoney } from "@/app/components/portfolio/format";

export function CashBalanceNote({
  balance,
  currency,
  amount,
  kind,
}: {
  /** 같은 계좌·같은 통화 예수금 잔액. 미등록이면 null. */
  balance: number | null;
  currency: string;
  /** 이번 거래 대금(수량 × 단가). 아직 못 구하면 null. */
  amount: number | null;
  kind: "buy" | "sell";
}) {
  if (balance === null) return null;

  const delta = amount === null ? null : kind === "buy" ? -amount : amount;
  const after = delta === null ? null : balance + delta;
  const short = after !== null && after < 0;

  return (
    <p
      className="amount fs-caption mt-2 px-1"
      style={{ color: short ? "var(--warning)" : "var(--text-faint)" }}
    >
      {currency} 예수금 {formatMoney(balance, currency)}
      {after !== null && (
        <>
          {" → 거래 후 "}
          {formatMoney(after, currency)}
          {short && " · 잔액을 넘는 매수는 등록되지 않아요"}
        </>
      )}
    </p>
  );
}
