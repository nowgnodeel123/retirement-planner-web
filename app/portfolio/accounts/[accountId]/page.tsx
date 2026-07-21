// app/portfolio/accounts/[accountId]/page.tsx — 계좌 상세: 총 평가금액 요약 + 보유 자산 목록
// D-049 손익 + D-058 전일종가 라벨 + D-063 원화환산. 디자인 토큰 기반.
// M6: 보유자산 카드 → 자산 상세(매도/거래내역) 화면 링크 추가.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
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

function formatMoney(value: number, currency: string) {
  if (currency === "KRW") return `${Math.round(value).toLocaleString()}원`;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString()}원`;
}

function signed(value: number, formatted: string) {
  return `${value >= 0 ? "+" : "-"}${formatted.replace(/^-/, "")}`;
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
        <Link
          href={`/portfolio/accounts/${accountId}/assets/new`}
          className="text-[12px] font-semibold px-2 py-1 rounded-lg"
          style={{ color: "var(--accent)" }}
        >
          + 자산 추가
        </Link>
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

      {holdings !== null && holdings.length > 0 && (
        <div className="space-y-2.5 rise-in">
          {holdings.map((h) => {
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
    </div>
  );
}
