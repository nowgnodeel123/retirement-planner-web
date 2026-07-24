// app/portfolio/accounts/[accountId]/page.tsx — 계좌 상세: 총 평가금액 요약 + 보유 자산 목록
// D-049 손익 + D-058 전일종가 라벨 + D-063 원화환산. 디자인 토큰 기반.
// M6: 보유자산 카드 → 자산 상세(매도/거래내역) 화면 링크 추가.
// M7: D-054 정렬(드롭다운) + D-069 관련 "정리한 자산"(전량매도) 섹션 분리.
// quantity===0인 자산은 보유목록에서 제외하고 하단 접이식 섹션으로 뺀다 — 백엔드는 그대로
// 전체를 내려주므로(GET /api/assets) 이 구분은 프론트 전용이며 API 변경 없음.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import { ProfitTab } from "@/app/components/portfolio/ProfitTab";
import { formatKrw, formatMoney, signed } from "@/app/components/portfolio/format";
import {
  HoldingSortKey,
  SortDirection,
  SortModal,
} from "@/app/components/portfolio/SortModal";
import {
  AccountResponse,
  AssetHoldingResponse,
  categoryUnit,
  detailTypeLabel,
  institutionLabel,
  TradableAssetCategory,
} from "@/app/components/portfolio/types";

function formatQuantity(qty: number) {
  return qty % 1 === 0 ? qty.toLocaleString() : qty.toString();
}

// M7: 정렬 기준값 추출. 해외주식은 원화환산 평가금액을 기준으로 삼아 카테고리가 섞여도
// 비교가 성립하게 한다(D-063/D-087 이중표시 원칙과 일관).
function getSortValue(
  h: AssetHoldingResponse,
  key: HoldingSortKey,
): number | null {
  if (key === "profitRate") return h.profitRate;
  if (h.category === "FOREIGN_STOCK") return h.krwEvaluationAmount;
  return h.evaluationAmount;
}

function sortHoldings(
  list: AssetHoldingResponse[],
  key: HoldingSortKey,
  dir: SortDirection,
): AssetHoldingResponse[] {
  return [...list].sort((a, b) => {
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "ko");
      return dir === "asc" ? cmp : -cmp;
    }
    const av = getSortValue(a, key);
    const bv = getSortValue(b, key);
    // 시세 조회 실패 등으로 값이 없는 자산은 정렬 방향과 무관하게 항상 맨 뒤로 —
    // "내림차순인데 알 수 없는 값이 위로 온다" 같은 혼란을 막는다.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });
}

