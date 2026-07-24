// MonthlyInsightBanner.tsx — D-069: "이번 달 매매+배당 요약" 인사이트 배너.
// 이번 달 활동이 전혀 없으면 빈 배너로 공간을 차지하지 않도록 렌더링 자체를 생략한다.
import { formatKrw } from "./format";
import { MonthlyInsightResponse } from "./types";

export function MonthlyInsightBanner({
  insight,
}: {
  insight: MonthlyInsightResponse | null;
}) {
  if (insight === null) {
    return (
      <div
        className="card px-4 py-3.5 mb-7 animate-pulse"
        style={{ height: 54 }}
      />
    );
  }

  const totalActivity =
    insight.buyCount + insight.sellCount + insight.dividendCount;
  if (totalActivity === 0) return null;

  const parts: string[] = [];
  if (insight.buyCount > 0) parts.push(`매수 ${insight.buyCount}건`);
  if (insight.sellCount > 0) parts.push(`매도 ${insight.sellCount}건`);
  if (insight.dividendCount > 0) parts.push(`배당 ${insight.dividendCount}건`);

  return (
    <div className="card px-4 py-3.5 mb-7 rise-in">
      <p className="text-[12px]" style={{ color: "var(--text-sub)" }}>
        이번 달
      </p>
      <p
        className="text-[14px] font-semibold mt-0.5"
        style={{ color: "var(--text-strong)" }}
      >
        {parts.join(" · ")}
      </p>
      {insight.dividendCount > 0 && (
        <p
          className="amount text-[12px] mt-1"
          style={{ color: "var(--gain)" }}
        >
          배당수익 +{formatKrw(insight.dividendAmountKrw)}
        </p>
      )}
    </div>
  );
}
