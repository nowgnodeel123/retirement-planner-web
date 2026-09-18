// app/portfolio/order/page.tsx — 계좌 순서 편집 전용 화면.
// 목록 화면에 인라인으로 넣지 않는 이유는 ReorderableList 주석 참고(제스처 충돌).
// 여기서는 금액·손익을 다 빼고 이름만 남긴 얇은 행으로 그린다 — 한 화면에 다 들어와야
// 드래그 이동 거리가 짧아진다. 저장은 확인 버튼을 눌러야 일어난다(실수로 옮겨도 취소 가능).
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { OrderEditHeader } from "@/app/components/portfolio/OrderEditHeader";
import {
  DragHandle,
  ReorderableList,
} from "@/app/components/portfolio/ReorderableList";
import { InstitutionIcon } from "@/app/components/portfolio/InstitutionIcon";
import {
  AccountResponse,
  detailTypeLabel,
} from "@/app/components/portfolio/types";

function byManualOrder(a: AccountResponse, b: AccountResponse) {
  const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  return ao !== bo ? ao - bo : a.id - b.id;
}

export default function AccountOrderPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AccountResponse[]>("/api/accounts")
      .then((all) => setAccounts([...all].sort(byManualOrder)))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요."),
      );
  }, []);

  async function handleSave() {
    if (!accounts) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/accounts/order", {
        orderedIds: accounts.map((a) => a.id),
      });
      router.replace("/portfolio");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "순서 저장에 실패했어요.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6">
      <OrderEditHeader
        title="계좌 순서"
        description="손잡이를 잡고 끌어서 원하는 순서로 바꾼 뒤 오른쪽 위 저장을 누르세요."
        onCancel={() => router.back()}
        onConfirm={handleSave}
        saving={saving}
        disabled={!accounts || accounts.length === 0}
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {accounts === null && !error && (
        <div className="space-y-2">
          <div className="card h-14 animate-pulse" />
          <div className="card h-14 animate-pulse" />
          <div className="card h-14 animate-pulse" />
        </div>
      )}

      {accounts !== null && accounts.length === 0 && (
        <div className="card px-4 py-8 text-center">
          <p className="fs-body" style={{ color: "var(--text-sub)" }}>
            아직 계좌가 없어요.
          </p>
        </div>
      )}

      {accounts !== null && accounts.length > 0 && (
        <ReorderableList
          items={accounts}
          getId={(a) => a.id}
          onOrderChange={setAccounts}
          renderItem={(account) => (
            <div
              className="card flex items-center gap-3 px-4 py-3"
              style={{ touchAction: "pan-y" }}
            >
              <InstitutionIcon type={account.institutionType} />
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <p
                  className="fs-title font-semibold truncate"
                  style={{ color: "var(--text-strong)" }}
                >
                  {account.name}
                </p>
                {account.detailType !== "NORMAL" && (
                  <span
                    className="flex-shrink-0 fs-caption font-medium rounded-md px-2 py-1"
                    style={{
                      color: "var(--accent)",
                      background: "var(--accent-soft)",
                    }}
                  >
                    {detailTypeLabel[account.detailType]}
                  </span>
                )}
              </div>
              <DragHandle />
            </div>
          )}
        />
      )}

    </div>
  );
}
