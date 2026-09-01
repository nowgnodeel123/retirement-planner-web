// WhatIfSlider.tsx
// WHY: 결과 화면이 "몇 살에 은퇴 가능한지" 답은 주지만 "그래서 뭘 바꾸면 나아지는지"는
// 안 보여주고 있었다. 주식/ETF 월 적립액을 슬라이더로 늘려보면서 은퇴 나이가 실시간으로
// 얼마나 당겨지는지 보여주는 what-if 인터랙션 — 계산은 기존 시뮬레이션 엔드포인트를
// 그대로 재사용(완전 무상태 원칙 D-116 유지, 결과를 저장하지 않고 미리보기만 표시).
"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { SimulationRequestPayload, SimulationResponseDto } from "./types";

// WHY(칩으로 교체): 연속 드래그 슬라이더는 "굳이 드래그까지 해야 하나" 싶은
// 마찰이 있고, 실제로는 몇 개 금액대만 눌러보는 용도라 프리셋 칩이 더 가볍다
// — 탭 한 번으로 바로 결과가 나온다(실사용 피드백 반영).
const PRESETS = [10, 30, 50, 100]; // 만원
const DEBOUNCE_MS = 350;

export default function WhatIfSlider({
  basePayload,
  baseRetirementAge,
  baseFeasible,
}: {
  basePayload: SimulationRequestPayload;
  baseRetirementAge: number;
  baseFeasible: boolean;
}) {
  const [extra, setExtra] = useState(0);
  const [previewAge, setPreviewAge] = useState<number | null>(null);
  const [previewFeasible, setPreviewFeasible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // extra가 0이면 미리보기 자체가 없다. 여기서 상태를 되돌리는 대신
    // 아래 렌더에서 파생시켜 이펙트발 추가 렌더를 없앤다.
    if (extra === 0) return;

    // 재계산 요청 시작을 알리는 플래그. 파생시킬 수 있는 값이 아니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFailed(false);
    debounceRef.current = setTimeout(() => {
      const payload: SimulationRequestPayload = {
        ...basePayload,
        monthlyStockInvestment: basePayload.monthlyStockInvestment + extra,
      };
      api
        .post<SimulationResponseDto>("/api/v1/simulation/calculate", payload)
        .then((data) => {
          setPreviewAge(data.summary.estimatedRetirementAge);
          setPreviewFeasible(data.summary.feasible);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [extra, basePayload]);

  const delta =
    extra > 0 && previewAge !== null && baseFeasible && previewFeasible
      ? baseRetirementAge - previewAge
      : 0;

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

      <div className="flex gap-1.5" role="group" aria-label="월 추가 투자액 선택">
        {PRESETS.map((p) => {
          const selected = extra === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setExtra(selected ? 0 : p)}
              className="flex-1 rounded-xl py-2 fs-body font-semibold border transition-colors"
              style={
                selected
                  ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                  : { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-sub)" }
              }
            >
              +{p}만원
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="fs-body" style={{ color: "var(--text-sub)" }}>
          매달{" "}
          <strong style={{ color: "var(--text-strong)" }}>{extra}만원</strong>{" "}
          더 투자하면
        </p>

        <div className="text-right">
          {/* WHY: baseRetirementAge는 infeasible이면 실제 은퇴 나이가 아니라 탐색
              상한(참고용)이라, 그대로 굵게 보여주면 확정 답처럼 읽힌다. */}
          {extra === 0 && baseFeasible && (
            <p
              className="text-lg font-bold"
              style={{ color: "var(--text-strong)" }}
            >
              {baseRetirementAge}세
            </p>
          )}
          {extra === 0 && !baseFeasible && (
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              아직 부족해요
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
          {/* WHY: 미리보기도 infeasible(상한 참고값)일 수 있어 previewFeasible을
              함께 확인한다 — 그렇지 않으면 "여전히 부족한" 시나리오에도 특정
              나이를 확정 답처럼 보여주게 된다. */}
          {extra > 0 && !loading && !failed && previewAge !== null && !previewFeasible && (
            <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              여전히 부족해요
            </p>
          )}
          {extra > 0 && !loading && !failed && previewAge !== null && previewFeasible && (
            <>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                {previewAge}세
              </p>
              <p
                className="fs-caption"
                style={{
                  color:
                    !baseFeasible || delta > 0 ? "var(--gain)" : "var(--text-faint)",
                }}
              >
                {!baseFeasible
                  ? "목표를 채울 수 있어요"
                  : delta > 0
                    ? `${delta}년 앞당겨져요`
                    : "변화 없어요"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