function SkeletonCard() {
  return (
    <div className="card px-4 py-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div
            className="w-24 h-4 rounded"
            style={{ background: "var(--border)" }}
          />
          <div
            className="w-16 h-3 rounded"
            style={{ background: "var(--border)" }}
          />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div
            className="w-20 h-4 rounded"
            style={{ background: "var(--border)" }}
          />
          <div
            className="w-14 h-3 rounded"
            style={{ background: "var(--border)" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AccountDetailPage() {
  const params = useParams<{ accountId: string }>();
  const router = useRouter();
  const accountId = Number(params.accountId);

  const [account, setAccount] = useState<AccountResponse | null | undefined>(
    undefined,
  );
  const [holdings, setHoldings] = useState<AssetHoldingResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // M10(D-065): 계좌 상세 3탭(자산/수익/세금). 세금 탭은 M11 스코프 — 플레이스홀더만 노출.
  const [activeTab, setActiveTab] = useState<"ASSETS" | "PROFIT" | "TAX">(
    "ASSETS",
  );

  // M7: 정렬(D-054) — 기본값은 평가금액 내림차순(비중 큰 자산부터).
  const [sortKey, setSortKey] = useState<HoldingSortKey>("value");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [sortModalOpen, setSortModalOpen] = useState(false);

  // M7: 정리한 자산(전량매도) 섹션 — 기본 접힘.
  const [clearedOpen, setClearedOpen] = useState(false);

  useEffect(() => {
    // 단건 조회 API가 없어 목록에서 찾는다 — GET /api/accounts/{id}는 백로그 후보.
    api
      .get<AccountResponse[]>("/api/accounts")
      .then((all) => setAccount(all.find((a) => a.id === accountId) ?? null));

    api
      .get<AssetHoldingResponse[]>(`/api/assets?accountId=${accountId}`)
      .then(setHoldings)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "자산을 불러오지 못했어요.",
        ),
      );
  }, [accountId]);

  // 토스/도미노식 요약: 총 평가금액(원화 환산) + 총 손익. 시세 없는 자산은 제외하고 캡션 안내.
  const summary = useMemo(() => {
    if (!holdings || holdings.length === 0) return null;
    let totalKrw = 0;
    let profitKrw = 0;
    let excluded = 0;

    for (const h of holdings) {
      if (h.category === "FOREIGN_STOCK") {
        if (h.krwEvaluationAmount !== null && h.exchangeRate !== null) {
          totalKrw += h.krwEvaluationAmount;
          if (h.profitAmount !== null)
            profitKrw += h.profitAmount * h.exchangeRate;
        } else excluded++;
      } else if (h.evaluationAmount !== null) {
        totalKrw += h.evaluationAmount;
        if (h.profitAmount !== null) profitKrw += h.profitAmount;
      } else excluded++;
    }

    if (totalKrw === 0 && excluded > 0)
      return { totalKrw: null, profitKrw: 0, profitRate: 0, excluded };
    const cost = totalKrw - profitKrw;
    const profitRate = cost > 0 ? (profitKrw / cost) * 100 : 0;
    return { totalKrw, profitKrw, profitRate, excluded };
  }, [holdings]);

  // M7: quantity===0(전량매도)은 "정리한 자산"으로 분리. 요약(summary)은 위에서
  // holdings 전체를 그대로 쓰므로(평가금액 없는 자산은 자연히 0으로 반영) 영향 없음.
  const activeHoldings = useMemo(
    () => (holdings ?? []).filter((h) => h.quantity > 0),
    [holdings],
  );
  const clearedHoldings = useMemo(
    () => (holdings ?? []).filter((h) => h.quantity <= 0),
    [holdings],
  );
  const sortedActiveHoldings = useMemo(
    () => sortHoldings(activeHoldings, sortKey, sortDir),
    [activeHoldings, sortKey, sortDir],
  );

  if (account === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[14px] mb-4" style={{ color: "var(--text-sub)" }}>
          계좌를 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push("/portfolio")}
          className="text-[13px] font-semibold"
          style={{ color: "var(--accent)" }}
        >
          포트폴리오로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-6">
      <button
        onClick={() => router.push("/portfolio")}
        className="flex items-center gap-1 text-[13px] mb-5"
        style={{ color: "var(--text-sub)" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 6-6 6 6 6" />
        </svg>
        포트폴리오
      </button>

      <div className="mb-1">
        <h1
          className="text-[17px] font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          {account?.name ?? (
            <span
              className="inline-block w-32 h-6 rounded-md animate-pulse"
              style={{ background: "var(--border)" }}
            />
          )}
        </h1>
        {account && (
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "var(--text-sub)" }}
          >
            {institutionLabel[account.institutionType]}
            {account.detailType !== "NORMAL" &&
              ` · ${detailTypeLabel[account.detailType]}`}
          </p>
        )}
      </div>

      {/* M10(D-065): 자산/수익/세금 3탭 */}
      <div
        className="flex mb-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {(
          [
            { key: "ASSETS" as const, label: "자산" },
            { key: "PROFIT" as const, label: "수익" },
            { key: "TAX" as const, label: "세금" },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 text-center py-2.5 text-[13px] font-semibold relative"
            style={{
              color:
                activeTab === tab.key ? "var(--text-strong)" : "var(--text-faint)",
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span
                className="absolute left-0 right-0 -bottom-px h-[2px]"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === "PROFIT" && <ProfitTab accountId={accountId} />}

      {activeTab === "TAX" && (
        <div className="card px-4 py-9 text-center rise-in">
          <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
            세금 탭은 다음 업데이트(M11)에서 제공될 예정이에요.
          </p>
        </div>
      )}

      {activeTab === "ASSETS" && (
      <>
      {/* 총 평가금액 — 진입 즉시 "내 돈이 지금 얼마인가" */}
      {summary && summary.totalKrw !== null && (
        <div className="mt-5 mb-7 rise-in">
          <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
            총 평가금액
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
          <p
            className="text-[11px] mt-1.5"
            style={{ color: "var(--text-faint)" }}
          >
            원화 환산 기준
            {summary.excluded > 0 &&
              ` · 시세 미조회 자산 ${summary.excluded}건 제외`}
          </p>
        </div>
      )}
      {(!summary || summary.totalKrw === null) && <div className="mb-6" />}

      <div className="flex items-center justify-between mb-2.5 px-1">
        <p
          className="text-[13px] font-semibold"
          style={{ color: "var(--text-sub)" }}
        >
          보유 자산
        </p>
        <div className="flex items-center gap-1">
          {activeHoldings.length >= 2 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortModalOpen((v) => !v)}
                className="flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg"
                style={{ color: "var(--text-sub)" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M6 12h12M10 18h4" />
                </svg>
                정렬
              </button>
              {sortModalOpen && (
                <SortModal
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onApply={(key, dir) => {
                    setSortKey(key);
                    setSortDir(dir);
                    setSortModalOpen(false);
                  }}
                  onClose={() => setSortModalOpen(false)}
                />
              )}
            </div>
          )}
          <Link
            href={`/portfolio/accounts/${accountId}/assets/new`}
            className="text-[12px] font-semibold px-2 py-1 rounded-lg"
            style={{ color: "var(--accent)" }}
          >
            + 자산 추가
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {holdings === null && !error && (
        <div className="space-y-2.5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {holdings !== null && holdings.length === 0 && (
        <div className="card px-4 py-9 text-center">
          <p className="text-[13px] mb-3" style={{ color: "var(--text-sub)" }}>
            아직 보유한 자산이 없어요.
          </p>
          <Link
            href={`/portfolio/accounts/${accountId}/assets/new`}
            className="inline-block text-[13px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            첫 자산 추가하기
          </Link>
        </div>
      )}

      {/* M7: 자산은 있었지만 전부 정리(전량매도)한 경우 — 아래 "정리한 자산" 섹션으로 안내 */}
      {holdings !== null &&
        holdings.length > 0 &&
        activeHoldings.length === 0 && (
          <div className="card px-4 py-9 text-center">
            <p
              className="text-[13px] mb-1"
              style={{ color: "var(--text-sub)" }}
            >
              현재 보유 중인 자산이 없어요.
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              정리한 자산 {clearedHoldings.length}건은 아래에서 볼 수 있어요.
            </p>
          </div>
        )}

      {activeHoldings.length > 0 && (
        <div className="space-y-2.5 rise-in">
          {sortedActiveHoldings.map((h) => {
            const category = h.category as TradableAssetCategory;
            const priceUnavailable = h.quantity > 0 && h.currentPrice === null;
            const isGain = (h.profitAmount ?? 0) >= 0;

            return (
              <Link
                key={h.assetId}
                href={`/portfolio/accounts/${accountId}/assets/${h.assetId}`}
                className="card px-4 py-4 block active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* 좌: 종목 정보 */}
                  <div className="min-w-0">
                    <p
                      className="text-[15px] font-semibold truncate"
                      style={{ color: "var(--text-strong)" }}
                    >
                      {h.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <CategoryBadge category={category} />
                      {category === "DOMESTIC_STOCK" && (
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-faint)" }}
                        >
                          전일 종가 기준
                        </span>
                      )}
                    </div>
                    <p
                      className="amount text-[12px] mt-1.5"
                      style={{ color: "var(--text-sub)" }}
                    >
                      {formatQuantity(h.quantity)}
                      {categoryUnit[category] ?? ""} · 평단{" "}
                      {formatMoney(h.averagePrice, h.currency)}
                    </p>
                  </div>

                  {/* 우: 평가금액(주역) + 손익(색상) */}
                  <div className="text-right flex-shrink-0">
                    {priceUnavailable ? (
                      <p className="text-[12px] mt-1 text-amber-500">
                        시세 조회 실패
                      </p>
                    ) : (
                      h.evaluationAmount !== null && (
                        <>
                          <p
                            className="amount text-[15px] font-bold"
                            style={{ color: "var(--text-strong)" }}
                          >
                            {formatMoney(h.evaluationAmount, h.currency)}
                          </p>
                          {h.profitAmount !== null && h.profitRate !== null && (
                            <p
                              className="amount text-[12px] font-semibold mt-0.5"
                              style={{
                                color: isGain ? "var(--gain)" : "var(--loss)",
                              }}
                            >
                              {signed(
                                h.profitAmount,
                                formatMoney(h.profitAmount, h.currency),
                              )}{" "}
                              (
                              {signed(
                                h.profitRate,
                                `${Math.abs(h.profitRate).toFixed(2)}%`,
                              )}
                              )
                            </p>
                          )}
                          {category === "FOREIGN_STOCK" &&
                            h.krwEvaluationAmount !== null && (
                              <p
                                className="amount text-[11px] mt-0.5"
                                style={{ color: "var(--text-sub)" }}
                              >
                                ≈ {formatKrw(h.krwEvaluationAmount)}
                                {h.exchangeRateBaseDate && (
                                  <span style={{ color: "var(--text-faint)" }}>
                                    {" "}
                                    ({h.exchangeRateBaseDate} 환율)
                                  </span>
                                )}
                              </p>
                            )}
                        </>
                      )
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* M7: D-069 관련 — 정리한 자산(전량매도). 기본 접힘, 개수만 노출. */}
      {clearedHoldings.length > 0 && (
        <div className="mt-7">
          <button
            type="button"
            onClick={() => setClearedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-1 mb-2.5"
          >
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--text-sub)" }}
            >
              정리한 자산 ({clearedHoldings.length})
            </p>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: "var(--text-faint)",
                transform: clearedOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {clearedOpen && (
            <div className="space-y-2 rise-in">
              {clearedHoldings.map((h) => {
                const category = h.category as TradableAssetCategory;
                return (
                  <Link
                    key={h.assetId}
                    href={`/portfolio/accounts/${accountId}/assets/${h.assetId}`}
                    className="card px-4 py-3.5 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    style={{ opacity: 0.75 }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[14px] font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {h.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={category} />
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-faint)" }}
                        >
                          전량 매도
                        </span>
                      </div>
                    </div>
                    <p
                      className="amount text-[12px] flex-shrink-0"
                      style={{ color: "var(--text-faint)" }}
                    >
                      평단 {formatMoney(h.averagePrice, h.currency)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
