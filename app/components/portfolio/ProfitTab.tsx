// app/components/portfolio/ProfitTab.tsx
// M10(D-065): 계좌 상세 수익 탭 — 기간×카테고리 필터로 실현손익+배당 조회.
// 백엔드가 이미 병합·최신순 정렬해서 내려주므로(ProfitSummaryResponse.items)
// 자산 상세 화면의 combineHistory 같은 프론트 병합 로직은 불필요.
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import { formatKrw, profitColor, signed } from "@/app/components/portfolio/format";
import { PeriodFilterModal } from "@/app/components/portfolio/PeriodFilterModal";
import { CategoryFilterChips } from "@/app/components/portfolio/CategoryFilterChips";
import {
  ProfitPeriod,
  profitPeriodLabel,
  ProfitSummaryResponse,
  TradableAssetCategory,
} from "@/app/components/portfolio/types";

function ProfitSkeletonCard() {
  return (
    <div className="card px-4 py-3.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-20 h-3.5 rounded" style={{ background: "var(--border)" }} />
          <div className="w-14 h-3 rounded" style={{ background: "var(--border)" }} />
        </div>
        <div className="w-16 h-4 rounded" style={{ background: "var(--border)" }} />
      </div>
    </div>
  );
}

export function ProfitTab({
  accountId,
  allowed,
}: {
  accountId: number;
  allowed?: TradableAssetCategory[];
}) {
  const [period, setPeriod] = useState<ProfitPeriod>("MONTH");
  const [category, setCategory] = useState<TradableAssetCategory | null>(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  // 선택된 카테고리가 계좌가 다루지 않는 값으로 남지 않도록 정리
  useEffect(() => {
    if (category && allowed && !allowed.includes(category)) setCategory(null);
  }, [category, allowed]);

  const showChips = (allowed ?? ["DOMESTIC_STOCK", "FOREIGN_STOCK", "CRYPTO"])
    .length > 1;

  return (
    <div className="rise-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[13px] font-semibold" style={{ color: "var(--text-sub)" }}>
          기간별 수익
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodModalOpen((v) => !v)}
            className="flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg"
            style={{ color: "var(--text-sub)" }}
          >
            {profitPeriodLabel[period]}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {periodModalOpen && (
            <PeriodFilterModal
              period={period}
              onApply={(p) => {
                setPeriod(p);
                setPeriodModalOpen(false);
              }}
              onClose={() => setPeriodModalOpen(false)}
            />
          )}
        </div>
      </div>

      {showChips && (
        <div className="mb-4">
          <CategoryFilterChips
            value={category}
            onChange={setCategory}
            allowed={allowed}
          />
        </div>
      )}

      {/* 기간/카테고리가 바뀌면 key로 새로 마운트해 이전 응답이 잠깐 남아있는 것을 방지 —
          effect 안에서 setData(null)로 수동 리셋하지 않고 리마운트로 초기 state를 되찾는다. */}
      <ProfitContent
        key={`${period}-${category ?? "ALL"}`}
        accountId={accountId}
        period={period}
        category={category}
      />
    </div>
  );
}

function ProfitContent({
  accountId,
  period,
  category,
}: {
  accountId: number;
  period: ProfitPeriod;
  category: TradableAssetCategory | null;
}) {
  const [data, setData] = useState<ProfitSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ period });
    if (category) qs.set("category", category);
    api
      .get<ProfitSummaryResponse>(`/api/accounts/${accountId}/profit?${qs.toString()}`)
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "수익 정보를 불러오지 못했어요."),
      );
  }, [accountId, period, category]);

  return (
    <>
      {error && <ErrorBanner message={error} />}

      {data === null && !error && (
        <div className="space-y-2">
          <ProfitSkeletonCard />
          <ProfitSkeletonCard />
        </div>
      )}

      {data && (
        <>
          <div className="card px-4 py-4 mb-6">
            <div className="flex justify-between text-[13px]" style={{ color: "var(--text-sub)" }}>
              <span>실현손익</span>
              <span
                className="amount font-semibold"
                style={{ color: profitColor(data.realizedProfitKrw) }}
              >
                {signed(data.realizedProfitKrw, formatKrw(Math.abs(data.realizedProfitKrw)))}
              </span>
            </div>
            <div
              className="flex justify-between text-[13px] mt-1.5"
              style={{ color: "var(--text-sub)" }}
            >
              <span>배당수익</span>
              <span className="amount font-semibold" style={{ color: "var(--gain)" }}>
                +{formatKrw(data.dividendKrw)}
              </span>
            </div>
            <div
              className="flex justify-between text-[14px] mt-3 pt-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold" style={{ color: "var(--text-strong)" }}>
                합계
              </span>
              <span
                className="amount font-bold"
                style={{ color: profitColor(data.totalProfitKrw) }}
              >
                {signed(data.totalProfitKrw, formatKrw(Math.abs(data.totalProfitKrw)))}
              </span>
            </div>
          </div>

          {data.items.length === 0 ? (
            <div className="card px-4 py-9 text-center">
              <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
                해당 기간에 실현손익·배당 내역이 없어요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={`${item.kind}-${item.sourceId}`}
                  className="card px-4 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={
                          item.kind === "DIVIDEND"
                            ? { color: "var(--gain)" }
                            : { color: "var(--text-sub)", background: "var(--border)" }
                        }
                      >
                        {item.kind === "DIVIDEND" ? "배당" : "실현손익"}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                        {item.date}
                      </span>
                    </div>
                    <p
                      className="text-[13px] mt-1.5 truncate"
                      style={{ color: "var(--text-strong)" }}
                    >
                      {item.assetName}
                    </p>
                    <div className="mt-1">
                      <CategoryBadge category={item.category as TradableAssetCategory} />
                    </div>
                  </div>
                  <p
                    className="amount text-[13px] font-semibold flex-shrink-0"
                    style={{ color: profitColor(item.amountKrw) }}
                  >
                    {signed(item.amountKrw, formatKrw(Math.abs(item.amountKrw)))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
