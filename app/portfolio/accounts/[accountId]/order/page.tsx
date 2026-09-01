// app/portfolio/accounts/[accountId]/order/page.tsx — 계좌 안 자산(종목) 순서 편집.
// 계좌 순서 편집 화면(/portfolio/order)과 같은 패턴. 전량매도한 "정리한 자산"은
// 목록이 따로라 여기 순서에 섞지 않는다.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { OrderEditHeader } from "@/app/components/portfolio/OrderEditHeader";
import {
  DragHandle,
  ReorderableList,
} from "@/app/components/portfolio/ReorderableList";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import {
  AssetCategory,
  AssetHoldingResponse,
} from "@/app/components/portfolio/types";

function byManualOrder(a: AssetHoldingResponse, b: AssetHoldingResponse) {
  const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  return ao !== bo ? ao - bo : a.assetId - b.assetId;
}

export default function AssetOrderPage() {
  const params = useParams<{ accountId: string }>();
  const router = useRouter();
  const accountId = Number(params.accountId);

  const [holdings, setHoldings] = useState<AssetHoldingResponse[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AssetHoldingResponse[]>(`/api/assets?accountId=${accountId}`)
      .then((all) =>
        setHoldings(all.filter((h) => h.quantity > 0).sort(byManualOrder)),
      )
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "자산을 불러오지 못했어요."),
      );
  }, [accountId]);

  async function handleSave() {
    if (!holdings) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/assets/order", {
        accountId,
        orderedIds: holdings.map((h) => h.assetId),
      });
      router.replace(`/portfolio/accounts/${accountId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "순서 저장에 실패했어요.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6 pb-24">
      <OrderEditHeader
        title="자산 순서"
        description="손잡이를 잡고 끌어서 원하는 순서로 바꾼 뒤 오른쪽 위 체크를 누르세요."
        onCancel={() => router.back()}
        onConfirm={handleSave}
        saving={saving}
        disabled={!holdings || holdings.length === 0}
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {holdings === null && !error && (
        <div className="space-y-2">
          <div className="card h-14 animate-pulse" />
          <div className="card h-14 animate-pulse" />
          <div className="card h-14 animate-pulse" />
        </div>
      )}

      {holdings !== null && holdings.length === 0 && (
        <div className="card px-4 py-8 text-center">
          <p className="fs-body" style={{ color: "var(--text-sub)" }}>
            순서를 정할 자산이 없어요.
          </p>
        </div>
      )}

      {holdings !== null && holdings.length > 0 && (
        <ReorderableList
          items={holdings}
          getId={(h) => h.assetId}
          onOrderChange={setHoldings}
          renderItem={(h) => (
            <div
              className="card flex items-center gap-3 px-4 py-3"
              style={{ touchAction: "pan-y" }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="fs-title font-semibold truncate"
                  style={{ color: "var(--text-strong)" }}
                >
                  {h.name}
                </p>
                <div className="mt-0.5">
                  <CategoryBadge category={h.category as AssetCategory} />
                </div>
              </div>
              <DragHandle />
            </div>
          )}
        />
      )}

    </div>
  );
}
