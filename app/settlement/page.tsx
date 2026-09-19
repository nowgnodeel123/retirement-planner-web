// app/settlement/page.tsx — 결산 탭(수익 + 세금).
//
// M15(D-232): 수익·세금을 계좌 상세에서 이 화면으로 옮겼다. 취향의 문제가 아니라
// 정확성 문제였다 — 양도소득세 기본공제 250만원과 금융소득종합과세 2천만원 기준은
// 인별 연간 한도인데, 계좌별로 계산하면 공제를 계좌 수만큼 중복해서 잡고(세금을 실제보다
// 적게 추정) 배당도 계좌마다 따로 판정해 합계가 기준을 넘는 사람에게 "미달"이라고 답한다.
//
// 이름을 「결산」으로 둔 이유: 실현손익과 세금을 한 단어로 아우르고, 연말정산·결산이라는
// 이미 아는 말이라 처음 봐도 뭘 하는 화면인지 짐작이 간다. "수익 및 세금"은 하단 탭
// 라벨로 쓰기에 길어 3탭 세그먼트 폭에서 잘린다.
"use client";

import { useState } from "react";
import RequireAuth from "@/app/components/auth/RequireAuth";
import { ProfitTab } from "@/app/components/portfolio/ProfitTab";
import { TaxTab } from "@/app/components/portfolio/TaxTab";
import { SCREEN } from "@/app/components/nav/labels";

type Section = "PROFIT" | "TAX";

export default function SettlementPage() {
  const [section, setSection] = useState<Section>("PROFIT");

  const sections: { key: Section; label: string }[] = [
    { key: "PROFIT", label: "수익" },
    { key: "TAX", label: "세금" },
  ];

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RequireAuth>
        <div className="max-w-[420px] w-full mx-auto px-5 pt-7">
          <h1
            className="fs-metric font-bold"
            style={{
              color: "var(--text-strong)",
              marginBottom: "var(--rhythm-section)",
            }}
          >
            {SCREEN.settlement}
          </h1>

          {/* 수익/세금은 성격이 달라 한 화면에 세로로 쌓으면 스크롤이 길어지고 무엇을 보는
              중인지 흐려진다. 계좌 상세에서 쓰던 밑줄 탭 패턴을 그대로 가져와 학습 비용을 줄인다. */}
          <div
            className="flex mb-5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                // min-h-[44px]: 이 화면의 최상위 전환 장치인데 36px이었다.
                // 가장 자주 누르는 것일수록 크기가 넉넉해야 한다.
                className="flex-1 text-center py-2 min-h-[44px] fs-body font-semibold relative tappable"
                style={{
                  color:
                    section === s.key ? "var(--text-strong)" : "var(--text-faint)",
                }}
              >
                {s.label}
                {section === s.key && (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-[2px]"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {section === "PROFIT" ? <ProfitTab /> : <TaxTab />}
        </div>
      </RequireAuth>
    </main>
  );
}
