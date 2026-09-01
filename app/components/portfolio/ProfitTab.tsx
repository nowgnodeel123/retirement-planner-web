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

// M15(D-232): 계좌 스코프에서 인별 스코프로. accountId를 받지 않는다 —
// "내 실현손익이 얼마인가"는 계좌가 아니라 사람 단위의 질문이라서다.
// 카테고리 필터도 계좌 유형으로 제한할 이유가 없어졌다(전 계좌를 합쳐 보므로).
export function ProfitTab() {
  const [period, setPeriod] = useState<ProfitPeriod>("MONTH");
  const [category, setCategory] = useState<TradableAssetCategory | null>(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);


  return (
    <div className="rise-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="fs-body font-semibold" style={{ color: "var(--text-sub)" }}>
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

      <div className="mb-4">
        <CategoryFilterChips value={category} onChange={setCategory} />
      </div>

      {/* 기간/카테고리가 바뀌면 key로 새로 마운트해 이전 응답이 잠깐 남아있는 것을 방지 —
          effect 안에서 setData(null)로 수동 리셋하지 않고 리마운트로 초기 state를 되찾는다. */}
      <ProfitContent
        key={`${period}-${category ?? "ALL"}`}
        period={period}
        category={category}
        onShowAll={() => setPeriod("ALL")}
      />
    </div>
  );
}

function ProfitContent({
  period,
  category,
  onShowAll,
}: {
  period: ProfitPeriod;
  category: TradableAssetCategory | null;
  onShowAll: () => void;
}) {
  const [data, setData] = useState<ProfitSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 이 기간이 비었을 때, 다른 기간에는 내역이 있는지. null=아직 모름.
  const [hasOlder, setHasOlder] = useState<boolean | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ period });
    if (category) qs.set("category", category);
    api
      .get<ProfitSummaryResponse>(`/api/profit?${qs.toString()}`)
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "수익 정보를 불러오지 못했어요."),
      );
  }, [period, category]);

  // 기본 기간이 "월"이라 지난달에 판 종목은 화면에서 그냥 사라진다. 실제로 "매도했는데
  // 수익이 안 잡힌다"는 제보가 여기서 나왔다 — 사용자는 기간을 하나씩 바꿔보고 나서야
  // 찾았다. 비어 있을 때 "다른 기간에는 있다"는 사실을 알려주지 않으면, 화면의 0원이
  // 데이터가 없다는 뜻인지 기간이 안 맞는다는 뜻인지 구분할 방법이 없다.
  useEffect(() => {
    // 기간·카테고리가 바뀌면 key로 리마운트돼 hasOlder가 null로 다시 시작하므로,
    // 여기서 되돌릴 필요가 없다(이펙트 본문 setState는 연쇄 렌더를 부른다).
    if (!data || data.items.length > 0 || period === "ALL") return;
    const qs = new URLSearchParams({ period: "ALL" });
    if (category) qs.set("category", category);
    api
      .get<ProfitSummaryResponse>(`/api/profit?${qs.toString()}`)
      .then((all) => setHasOlder(all.items.length > 0))
      .catch(() => setHasOlder(false));
  }, [data, period, category]);

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
          <div className="card px-4 py-4" style={{ marginBottom: "var(--rhythm-section)" }}>
            <div className="flex justify-between fs-body" style={{ color: "var(--text-sub)" }}>
              <span>실현손익</span>
              <span
                className="amount font-semibold"
                style={{ color: profitColor(data.realizedProfitKrw) }}
              >
                {signed(data.realizedProfitKrw, formatKrw(Math.abs(data.realizedProfitKrw)))}
              </span>
            </div>
            <div
              className="flex justify-between fs-body mt-1.5"
              style={{ color: "var(--text-sub)" }}
            >
              <span>배당수익</span>
              {/* 배당은 음수가 될 수 없지만 0일 수는 있다. 색과 부호를 직접 박아두면
                  받은 배당이 없을 때도 "+0원"이 이익 빨강으로 떠서, 바로 위 실현손익
                  0원(회색)과 다르게 읽힌다 — 위 두 줄과 같은 헬퍼를 거치게 통일. */}
              <span
                className="amount font-semibold"
                style={{ color: profitColor(data.dividendKrw) }}
              >
                {signed(data.dividendKrw, formatKrw(data.dividendKrw))}
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
              <p className="fs-body" style={{ color: "var(--text-sub)" }}>
                {hasOlder
                  ? "이 기간에는 내역이 없어요."
                  : "아직 실현손익·배당 내역이 없어요."}
              </p>
              {hasOlder && (
                <button
                  type="button"
                  onClick={onShowAll}
                  className="pressable mt-3 fs-body font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
                >
                  전체 기간으로 보기
                </button>
              )}
            </div>
          ) : (
            /* 항목마다 따로 카드를 띄우면 화면이 조각나 "붕 뜬" 느낌이 난다(D-124/D-128과
               같은 문제). 한 장의 카드 안에 구분선으로 나눠 목록이 하나의 덩어리로 읽히게 한다. */
            <div className="card overflow-hidden">
              {data.items.map((item, i) => (
                <div
                  key={`${item.kind}-${item.sourceId}`}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                  style={
                    i > 0
                      ? { borderTop: "1px solid var(--border)" }
                      : undefined
                  }
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="fs-caption font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={
                          item.kind === "DIVIDEND"
                            ? { color: "var(--gain)", background: "var(--gain-soft)" }
                            : { color: "var(--text-sub)", background: "var(--border)" }
                        }
                      >
                        {item.kind === "DIVIDEND" ? "배당" : "실현손익"}
                      </span>
                      <p
                        className="fs-body font-medium truncate"
                        style={{ color: "var(--text-strong)" }}
                      >
                        {item.assetName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CategoryBadge category={item.category as TradableAssetCategory} />
                      <span className="fs-caption" style={{ color: "var(--text-faint)" }}>
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <p
                    className="amount fs-body font-semibold flex-shrink-0"
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
