// app/portfolio/accounts/[accountId]/assets/new/page.tsx
// D-053: 종목 검색 → 최초 매수 거래로 자산 생성 통합.
// D-037: 카테고리는 계좌 기관유형으로 자동 필터 — 사용자가 직접 아무거나 고르지 않는다.
// D-170: 증권사 계좌는 국내/해외 카테고리도 사용자가 먼저 고르지 않는다 —
// 종목명 하나만 검색하면 UnifiedStockSearch가 국내(KRX 로컬 캐시)·해외(Finnhub)
// 검색을 동시에 호출해 합친 결과를 보여주고, 선택한 종목이 어느 쪽인지에 따라
// 카테고리가 자동으로 정해진다(이전엔 카테고리 토글을 먼저 눌러야 검색창이 나왔음).
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
} from "@/app/components/wizard/Ui";
import { CategoryBadge } from "@/app/components/portfolio/CategoryBadge";
import { TradeAmountFields } from "@/app/components/portfolio/TradeForm";
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

interface UnifiedSearchItem {
  category: "DOMESTIC_STOCK" | "FOREIGN_STOCK";
  symbol: string;
  name: string;
  sub: string; // 국내: 시장구분(KOSPI/KOSDAQ), 해외: 심볼
}

/**
 * 국내(KRX 로컬 캐시)·해외(Finnhub) 종목 검색을 한 입력창에서 동시에 호출해
 * 합친 결과를 보여준다(D-170). 예전엔 "국내주식/해외주식" 카테고리를 먼저
 * 골라야 검색창이 나왔는데, 사용자가 그 구분을 몰라도(또는 귀찮아도) 종목명만
 * 알면 되도록 바꿨다 — 선택한 항목의 category가 그대로 매수 카테고리가 된다.
 *
 * 정렬: 관련도를 계산할 시가총액·거래량 데이터가 없어 완벽한 랭킹은 못 하지만,
 * 입력값에 한글이 섞여 있으면 국내 결과를, 아니면 해외 결과를 위로 올리는
 * 것만으로도 대부분의 실사용 케이스(한글 검색="국내 종목 찾는 중")에서 원하는
 * 종목이 스크롤 없이 상단에 온다.
 */
