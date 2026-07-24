// PortfolioSummary.tsx — M9 대시보드 총자산 블록(D-066: 손익금액+손익률 통합 표시).
// 계좌 상세 화면(app/portfolio/accounts/[accountId]/page.tsx)의 총 평가금액 UI와
// 동일한 시각 패턴을 계좌 전체 범위(PortfolioSummaryResponse)로 재구현한다.
import { formatKrw, signed } from "./format";
import { PortfolioSummaryResponse } from "./types";

export function PortfolioSummary({
  summary,
}: {
  summary: PortfolioSummaryResponse | null;
}) {
  if (summary === null) {
    return (
      <div className="mb-2 animate-pulse">
        <div
          className="w-20 h-3.5 rounded"
          style={{ background: "var(--border)" }}
        />
        <div
          className="w-40 h-8 rounded mt-2"
          style={{ background: "var(--border)" }}
        />
      </div>
    );
  }

  if (summary.totalKrw === null) {
    return (
      <div className="mb-2">
        <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
          총자산
        </p>
        <p
          className="text-[15px] mt-2"
          style={{ color: "var(--text-sub)" }}
        >
          {summary.excludedCount > 0
            ? `시세 미조회 자산 ${summary.excludedCount}건 제외 — 표시할 자산이 없어요`
            : "아직 보유한 자산이 없어요"}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2 rise-in">
      <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
        총자산
      </p>
      <p
        className="amount text-[32px] font-bold mt-0.5"
        style={{ color: "var(--text-strong)" }}
      >
        {formatKrw(summary.totalKrw)}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="amount text-[14px] font-semibold"
          style={{
            color: summary.profitKrw >= 0 ? "var(--gain)" : "var(--loss)",
          }}
        >
          {signed(summary.profitKrw, formatKrw(summary.profitKrw))} (
          {signed(
            summary.profitRate,
            `${Math.abs(summary.profitRate).toFixed(2)}%`,
          )}
          )
        </span>
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>
        모든 계좌 · 원화 환산 기준
        {summary.excludedCount > 0 &&
          ` · 시세 미조회 자산 ${summary.excludedCount}건 제외`}
      </p>
    </div>
  );
}
