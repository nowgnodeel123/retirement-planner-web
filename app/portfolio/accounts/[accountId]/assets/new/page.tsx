// app/portfolio/accounts/[accountId]/assets/new/page.tsx
// D-053: 종목 검색 → 최초 매수 거래로 자산 생성 통합.
// D-037: 카테고리는 계좌 기관유형으로 자동 필터 — 사용자가 직접 아무거나 고르지 않는다.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  NumberInput,
} from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import {
  AccountResponse,
  AssetBuyRequest,
  categoryLabel,
  categoryUnit,
  InstitutionType,
  TradableAssetCategory,
} from "@/app/components/portfolio/types";

// D-037: 계좌 기관유형이 허용하는 자산 카테고리만 남긴다.
// 은행 계좌는 이 화면(주식/코인 매수) 대상이 아니다 — 예적금은 D-060 별도 입력 방식, 아직 미구현.
function allowedCategories(
  institutionType: InstitutionType,
): TradableAssetCategory[] {
  switch (institutionType) {
    case "SECURITIES":
      return ["DOMESTIC_STOCK", "FOREIGN_STOCK"];
    case "EXCHANGE":
      return ["CRYPTO"];
    case "BANK":
      return [];
  }
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewAssetPage() {
  const params = useParams<{ accountId: string }>();
  const router = useRouter();
  const accountId = Number(params.accountId);

  const [account, setAccount] = useState<AccountResponse | null | undefined>(
    undefined,
  );
  const [category, setCategory] = useState<TradableAssetCategory | null>(null);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [fx, setFx] = useState<number | "">("");
  const [tradeDate, setTradeDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AccountResponse[]>("/api/accounts").then((all) => {
      const found = all.find((a) => a.id === accountId) ?? null;
      setAccount(found);
      if (found) {
        const options = allowedCategories(found.institutionType);
        if (options.length > 0) setCategory(options[0]);
      }
    });
  }, [accountId]);

  if (account === undefined) {
    return (
      <div className="flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (account === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[14px] text-neutral-500 mb-4">
          계좌를 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push("/portfolio")}
          className="text-[13px] font-semibold text-blue-500"
        >
          포트폴리오로 돌아가기
        </button>
      </div>
    );
  }

  const options = allowedCategories(account.institutionType);

  if (options.length === 0) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[15px] font-semibold text-neutral-800 mb-1.5">
          아직 지원하지 않아요
        </p>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-6">
          은행 계좌의 예적금 입력은 준비 중이에요.
          <br />
          주식·코인은 증권사·거래소 계좌에서 추가할 수 있어요.
        </p>
        <button
          onClick={() => router.push(`/portfolio/accounts/${accountId}`)}
          className="text-[13px] font-semibold text-blue-500"
        >
          계좌 상세로 돌아가기
        </button>
      </div>
    );
  }

  const isForeign = category === "FOREIGN_STOCK";

  function validate(): string | null {
    if (!category) return "카테고리를 확인해주세요.";
    if (!symbol.trim()) return "종목코드를 입력해주세요.";
    if (!name.trim()) return "종목명을 입력해주세요.";
    if (quantity === "" || quantity <= 0) return "수량을 입력해주세요.";
    if (unitPrice === "" || unitPrice < 0) return "매수 단가를 입력해주세요.";
    if (isForeign && (fx === "" || fx <= 0)) return "환율을 입력해주세요.";
    if (tradeDate > todayString()) return "거래일은 오늘보다 미래일 수 없어요.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body: AssetBuyRequest = {
        accountId,
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        category: category as TradableAssetCategory,
        quantity: quantity as number,
        unitPrice: unitPrice as number,
        tradeDate,
        ...(isForeign ? { currency: "USD", fx: fx as number } : {}),
      };
      await api.post("/api/assets/buy", body);
      router.push(`/portfolio/accounts/${accountId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "매수 등록에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-5 pt-6">
      <h1 className="text-[20px] font-bold text-neutral-800 mb-6">자산 추가</h1>

      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] border border-neutral-100">
        {options.length === 1 ? (
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-neutral-50/70 border border-neutral-100 px-4 py-3">
            <span className="text-[13px] text-neutral-500 font-medium">
              카테고리
            </span>
            <CategoryBadge category={options[0]} />
          </div>
        ) : (
          <>
            <label className="text-sm text-neutral-500 font-medium">
              카테고리
            </label>
            <div className="mt-1.5 mb-5 grid grid-cols-2 gap-2">
              {options.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-2xl border py-3 transition-all ${active ? "border-blue-400 bg-blue-50/60 ring-4 ring-blue-500/10" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                  >
                    <CategoryBadge category={c} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="종목코드" unit="">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder={
                category === "DOMESTIC_STOCK"
                  ? "005930"
                  : category === "CRYPTO"
                    ? "BTC"
                    : "AAPL"
              }
              className={inputClass}
              maxLength={30}
            />
          </Field>
          <Field label="종목명" unit="">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="삼성전자"
              className={inputClass}
              maxLength={100}
            />
          </Field>
        </div>

        <Field label="수량" unit={category ? categoryUnit[category] : ""}>
          <NumberInput
            value={quantity}
            onChange={setQuantity}
            allowDecimal
            placeholder="0"
            maxDigits={12}
          />
        </Field>

        <Field label="매수 단가" unit={isForeign ? "USD" : "원"}>
          <NumberInput
            value={unitPrice}
            onChange={setUnitPrice}
            allowDecimal
            placeholder="0"
          />
        </Field>

        {isForeign && (
          <Field label="매수 시점 환율" unit="원">
            <NumberInput
              value={fx}
              onChange={setFx}
              allowDecimal
              placeholder="1,350.00"
            />
          </Field>
        )}

        <div className="mb-1">
          <label className="text-sm text-neutral-500 font-medium">거래일</label>
          <input
            type="date"
            value={tradeDate}
            max={todayString()}
            onChange={(e) => setTradeDate(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        {error && (
          <div className="mt-5">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <SecondaryButton onClick={() => router.back()} className="flex-[1]">
            취소
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            loading={submitting}
            className="flex-[2]"
          >
            매수 등록
          </PrimaryButton>
        </div>
      </div>

      <p className="text-[12px] text-neutral-400 text-center mt-4 leading-relaxed">
        {category ? categoryLabel[category] : ""} 종목 검색·자동완성은 곧 지원될
        예정이에요.
        <br />
        지금은 종목코드와 이름을 직접 입력해주세요.
      </p>
    </div>
  );
}
