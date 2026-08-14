// app/components/portfolio/TaxTab.tsx
// M11(D-064/D-068): 계좌 상세 세금 탭. 세금계산기 완전판이 아니라 추정·판정만 제공한다.
// D-064: 해외주식 연간 실현손익 기준 양도소득세 추정치(국내주식 제외, 전문가검증 문구 상시노출)
// D-068: 배당소득세는 실제 세액 미계산, 금융소득 2천만원 기준 분리과세종결/종합신고가능 판정만
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner } from "@/app/components/wizard/Ui";
import { formatKrw, signed } from "@/app/components/portfolio/format";
import { dividendJudgementLabel, TaxSummaryResponse } from "@/app/components/portfolio/types";

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
          className="text-[11px] rounded-full w-4 h-4 inline-flex items-center justify-center"
          style={{ color: "var(--text-faint)", border: "1px solid var(--border)" }}
        >
          i
        </button>
      </span>
      {open && (
        <p className="text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>
          {explanation}
        </p>
      )}
    </span>
  );
}

function DisclaimerBanner() {
  return (
    <div
      className="rounded-xl px-3 py-2.5 mb-4 text-[12px]"
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

export function TaxTab({ accountId }: { accountId: number }) {
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
        <p className="text-[14px] font-semibold" style={{ color: "var(--text-strong)" }}>
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

      <TaxContent key={year} accountId={accountId} year={year} />
    </div>
  );
}

function TaxContent({ accountId, year }: { accountId: number; year: number }) {
  const [data, setData] = useState<TaxSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<TaxSummaryResponse>(`/api/accounts/${accountId}/tax?year=${year}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "세금 정보를 불러오지 못했어요."));
  }, [accountId, year]);

  if (error) return <ErrorBanner message={error} />;

  if (data === null) {
    return (
      <div className="space-y-3">
        <TaxSkeletonCard />
        <TaxSkeletonCard />
      </div>
    );
  }

  const { capitalGains: cg, dividendIncome: di } = data;

  return (
    <div className="space-y-3">
      <div className="card px-4 py-4">
        <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-strong)" }}>
          양도소득세 추정 (해외주식만)
        </p>

        <div className="flex justify-between text-[13px]" style={{ color: "var(--text-sub)" }}>
          <span>해외주식 연간 실현손익</span>
          <span
            className="amount font-semibold"
            style={{ color: cg.realizedProfitKrw >= 0 ? "var(--gain)" : "var(--loss)" }}
          >
            {signed(cg.realizedProfitKrw, formatKrw(Math.abs(cg.realizedProfitKrw)))}
          </span>
        </div>
        <div className="flex justify-between text-[13px] mt-1.5" style={{ color: "var(--text-sub)" }}>
          <span>기본공제</span>
          <span className="amount">-{formatKrw(cg.basicDeductionKrw)}</span>
        </div>
        <div className="flex justify-between text-[13px] mt-1.5" style={{ color: "var(--text-sub)" }}>
          <InfoTerm term="과세표준" explanation="실현손익에서 기본공제(연 250만원)를 뺀 금액이에요. 손실이면 0으로 처리해요." />
          <span className="amount">{formatKrw(cg.taxableBaseKrw)}</span>
        </div>
        <div
          className="flex justify-between text-[14px] mt-3 pt-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-semibold" style={{ color: "var(--text-strong)" }}>
            추정 세액 ({Math.round(cg.taxRate * 100)}%)
          </span>
          <span className="amount font-bold" style={{ color: "var(--text-strong)" }}>
            {formatKrw(cg.estimatedTaxKrw)}
          </span>
        </div>

        <p className="text-[12px] mt-3" style={{ color: "var(--text-faint)" }}>
          국내주식은 이 추정에 포함하지 않아요. 매도 {cg.sellCount}건 기준이에요.
        </p>
      </div>

      <div className="card px-4 py-4">
        <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-strong)" }}>
          배당소득세 판정
        </p>

        <div className="flex justify-between text-[13px]" style={{ color: "var(--text-sub)" }}>
          <InfoTerm
            term="연간 배당 합계(세전 환산)"
            explanation="국내주식 배당은 세후 금액으로 기록되기 때문에, 15.4% 원천징수율로 세전 금액을 역환산해서 합산해요. 실제 세전 금액과 다를 수 있는 추정치예요."
          />
          <span className="amount font-semibold" style={{ color: "var(--text-strong)" }}>
            {formatKrw(di.totalDividendKrw)}
          </span>
        </div>
        <div className="flex justify-between text-[13px] mt-1.5" style={{ color: "var(--text-sub)" }}>
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
            className="text-[13px] font-semibold px-2.5 py-1 rounded-lg"
            style={
              di.exceedsThreshold
                ? { color: "var(--error)", background: "var(--error-soft)" }
                : { color: "var(--gain)" }
            }
          >
            {dividendJudgementLabel[di.judgement]}
          </span>
        </div>

        <p className="text-[12px] mt-3" style={{ color: "var(--text-faint)" }}>
          실제 종합소득세액은 계산하지 않아요. 이 앱은 예적금 이자소득을 추적하지 않아 실제 금융소득이
          더 클 수 있어요. 배당 {di.dividendCount}건 기준이에요.
        </p>
      </div>
    </div>
  );
}
