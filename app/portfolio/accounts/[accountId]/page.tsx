// app/portfolio/accounts/[accountId]/page.tsx — 계좌 상세: 총 평가금액 요약 + 보유 자산 목록
// D-049 손익 + D-058 전일종가 라벨 + D-063 원화환산. 디자인 토큰 기반.
// M6: 보유자산 카드 → 자산 상세(매도/거래내역) 화면 링크 추가.
// M7: D-054 정렬(드롭다운) + D-069 관련 "정리한 자산"(전량매도) 섹션 분리.
// quantity===0인 자산은 보유목록에서 제외하고 하단 접이식 섹션으로 뺀다 — 백엔드는 그대로
// 전체를 내려주므로(GET /api/assets) 이 구분은 프론트 전용이며 API 변경 없음.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import { RenameModal } from "@/app/components/portfolio/RenameModal";
import { SwipeRow } from "@/app/components/portfolio/SwipeRow";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import {
  formatKrw,
  formatMoney,
  formatQuantity,
  profitColor,
  signed,
} from "@/app/components/portfolio/format";
import {
  HoldingSortKey,
  SortDirection,
  SortModal,
} from "@/app/components/portfolio/SortModal";
import {
  AccountResponse,
  AssetHoldingResponse,
  AssetCategory,
  categoryColor,
  categoryLabel,
  categoryUnit,
  detailTypeLabel,
  institutionLabel,
} from "@/app/components/portfolio/types";
import { ScrollableList } from "@/app/components/portfolio/ScrollableList";

// M7: 정렬 기준값 추출. 해외주식은 원화환산 평가금액을 기준으로 삼아 카테고리가 섞여도
// 비교가 성립하게 한다(D-063/D-087 이중표시 원칙과 일관).
function getSortValue(
  h: AssetHoldingResponse,
  key: HoldingSortKey,
): number | null {
  // 수익률순은 원화 기준으로 줄 세운다 — profitRate(표시통화 기준)로 정렬하면 환차손익이
  // 빠진 값이라 카테고리가 섞였을 때 순서가 실제 손익과 어긋난다.
  if (key === "profitRate") return h.krwProfitRate ?? h.profitRate;
  if (h.currency !== "KRW") return h.krwEvaluationAmount;
  return h.evaluationAmount;
}

// 정렬 버튼에 지금 무슨 기준으로 보고 있는지 그대로 띄운다 — "내 순서"가 생기면서
// 버튼이 "정렬"이라고만 되어 있으면 현재 상태를 알 수 없게 됐다(포트폴리오 메인과 동일 규칙).
const SORT_LABEL: Record<HoldingSortKey, string> = {
  value: "금액순",
  profitRate: "수익률순",
  name: "이름순",
  manual: "내 순서",
};

/** 보유 자산 목록에서 한 화면에 보여줄 개수. 그 이상은 목록 안에서 스크롤한다. */
const HOLDINGS_VISIBLE = 5;

