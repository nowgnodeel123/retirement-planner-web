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
import { RetirementAgeCard } from "@/app/components/portfolio/RetirementAgeCard";
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
  RetirementAgeCardResponse,
} from "@/app/components/portfolio/types";
import { ScrollableList } from "@/app/components/portfolio/ScrollableList";
import { Section } from "@/app/components/ui/Section";

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

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** 계좌 목록에서 한 화면에 보여줄 개수. 그 이상은 목록 안에서 스크롤한다. */
const ACCOUNTS_VISIBLE = 3;

const SORT_LABEL: Record<HoldingSortKey, string> = {
  value: "금액순",
  profitRate: "수익률순",
  name: "이름순",
  manual: "내 순서",
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center pt-4 px-6 rise-in">
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
        className="font-bold mb-2 fs-title"
        style={{ color: "var(--text-strong)" }}
      >
        등록된 계좌가 없어요
      </p>
      <p
        className="leading-relaxed fs-body"
        style={{ marginBottom: "var(--rhythm-section)", color: "var(--text-sub)" }}
      >
        증권사·은행 계좌를 등록하면
        <br />
        흩어진 자산을 한곳에서 볼 수 있어요
      </p>
      <Link
        href="/portfolio/accounts/new"
        className="pressable rounded-2xl px-6 py-3 min-h-[44px] font-semibold fs-title"
        style={{ background: "var(--accent)", color: "var(--on-accent)" }}
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
    // 평가금액·손익 정보가 없는 계좌(시세를 못 불러온 경우 등)는 방향과 무관하게 항상 뒤로.
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
  // D-219: 은퇴 가능 나이 카드. 자산이 바뀌면 답도 바뀌므로 요약과 같이 다시 받는다.
  const [retirementCard, setRetirementCard] = useState<
    RetirementAgeCardResponse | "hidden" | null
  >(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  // WHY 요약과 분리해서 부르는가: 은퇴 나이 계산은 총자산 조회보다 무겁다(나이를 한 살씩
  // 올려가며 탐색). 한 요청으로 묶으면 총자산 표시까지 그만큼 늦어지므로 따로 보내고
  // 카드만 늦게 채운다. 실패하면 카드를 감추고 나머지 화면은 그대로 둔다 — hasProfile=false로
  // 대신 두면 이미 시뮬레이터를 돌린 사용자가 일시적 통신 실패만으로 "한 번 계산해두세요"
  // 안내를 보게 되므로, 모른다는 사실을 안내로 위장하지 않고 그냥 감춘다.
  const loadRetirementCard = useCallback(
    () =>
      api
        .get<RetirementAgeCardResponse>("/api/v1/simulation/retirement-age")
        .then((data) => setRetirementCard(data))
        .catch(() => setRetirementCard("hidden")),
    [],
  );

  // 재시도 가능하도록 첫 로딩을 함수로 뺀다. 백엔드가 잠깐 죽었을 때 사용자가
  // 새로고침 말고 그 자리에서 다시 시도할 수 있어야 한다(복구 테스트에서 발견).
  //
  // 여기서는 setState를 동기로 부르지 않는다 — 이펙트에서 바로 호출되므로
  // 연쇄 렌더가 된다(react-hooks 린트가 잡아준다). 배너 초기화와 진행 표시는
  // 재시도 핸들러(handleRetry)에서만 한다.
  const loadAll = useCallback(() => {
    const accountsP = api
      .get<AccountResponse[]>("/api/accounts")
      .then(setAccounts)
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : "계좌를 불러오지 못했어요.");
        throw e;
      });

    loadSummary();
    loadRetirementCard();

    // 닉네임은 실패해도 화면을 막지 않는다. 다만 영영 스켈레톤으로 두지는 않는다 —
    // 로딩이 끝났는데 회색 막대가 남아 있으면 "아직 불러오는 중"으로 읽힌다.
    api
      .get<{ nickname: string }>("/api/users/me")
      .then((me) => setNickname(me.nickname))
      .catch(() => setNickname(""));

    return accountsP;
  }, [loadSummary, loadRetirementCard]);

  useEffect(() => {
    loadAll().catch(() => {});
  }, [loadAll]);

  function handleRetry() {
    setError(null);
    setRetrying(true);
    loadAll()
      .catch(() => {})
      .finally(() => setRetrying(false));
  }

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

  const hasAccounts = accounts !== null && accounts.length > 0;

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
      loadRetirementCard();
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

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-7">
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--rhythm-section)" }}>
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
              className="font-bold truncate fs-metric"
              style={{ color: "var(--text-strong)" }}
            >
              {nickname}
            </h1>
          )}
        </div>

        {/* 계좌 추가(+)는 "내 계좌" 섹션 헤더로 내려갔다 — 추가되는 대상이 계좌 목록이므로
            목록 바로 위에 있어야 무엇에 작용하는지가 위치로 설명된다. 비워진 이 자리에는
            화면 전체에 걸리는 조작인 설정을 둔다. */}
        <Link
          href="/my"
          aria-label="설정"
          // 아이콘 20px + p-2(8px)로는 36×36이라 최소 터치영역(44px)에 못 미쳤다.
          // 아이콘 크기는 그대로 두고 눌리는 영역만 44px로 넓힌다.
          className="pressable rounded-lg flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ color: "var(--text-sub)" }}
        >
          <GearIcon />
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleRetry} retrying={retrying} />}

      {/* 계좌가 하나라도 있을 때만 총자산·비중을 그린다.
          WHY: 가입 직후 화면을 60세 사용자 기준으로 열어보니, "총자산 0원"과 빈 도넛
          ("언랭크")이 화면을 거의 다 차지하고 정작 해야 할 일인 "첫 계좌 등록하기"가
          Y=764px — 하단 탭바에 가려 보이지 않았다(실측).
          처음 온 사람에게 "당신의 자산은 0원, 등급은 언랭크"부터 선언할 이유가 없다.
          보여줄 자산이 생긴 다음에 보여준다. */}
      {hasAccounts && (
        <>
          <PortfolioSummary summary={summary} />
          {/* 은퇴 가능 나이 카드는 라벨 없는 카드라 총자산과 비중 사이에서 무엇인지
              드러나지 않았다. 도넛의 "비중"과 같은 섹션 헤더를 붙여 위계를 맞춘다.
              카드가 통째로 빠지는 조회 실패("hidden")일 때는 헤더도 같이 빼야 한다 —
              안 그러면 아무것도 없는 "은퇴 준비" 제목만 남는다. */}
          {retirementCard !== "hidden" && (
            <Section label="은퇴 준비" first>
              <RetirementAgeCard card={retirementCard} />
            </Section>
          )}
          <HoldingsDonutChart
            holdings={summary?.holdings ?? null}
            totalAssetKrw={summary?.totalKrw ?? null}
          />
        </>
      )}

      {accounts === null && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--rhythm-tight)" }}>
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

      {/* 계좌가 없을 때의 화면. 할 일(계좌 등록)을 맨 위에 두고, 그 아래에
          "계좌가 없어도 지금 해볼 수 있는 것"으로 은퇴 시뮬레이터를 안내한다 —
          빈 화면에서 아무것도 못 하고 나가는 것보다, 바로 해볼 수 있는 게 하나는 보여야 한다. */}
      {accounts !== null && accounts.length === 0 && (
        <>
          <EmptyState />
          {retirementCard !== "hidden" && (
            <Section label="계좌가 없어도 해볼 수 있어요">
              <RetirementAgeCard card={retirementCard} />
            </Section>
          )}
        </>
      )}

      {hasAccounts && (
        /* 정렬·추가 컨트롤은 섹션 헤더로 올렸다 — 둘 다 작용 대상이 아래 계좌 목록이라
           목록 바로 위에 나란히 있는 편이 무엇에 대한 조작인지 분명하다.
           정렬은 계좌가 1개여도 보여준다: 정렬 결과는 같지만 컨트롤이 나타났다 사라지면
           화면이 흔들리고 "사용자 설정"으로 순서 편집에 들어가는 길도 함께 막힌다. */
        <Section
          label="내 계좌"
          hint={accounts.length > ACCOUNTS_VISIBLE ? `${accounts.length}개 · 스크롤해서 더 보기` : undefined}
          action={
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="pressable flex items-center gap-2 font-semibold px-2 min-h-[44px] rounded-lg fs-body"
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
              <Link
                href="/portfolio/accounts/new"
                aria-label="계좌 추가"
                className="pressable flex items-center gap-1 font-semibold px-2 min-h-[44px] rounded-lg fs-body"
                style={{ color: "var(--accent)" }}
              >
                <PlusIcon />
                추가
              </Link>
            </>
          }
        >
          <ScrollableList
            padded
            maxItems={ACCOUNTS_VISIBLE}
            recomputeKey={`${sortedAccounts.length}-${summaryMap.size}`}
            style={{ display: "flex", flexDirection: "column", gap: "var(--rhythm-tight)" }}
          >
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
          </ScrollableList>
        </Section>
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
