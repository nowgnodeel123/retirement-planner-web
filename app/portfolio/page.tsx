// app/portfolio/page.tsx — 로그인 후 기본 진입 화면.
// D-201: 헤더에 사용자 닉네임 + 둥지 아이콘. 총자산 → 등급 도넛 → 정렬 컨트롤 → 계좌 리스트.
//        계좌 수정/삭제는 카드를 좌측 스와이프하면 나오는 원형 버튼으로(관리 토글 폐지).
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { AccountCard } from "@/app/components/portfolio/AccountCard";
import { SwipeRow } from "@/app/components/portfolio/SwipeRow";
import { HoldingsDonutChart } from "@/app/components/portfolio/HoldingsDonutChart";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { RenameModal } from "@/app/components/portfolio/RenameModal";
import { PortfolioSummary } from "@/app/components/portfolio/PortfolioSummary";
import { Toast } from "@/app/components/portfolio/Toast";
import {
  SortModal,
  HoldingSortKey,
  SortDirection,
} from "@/app/components/portfolio/SortModal";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { NestMark } from "@/app/components/brand/NestMark";
import {
  AccountResponse,
  AccountSummary,
  PortfolioSummaryResponse,
} from "@/app/components/portfolio/types";

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
  manual: "내 순서",
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
    if (key === "manual") {
      // 아직 순서를 지정한 적 없는 계좌는 뒤로, 그 안에서는 등록순(id).
      const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return ao !== bo ? ao - bo : a.id - b.id;
    }
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
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 사용자가 직접 고른 정렬. null이면 아직 안 골랐다는 뜻이라 아래에서 기본값을 정한다.
  const [pickedSort, setPickedSort] = useState<{
    key: HoldingSortKey;
    dir: SortDirection;
  } | null>(null);
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

  // 총자산·등급 도넛·종목별 비중의 단일 소스. 계좌가 지워지면 이 요약도 다시 받아와야 한다.
  const loadSummary = useCallback(
    () =>
      api
        .get<PortfolioSummaryResponse>("/api/portfolio/summary")
        .then((data) => setSummary(data))
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    api
      .get<AccountResponse[]>("/api/accounts")
      .then(setAccounts)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요."),
      );

    loadSummary();

    api
      .get<{ nickname: string }>("/api/users/me")
      .then((me) => setNickname(me.nickname))
      .catch(() => {});
  }, [loadSummary]);

  const summaryMap = useMemo(() => {
    const m = new Map<number, AccountSummary>();
    for (const s of summary?.accounts ?? []) m.set(s.accountId, s);
    return m;
  }, [summary]);

  // 한 번이라도 순서를 정했다면 기본 보기를 내 순서로 맞춘다 —
  // "편집하러 들어가기"와 "내 순서로 보기"를 따로 배우지 않아도 되게.
  // 이펙트에서 setState 하면 목록이 한 번 다른 순서로 그려졌다가 다시 그려진다(연쇄 렌더).
  // 사용자가 정렬을 직접 고르기 전까지는 파생값으로 계산한다.
  const hasManualOrder = accounts?.some((a) => a.sortOrder !== null) ?? false;
  const sortKey = pickedSort?.key ?? (hasManualOrder ? "manual" : "value");
  const sortDir = pickedSort?.dir ?? (hasManualOrder ? "asc" : "desc");

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
      // 서버는 FK ON DELETE CASCADE(V2)로 하위 자산·거래·배당까지 지운다.
      // 요약은 마운트 시 1회만 받아오던 탓에 지워진 계좌의 자산이 총자산·도넛에 그대로 남아 있었다.
      await loadSummary();
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
          <NestMark size={32} />
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
                      // "사용자 설정"은 정렬 옵션이 아니라 순서 편집 화면 진입이다.
                      if (key === "manual") {
                        router.push("/portfolio/order");
                        return;
                      }
                      setPickedSort({ key, dir });
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
                <SwipeRow
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
                </SwipeRow>
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
        <RenameModal
          title="계좌 이름 수정"
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
