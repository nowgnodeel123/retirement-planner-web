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
import { TradeForm } from "@/app/components/portfolio/TradeForm";
import {
  formatMoney,
  formatQuantity,
} from "@/app/components/portfolio/format";
import { useDealBasRate } from "@/app/components/portfolio/useDealBasRate";
import {
  AssetBuyRequest,
  AssetHoldingResponse,
  AssetSellRequest,
  DividendCreateRequest,
  DividendResponse,
  TransactionResponse,
  AssetCategory,
  TradableAssetCategory,
  categoryUnit,
  transactionTypeLabel,
} from "@/app/components/portfolio/types";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function fxHintText(touched: boolean, baseDate: string | null) {
  return !touched && baseDate
    ? `${baseDate} 고시 매매기준율로 채웠어요 · 직접 수정 가능`
    : null;
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

  const [holding, setHolding] = useState<
    AssetHoldingResponse | null | undefined
  >(undefined);
  const [transactions, setTransactions] = useState<
    TransactionResponse[] | null
  >(null);
  const [dividends, setDividends] = useState<DividendResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [buyOpen, setBuyOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState<number | "">("");
  const [buyUnitPrice, setBuyUnitPrice] = useState<number | "">("");
  const [buyFx, setBuyFx] = useState<number | "">("");
  const [buyFxTouched, setBuyFxTouched] = useState(false);
  const [buyTradeDate, setBuyTradeDate] = useState(todayString());
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [buyFormError, setBuyFormError] = useState<string | null>(null);

  const [sellOpen, setSellOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [fx, setFx] = useState<number | "">("");
  const [fxTouched, setFxTouched] = useState(false);
  const [tradeDate, setTradeDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // M8: 배당 등록 폼
  const [dividendOpen, setDividendOpen] = useState(false);
  const [payDate, setPayDate] = useState(todayString());
  // 배당락일 — 선택 입력(자동조회는 라이선스 문제로 미제공, R-018 종결)
  const [exDividendDate, setExDividendDate] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [dividendFx, setDividendFx] = useState<number | "">("");
  const [dividendFxTouched, setDividendFxTouched] = useState(false);
  const [dividendSubmitting, setDividendSubmitting] = useState(false);
  const [dividendFormError, setDividendFormError] = useState<string | null>(
    null,
  );

  // 현금 잔액 수정 — 거래가 아니라 덮어쓰기라 별도 폼
  const [cashOpen, setCashOpen] = useState(false);
  const [cashBalance, setCashBalance] = useState<number | "">("");
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashFormError, setCashFormError] = useState<string | null>(null);

  // 거래 정정/삭제 — 잘못 입력한 매매를 고칠 수 있어야 한다.
  // 수량·평단·손익은 저장돼 있지 않고 거래에서 파생되므로(D-050), 거래만 고치면 전부 따라온다.
  const [editTxId, setEditTxId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number | "">("");
  const [editUnitPrice, setEditUnitPrice] = useState<number | "">("");
  const [editFx, setEditFx] = useState<number | "">("");
  const [editTradeDate, setEditTradeDate] = useState(todayString());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<number | null>(null);
  const [deletingTx, setDeletingTx] = useState(false);

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
  const isCash = holding?.category === "CASH";
  // D-067: 배당은 국내/해외주식만
  const isDividendEligible =
    holding?.category === "DOMESTIC_STOCK" ||
    holding?.category === "FOREIGN_STOCK";

  // 거래일/지급일 기준 매매기준율 자동조회 — 각 폼이 열려 있고 해외주식이며
  // 사용자가 아직 환율을 직접 수정하지 않았을 때만 자동으로 채운다.
  const buyRate = useDealBasRate(
    buyTradeDate,
    isForeign && buyOpen && !buyFxTouched,
  );
  const sellRate = useDealBasRate(tradeDate, isForeign && sellOpen && !fxTouched);
  const dividendRate = useDealBasRate(
    payDate,
    isForeign && dividendOpen && !dividendFxTouched,
  );

  // 비동기로 도착한 고시환율을 폼 입력값에 반영. 파생값(!touched ? auto : 값)으로
  // 바꾸는 게 맞지만 폼 4개의 제출·검증 경로를 함께 손대야 해서, 브라우저 검증이
  // 가능해진 뒤로 미룬다(STATE.md 미해결 이슈).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (buyRate.rate !== null && !buyFxTouched) setBuyFx(buyRate.rate);
  }, [buyRate.rate, buyFxTouched]);
  useEffect(() => {
    if (sellRate.rate !== null && !fxTouched) setFx(sellRate.rate);
  }, [sellRate.rate, fxTouched]);
  useEffect(() => {
    if (dividendRate.rate !== null && !dividendFxTouched)
      setDividendFx(dividendRate.rate);
  }, [dividendRate.rate, dividendFxTouched]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const combinedHistory = useMemo(() => {
    if (transactions === null || dividends === null) return null;
    return combineHistory(transactions, dividends);
  }, [transactions, dividends]);

  // 기존 보유 종목에 매수를 더 쌓는다. /api/assets/buy는 accountId+symbol이 같으면
  // 새 자산을 만들지 않고 기존 자산에 거래만 추가한다(AssetService.buy() 참고).
  function validateBuy(): string | null {
    if (buyQuantity === "" || buyQuantity <= 0) return "매수 수량을 입력해주세요.";
    if (buyUnitPrice === "" || buyUnitPrice < 0) return "매수 단가를 입력해주세요.";
    if (isForeign && (buyFx === "" || buyFx <= 0)) return "환율을 입력해주세요.";
    if (buyTradeDate > todayString()) return "거래일은 오늘보다 미래일 수 없어요.";
    return null;
  }

  function openEditTransaction(tx: TransactionResponse) {
    setEditTxId(tx.transactionId);
    setEditQuantity(tx.quantity);
    setEditUnitPrice(tx.unitPrice);
    setEditFx(tx.fx ?? "");
    setEditTradeDate(tx.tradeDate);
    setEditFormError(null);
  }

  function closeEditTransaction() {
    setEditTxId(null);
    setEditFormError(null);
  }

  async function handleUpdateTransaction() {
    if (editTxId === null) return;
    if (editQuantity === "" || editQuantity <= 0) {
      setEditFormError("수량을 입력해주세요.");
      return;
    }
    if (editUnitPrice === "" || editUnitPrice < 0) {
      setEditFormError("단가를 입력해주세요.");
      return;
    }
    if (isForeign && (editFx === "" || editFx <= 0)) {
      setEditFormError("환율을 입력해주세요.");
      return;
    }
    if (editTradeDate > todayString()) {
      setEditFormError("거래일은 오늘보다 미래일 수 없어요.");
      return;
    }
    setEditFormError(null);
    setEditSubmitting(true);
    try {
      await api.patch(`/api/assets/${assetId}/transactions/${editTxId}`, {
        quantity: editQuantity,
        unitPrice: editUnitPrice,
        tradeDate: editTradeDate,
        ...(isForeign ? { fx: editFx as number } : {}),
      });
      closeEditTransaction();
      setToast("거래 내역을 수정했어요.");
      loadAll();
    } catch (e) {
      setEditFormError(
        e instanceof ApiError ? e.message : "거래 수정에 실패했어요.",
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteTransaction() {
    if (deleteTxId === null) return;
    setDeletingTx(true);
    try {
      await api.delete(`/api/assets/${assetId}/transactions/${deleteTxId}`);
      setDeleteTxId(null);
      if (editTxId === deleteTxId) closeEditTransaction();
      setToast("거래 내역을 삭제했어요.");
      loadAll();
    } catch (e) {
      setDeleteTxId(null);
      setError(e instanceof ApiError ? e.message : "거래 삭제에 실패했어요.");
    } finally {
      setDeletingTx(false);
    }
  }

  async function handleSaveCashBalance() {
    if (cashBalance === "" || cashBalance < 0) {
      setCashFormError("잔액을 입력해주세요.");
      return;
    }
    setCashFormError(null);
    setCashSubmitting(true);
    try {
      await api.patch(`/api/assets/${assetId}/cash`, { balance: cashBalance });
      setCashOpen(false);
      setCashBalance("");
      setToast("잔액을 수정했어요.");
      loadAll();
    } catch (e) {
      setCashFormError(
        e instanceof ApiError ? e.message : "잔액 수정에 실패했어요.",
      );
    } finally {
      setCashSubmitting(false);
    }
  }

  async function handleBuy() {
    if (!holding) return;
    const validationError = validateBuy();
    if (validationError) {
      setBuyFormError(validationError);
      return;
    }
    setBuyFormError(null);
    setBuySubmitting(true);
    try {
      const body: AssetBuyRequest = {
        accountId,
        symbol: holding.symbol,
        name: holding.name,
        category: holding.category as TradableAssetCategory,
        quantity: buyQuantity as number,
        unitPrice: buyUnitPrice as number,
        tradeDate: buyTradeDate,
        ...(isForeign ? { currency: holding.currency, fx: buyFx as number } : {}),
      };
      await api.post("/api/assets/buy", body);
      setBuyOpen(false);
      setBuyQuantity("");
      setBuyUnitPrice("");
      setBuyFx("");
      setBuyFxTouched(false);
      setBuyTradeDate(todayString());
      setToast("매수 거래가 등록되었어요.");
      loadAll();
    } catch (e) {
      setBuyFormError(
        e instanceof ApiError ? e.message : "매수 등록에 실패했어요.",
      );
    } finally {
      setBuySubmitting(false);
    }
  }

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
      setFxTouched(false);
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
    if (exDividendDate && exDividendDate > payDate)
      return "배당락일은 지급일보다 늦을 수 없어요.";
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
        ...(exDividendDate ? { exDividendDate } : {}),
        amount: amount as number,
        ...(isForeign ? { fx: dividendFx as number } : {}),
      };
      await api.post(`/api/assets/${assetId}/dividends`, body);
      setDividendOpen(false);
      setPayDate(todayString());
      setExDividendDate("");
      setAmount("");
      setDividendFx("");
      setDividendFxTouched(false);
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
      setError(e instanceof ApiError ? e.message : "배당 삭제에 실패했어요.");
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
          className="fs-body font-semibold"
          style={{ color: "var(--accent)" }}
        >
          계좌 상세로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-6">
      <button
        onClick={() => router.push(`/portfolio/accounts/${accountId}`)}
        className="flex items-center gap-1 fs-body mb-5"
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
            <h1>
              <span
                className="text-[17px] font-bold"
                style={{ color: "var(--text-strong)" }}
              >
                {holding.name}
              </span>{" "}
              {!isCash && (
                <span className="fs-body" style={{ color: "var(--text-faint)" }}>
                  {holding.symbol}
                </span>
              )}
            </h1>
            <div className="mt-1">
              <CategoryBadge
                category={holding.category as AssetCategory}
              />
            </div>
          </div>

          <div className="mt-4 mb-6 card px-4 py-4">
            <p className="text-[12px]" style={{ color: "var(--text-sub)" }}>
              {isCash ? "잔액" : "보유 수량"}
            </p>
            <p
              className="amount text-[20px] font-bold mt-0.5"
              style={{ color: "var(--text-strong)" }}
            >
              {isCash
                ? formatMoney(holding.quantity, holding.currency)
                : `${formatQuantity(holding.quantity)}${
                    categoryUnit[holding.category as AssetCategory] ?? ""
                  }`}
            </p>
            {isCash ? (
              holding.krwEvaluationAmount !== null &&
              holding.currency !== "KRW" && (
                <p
                  className="amount text-[12px] mt-1"
                  style={{ color: "var(--text-sub)" }}
                >
                  ≈ {Math.round(holding.krwEvaluationAmount).toLocaleString()}원
                  {holding.exchangeRateBaseDate && (
                    <span style={{ color: "var(--text-faint)" }}>
                      {" "}
                      ({holding.exchangeRateBaseDate} 고시 매매기준율)
                    </span>
                  )}
                </p>
              )
            ) : (
              <p
                className="amount text-[12px] mt-1"
                style={{ color: "var(--text-sub)" }}
              >
                평단 {formatMoney(holding.averagePrice, holding.currency)}
              </p>
            )}
          </div>

          <div className="mb-6 flex gap-2">
            {isCash ? (
              <SecondaryButton
                onClick={() => {
                  setCashOpen((v) => !v);
                  setCashBalance(cashOpen ? "" : holding.quantity);
                  setCashFormError(null);
                }}
                className="flex-1"
              >
                {cashOpen ? "수정 취소" : "잔액 수정"}
              </SecondaryButton>
            ) : (
              <>
            <SecondaryButton
              onClick={() => setBuyOpen((v) => !v)}
              className="flex-1"
            >
              {buyOpen ? "매수 취소" : "매수"}
            </SecondaryButton>
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
              </>
            )}
          </div>

          {cashOpen && (
            <div className="mb-6 card px-4 py-4">
              <Field label="잔액" unit={holding.currency === "KRW" ? "원" : "USD"}>
                <NumberInput
                  value={cashBalance}
                  onChange={setCashBalance}
                  allowDecimal={holding.currency !== "KRW"}
                  placeholder="0"
                  maxDigits={12}
                />
              </Field>
              <p
                className="fs-caption mt-1.5 leading-relaxed"
                style={{ color: "var(--text-faint)" }}
              >
                현재 잔액으로 덮어써요. 거래 이력은 남지 않아요.
              </p>
              {cashFormError && (
                <div className="mt-4">
                  <ErrorBanner message={cashFormError} />
                </div>
              )}
              <div className="mt-4">
                <PrimaryButton
                  onClick={handleSaveCashBalance}
                  loading={cashSubmitting}
                  className="w-full"
                >
                  잔액 저장
                </PrimaryButton>
              </div>
            </div>
          )}

          {buyOpen && (
            <TradeForm
              quantityLabel="매수 수량"
              quantity={buyQuantity}
              onQuantityChange={setBuyQuantity}
              quantityUnit={categoryUnit[holding.category as AssetCategory] ?? ""}
              priceLabel="매수 단가"
              unitPrice={buyUnitPrice}
              onUnitPriceChange={setBuyUnitPrice}
              isForeign={isForeign}
              fxLabel="매수 시점 환율"
              fx={buyFx}
              onFxChange={(v) => {
                setBuyFx(v);
                setBuyFxTouched(true);
              }}
              fxHint={fxHintText(buyFxTouched, buyRate.baseDate)}
              tradeDate={buyTradeDate}
              onTradeDateChange={setBuyTradeDate}
              formError={buyFormError}
              submitting={buySubmitting}
              submitLabel="매수 등록"
              onSubmit={handleBuy}
            />
          )}

          {sellOpen && (
            <TradeForm
              quantityLabel="매도 수량"
              quantity={quantity}
              onQuantityChange={setQuantity}
              quantityUnit={categoryUnit[holding.category as AssetCategory] ?? ""}
              priceLabel="매도 단가"
              unitPrice={unitPrice}
              onUnitPriceChange={setUnitPrice}
              isForeign={isForeign}
              fxLabel="매도 시점 환율"
              fx={fx}
              onFxChange={(v) => {
                setFx(v);
                setFxTouched(true);
              }}
              fxHint={fxHintText(fxTouched, sellRate.baseDate)}
              tradeDate={tradeDate}
              onTradeDateChange={setTradeDate}
              formError={formError}
              submitting={submitting}
              submitLabel="매도 등록"
              onSubmit={handleSell}
            />
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
              <div className="mb-1 mt-4">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-sub)" }}
                >
                  배당락일 <span style={{ color: "var(--text-faint)" }}>(선택, 모르면 비워두세요)</span>
                </label>
                <input
                  type="date"
                  value={exDividendDate}
                  max={payDate}
                  onChange={(e) => setExDividendDate(e.target.value)}
                  className="w-full rounded-xl border px-3.5 py-3 text-base mt-1.5"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>
              {/* 세후임을 라벨에 박아둔다. 세금 탭은 이 값이 실수령액이라는 전제로
                  국내분을 15.4% 역환산하는데, 전에는 그 전제가 입력하는 자리에 없어서
                  세전 금액을 넣으면 조용히 18% 부풀려지는 상태였다. */}
              <Field label="배당금액 (세후 실수령액)" unit={isForeign ? "USD" : "원"}>
                <NumberInput
                  value={amount}
                  onChange={setAmount}
                  allowDecimal
                  placeholder="0"
                  maxDigits={12}
                />
              </Field>
              <p
                className="text-[12px] -mt-3 mb-4"
                style={{ color: "var(--text-faint)" }}
              >
                세금을 떼고 실제로 받은 금액을 넣어주세요. 증권사 앱에 찍힌 입금액이면 돼요.
              </p>
              {isForeign && (
                <>
                  <Field label="지급 시점 환율" unit="원">
                    <NumberInput
                      value={dividendFx}
                      onChange={(v) => {
                        setDividendFx(v);
                        setDividendFxTouched(true);
                      }}
                      allowDecimal
                      placeholder="1,350.00"
                    />
                  </Field>
                  {fxHintText(dividendFxTouched, dividendRate.baseDate) && (
                    <p
                      className="text-[12px] -mt-3 mb-4"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {fxHintText(dividendFxTouched, dividendRate.baseDate)}
                    </p>
                  )}
                </>
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
        className="fs-body font-semibold mb-2.5 px-1"
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
          <p className="fs-body" style={{ color: "var(--text-sub)" }}>
            아직 거래내역이 없어요.
          </p>
        </div>
      )}

      {combinedHistory !== null && combinedHistory.length > 0 && (
        <div className="space-y-2">
          {combinedHistory.map((item) =>
            item.kind === "transaction" ? (
              <div key={`tx-${item.data.transactionId}`}>
              <div
                className="card px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="fs-caption font-semibold px-1.5 py-0.5 rounded-md"
                      style={{
                        color:
                          item.data.type === "BUY"
                            ? "var(--gain)"
                            : "var(--loss)",
                        background:
                          item.data.type === "BUY"
                            ? "var(--gain-soft)"
                            : "var(--loss-soft)",
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
                    className="amount fs-body mt-1"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {formatQuantity(item.data.quantity)}
                    {holding
                      ? (categoryUnit[
                          holding.category as AssetCategory
                        ] ?? "")
                      : ""}{" "}
                    ·{" "}
                    {formatMoney(
                      item.data.unitPrice,
                      holding?.currency ?? "KRW",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p
                    className="amount fs-body font-semibold"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {formatMoney(item.data.amount, holding?.currency ?? "KRW")}
                  </p>
                  <button
                    onClick={() =>
                      editTxId === item.data.transactionId
                        ? closeEditTransaction()
                        : openEditTransaction(item.data)
                    }
                    aria-label="거래 내역 수정"
                    className="p-1 rounded-md"
                    style={{
                      color:
                        editTxId === item.data.transactionId
                          ? "var(--accent)"
                          : "var(--text-faint)",
                    }}
                  >
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
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTxId(item.data.transactionId)}
                    aria-label="거래 내역 삭제"
                    className="p-1 rounded-md"
                    style={{ color: "var(--text-faint)" }}
                  >
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
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {editTxId === item.data.transactionId && (
                <div className="mt-2">
                  <TradeForm
                    quantityLabel={`${transactionTypeLabel[item.data.type]} 수량`}
                    quantity={editQuantity}
                    onQuantityChange={setEditQuantity}
                    quantityUnit={
                      holding
                        ? (categoryUnit[holding.category as AssetCategory] ?? "")
                        : ""
                    }
                    priceLabel={`${transactionTypeLabel[item.data.type]} 단가`}
                    unitPrice={editUnitPrice}
                    onUnitPriceChange={setEditUnitPrice}
                    isForeign={isForeign}
                    fxLabel="거래 시점 환율"
                    fx={editFx}
                    onFxChange={setEditFx}
                    fxHint={null}
                    tradeDate={editTradeDate}
                    onTradeDateChange={setEditTradeDate}
                    formError={editFormError}
                    submitting={editSubmitting}
                    submitLabel="수정 저장"
                    onSubmit={handleUpdateTransaction}
                  />
                </div>
              )}
              </div>
            ) : (
              <div
                key={`div-${item.data.dividendId}`}
                className="card px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="fs-caption font-semibold px-1.5 py-0.5 rounded-md"
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
                  {item.data.exDividendDate && (
                    <p
                      className="fs-caption mt-0.5"
                      style={{ color: "var(--text-faint)" }}
                    >
                      배당락일 {item.data.exDividendDate}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className="amount fs-body font-semibold"
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

      {deleteTxId !== null && (
        <ConfirmModal
          title="거래 내역을 삭제할까요?"
          description="삭제하면 보유 수량과 평단이 다시 계산돼요. 되돌릴 수 없어요."
          loading={deletingTx}
          onConfirm={handleDeleteTransaction}
          onCancel={() => setDeleteTxId(null)}
        />
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
