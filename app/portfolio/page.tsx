// app/portfolio/page.tsx — 포트폴리오 탭 진입 화면
// M9: 대시보드(총자산→인사이트 배너→비중 도넛, D-069 순서) + 기존 계좌 목록
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { AccountCard } from "@/app/components/portfolio/AccountCard";
import { CategoryDonutChart } from "@/app/components/portfolio/CategoryDonutChart";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { MonthlyInsightBanner } from "@/app/components/portfolio/MonthlyInsightBanner";
import { PortfolioSummary } from "@/app/components/portfolio/PortfolioSummary";
import { Toast } from "@/app/components/portfolio/Toast";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import {
  AccountResponse,
  institutionLabel,
  InstitutionType,
  MonthlyInsightResponse,
  PortfolioSummaryResponse,
} from "@/app/components/portfolio/types";

const SECTION_ORDER: InstitutionType[] = ["BANK", "SECURITIES", "EXCHANGE"];

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center pt-20 px-6 rise-in">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "var(--accent-soft)" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M16 13h.01" />
        </svg>
      </div>
      <p
        className="text-[16px] font-bold mb-1.5"
        style={{ color: "var(--text-strong)" }}
      >
        등록된 계좌가 없어요
      </p>
      <p
        className="text-[13px] leading-relaxed mb-7"
        style={{ color: "var(--text-sub)" }}
      >
        은행, 증권사, 거래소 계좌를 등록하고
        <br />
        자산을 한곳에 정리해보세요
      </p>
      <Link
        href="/portfolio/accounts/new"
        className="pressable rounded-2xl text-white px-6 py-3.5 text-[15px] font-semibold"
        style={{ background: "var(--accent)" }}
      >
        첫 계좌 등록하기
      </Link>
    </div>
  );
}

export default function PortfolioPage() {
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(
    null,
  );
  const [insight, setInsight] = useState<MonthlyInsightResponse | null>(null);
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

    // M9: 대시보드 요약/인사이트는 계좌 목록과 독립적으로 병렬 조회
    api
      .get<PortfolioSummaryResponse>("/api/portfolio/summary")
      .catch(() => null)
      .then((data) => data && setSummary(data));

    api
      .get<MonthlyInsightResponse>("/api/portfolio/insights/monthly")
      .catch(() => null)
      .then((data) => data && setInsight(data));
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
    <div className="max-w-[420px] w-full mx-auto px-5 pt-7">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          포트폴리오
        </h1>
        <div className="flex items-center gap-1">
          {accounts && accounts.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              style={
                editing
                  ? { color: "var(--accent)", background: "var(--accent-soft)" }
                  : { color: "var(--text-sub)" }
              }
            >
              {editing ? "완료" : "관리"}
            </button>
          )}
          <Link
            href="/portfolio/accounts/new"
            aria-label="계좌 추가"
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-sub)" }}
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
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card px-4 py-4 flex items-center gap-3 animate-pulse"
            >
              <div
                className="w-10 h-10 rounded-full"
                style={{ background: "var(--border)" }}
              />
              <div
                className="w-28 h-4 rounded"
                style={{ background: "var(--border)" }}
              />
            </div>
          ))}
        </div>
      )}

      {accounts !== null && accounts.length === 0 && <EmptyState />}

      {/* M9: 대시보드 — 총자산 → 이번 달 인사이트 → 비중(도넛) 순서(D-069) */}
      {accounts !== null && accounts.length > 0 && (
        <>
          <PortfolioSummary summary={summary} />
          <MonthlyInsightBanner insight={insight} />
          <CategoryDonutChart categories={summary?.categories ?? null} />
        </>
      )}

      {accounts !== null && accounts.length > 0 && (
        <div className="space-y-7 rise-in">
          {grouped.map((section) => (
            <div key={section.type}>
              <p
                className="text-[13px] font-semibold mb-2.5 px-1"
                style={{ color: "var(--text-sub)" }}
              >
                {institutionLabel[section.type]}
              </p>
              <div className="space-y-2.5">
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
