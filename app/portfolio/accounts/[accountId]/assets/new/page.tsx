// app/portfolio/accounts/[accountId]/assets/new/page.tsx
// D-053: 종목 검색 → 최초 매수 거래로 자산 생성 통합.
// D-037: 카테고리는 계좌 기관유형으로 자동 필터 — 사용자가 직접 아무거나 고르지 않는다.
// 국내주식은 종목명 검색 자동완성(KRX 로컬 캐시, /api/domestic-stocks/search),
// 해외주식은 Finnhub 심볼 검색(/api/foreign-stocks/search) 적용 —
// 코인은 아직 심볼 검색 API가 없어 기존 수동 입력 유지.
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
  DomesticStockSearchResult,
  ForeignStockSearchResult,
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

/**
 * 국내주식 종목명 검색 자동완성. 백엔드가 이미 KRX 전체 종목을 로컬 캐싱해서
 * 부분일치 검색을 제공하고 있었는데(GET /api/domestic-stocks/search) 이 화면에
 * 연결이 안 돼 있었다 — 여기서 연결한다.
 */
function DomesticStockSearch({
  onSelect,
}: {
  onSelect: (stock: DomesticStockSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomesticStockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<DomesticStockSearchResult[]>(
          `/api/domestic-stocks/search?keyword=${encodeURIComponent(query.trim())}`,
        )
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="종목명 검색 (예: 삼성전자)"
        className={inputClass}
        autoComplete="off"
      />
      {open && query.trim().length > 0 && (
        <div
          className="absolute z-20 left-0 right-0 mt-1.5 rounded-xl border max-h-64 overflow-y-auto shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {loading && (
            <p className="px-4 py-3 text-[13px]" style={{ color: "var(--text-faint)" }}>
              검색 중...
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-[13px]" style={{ color: "var(--text-faint)" }}>
              일치하는 종목이 없어요.
            </p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.symbolCode}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-[var(--surface-pressed)]"
              >
                <span className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>
                  {r.name}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {r.market}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * 해외주식 심볼 검색 자동완성. Finnhub 심볼 검색(/api/foreign-stocks/search)을
 * 그대로 프록시하는 신규 백엔드 엔드포인트에 연결한다. 구조는 DomesticStockSearch와
 * 동일 패턴 — 두 카테고리의 응답 필드가 달라(market vs type) 공용 컴포넌트로
 * 묶지 않고 그대로 나란히 둔다.
 */
function ForeignStockSearch({
  onSelect,
}: {
  onSelect: (stock: ForeignStockSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ForeignStockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<ForeignStockSearchResult[]>(
          `/api/foreign-stocks/search?keyword=${encodeURIComponent(query.trim())}`,
        )
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="종목명·심볼 검색 (예: Apple, AAPL)"
        className={inputClass}
        autoComplete="off"
      />
      {open && query.trim().length > 0 && (
        <div
          className="absolute z-20 left-0 right-0 mt-1.5 rounded-xl border max-h-64 overflow-y-auto shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {loading && (
            <p className="px-4 py-3 text-[13px]" style={{ color: "var(--text-faint)" }}>
              검색 중...
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-[13px]" style={{ color: "var(--text-faint)" }}>
              일치하는 종목이 없어요.
            </p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-[var(--surface-pressed)]"
              >
                <span className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>
                  {r.name}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {r.symbol}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
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
  const [fxBaseDate, setFxBaseDate] = useState<string | null>(null);
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

  // D-087: 과거 환율 이력은 저장하지 않아 "가장 최근 매매기준율"만 기본값으로
  // 채운다. 사용자가 이미 입력했으면 덮어쓰지 않는다.
  useEffect(() => {
    if (category !== "FOREIGN_STOCK" || fx !== "") return;
    api
      .get<{ dealBasR: number; baseDate: string }>("/api/exchange-rates/USD")
      .then((rate) => {
        setFx(rate.dealBasR);
        setFxBaseDate(rate.baseDate);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (account === undefined) {
    return (
      <div className="flex justify-center pt-24">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
        />
      </div>
    );
  }

  if (account === null) {
    return (
      <div className="max-w-[420px] mx-auto px-5 pt-16 text-center">
        <p className="text-[14px] mb-4" style={{ color: "var(--text-sub)" }}>
          계좌를 찾을 수 없어요.
        </p>
        <button
          onClick={() => router.push("/portfolio")}
          className="text-[13px] font-semibold"
          style={{ color: "var(--accent)" }}
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
        <p className="text-[15px] font-semibold mb-1.5" style={{ color: "var(--text-strong)" }}>
          아직 지원하지 않아요
        </p>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--text-faint)" }}>
          은행 계좌의 예적금 입력은 준비 중이에요.
          <br />
          주식·코인은 증권사·거래소 계좌에서 추가할 수 있어요.
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

  const isForeign = category === "FOREIGN_STOCK";
  const isDomestic = category === "DOMESTIC_STOCK";

  function selectCategory(c: TradableAssetCategory) {
    setCategory(c);
    setSymbol("");
    setName("");
    setFx("");
    setFxBaseDate(null);
  }

  function validate(): string | null {
    if (!category) return "카테고리를 확인해주세요.";
    if (!symbol.trim())
      return isDomestic || isForeign
        ? "종목을 검색해서 선택해주세요."
        : "종목코드를 입력해주세요.";
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
      <h1 className="text-[20px] font-bold mb-6" style={{ color: "var(--text-strong)" }}>
        자산 추가
      </h1>

      <div
        className="rounded-3xl p-6 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "0 2px 24px rgba(15,23,42,0.06)",
        }}
      >
        {options.length === 1 ? (
          <div
            className="mb-5 flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ background: "var(--surface-pressed)", borderColor: "var(--border)" }}
          >
            <span className="text-[13px] font-medium" style={{ color: "var(--text-sub)" }}>
              카테고리
            </span>
            <CategoryBadge category={options[0]} />
          </div>
        ) : (
          <>
            <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
              카테고리
            </label>
            <div className="mt-1.5 mb-5 grid grid-cols-2 gap-2">
              {options.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectCategory(c)}
                    className={`rounded-2xl border py-3 transition-all ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-4 ring-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-faint)]"
                    }`}
                  >
                    <CategoryBadge category={c} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {isDomestic || isForeign ? (
          <div className="mb-4">
            <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
              종목
            </label>
            <div className="mt-1.5">
              {symbol && name ? (
                <div
                  className="flex items-center justify-between rounded-xl border px-3.5 py-3"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <span className="text-[15px] font-medium" style={{ color: "var(--text-strong)" }}>
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSymbol("");
                      setName("");
                    }}
                    className="text-[12px] font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    변경
                  </button>
                </div>
              ) : isDomestic ? (
                <DomesticStockSearch
                  onSelect={(r) => {
                    setSymbol(r.symbolCode);
                    setName(r.name);
                  }}
                />
              ) : (
                <ForeignStockSearch
                  onSelect={(r) => {
                    setSymbol(r.symbol);
                    setName(r.name);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="종목코드" unit="">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="BTC"
                className={inputClass}
                maxLength={30}
              />
            </Field>
            <Field label="종목명" unit="">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="비트코인"
                className={inputClass}
                maxLength={100}
              />
            </Field>
          </div>
        )}

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
              onChange={(v) => {
                setFx(v);
                setFxBaseDate(null);
              }}
              allowDecimal
              placeholder="1,350.00"
            />
          </Field>
        )}
        {isForeign && fxBaseDate && (
          <p className="text-[12px] -mt-3 mb-4" style={{ color: "var(--text-faint)" }}>
            {fxBaseDate} 매매기준율로 미리 채웠어요. 과거 거래라면 그 시점 환율로 직접 수정해주세요.
          </p>
        )}

        <div className="mb-1">
          <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
            거래일
          </label>
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

      {category === "CRYPTO" && (
        <p className="text-[12px] text-center mt-4 leading-relaxed" style={{ color: "var(--text-faint)" }}>
          {categoryLabel[category]} 종목 검색·자동완성은 아직 준비 중이에요.
          <br />
          지금은 종목코드와 이름을 직접 입력해주세요.
        </p>
      )}
    </div>
  );
}
