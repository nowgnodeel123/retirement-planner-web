// WhatIfSlider.tsx
// WHY: 결과 화면이 "몇 살에 은퇴 가능한지" 답은 주지만 "그래서 뭘 바꾸면 나아지는지"는
// 안 보여주고 있었다. 주식/ETF 월 적립액을 슬라이더로 늘려보면서 은퇴 나이가 실시간으로
// 얼마나 당겨지는지 보여주는 what-if 인터랙션 — 계산은 기존 시뮬레이션 엔드포인트를
// 그대로 재사용(완전 무상태 원칙 D-116 유지, 결과를 저장하지 않고 미리보기만 표시).
"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { SimulationRequestPayload, SimulationResponseDto } from "./types";

const MAX_EXTRA = 100; // 만원
const STEP = 5;
const DEBOUNCE_MS = 350;

export default function WhatIfSlider({
  basePayload,
  baseRetirementAge,
}: {
  basePayload: SimulationRequestPayload;
  baseRetirementAge: number;
}) {
  const [extra, setExtra] = useState(0);
  const [previewAge, setPreviewAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (extra === 0) {
      setPreviewAge(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    debounceRef.current = setTimeout(() => {
      const payload: SimulationRequestPayload = {
        ...basePayload,
        monthlyStockInvestment: basePayload.monthlyStockInvestment + extra,
      };
      api
        .post<SimulationResponseDto>("/api/v1/simulation/calculate", payload)
        .then((data) => setPreviewAge(data.summary.estimatedRetirementAge))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [extra, basePayload]);

  const delta =
    previewAge !== null ? baseRetirementAge - previewAge : 0;

  return (
    <div
      className="rounded-2xl border p-4 mb-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p
        className="text-xs font-semibold tracking-wide mb-3"
        style={{ color: "var(--text-faint)" }}
      >
        매달 주식·ETF에 더 투자하면?
      </p>

      <input
        type="range"
        min={0}
        max={MAX_EXTRA}
        step={STEP}
        value={extra}
        onChange={(e) => setExtra(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
        aria-label="월 추가 투자액"
      />
      <div
        className="flex justify-between text-[11px] mt-1"
        style={{ color: "var(--text-faint)" }}
      >
        <span>+0만원</span>
        <span>+{MAX_EXTRA}만원</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>
          매달{" "}
          <strong style={{ color: "var(--text-strong)" }}>{extra}만원</strong>{" "}
          더 투자하면
        </p>

        <div className="text-right">
          {extra === 0 && (
            <p
              className="text-lg font-bold"
              style={{ color: "var(--text-strong)" }}
            >
              {baseRetirementAge}세
            </p>
          )}
          {extra > 0 && loading && (
            <p className="text-lg font-bold" style={{ color: "var(--text-faint)" }}>
              계산 중…
            </p>
          )}
          {extra > 0 && !loading && failed && (
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              계산 실패, 다시 시도해주세요
            </p>
          )}
          {extra > 0 && !loading && !failed && previewAge !== null && (
            <>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                {previewAge}세
              </p>
              <p
                className="text-[11px]"
                style={{
                  color: delta > 0 ? "var(--gain)" : "var(--text-faint)",
                }}
              >
                {delta > 0 ? `${delta}년 앞당겨져요` : "변화 없어요"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
