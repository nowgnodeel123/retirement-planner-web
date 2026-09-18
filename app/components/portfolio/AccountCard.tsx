// AccountCard.tsx — 포트폴리오 메인의 계좌 카드.
// D-201: [아이콘] [계좌이름 +배지] ↔ [평가금액] 을 카드 안에서 세로 가운데로 맞추고,
// 수익금·수익률은 평가금액 바로 아래에 딱 붙여 오른쪽 정렬한다.
// 오른쪽 스택에 -mb를 줘서 flexbox 중앙 정렬 기준을 "평가금액"으로 잡고(수익금은
// 아래 여백으로 흘려보냄) 평가금액이 이름과 같은 높이에 오게 한다.
// 총 매수금액은 표시하지 않는다(총자산은 상단에 이미 크게 있음). 수정/삭제는 SwipeRow가 담당.
import Link from "next/link";
import { AccountResponse, AccountSummary, detailTypeLabel } from "./types";
import { formatKrw, profitColor, signed } from "./format";
import { InstitutionIcon } from "./InstitutionIcon";

export function AccountCard({
  account,
  summary,
}: {
  account: AccountResponse;
  summary?: AccountSummary;
}) {
  return (
    <Link href={`/portfolio/accounts/${account.id}`} className="block">
      <div className="card pressable flex items-center gap-3 px-4 py-4">
        <InstitutionIcon type={account.institutionType} />

        {/* 이름 + 상세유형 배지 — 평가금액과 세로 가운데 정렬 */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <p
            className="font-semibold truncate fs-title"
            style={{ color: "var(--text-strong)" }}
          >
            {account.name}
          </p>
          {account.detailType !== "NORMAL" && (
            <span
              className="flex-shrink-0 font-medium rounded-md px-2 py-1 fs-caption"
              style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
            >
              {detailTypeLabel[account.detailType]}
            </span>
          )}
        </div>

        {/* 평가금액(가운데 기준) + 그 아래 딱 붙는 수익금(수익률) */}
        {summary && (
          <div className="flex flex-col items-end flex-shrink-0 leading-tight -mb-[16px]">
            <p
              className="amount font-bold fs-title"
              style={{ color: "var(--text-strong)" }}
            >
              {formatKrw(summary.totalKrw)}
            </p>
            <p
              className="amount font-medium mt-1 whitespace-nowrap fs-caption"
              style={{ color: profitColor(summary.profitKrw) }}
            >
              {signed(summary.profitKrw, formatKrw(Math.abs(summary.profitKrw)))} (
              {signed(
                summary.profitRate,
                `${Math.abs(summary.profitRate).toFixed(2)}%`,
              )}
              )
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
