// app/portfolio/page.tsx — 계좌 목록 (포트폴리오 탭 진입 화면)
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { AccountCard } from "@/app/components/portfolio/AccountCard";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { Toast } from "@/app/components/portfolio/Toast";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import {
  AccountResponse,
  institutionLabel,
  InstitutionType,
} from "@/app/components/portfolio/types";

const SECTION_ORDER: InstitutionType[] = ["BANK", "SECURITIES", "EXCHANGE"];

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center pt-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M16 13h.01" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-neutral-800 mb-1.5">
        등록된 계좌가 없어요
      </p>
      <p className="text-[13px] text-neutral-400 leading-relaxed mb-6">
        은행, 증권사, 거래소 계좌를 등록하고
        <br />
        자산을 정리해보세요.
      </p>
      <Link
        href="/portfolio/accounts/new"
        className="rounded-2xl bg-blue-500 text-white px-6 py-3 text-[14px] font-semibold shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:scale-[0.98] transition-all"
      >
        첫 계좌 등록하기
      </Link>
    </div>
  );
}

export default function PortfolioPage() {
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AccountResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AccountResponse[]>("/api/accounts")
      .then(setAccounts)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요.",
        ),
      );
  }, []);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/accounts/${pendingDelete.id}`);
      setAccounts(
        (prev) => prev?.filter((a) => a.id !== pendingDelete.id) ?? null,
      );
      setToast("계좌가 삭제되었어요.");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "삭제 중 문제가 발생했어요.",
      );
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const grouped = SECTION_ORDER.map((type) => ({
    type,
    items: (accounts ?? []).filter((a) => a.institutionType === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-bold text-neutral-800">포트폴리오</h1>
        <div className="flex items-center gap-1">
          {accounts && accounts.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                editing
                  ? "text-blue-500 bg-blue-50"
                  : "text-neutral-400 hover:bg-neutral-100"
              }`}
            >
              {editing ? "완료" : "관리"}
            </button>
          )}
          <Link
            href="/portfolio/accounts/new"
            aria-label="계좌 추가"
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {accounts === null && !error && (
        <div className="flex justify-center pt-16">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin" />
        </div>
      )}

      {accounts !== null && accounts.length === 0 && <EmptyState />}

      {accounts !== null && accounts.length > 0 && (
        <div className="space-y-6">
          {grouped.map((section) => (
            <div key={section.type}>
              <p className="text-[12px] font-semibold text-neutral-400 mb-2 px-1">
                {institutionLabel[section.type]}
              </p>
              <div className="space-y-2">
                {section.items.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    editing={editing}
                    onDelete={() => setPendingDelete(account)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title="계좌를 삭제할까요?"
          description={`"${pendingDelete.name}" 계좌를 삭제하면 안에 있는 보유 자산과 거래 내역도 모두 함께 삭제돼요. 이 작업은 되돌릴 수 없어요.`}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
