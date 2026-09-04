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

/**
 * 선택한 기간 밖에 내역이 더 있으면 알려준다.
 *
 * WHY: 기간이 "이번 달"이면 매월 1일에는 범위가 하루뿐이라, 며칠 전에 판 종목이
 * 목록에서 조용히 빠진다. 목록이 통째로 비면 눈치채지만, 다른 종목이 남아 있으면
 * 특정 종목만 사라진 것처럼 보여 계산 오류로 읽힌다 — 실제로 "해외주식은 왜 년·전체에만
 * 뜨냐"는 제보가 이 형태였다(해당 매도만 지난달 날짜였다). 그래서 비었을 때뿐 아니라
 * 부분적으로 빠졌을 때도 알리고, 기간 경계를 날짜로 그대로 보여준다.
 */
function OutOfRangeNotice({
  data,
  period,
  onShowAll,
}: {
  data: ProfitSummaryResponse;
  period: ProfitPeriod;
  onShowAll: () => void;
}) {
  const hidden = data.allTimeItemCount - data.items.length;
  if (period === "ALL" || hidden <= 0) return null;

  const range =
    data.rangeStart && data.rangeEnd
      ? `${formatDot(data.rangeStart)} ~ ${formatDot(data.rangeEnd)}`
      : null;

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--border)",
        marginBottom: "var(--rhythm-group)",
      }}
    >
      <p className="fs-caption" style={{ color: "var(--text-sub)" }}>
        {range && <>이 기간은 <b>{range}</b>이에요. </>}
        기간 밖에 {hidden}건이 더 있어요.
      </p>
      <button
        type="button"
        onClick={onShowAll}
        className="pressable mt-2 fs-caption font-semibold px-2.5 py-1 rounded-lg"
        style={{ color: "var(--accent)", background: "var(--surface)" }}
      >
        전체 기간으로 보기
      </button>
    </div>
  );
}

// 2026-08-26 → 8.26 (기간 경계는 연도가 같은 경우가 대부분이라 월·일만 보여준다)
function formatDot(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}.${Number(d)}`;
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


  return (
    <>
      {error && <ErrorBanner message={error} />}

      {data === null && !error && (
        <div className="space-y-2">
          <ProfitSkeletonCard />
          <ProfitSkeletonCard />
        </div>
      )}

      {data && <OutOfRangeNotice data={data} period={period} onShowAll={onShowAll} />}

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
                {data.allTimeItemCount > 0
                  ? "이 기간에는 내역이 없어요."
                  : "아직 실현손익·배당 내역이 없어요."}
              </p>
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
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      <CategoryBadge category={item.category as TradableAssetCategory} />
                      <span
                        className="fs-caption truncate"
                        style={{ color: "var(--text-sub)" }}
                      >
                        {item.accountName}
                      </span>
                      <span
                        className="fs-caption flex-shrink-0"
                        style={{ color: "var(--text-faint)" }}
                      >
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