function UnifiedStockSearch({
  onSelect,
}: {
  onSelect: (item: UnifiedSearchItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [domesticResults, setDomesticResults] = useState<DomesticStockSearchResult[]>([]);
  const [foreignResults, setForeignResults] = useState<ForeignStockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setDomesticResults([]);
      setForeignResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const keyword = encodeURIComponent(query.trim());
      Promise.allSettled([
        api.get<DomesticStockSearchResult[]>(`/api/domestic-stocks/search?keyword=${keyword}`),
        api.get<ForeignStockSearchResult[]>(`/api/foreign-stocks/search?keyword=${keyword}`),
      ])
        .then(([domestic, foreign]) => {
          setDomesticResults(domestic.status === "fulfilled" ? domestic.value : []);
          setForeignResults(foreign.status === "fulfilled" ? foreign.value : []);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const domesticItems: UnifiedSearchItem[] = domesticResults.map((r) => ({
    category: "DOMESTIC_STOCK",
    symbol: r.symbolCode,
    name: r.name,
    sub: r.market,
  }));
  const foreignItems: UnifiedSearchItem[] = foreignResults.map((r) => ({
    category: "FOREIGN_STOCK",
    symbol: r.symbol,
    name: r.name,
    sub: r.symbol,
  }));
  const looksKorean = /[가-힣]/.test(query);
  const merged = looksKorean
    ? [...domesticItems, ...foreignItems]
    : [...foreignItems, ...domesticItems];

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
        placeholder="종목명 검색 (예: 삼성전자, Apple)"
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
          {!loading && merged.length === 0 && (
            <p className="px-4 py-3 text-[13px]" style={{ color: "var(--text-faint)" }}>
              일치하는 종목이 없어요.
            </p>
          )}
          {!loading &&
            merged.map((item) => (
              <button
                key={`${item.category}-${item.symbol}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors hover:bg-[var(--surface-pressed)]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <CategoryBadge category={item.category} />
                  <span
                    className="text-[14px] font-medium truncate"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {item.name}
                  </span>
                </span>
                <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                  {item.sub}
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
        // D-170: 증권사 계좌(국내+해외 둘 다 허용)는 검색 결과를 고르기 전까지
        // 카테고리를 비워둔다 — 미리 하나를 찍어두면 "이미 골랐다"는 뜻이 되어
        // UnifiedStockSearch가 자동으로 정해주는 흐름과 어긋난다. 옵션이 하나뿐인
        // 계좌(거래소=코인)만 그대로 자동 확정.
        if (options.length === 1) setCategory(options[0]);
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

  // 증권사 계좌(국내+해외 둘 다 허용)인데 아직 검색 결과를 안 골랐으면 category가 null.
  const isDualStockAccount = options.length === 2;
  const isForeign = category === "FOREIGN_STOCK";
  const isDomestic = category === "DOMESTIC_STOCK";

  // D-170: 종목 하나를 고르는 즉시 카테고리까지 함께 확정된다(수동 토글 없음).
  function selectSearchResult(item: {
    category: "DOMESTIC_STOCK" | "FOREIGN_STOCK";
    symbol: string;
    name: string;
  }) {
    setCategory(item.category);
    setSymbol(item.symbol);
    setName(item.name);
  }

  // "변경" 버튼 전용 — 이 함수를 쓰는 곳은 isDualStockAccount 분기뿐이라
  // 항상 category까지 null로 되돌려 다음 검색에서 새로 자동 확정되게 한다.
  function clearSelection() {
    setCategory(null);
    setSymbol("");
    setName("");
    setFx("");
    setFxBaseDate(null);
  }

  function validate(): string | null {
    if (!category) return "종목을 검색해서 선택해주세요.";
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
        {/* 옵션이 하나뿐인 계좌(거래소=코인)만 고정 카테고리 배지를 보여준다.
            증권사 계좌는 국내/해외를 먼저 고르게 하지 않는다(D-170) — 아래
            종목 검색에서 고른 결과에 따라 카테고리가 자동으로 정해진다. */}
        {options.length === 1 && (
          <div
            className="mb-5 flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ background: "var(--surface-pressed)", borderColor: "var(--border)" }}
          >
            <span className="text-[13px] font-medium" style={{ color: "var(--text-sub)" }}>
              카테고리
            </span>
            <CategoryBadge category={options[0]} />
          </div>
        )}

        {isDualStockAccount ? (
          <div className="mb-4">
            <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
              종목
            </label>
            <div className="mt-1.5">
              {symbol && name && category ? (
                <div
                  className="flex items-center justify-between rounded-xl border px-3.5 py-3"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <CategoryBadge category={category} />
                    <span
                      className="text-[15px] font-medium truncate"
                      style={{ color: "var(--text-strong)" }}
                    >
                      {name}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[12px] font-medium flex-shrink-0"
                    style={{ color: "var(--accent)" }}
                  >
                    변경
                  </button>
                </div>
              ) : (
                <UnifiedStockSearch onSelect={selectSearchResult} />
              )}
            </div>
            {!(symbol && name && category) && (
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>
                종목명을 검색하면 국내·해외 구분이 자동으로 정해져요.
              </p>
            )}
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

        <TradeAmountFields
          quantityLabel="수량"
          quantity={quantity}
          onQuantityChange={setQuantity}
          quantityUnit={category ? categoryUnit[category] : ""}
          priceLabel="매수 단가"
          unitPrice={unitPrice}
          onUnitPriceChange={setUnitPrice}
          isForeign={isForeign}
          fxLabel="매수 시점 환율"
          fx={fx}
          onFxChange={(v) => {
            setFx(v);
            setFxBaseDate(null);
          }}
          tradeDate={tradeDate}
          onTradeDateChange={setTradeDate}
        />
        {isForeign && fxBaseDate && (
          <p className="text-[12px] -mt-3 mb-4" style={{ color: "var(--text-faint)" }}>
            {fxBaseDate} 매매기준율로 미리 채웠어요. 과거 거래라면 그 시점 환율로 직접 수정해주세요.
          </p>
        )}

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
