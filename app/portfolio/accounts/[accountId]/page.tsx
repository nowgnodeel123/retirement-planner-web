// app/portfolio/accounts/[accountId]/page.tsx — 계좌 상세: 보유 자산 목록 (D-047)
"use client";

import { useEffect, useState } from "react";
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

  if (account === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[14px] text-neutral-500 mb-4">
          계좌를 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push("/portfolio")}
          className="text-[13px] font-semibold text-blue-500"
        >
          포트폴리오로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6">
      <button
        onClick={() => router.push("/portfolio")}
        className="flex items-center gap-1 text-[13px] text-neutral-400 mb-4"
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

      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-neutral-800">
          {account?.name ?? (
            <span className="inline-block w-32 h-6 bg-neutral-200 rounded-md animate-pulse" />
          )}
        </h1>
        {account && (
          <p className="text-[13px] text-neutral-400 mt-1">
            {institutionLabel[account.institutionType]}
            {account.detailType !== "NORMAL" &&
              ` · ${detailTypeLabel[account.detailType]}`}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[13px] font-semibold text-neutral-500">보유 자산</p>
        <Link
          href={`/portfolio/accounts/${accountId}/assets/new`}
          className="text-[12px] font-semibold text-blue-500 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + 자산 추가
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      {holdings === null && !error && (
        <div className="flex justify-center pt-10">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin" />
        </div>
      )}

      {holdings !== null && holdings.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center">
          <p className="text-[13px] text-neutral-400 mb-3">
            아직 보유한 자산이 없어요.
          </p>
          <Link
            href={`/portfolio/accounts/${accountId}/assets/new`}
            className="inline-block text-[13px] font-semibold text-blue-500"
          >
            첫 자산 추가하기
          </Link>
        </div>
      )}

      {holdings !== null && holdings.length > 0 && (
        <div className="space-y-2">
          {holdings.map((h) => (
            <div
              key={h.assetId}
              className="flex items-center justify-between bg-white rounded-2xl border border-neutral-100 px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-neutral-800 truncate">
                  {h.name}
                </p>
                <div className="mt-1">
                  <CategoryBadge
                    category={h.category as TradableAssetCategory}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-[14px] font-semibold text-neutral-800">
                  {formatQuantity(h.quantity)}
                  {categoryUnit[h.category as TradableAssetCategory] ?? ""}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  평단 {h.averagePrice.toLocaleString()} {h.currency}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
