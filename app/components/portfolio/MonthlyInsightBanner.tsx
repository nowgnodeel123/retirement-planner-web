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
    <div className="card px-4 py-3.5 mb-7 rise-in flex items-center gap-3">
      {/* D-176: 이 카드가 텍스트만 왼쪽에 놓이고 오른쪽 절반이 빈 채로 남아
          다른 리스트 행(아이콘+텍스트)들과 시각적으로 겉돌던 것을, 같은
          아이콘-원 패턴을 적용해 화면 전체 리듬을 통일했다. */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-3-3-4 4" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
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
    </div>
  );
}
