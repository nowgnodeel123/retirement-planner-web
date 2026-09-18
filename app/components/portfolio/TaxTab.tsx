// app/components/portfolio/TaxTab.tsx
// M11(D-064/D-068): 계좌 상세 세금 탭. 세금계산기 완전판이 아니라 추정·판정만 제공한다.
// D-064: 해외주식 연간 실현손익 기준 양도소득세 추정치(국내주식 제외, 전문가검증 문구 상시노출)
// D-068: 배당소득세는 실제 세액 미계산, 금융소득 2천만원 기준 분리과세종결/종합신고가능 판정만
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { formatKrw, profitColor, signed } from "@/app/components/portfolio/format";
import { dividendJudgementLabel, TaxScope, TaxSummaryResponse } from "@/app/components/portfolio/types";

// D-076: 전문용어(과세표준/분리과세) ⓘ 버튼+풀이. 별도 모달/팝오버 라이브러리 없이
// 클릭 시 인라인으로 풀이를 펼치는 최소 구현.
function InfoTerm({ term, explanation }: { term: string; explanation: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block">
      <span className="inline-flex items-center gap-1">
        {term}
        <button
          type="button"
          aria-label={`${term} 설명 보기`}
          onClick={() => setOpen((v) => !v)}
          className="fs-caption rounded-full w-4 h-4 inline-flex items-center justify-center"
          style={{ color: "var(--text-faint)", border: "1px solid var(--border)" }}
        >
          i
        </button>
      </span>
      {open && (
        <p className="fs-body mt-1" style={{ color: "var(--text-faint)" }}>
          {explanation}
        </p>
      )}
    </span>
  );
}

function DisclaimerBanner() {
  return (
    <div
      className="rounded-xl px-3 py-2 mb-4 fs-body"
      style={{ background: "var(--error-soft)", color: "var(--error)" }}
    >
      이 화면의 세금 정보는 추정·판정치이며 실제 세액이 아니에요. 신고 전 반드시 세무 전문가 검증을 받으세요.
    </div>
  );
}

function TaxSkeletonCard() {
  return (
    <div className="card px-4 py-4 animate-pulse space-y-2">
      <div className="w-24 h-3.5 rounded" style={{ background: "var(--border)" }} />
      <div className="w-32 h-5 rounded" style={{ background: "var(--border)" }} />
    </div>
  );
}

// M15(D-232): 계좌 스코프에서 인별 스코프로. 기본공제 250만원과 금융소득 2천만원 기준이
// 인별 한도라, 계좌별로 보여주면 공제를 계좌 수만큼 중복해 잡은 값을 보게 된다.
export function TaxTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  return (
    <div className="rise-in">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label="이전 연도"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: "var(--text-sub)", border: "1px solid var(--border)" }}
        >
          ‹
        </button>
        <p className="fs-title font-semibold" style={{ color: "var(--text-strong)" }}>
          {year}년
        </p>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}
          aria-label="다음 연도"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            color: year >= currentYear ? "var(--text-faint)" : "var(--text-sub)",
            border: "1px solid var(--border)",
            opacity: year >= currentYear ? 0.5 : 1,
          }}
        >
          ›
        </button>
      </div>

      <DisclaimerBanner />

      <TaxContent key={year} year={year} />
    </div>
  );
}

/**
 * 어떤 계좌를 보고 어떤 계좌를 뺐는지 밝힌다.
 * 이 사실을 안 보여주면 "연금계좌 매도차익이 왜 안 잡히지?"라는 의문이 앱의 결함으로 읽힌다.
 *
 * 제외 사유를 나눠 쓰는 이유: 예전엔 전부 "세제혜택 계좌"라고 뭉뚱그렸는데 거래소 계좌는
 * 세제혜택 계좌가 아니라 설명이 틀렸다. 게다가 그때는 거래소가 "포함" 쪽에 세어져서,
 * 화면은 계산했다고 말하면서 실제로는 그 계좌의 매도차익을 한 푼도 넣지 않고 있었다.
 */
function ScopeNotice({ scope }: { scope: TaxScope }) {
  if (scope.excludedAccountCount === 0) return null;

  const taxAdvantaged = scope.excludedAccounts.filter((a) => a.reason === "TAX_ADVANTAGED");
  const cryptoOnly = scope.excludedAccounts.filter((a) => a.reason === "CRYPTO_ONLY");

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}
    >
      <p className="fs-caption" style={{ color: "var(--text-sub)" }}>
        일반 증권 계좌 {scope.taxableAccountCount}곳을 합쳐서 계산했어요.
        {taxAdvantaged.length > 0 && (
          <>
            {" "}
            세제혜택 계좌 {taxAdvantaged.length}곳(
            {taxAdvantaged.map((a) => a.name).join(", ")})은 양도소득세·금융소득 합산 대상이
            아니라 뺐어요.
          </>
        )}
        {cryptoOnly.length > 0 && (
          <>
            {" "}
            거래소 계좌 {cryptoOnly.length}곳({cryptoOnly.map((a) => a.name).join(", ")})은
            이 앱이 가상자산 세금을 추정하지 않아 뺐어요.
          </>
        )}
      </p>
    </div>
  );
}

