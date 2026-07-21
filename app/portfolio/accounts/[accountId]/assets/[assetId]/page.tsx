// app/portfolio/accounts/[accountId]/assets/[assetId]/page.tsx
// M6: 자산 상세 — 보유 요약 + 매도 폼 + 매매 히스토리 조회
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  NumberInput,
} from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import {
  AssetHoldingResponse,
  AssetSellRequest,
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
  const [error, setError] = useState<string | null>(null);

  const [sellOpen, setSellOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [fx, setFx] = useState<number | "">("");
  const [tradeDate, setTradeDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, assetId]);

  const isForeign = holding?.category === "FOREIGN_STOCK";

  function validate(): string | null {
    if (quantity === "" || quantity <= 0) return "매도 수량을 입력해주세요.";
    if (holding && quantity > holding.quantity)
      return `보유 수량(${formatQuantity(holding.quantity)})보다 많이 매도할 수 없어요.`;
    if (unitPrice === "" || unitPrice < 0) return "매도 단가를 입력해주세요.";
    if (isForeign && (fx === "" || fx <= 0)) return "환율을 입력해주세요.";
    if (tradeDate > todayString()) return "거래일은 오늘보다 미래일 수 없어요.";
    return null;
  }

  async function handleSell() {
    const validationError = validate();
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
    <div className="max-w-[420px] w-full mx-auto px-5 pt-6">
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

          <div className="mb-6">
            <SecondaryButton
              onClick={() => setSellOpen((v) => !v)}
              className="w-full"
            >
              {sellOpen ? "매도 취소" : "매도"}
            </SecondaryButton>
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
        </>
      )}

      <p
        className="text-[13px] font-semibold mb-2.5 px-1"
        style={{ color: "var(--text-sub)" }}
      >
        매매 히스토리
      </p>

      {error && <ErrorBanner message={error} />}

      {transactions === null && !error && (
        <div className="space-y-2">
          <div className="card px-4 py-3 animate-pulse h-14" />
          <div className="card px-4 py-3 animate-pulse h-14" />
        </div>
      )}

      {transactions !== null && transactions.length === 0 && (
        <div className="card px-4 py-8 text-center">
          <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
            아직 거래내역이 없어요.
          </p>
        </div>
      )}

      {transactions !== null && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.transactionId}
              className="card px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      color:
                        tx.type === "BUY" ? "var(--accent)" : "var(--text-sub)",
                      background:
                        tx.type === "BUY"
                          ? "var(--accent-soft)"
                          : "var(--border)",
                    }}
                  >
                    {transactionTypeLabel[tx.type]}
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {tx.tradeDate}
                  </span>
                </div>
                <p
                  className="amount text-[13px] mt-1"
                  style={{ color: "var(--text-strong)" }}
                >
                  {formatQuantity(tx.quantity)}
                  {holding
                    ? (categoryUnit[
                        holding.category as TradableAssetCategory
                      ] ?? "")
                    : ""}{" "}
                  · {formatMoney(tx.unitPrice, holding?.currency ?? "KRW")}
                </p>
              </div>
              <p
                className="amount text-[13px] font-semibold"
                style={{ color: "var(--text-strong)" }}
              >
                {formatMoney(tx.amount, holding?.currency ?? "KRW")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
