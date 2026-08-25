// app/portfolio/page.tsx — 포트폴리오 탭 진입 화면
// M9: 대시보드(총자산→인사이트 배너→비중 도넛, D-069 순서) + 기존 계좌 목록
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { AccountCard } from "@/app/components/portfolio/AccountCard";
import { HoldingsDonutChart } from "@/app/components/portfolio/HoldingsDonutChart";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { RenameAccountModal } from "@/app/components/portfolio/RenameAccountModal";
import { PortfolioSummary } from "@/app/components/portfolio/PortfolioSummary";
import { Toast } from "@/app/components/portfolio/Toast";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import {
  AccountResponse,
  institutionLabel,
  InstitutionType,
  PortfolioSummaryResponse,
} from "@/app/components/portfolio/types";

const SECTION_ORDER: InstitutionType[] = ["BANK", "SECURITIES", "EXCHANGE"];

// D-188(요청): 원+사다리꼴 조합이 기계적이라는 피드백 — 원호(arc) 대신 손으로 그린
// 것 같은 3차 베지어 곡선 하나로 "웃는 모양" 둥지를 그리고, 알(원)을 그 위에 얹었다.
// 도형은 여전히 두 개뿐이지만 직선·직각이 하나도 없어 훨씬 부드럽게 읽힌다.
function NestIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7.6" r="3.3" fill="white" />
      <path
        d="M5 9.5C5 14.5 8 18 12 18C16 18 19 14.5 19 9.5"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AccountResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [pendingRename, setPendingRename] = useState<AccountResponse | null>(
    null,
  );
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // D-182: 좌측 스와이프(SwipeableRow) 대신 헤더의 관리 토글로 계좌 수정·삭제 진입.
  const [manageMode, setManageMode] = useState(false);

  useEffect(() => {
    api
      .get<AccountResponse[]>("/api/accounts")
      .then(setAccounts)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요.",
        ),
      );

    // M9: 대시보드 요약은 계좌 목록과 독립적으로 병렬 조회
    api
      .get<PortfolioSummaryResponse>("/api/portfolio/summary")
      .catch(() => null)
      .then((data) => data && setSummary(data));
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

  const grouped = SECTION_ORDER.map((type) => ({
    type,
    items: (accounts ?? []).filter((a) => a.institutionType === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            <NestIcon />
          </div>
          <h1
            className="text-[22px] font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            포트폴리오
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {/* D-182: 좌측 스와이프(SwipeableRow) 대신 다시 관리 토글로 되돌렸다 — 실기기에서
              스와이프 제스처가 탭과 자주 혼동돼 계좌 상세로 못 들어가는 문제가 반복됨.
              관리 모드에서는 카드가 링크가 아니라 수정/삭제 아이콘 버튼으로만 반응한다. */}
          {accounts !== null && accounts.length > 0 && (
            <button
              type="button"
              onClick={() => setManageMode((v) => !v)}
              aria-label={manageMode ? "관리 완료" : "계좌 관리"}
              className="p-2 rounded-lg transition-colors text-[13px] font-semibold"
              style={{ color: manageMode ? "var(--accent)" : "var(--text-sub)" }}
            >
              {manageMode ? "완료" : "관리"}
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

      {/* M9: 대시보드 — 총자산 → 비중(도넛) 순서. D-181: "이번 달 매수 N건" 인사이트
          배너는 액션 불가능한 정보라 판단해 제거(D-127/D-128과 같은 판단 기준).
          D-183: 계좌·자산이 하나도 없어도 총자산 0원 + 빈 도넛을 기본 표시(계좌 목록
          로딩만 끝나면 표시, 개수와 무관) — 이전엔 계좌가 0개면 통째로 숨겨졌었다. */}
      {accounts !== null && (
        <>
          <PortfolioSummary summary={summary} />
          <HoldingsDonutChart holdings={summary?.holdings ?? null} />
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
                    summary={summary?.accounts.find((a) => a.accountId === account.id)}
                    manageMode={manageMode}
                    onRename={() => {
                      setRenameError(null);
                      setPendingRename(account);
                    }}
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
