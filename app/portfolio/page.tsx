// app/portfolio/page.tsx — 로그인 후 기본 진입 화면.
// D-201: 헤더에 사용자 닉네임 + 둥지 아이콘. 총자산 → 등급 도넛 → 정렬 컨트롤 → 계좌 리스트.
//        계좌 수정/삭제는 카드를 좌측 스와이프하면 나오는 원형 버튼으로(관리 토글 폐지).
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { AccountCard } from "@/app/components/portfolio/AccountCard";
import { SwipeAccountRow } from "@/app/components/portfolio/SwipeAccountRow";
import { HoldingsDonutChart } from "@/app/components/portfolio/HoldingsDonutChart";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { RenameAccountModal } from "@/app/components/portfolio/RenameAccountModal";
import { PortfolioSummary } from "@/app/components/portfolio/PortfolioSummary";
import { Toast } from "@/app/components/portfolio/Toast";
import {
  SortModal,
  HoldingSortKey,
  SortDirection,
} from "@/app/components/portfolio/SortModal";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import {
  AccountResponse,
  AccountSummary,
  PortfolioSummaryResponse,
} from "@/app/components/portfolio/types";

// D-201: 둥지 아이콘 — 미니멀. 달걀(세로 타원) 하나 + 그 아래 초승달 모양의 둥지 그릇.
// 둘 다 흰색 실루엣, 사이의 얇은 틈은 배경(accent)색이 그대로 비쳐 알과 둥지가 분리돼 읽힌다.
function NestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <ellipse cx="12" cy="9.5" rx="3.6" ry="4.4" />
      <path d="M3 11.5Q3 21 12 21 21 21 21 11.5 21 15.6 12 15.6 3 15.6 3 11.5Z" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}

const SORT_LABEL: Record<HoldingSortKey, string> = {
  value: "금액순",
  profitRate: "수익률순",
  name: "이름순",
};

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

function sortAccounts(
  accounts: AccountResponse[],
  summaries: Map<number, AccountSummary>,
  key: HoldingSortKey,
  dir: SortDirection,
): AccountResponse[] {
  return [...accounts].sort((a, b) => {
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "ko");
      return dir === "asc" ? cmp : -cmp;
    }
    const sa = summaries.get(a.id);
    const sb = summaries.get(b.id);
    const av = sa ? (key === "profitRate" ? sa.profitRate : sa.totalKrw) : null;
    const bv = sb ? (key === "profitRate" ? sb.profitRate : sb.totalKrw) : null;
    // 평가금액·손익 정보가 없는 계좌(은행 등)는 방향과 무관하게 항상 뒤로.
    if (av === null && bv === null) return a.name.localeCompare(b.name, "ko");
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });
}

export default function PortfolioPage() {
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<HoldingSortKey>("value");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const [pendingRename, setPendingRename] = useState<AccountResponse | null>(
    null,
  );
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<AccountResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<AccountResponse[]>("/api/accounts")
      .then(setAccounts)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요."),
      );

    api
      .get<PortfolioSummaryResponse>("/api/portfolio/summary")
      .catch(() => null)
      .then((data) => data && setSummary(data));

    api
      .get<{ nickname: string }>("/api/users/me")
      .then((me) => setNickname(me.nickname))
      .catch(() => {});
  }, []);

  const summaryMap = useMemo(() => {
    const m = new Map<number, AccountSummary>();
    for (const s of summary?.accounts ?? []) m.set(s.accountId, s);
    return m;
  }, [summary]);

  const sortedAccounts = useMemo(
    () => sortAccounts(accounts ?? [], summaryMap, sortKey, sortDir),
    [accounts, summaryMap, sortKey, sortDir],
  );

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
      setError(e instanceof ApiError ? e.message : "삭제 중 문제가 발생했어요.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function handleRenameSubmit(name: string) {
    if (!pendingRename) return;
    setRenaming(true);
    setRenameError(null);
    try {
      const updated = await api.patch<AccountResponse>(
        `/api/accounts/${pendingRename.id}/name`,
        { name },
      );
      setAccounts(
        (prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null,
      );
      setPendingRename(null);
      setToast("계좌 이름이 수정되었어요.");
    } catch (e) {
      setRenameError(
        e instanceof ApiError ? e.message : "이름 수정 중 문제가 발생했어요.",
      );
    } finally {
      setRenaming(false);
    }
  }

  const hasAccounts = accounts !== null && accounts.length > 0;

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-7 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            <NestIcon />
          </div>
          {nickname === null ? (
            <span
              className="inline-block w-20 h-4 rounded-md animate-pulse"
              style={{ background: "var(--border)" }}
              aria-hidden="true"
            />
          ) : (
            <h1
              className="text-[20px] font-bold truncate"
              style={{ color: "var(--text-strong)" }}
            >
              {nickname}
            </h1>
          )}
        </div>

        <Link
          href="/portfolio/accounts/new"
          aria-label="계좌 추가"
          className="p-2 rounded-lg flex-shrink-0"
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

      {error && <ErrorBanner message={error} />}

      {accounts !== null && (
        <>
          <PortfolioSummary summary={summary} />
          <HoldingsDonutChart
            holdings={summary?.holdings ?? null}
            totalAssetKrw={summary?.totalKrw ?? null}
          />
        </>
      )}

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

      {hasAccounts && (
        <>
          {/* 정렬 컨트롤 — 파이차트 아래, 계좌 리스트 위. "≡ 금액순" 형태로 현재 정렬을 노출.
              계좌가 2개 이상일 때만(1개는 정렬 의미 없음). */}
          {accounts.length >= 2 && (
            <div className="flex justify-end mb-2.5 px-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="pressable flex items-center gap-1.5 text-[13px] font-semibold px-2 py-1 rounded-lg"
                  style={{ color: "var(--text-sub)" }}
                >
                  <SortIcon />
                  {SORT_LABEL[sortKey]}
                </button>
                {sortOpen && (
                  <SortModal
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onApply={(key, dir) => {
                      setSortKey(key);
                      setSortDir(dir);
                      setSortOpen(false);
                    }}
                    onClose={() => setSortOpen(false)}
                  />
                )}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {sortedAccounts.map((account, i) => (
              <div
                key={account.id}
                className="rise-in"
                style={{ animationDelay: `${Math.min(i * 45, 270)}ms` }}
              >
                <SwipeAccountRow
                  onEdit={() => {
                    setRenameError(null);
                    setPendingRename(account);
                  }}
                  onDelete={() => setPendingDelete(account)}
                >
                  <AccountCard
                    account={account}
                    summary={summaryMap.get(account.id)}
                  />
                </SwipeAccountRow>
              </div>
            ))}
          </div>
        </>
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

      {pendingRename && (
        <RenameAccountModal
          currentName={pendingRename.name}
          loading={renaming}
          error={renameError}
          onConfirm={handleRenameSubmit}
          onCancel={() => setPendingRename(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