function TaxContent({ year }: { year: number }) {
  const [data, setData] = useState<TaxSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<TaxSummaryResponse>(`/api/tax?year=${year}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "세금 정보를 불러오지 못했어요."));
  }, [year]);

  if (error) return <ErrorBanner message={error} />;

  if (data === null) {
    return (
      <div className="space-y-3">
        <TaxSkeletonCard />
        <TaxSkeletonCard />
      </div>
    );
  }

  const { capitalGains: cg, dividendIncome: di, scope } = data;

  return (
    <div className="space-y-3">
      <ScopeNotice scope={scope} />

      <div className="card px-4 py-4">
        <p className="fs-body font-semibold mb-3" style={{ color: "var(--text-strong)" }}>
          양도소득세 추정 (해외주식만)
        </p>

        <div className="flex justify-between fs-body" style={{ color: "var(--text-sub)" }}>
          <span>해외주식 연간 실현손익</span>
          <span
            className="amount font-semibold"
            style={{ color: profitColor(cg.realizedProfitKrw) }}
          >
            {signed(cg.realizedProfitKrw, formatKrw(Math.abs(cg.realizedProfitKrw)))}
          </span>
        </div>
        <div className="flex justify-between fs-body mt-2" style={{ color: "var(--text-sub)" }}>
          <span>기본공제</span>
          <span className="amount">-{formatKrw(cg.basicDeductionKrw)}</span>
        </div>
        <div className="flex justify-between fs-body mt-2" style={{ color: "var(--text-sub)" }}>
          <InfoTerm term="과세표준" explanation="실현손익에서 기본공제(연 250만원)를 뺀 금액이에요. 손실이면 0으로 처리해요." />
          <span className="amount">{formatKrw(cg.taxableBaseKrw)}</span>
        </div>
        <div
          className="flex justify-between fs-title mt-3 pt-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-semibold" style={{ color: "var(--text-strong)" }}>
            추정 세액 ({Math.round(cg.taxRate * 100)}%)
          </span>
          <span className="amount font-bold" style={{ color: "var(--text-strong)" }}>
            {formatKrw(cg.estimatedTaxKrw)}
          </span>
        </div>

        <p className="fs-body mt-3" style={{ color: "var(--text-faint)" }}>
          국내주식은 이 추정에 포함하지 않아요. 매도 {cg.sellCount}건 기준이에요.
        </p>
      </div>

      <div className="card px-4 py-4">
        <p className="fs-body font-semibold mb-3" style={{ color: "var(--text-strong)" }}>
          배당소득세 판정
        </p>

        <div className="flex justify-between fs-body" style={{ color: "var(--text-sub)" }}>
          <InfoTerm
            term="연간 배당 합계(세전 환산)"
            explanation="배당은 실수령액(세후)으로 기록해요. 국내주식은 15.4% 원천징수율로 세전 금액을 역환산해 합산하지만, 해외주식은 원천징수율이 나라마다 달라 역환산하지 않아요. 실제 세전 금액과 다를 수 있는 추정치예요."
          />
          <span className="amount font-semibold" style={{ color: "var(--text-strong)" }}>
            {formatKrw(di.totalDividendKrw)}
          </span>
        </div>
        <div className="flex justify-between fs-body mt-2" style={{ color: "var(--text-sub)" }}>
          <span>금융소득종합과세 기준</span>
          <span className="amount">{formatKrw(di.thresholdKrw)}</span>
        </div>

        <div
          className="mt-3 pt-3 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <InfoTerm
            term="판정 결과"
            explanation="이자·배당 등 금융소득이 연 2천만원을 넘으면 분리과세로 끝나지 않고 다른 소득과 합산해 종합소득세로 신고할 가능성이 생겨요."
          />
          <span
            className="fs-body font-semibold px-2 py-1 rounded-lg"
            style={
              di.exceedsThreshold
                ? { color: "var(--error)", background: "var(--error-soft)" }
                : { color: "var(--gain)" }
            }
          >
            {dividendJudgementLabel[di.judgement]}
          </span>
        </div>

        {di.foreignDividendCount > 0 && (
          <p
            className="fs-body mt-3 leading-relaxed"
            style={{ color: "var(--warning)" }}
          >
            해외주식 배당 {di.foreignDividendCount}건은 <b>세전 환산 없이</b> 그대로 더했어요.
            원천징수율이 나라마다 달라(미국 15%, 중국 10%, 일본 15.3%) 임의로 추정하지 않아요.
            그만큼 위 합계가 실제 세전 금액보다 작아서, 기준에 가깝다면 실제로는 넘을 수 있어요.
          </p>
        )}

        <p className="fs-body mt-3" style={{ color: "var(--text-faint)" }}>
          실제 종합소득세액은 계산하지 않아요. 이 앱은 예적금 이자소득을 추적하지 않아 실제 금융소득이
          더 클 수 있어요. 배당 {di.dividendCount}건 기준이에요.
        </p>
      </div>
    </div>
  );
}