function sortHoldings(
  list: AssetHoldingResponse[],
  key: HoldingSortKey,
  dir: SortDirection,
): AssetHoldingResponse[] {
  return [...list].sort((a, b) => {
    if (key === "manual") {
      // 아직 순서를 지정한 적 없는 자산은 뒤로, 그 안에서는 등록순(assetId).
      const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return ao !== bo ? ao - bo : a.assetId - b.assetId;
    }
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "ko");
      return dir === "asc" ? cmp : -cmp;
    }
    const av = getSortValue(a, key);
    const bv = getSortValue(b, key);
    // 시세 조회 실패 등으로 값이 없는 자산은 정렬 방향과 무관하게 항상 맨 뒤로 —
    // "내림차순인데 알 수 없는 값이 위로 온다" 같은 혼란을 막는다.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });
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

  // M15(D-232): 계좌 상세는 자산만 보여준다. 수익·세금은 계좌가 아니라 사람 단위로
  // 집계해야 맞아(기본공제 250만원·금융소득 2천만원이 인별 한도) 하단 「결산」 탭으로 옮겼다.

  // M7: 정렬(D-054) — 기본값은 평가금액 내림차순(비중 큰 자산부터).
  // 사용자가 직접 고른 정렬. null이면 아직 안 골랐다는 뜻이라 아래에서 기본값을 정한다.
  const [pickedSort, setPickedSort] = useState<{
    key: HoldingSortKey;
    dir: SortDirection;
  } | null>(null);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  // M7: 정리한 자산(전량매도) 섹션 — 기본 접힘.
  const [clearedOpen, setClearedOpen] = useState(false);

  // D-201: 계좌 이름 수정은 이 화면에서(제목 옆 연필). 포트폴리오 리스트에선 스와이프로 진입.
  // 종목(자산) 삭제만 좌측 스와이프로 노출한다 — 종목 이름 수정은 종목 상세 화면의
  // 제목 옆 연필로 옮겼다(계좌와 같은 규칙).
  const [assetDeleteTarget, setAssetDeleteTarget] =
    useState<AssetHoldingResponse | null>(null);
  const [assetDeleting, setAssetDeleting] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  async function handleRename(name: string) {
    setRenaming(true);
    setRenameError(null);
    try {
      const updated = await api.patch<AccountResponse>(
        `/api/accounts/${accountId}/name`,
        { name },
      );
      setAccount(updated);
      setRenameOpen(false);
    } catch (e) {
      setRenameError(
        e instanceof ApiError ? e.message : "이름 수정 중 문제가 발생했어요.",
      );
    } finally {
      setRenaming(false);
    }
  }

  // 자산 목록의 단일 소스 — 이름 수정·삭제 후에도 같은 경로로 다시 받는다.
  const loadHoldings = useCallback(
    () =>
      api
        .get<AssetHoldingResponse[]>(`/api/assets?accountId=${accountId}`)
        .then(setHoldings)
        .catch((e) =>
          setError(
            e instanceof ApiError ? e.message : "자산을 불러오지 못했어요.",
          ),
        ),
    [accountId],
  );

  useEffect(() => {
    // 단건 조회 API가 없어 목록에서 찾는다 — GET /api/accounts/{id}는 백로그 후보.
    api
      .get<AccountResponse[]>("/api/accounts")
      .then((all) => setAccount(all.find((a) => a.id === accountId) ?? null));

    loadHoldings();
  }, [accountId, loadHoldings]);

  // 토스/도미노식 요약: 총 평가금액(원화 환산) + 총 손익. 시세 없는 자산은 제외하고 캡션 안내.
  const summary = useMemo(() => {
    if (!holdings || holdings.length === 0) return null;
    let totalKrw = 0;
    let profitKrw = 0;
    let excluded = 0;

    for (const h of holdings) {
      // 전량매도(보유수량 0)는 "정리한 자산"이지 시세를 못 불러온 자산이 아니다.
      // 제외로 세면 아래 캡션이 "N개가 빠졌어요"라는 거짓 경보를 띄운다.
      if (h.quantity === 0) continue;

      // 원화환산 여부는 카테고리가 아니라 통화로 판단한다 — 백엔드 DashboardService와
      // 같은 규칙. 카테고리로 나누면 외화 현금(CASH/USD)이 환산 분기를 못 타서
      // $1,000이 1,000원으로 더해지고, 이 화면 총액만 대시보드와 어긋난다.
      if (h.currency !== "KRW") {
        if (h.krwEvaluationAmount !== null && h.exchangeRate !== null) {
          totalKrw += h.krwEvaluationAmount;
          // krwProfitAmount는 취득원가를 매수 시점 fx로 환산한 값이라 환차손익을 포함한다.
          if (h.krwProfitAmount !== null) profitKrw += h.krwProfitAmount;
        } else excluded++;
      } else if (h.evaluationAmount !== null) {
        totalKrw += h.evaluationAmount;
        if (h.krwProfitAmount !== null) profitKrw += h.krwProfitAmount;
      } else excluded++;
    }

    if (totalKrw === 0 && excluded > 0)
      return { totalKrw: null, profitKrw: 0, profitRate: 0, excluded };
    const cost = totalKrw - profitKrw;
    const profitRate = cost > 0 ? (profitKrw / cost) * 100 : 0;
    return { totalKrw, profitKrw, profitRate, excluded };
  }, [holdings]);

  // M7: quantity===0(전량매도)은 "정리한 자산"으로 분리. 요약(summary)도 같은 기준으로
  // 건너뛴다 — 예전에는 "평가금액이 없으니 자연히 0으로 반영된다"고 봤지만, 실제로는
  // 제외 카운트가 올라가 없는 경고가 떴다.
  const activeHoldings = useMemo(
    () => (holdings ?? []).filter((h) => h.quantity > 0),
    [holdings],
  );
  const clearedHoldings = useMemo(
    () => (holdings ?? []).filter((h) => h.quantity <= 0),
    [holdings],
  );
  // 순서를 정한 적 있으면 기본 보기를 내 순서로. 이펙트+setState로 하면 목록이 한 번
  // 다른 순서로 그려졌다 다시 그려지므로(연쇄 렌더) 파생값으로 계산한다.
  const hasManualOrder = holdings?.some((h) => h.sortOrder !== null) ?? false;
  const sortKey = pickedSort?.key ?? (hasManualOrder ? "manual" : "value");
  const sortDir = pickedSort?.dir ?? (hasManualOrder ? "asc" : "desc");

  const sortedActiveHoldings = useMemo(
    () => sortHoldings(activeHoldings, sortKey, sortDir),
    [activeHoldings, sortKey, sortDir],
  );

  // 시세 기준 안내 문구 — 보유 자산 구성에 따라 필요한 것만 적는다.
  // 예전엔 행마다 "전일 종가 기준"/"(날짜 환율)"을 붙여 목록이 그만큼 길어졌다.
  const fxBaseDate = activeHoldings.find(
    (h) => h.currency !== "KRW" && h.exchangeRateBaseDate,
  )?.exchangeRateBaseDate;
  const priceBasisNote = [
    activeHoldings.some((h) => h.category === "DOMESTIC_STOCK")
      ? "국내주식은 전일 종가 기준"
      : null,
    fxBaseDate ? `해외자산 원화환산은 ${fxBaseDate} 환율 기준` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // 외부 시세 서비스가 죽어 있으면 서버가 마지막으로 성공한 값을 대신 내려준다.
  // 그 값을 오늘 시세인 것처럼 두면 안 되므로, 가장 오래된 조회 시각을 찾아 밝힌다.
  // "전일 종가 기준"이라는 위 문구가 그 상황에서는 사실이 아니게 되기 때문이다.
  const stalePriceDate = (() => {
    const today = new Date().toDateString();
    const stale = activeHoldings
      .map((h) => h.priceAsOf)
      .filter((v): v is string => Boolean(v))
      .map((v) => new Date(v))
      .filter((d) => !Number.isNaN(d.getTime()) && d.toDateString() !== today)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return stale
      ? `${stale.getMonth() + 1}월 ${stale.getDate()}일`
      : null;
  })();

  async function handleAssetDelete() {
    if (!assetDeleteTarget) return;
    setAssetDeleting(true);
    try {
      await api.delete(`/api/assets/${assetDeleteTarget.assetId}`);
      setAssetDeleteTarget(null);
      loadHoldings();
    } catch (e) {
      setAssetDeleteTarget(null);
      setError(e instanceof ApiError ? e.message : "삭제 중 문제가 발생했어요.");
    } finally {
      setAssetDeleting(false);
    }
  }

  if (account === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="fs-title mb-4" style={{ color: "var(--text-sub)" }}>
          계좌를 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push("/portfolio")}
          className="fs-body font-semibold"
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
        className="flex items-center gap-1 fs-body mb-3 min-h-[44px] -ml-1 px-1"
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
        <div className="flex items-center gap-2">
          <h1
            className="fs-title font-bold"
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
            <button
              type="button"
              onClick={() => {
                setRenameError(null);
                setRenameOpen(true);
              }}
              aria-label="계좌 이름 수정"
              className="rounded-md flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: "var(--text-faint)" }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
              </svg>
            </button>
          )}
        </div>
        {account && (
          <p
            className="fs-body mt-1"
            style={{ color: "var(--text-sub)" }}
          >
            {institutionLabel[account.institutionType]}
            {account.detailType !== "NORMAL" &&
              ` · ${detailTypeLabel[account.detailType]}`}
          </p>
        )}
      </div>

      <>
      {/* 총 평가금액 — 진입 즉시 "내 돈이 지금 얼마인가" */}
      {summary && summary.totalKrw !== null && (
        <div className="mt-5 mb-7 rise-in">
          <p className="fs-body" style={{ color: "var(--text-sub)" }}>
            총 평가금액
          </p>
          <p
            className="amount fs-display font-bold mt-1"
            style={{ color: "var(--text-strong)" }}
          >
            {formatKrw(summary.totalKrw)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="amount fs-title font-semibold"
              style={{
                color: profitColor(summary.profitKrw),
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
            className="fs-caption mt-2"
            style={{ color: "var(--text-faint)" }}
          >
            원화 환산 기준
            {summary.excluded > 0 &&
              ` · 시세 미조회 자산 ${summary.excluded}건 제외`}
          </p>
        </div>
      )}
      {(!summary || summary.totalKrw === null) && <div className="mb-6" />}

      {/* 섹션 헤더 — 포트폴리오 메인의 "내 계좌"와 같은 규칙(라벨 + 우측 조작).
          개수와 "스크롤해서 더 보기"를 여기 적어, 목록이 잘려 보이는 게 사고가 아니라
          의도라는 걸 밝힌다. */}
      <div
        className="flex items-end justify-between gap-2 px-1"
        style={{ marginBottom: "var(--rhythm-tight)" }}
      >
        <div className="min-w-0">
          <h2
            className="fs-body font-semibold"
            style={{ color: "var(--text-sub)" }}
          >
            보유 자산
          </h2>
          {activeHoldings.length > HOLDINGS_VISIBLE && (
            <p className="fs-caption mt-1" style={{ color: "var(--text-faint)" }}>
              {activeHoldings.length}개 · 스크롤해서 더 보기
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {activeHoldings.length >= 2 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortModalOpen((v) => !v)}
                className="flex items-center gap-1 fs-body font-semibold px-2 min-h-[44px] rounded-lg"
                style={{ color: "var(--text-sub)" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M6 12h12M10 18h4" />
                </svg>
                {SORT_LABEL[sortKey]}
              </button>
              {sortModalOpen && (
                <SortModal
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onApply={(key, dir) => {
                    // "사용자 설정"은 정렬 옵션이 아니라 순서 편집 화면 진입이다.
                    if (key === "manual") {
                      router.push(`/portfolio/accounts/${accountId}/order`);
                      return;
                    }
                    setPickedSort({ key, dir });
                    setSortModalOpen(false);
                  }}
                  onClose={() => setSortModalOpen(false)}
                />
              )}
            </div>
          )}
          <Link
            href={`/portfolio/accounts/${accountId}/assets/new`}
            className="fs-body font-semibold px-2 min-h-[44px] flex items-center rounded-lg"
            style={{ color: "var(--accent)" }}
          >
            + 자산 추가
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {holdings === null && !error && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {holdings !== null && holdings.length === 0 && (
        <div className="card px-4 py-9 text-center">
          <p className="fs-body mb-3" style={{ color: "var(--text-sub)" }}>
            아직 보유한 자산이 없어요.
          </p>
          <Link
            href={`/portfolio/accounts/${accountId}/assets/new`}
            className="inline-block fs-body font-semibold"
            style={{ color: "var(--accent)" }}
          >
            첫 자산 추가하기
          </Link>
        </div>
      )}

      {/* M7: 자산은 있었지만 전부 정리(전량매도)한 경우 — 아래 "정리한 자산" 섹션으로 안내 */}
      {holdings !== null &&
        holdings.length > 0 &&
        activeHoldings.length === 0 && (
          <div className="card px-4 py-9 text-center">
            <p
              className="fs-body mb-1"
              style={{ color: "var(--text-sub)" }}
            >
              현재 보유 중인 자산이 없어요.
            </p>
            <p className="fs-body" style={{ color: "var(--text-faint)" }}>
              정리한 자산 {clearedHoldings.length}건은 아래에서 볼 수 있어요.
            </p>
          </div>
        )}

      {activeHoldings.length > 0 && (
        /* overflow-hidden: 행 배경(--surface)이 카드의 둥근 모서리 위로 그대로 칠해져서
           목록 끝(마지막 행 아래 두 모서리)이 각지게 잘려 보였다. 항목이 많아 목록 안
           스크롤이 걸릴 때만 우연히 클립돼 둥글어 보였던 것 — 개수와 무관하게 늘 클립한다.
           카드 그림자는 .card 자신에게 걸려 있어(바깥) 여기서 잘리지 않는다. */
        <ScrollableList
          className="card rise-in overflow-hidden"
          maxItems={HOLDINGS_VISIBLE}
          recomputeKey={sortedActiveHoldings.length}
        >
          {sortedActiveHoldings.map((h, idx) => {
            const category = h.category as AssetCategory;
            const isCash = category === "CASH";
            // 현금은 시세 조회 대상이 아니라 currentPrice가 원래 null이다 —
            // 이걸 "시세 조회 실패"로 읽으면 안 된다.
            const priceUnavailable =
              !isCash && h.quantity > 0 && h.currentPrice === null;

            const inner = (
                <div className="flex items-start justify-between gap-3">
                  {/* 좌: 종목 정보 — 2줄.
                      카테고리는 이름 앞 색상 점(시인성)과 둘째 줄 라벨(명확성)로 나눠 담아
                      배지 전용 줄을 없앴다. 시세 기준일 안내는 행마다 반복하지 않고
                      목록 아래 한 줄로 모았다(반복이 카드 높이의 주범이었다). */}
                  {/* flex-1을 명시해야 오른쪽이 남긴 만큼이 아니라 "제 몫"을 먼저 가져간다.
                      예전엔 min-w-0만 있어서 오른쪽(flex-shrink-0)이 필요한 폭을 전부 챙기고
                      남은 것만 이름에 돌아갔다. 손익 문자열이 길어지면
                      ("+18,564,000원 (+781.31%)") 이름 자리가 17px까지 줄어 "S.."가 됐다. */}
                  <div className="min-w-0 flex-1">
                    {/* 종목코드(symbol)를 첫 줄에서 뺐다. 이름과 같은 줄에 두면 코드가
                        flex-shrink-0으로 45px쯤을 고정으로 챙겨서, 정작 이름이 "S.."까지
                        줄어드는 일이 생긴다 — 무슨 종목인지 못 읽는 게 코드를 못 읽는 것보다
                        나쁘다. 코드는 둘째 줄 보조 정보 줄로 내려 이름에 첫 줄 전체를 준다. */}
                    <p className="truncate flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColor[category] }}
                      />
                      <span
                        className="fs-title font-semibold truncate"
                        style={{ color: "var(--text-strong)" }}
                      >
                        {h.name}
                      </span>
                    </p>
                    {/* 보조줄은 자르지 않고 두 줄까지 접는다.
                        여기 담기는 건 종목코드·카테고리·수량·평단 네 가지인데, 한 줄로
                        자르면 맨 끝의 평단이 가장 먼저 사라진다 — "얼마에 샀나"는
                        목록에서 확인하고 싶은 값이라 잘려선 안 된다.
                        line-clamp-2라 그래도 안 들어가는 극단적인 경우에만 잘린다. */}
                    <p
                      className="amount fs-body mt-1 line-clamp-2 leading-snug"
                      style={{ color: "var(--text-sub)" }}
                    >
                      {!isCash && (
                        <>
                          {h.symbol}
                          {" · "}
                        </>
                      )}
                      {categoryLabel[category]}
                      {!isCash && (
                        <>
                          {" · "}
                          {formatQuantity(h.quantity)}
                          {categoryUnit[category] ?? ""} · 평단{" "}
                          {formatMoney(h.averagePrice, h.currency)}
                        </>
                      )}
                    </p>
                  </div>

                  {/* 우: 평가금액(주역) + 손익(색상).
                      max-w로 상한을 둬서 이름 자리를 굶기지 않는다. 상한에 걸리면 손익줄이
                      두 줄로 접히는데, 종목명이 "S.."가 되는 것보다 낫다 — 접힌 숫자는
                      그대로 읽히지만 잘린 이름은 무슨 종목인지 알 수 없다. */}
                  <div className="text-right flex-shrink-0 max-w-[50%]">
                    {priceUnavailable ? (
                      <p
                        className="fs-body mt-1"
                        style={{ color: "var(--warning)" }}
                      >
                        시세 조회 실패
                      </p>
                    ) : (
                      h.evaluationAmount !== null && (
                        <>
                          <p
                            className="amount fs-title font-bold"
                            style={{ color: "var(--text-strong)" }}
                          >
                            {formatMoney(h.evaluationAmount, h.currency)}
                          </p>
                          {h.profitAmount !== null && h.profitRate !== null && (
                            <p
                              className="amount fs-body font-semibold mt-1"
                              style={{
                                color: profitColor(h.profitAmount),
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
                          {h.currency !== "KRW" &&
                            h.krwEvaluationAmount !== null && (
                              <p
                                className="amount fs-caption mt-1"
                                style={{ color: "var(--text-sub)" }}
                              >
                                ≈ {formatKrw(h.krwEvaluationAmount)}
                                {/* 위 줄의 손익은 표시통화(USD) 기준이라 환차손익이 빠져 있다.
                                    원화 줄에 원화 기준 수익률을 같이 둬서 "종목이 얼마 올랐나"와
                                    "내 돈이 얼마 늘었나"가 다르다는 걸 드러낸다. */}
                                {h.krwProfitRate !== null && (
                                  <>
                                    {" · 원화 "}
                                    {signed(
                                      h.krwProfitRate,
                                      `${Math.abs(h.krwProfitRate).toFixed(2)}%`,
                                    )}
                                  </>
                                )}
                              </p>
                            )}
                        </>
                      )
                    )}
                  </div>
                </div>
            );

            return (
              /* 스와이프는 삭제 하나만 — 이름 수정은 종목 상세 화면 제목 옆 연필로
                 옮겼다(계좌 상세와 같은 규칙). 목록에서 스와이프로 이름을 고치는 건
                 바꾼 결과를 그 자리에서 확인하기 어려워 상세 화면 쪽이 맞다. */
              <SwipeRow
                key={h.assetId}
                flush
                onDelete={() => setAssetDeleteTarget(h)}
              >
                <Link
                  href={`/portfolio/accounts/${accountId}/assets/${h.assetId}`}
                  className="px-4 py-3 block active:opacity-70 transition-opacity"
                  style={{
                    background: "var(--surface)",
                    borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                  }}
                >
                  {inner}
                </Link>
              </SwipeRow>
            );
          })}
        </ScrollableList>
      )}

      {/* 시세 기준 안내 — 예전엔 행마다 "전일 종가 기준"/"(날짜 환율)"을 반복해 붙였다.
          같은 문구가 자산 수만큼 늘어나며 목록을 밀어내서 여기 한 줄로 모았다.
          표기 자체를 없애지는 않는다 — 국내주식이 D+1 종가라는 사실은 계속 밝혀야 한다. */}
      {activeHoldings.length > 0 && (priceBasisNote.length > 0) && (
        <p
          className="fs-caption mt-2 px-1"
          style={{ color: "var(--text-faint)" }}
        >
          {priceBasisNote}
        </p>
      )}

      {/* 시세가 오늘 것이 아니면 반드시 밝힌다. 장애 중에 마지막 값을 보여주는 것 자체는
          빈 화면보다 낫지만, 언제 시세인지 안 밝히면 사용자가 오늘 값으로 읽는다. */}
      {activeHoldings.length > 0 && stalePriceDate && (
        <p
          className="fs-caption mt-1 px-1"
          style={{ color: "var(--warning)" }}
        >
          시세 서비스 장애로 {stalePriceDate}에 받은 값을 보여주고 있어요
        </p>
      )}

      {/* M7: D-069 관련 — 정리한 자산(전량매도). 기본 접힘, 개수만 노출. */}
      {clearedHoldings.length > 0 && (
        <div className="mt-7">
          <button
            type="button"
            onClick={() => setClearedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-1 mb-2"
          >
            <h2
              className="fs-body font-semibold"
              style={{ color: "var(--text-sub)" }}
            >
              정리한 자산 ({clearedHoldings.length})
            </h2>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: "var(--text-faint)",
                transform: clearedOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {clearedOpen && (
            <div className="space-y-2 rise-in">
              {clearedHoldings.map((h) => {
                const category = h.category as AssetCategory;
                return (
                  <SwipeRow
                    key={h.assetId}
                    onDelete={() => setAssetDeleteTarget(h)}
                  >
                  <Link
                    href={`/portfolio/accounts/${accountId}/assets/${h.assetId}`}
                    className="card px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    style={{ opacity: 0.75 }}
                  >
                    <div className="min-w-0">
                      <p className="truncate">
                        <span
                          className="fs-title font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {h.name}
                        </span>{" "}
                        <span className="fs-caption" style={{ color: "var(--text-faint)" }}>
                          {h.symbol}
                        </span>
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={category} />
                        <span
                          className="fs-caption"
                          style={{ color: "var(--text-faint)" }}
                        >
                          전량 매도
                        </span>
                      </div>
                    </div>
                    <p
                      className="amount fs-body flex-shrink-0"
                      style={{ color: "var(--text-faint)" }}
                    >
                      평단 {formatMoney(h.averagePrice, h.currency)}
                    </p>
                  </Link>
                  </SwipeRow>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>

      {assetDeleteTarget && (
        <ConfirmModal
          title="이 종목을 삭제할까요?"
          description={`"${assetDeleteTarget.name}"의 매매 내역과 배당 기록도 모두 함께 삭제돼요. 이 작업은 되돌릴 수 없어요.`}
          loading={assetDeleting}
          onConfirm={handleAssetDelete}
          onCancel={() => setAssetDeleteTarget(null)}
        />
      )}

      {renameOpen && account && (
        <RenameModal
          title="계좌 이름 수정"
          currentName={account.name}
          loading={renaming}
          error={renameError}
          onConfirm={handleRename}
          onCancel={() => setRenameOpen(false)}
        />
      )}
    </div>
  );
}
