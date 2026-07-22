// app/portfolio/accounts/[accountId]/assets/[assetId]/page.tsx
// M6: 자산 상세 — 보유 요약 + 매도 폼 + 매매 히스토리 조회
// M8: 배당 기록(D-067, 국내/해외주식만) + 매매·배당 통합 히스토리 표시 + 배당 삭제(D-056)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  NumberInput,
} from "@/app/components/wizard/Ui";
import { ConfirmModal } from "@/app/components/portfolio/ConfirmModal";
import { Toast } from "@/app/components/portfolio/Toast";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import {
  AssetHoldingResponse,
  AssetSellRequest,
  DividendCreateRequest,
  DividendResponse,
  TransactionResponse,
  TradableAssetCategory,
  categoryUnit,
  transactionTypeLabel,
} from "@/app/components/portfolio/types";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatQuantity(qty: number) {
  return qty % 1 === 0 ? qty.toLocaleString() : qty.toString();
}

function formatMoney(value: number, currency: string) {
  if (currency === "KRW") return `${Math.round(value).toLocaleString()}원`;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// M8: 통합 히스토리 항목. 매매(transaction)와 배당(dividend)은 서로 다른 엔티티라
// 공통 id가 없으므로, 정렬용으로만 쓰는 얇은 래퍼로 감싼다.
type HistoryItem =
  | { kind: "transaction"; data: TransactionResponse }
  | { kind: "dividend"; data: DividendResponse };

function combineHistory(
  transactions: TransactionResponse[],
  dividends: DividendResponse[],
): HistoryItem[] {
  const items: HistoryItem[] = [
    ...transactions.map((t) => ({ kind: "transaction" as const, data: t })),
    ...dividends.map((d) => ({ kind: "dividend" as const, data: d })),
  ];
  return items.sort((a, b) => {
    const dateA = a.kind === "transaction" ? a.data.tradeDate : a.data.payDate;
    const dateB = b.kind === "transaction" ? b.data.tradeDate : b.data.payDate;
    if (dateA !== dateB) return dateA < dateB ? 1 : -1; // 최신순
    // 같은 날짜면 매매를 배당보다 위에 고정(정렬 안정성 목적, D-092와 같은 문제의식이나
    // 서로 다른 엔티티라 완전한 시각 비교는 불가 — MVP 단순화)
    if (a.kind !== b.kind) return a.kind === "transaction" ? -1 : 1;
    return 0;
  });
}

export default function AssetDetailPage() {
  const params = useParams<{ accountId: string; assetId: string }>();
  const router = useRouter();
  const accountId = Number(params.accountId);
  const assetId = Number(params.assetId);

  const [holding, setHolding] = useState
    AssetHoldingResponse | null | undefined
  >(undefined);
  const [transactions, setTransactions] = useState
    TransactionResponse[] | null
  >(null);
  const [dividends, setDividends] = useState<DividendResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [sellOpen, setSellOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [fx, setFx] = useState<number | "">("");
  const [tradeDate, setTradeDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // M8: 배당 등록 폼
  const [dividendOpen, setDividendOpen] = useState(false);
  const [payDate, setPayDate] = useState(todayString());
  const [amount, setAmount] = useState<number | "">("");
  const [dividendFx, setDividendFx] = useState<number | "">("");
  const [dividendSubmitting, setDividendSubmitting] = useState(false);
  const [dividendFormError, setDividendFormError] = useState<string | null>(
    null,
  );

  // M8: 배당 삭제 확인
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadAll() {
    // 단건 조회 API가 없어 계좌 보유목록에서 찾는다 — 계좌 상세 화면과 동일한 우회 패턴(백로그 항목)
    api
      .get<AssetHoldingResponse[]>(`/api/assets?accountId=${accountId}`)
      .then((all) => setHolding(all.find((h) => h.assetId === assetId) ?? null))
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "자산 정보를 불러오지 못했어요.",
        ),
      );

    api
      .get<TransactionResponse[]>(`/api/assets/${assetId}/transactions`)
      .then(setTransactions)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "거래내역을 불러오지 못했어요.",
        ),
      );

    api
      .get<DividendResponse[]>(`/api/assets/${assetId}/dividends`)
      .then(setDividends)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "배당 내역을 불러오지 못했어요.",
        ),
      );
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, assetId]);

  const isForeign = holding?.category === "FOREIGN_STOCK";
  // D-067: 배당은 국내/해외주식만
  const isDividendEligible =
    holding?.category === "DOMESTIC_STOCK" || holding?.category === "FOREIGN_STOCK";

  const combinedHistory = useMemo(() => {
    if (transactions === null || dividends === null) return null;
    return combineHistory(transactions, dividends);
  }, [transactions, dividends]);

  function validateSell(): string | null {
    if (quantity === "" || quantity <= 0) return "매도 수량을 입력해주세요.";
    if (holding && quantity > holding.quantity)
      return `보유 수량(${formatQuantity(holding.quantity)})보다 많이 매도할 수 없어요.`;
    if (unitPrice === "" || unitPrice < 0) return "매도 단가를 입력해주세요.";
    if (isForeign && (fx === "" || fx <= 0)) return "환율을 입력해주세요.";
    if (tradeDate > todayString()) return "거래일은 오늘보다 미래일 수 없어요.";
    return null;
  }

  async function handleSell() {
    const validationError = validateSell();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const body: AssetSellRequest = {
        assetId,
        quantity: quantity as number,
        unitPrice: unitPrice as number,
        tradeDate,
        ...(isForeign ? { fx: fx as number } : {}),
      };
      await api.post("/api/assets/sell", body);
      setSellOpen(false);
      setQuantity("");
      setUnitPrice("");
      setFx("");
      setTradeDate(todayString());
      loadAll();
    } catch (e) {
      setFormError(
        e instanceof ApiError ? e.message : "매도 등록에 실패했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // M8: 배당 등록 검증/제출
  function validateDividend(): string | null {
    if (!payDate) return "지급일을 입력해주세요.";
    if (payDate > todayString()) return "지급일은 오늘보다 미래일 수 없어요.";
    if (amount === "" || amount <= 0) return "배당금액을 입력해주세요.";
    if (isForeign && (dividendFx === "" || dividendFx <= 0))
      return "환율을 입력해주세요.";
    return null;
  }

  async function handleAddDividend() {
    const validationError = validateDividend();
    if (validationError) {
      setDividendFormError(validationError);
      return;
    }
    setDividendFormError(null);
    setDividendSubmitting(true);
    try {
      const body: DividendCreateRequest = {
        payDate,
        amount: amount as number,
        ...(isForeign ? { fx: dividendFx as number } : {}),
      };
      await api.post(`/api/assets/${assetId}/dividends`, body);
      setDividendOpen(false);
      setPayDate(todayString());
      setAmount("");
      setDividendFx("");
      setToast("배당 기록이 추가되었어요.");
      loadAll();
    } catch (e) {
      setDividendFormError(
        e instanceof ApiError ? e.message : "배당 등록에 실패했어요.",
      );
    } finally {
      setDividendSubmitting(false);
    }
  }

  // M8: 배당 삭제(D-056 — 확인 모달 + 토스트)
  async function handleDeleteDividend() {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      await api.delete(`/api/assets/${assetId}/dividends/${deleteTargetId}`);
      setDeleteTargetId(null);
      setToast("배당 기록이 삭제되었어요.");
      loadAll();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "배당 삭제에 실패했어요.",
      );
      setDeleteTargetId(null);
    } finally {
      setDeleting(false);
    }
  }

  if (holding === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[14px] mb-4" style={{ color: "var(--text-sub)" }}>
          자산을 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push(`/portfolio/accounts/${accountId}`)}
          className="text-[13px] font-semibold"
          style={{ color: "var(--accent)" }}
        >
          계좌 상세로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-6 pb-10">
      <button
        onClick={() => router.push(`/portfolio/accounts/${accountId}`)}
        className="flex items-center gap-1 text-[13px] mb-5"
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
        계좌 상세
      </button>

      {holding && (
        <>
          <div className="mb-1">
            <h1
              className="text-[17px] font-bold"
              style={{ color: "var(--text-strong)" }}
            >
              {holding.name}
            </h1>
            <div className="mt-1">
              <CategoryBadge
                category={holding.category as TradableAssetCategory}
              />
            </div>
          </div>

          <div className="mt-4 mb-6 card px-4 py-4">
            <p className="text-[12px]" style={{ color: "var(--text-sub)" }}>
              보유 수량
            </p>
            <p
              className="amount text-[20px] font-bold mt-0.5"
              style={{ color: "var(--text-strong)" }}
            >
              {formatQuantity(holding.quantity)}
              {categoryUnit[holding.category as TradableAssetCategory] ?? ""}
            </p>
            <p
              className="amount text-[12px] mt-1"
              style={{ color: "var(--text-sub)" }}
            >
              평단 {formatMoney(holding.averagePrice, holding.currency)}
            </p>
          </div>

          <div className="mb-6 flex gap-2">
            <SecondaryButton
              onClick={() => setSellOpen((v) => !v)}
              className="flex-1"
            >
              {sellOpen ? "매도 취소" : "매도"}
            </SecondaryButton>
            {isDividendEligible && (
              <SecondaryButton
                onClick={() => setDividendOpen((v) => !v)}
                className="flex-1"
              >
                {dividendOpen ? "배당 취소" : "배당 기록"}
              </SecondaryButton>
            )}
          </div>

          {sellOpen && (
            <div className="mb-6 card px-4 py-4">
              <Field
                label="매도 수량"
                unit={
                  categoryUnit[holding.category as TradableAssetCategory] ?? ""
                }
              >
                <NumberInput
                  value={quantity}
                  onChange={setQuantity}
                  allowDecimal
                  placeholder="0"
                  maxDigits={12}
                />
              </Field>
              <Field label="매도 단가" unit={isForeign ? "USD" : "원"}>
                <NumberInput
                  value={unitPrice}
                  onChange={setUnitPrice}
                  allowDecimal
                  placeholder="0"
                />
              </Field>
              {isForeign && (
                <Field label="매도 시점 환율" unit="원">
                  <NumberInput
                    value={fx}
                    onChange={setFx}
                    allowDecimal
                    placeholder="1,350.00"
                  />
                </Field>
              )}
              <div className="mb-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-sub)" }}
                >
                  거래일
                </label>
                <input
                  type="date"
                  value={tradeDate}
                  max={todayString()}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="w-full rounded-xl border px-3.5 py-3 text-base mt-1.5"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>

              {formError && (
                <div className="mt-4">
                  <ErrorBanner message={formError} />
                </div>
              )}

              <div className="mt-5">
                <PrimaryButton
                  onClick={handleSell}
                  loading={submitting}
                  className="w-full"
                >
                  매도 등록
                </PrimaryButton>
              </div>
            </div>
          )}

          {dividendOpen && isDividendEligible && (
            <div className="mb-6 card px-4 py-4">
              <div className="mb-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-sub)" }}
                >
                  지급일
                </label>
                <input
                  type="date"
                  value={payDate}
                  max={todayString()}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full rounded-xl border px-3.5 py-3 text-base mt-1.5"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>
              <Field label="배당금액" unit={isForeign ? "USD" : "원"}>
                <NumberInput
                  value={amount}
                  onChange={setAmount}
                  allowDecimal
                  placeholder="0"
                />
              </Field>
              {isForeign && (
                <Field label="지급 시점 환율" unit="원">
                  <NumberInput
                    value={dividendFx}
                    onChange={setDividendFx}
                    allowDecimal
                    placeholder="1,350.00"
                  />
                </Field>
              )}

              {dividendFormError && (
                <div className="mt-4">
                  <ErrorBanner message={dividendFormError} />
                </div>
              )}

              <div className="mt-5">
                <PrimaryButton
                  onClick={handleAddDividend}
                  loading={dividendSubmitting}
                  className="w-full"
                >
                  배당 등록
                </PrimaryButton>
              </div>
            </div>
          )}
        </>
      )}

      <p
        className="text-[13px] font-semibold mb-2.5 px-1"
        style={{ color: "var(--text-sub)" }}
      >
        거래 내역
      </p>

      {error && <ErrorBanner message={error} />}

      {combinedHistory === null && !error && (
        <div className="space-y-2">
          <div className="card px-4 py-3 animate-pulse h-14" />
          <div className="card px-4 py-3 animate-pulse h-14" />
        </div>
      )}

      {combinedHistory !== null && combinedHistory.length === 0 && (
        <div className="card px-4 py-8 text-center">
          <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
            아직 거래내역이 없어요.
          </p>
        </div>
      )}

      {combinedHistory !== null && combinedHistory.length > 0 && (
        <div className="space-y-2">
          {combinedHistory.map((item) =>
            item.kind === "transaction" ? (
              <div
                key={`tx-${item.data.transactionId}`}
                className="card px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{
                        color:
                          item.data.type === "BUY"
                            ? "var(--accent)"
                            : "var(--text-sub)",
                        background:
                          item.data.type === "BUY"
                            ? "var(--accent-soft)"
                            : "var(--border)",
                      }}
                    >
                      {transactionTypeLabel[item.data.type]}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {item.data.tradeDate}
                    </span>
                  </div>
                  <p
                    className="amount text-[13px] mt-1"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {formatQuantity(item.data.quantity)}
                    {holding
                      ? (categoryUnit[
                          holding.category as TradableAssetCategory
                        ] ?? "")
                      : ""}{" "}
                    · {formatMoney(item.data.unitPrice, holding?.currency ?? "KRW")}
                  </p>
                </div>
                <p
                  className="amount text-[13px] font-semibold"
                  style={{ color: "var(--text-strong)" }}
                >
                  {formatMoney(item.data.amount, holding?.currency ?? "KRW")}
                </p>
              </div>
            ) : (
              <div
                key={`div-${item.data.dividendId}`}
                className="card px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ color: "var(--gain)" }}
                    >
                      배당
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {item.data.payDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className="amount text-[13px] font-semibold"
                    style={{ color: "var(--gain)" }}
                  >
                    +{formatMoney(item.data.amount, holding?.currency ?? "KRW")}
                  </p>
                  <button
                    onClick={() => setDeleteTargetId(item.data.dividendId)}
                    aria-label="배당 기록 삭제"
                    className="p-1 rounded-md"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {deleteTargetId !== null && (
        <ConfirmModal
          title="배당 기록을 삭제할까요?"
          description="삭제하면 되돌릴 수 없어요."
          loading={deleting}
          onConfirm={handleDeleteDividend}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
