// TierEmblem.tsx — 등급을 귀엽고 모던한 광물 아이콘 + 그 아래 색깔 있는 등급 이름으로(D-201).
// 2톤 플랫: 등급색 본체 + 위쪽에 밝은 파세트 한 장. 모서리는 둥근 stroke로 통통하게.
// 이름 옆 "?"를 누르면 전체 등급표(금액대)가 뜬다 — 별도 라이브러리 없이 클릭 토글(D-111 패턴).
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Tier } from "./tier";

interface Cut {
  body: string;
  facet: string;
}

// 등급표 — 경계는 tier.ts와 동일(그 파일은 잠겨서 여기 값도 유지·동기 필요).
const TIER_TABLE: { name: string; range: string }[] = [
  { name: "언랭크", range: "1천만원 미만" },
  { name: "브론즈", range: "1천만 ~ 5천만원" },
  { name: "실버", range: "5천만 ~ 1억원" },
  { name: "골드", range: "1억 ~ 5억원" },
  { name: "플래티넘", range: "5억 ~ 10억원" },
  { name: "다이아몬드", range: "10억 ~ 30억원" },
  { name: "루비", range: "30억 ~ 50억원" },
  { name: "마스터", range: "50억원 이상" },
];

function cut(name: string): Cut {
  switch (name) {
    case "언랭크":
      return {
        body: "M10 9c4-3 10-2 12 3s0 12-6 13-11-3-11-8 1-5 5-8Z",
        facet: "M10 9c4-3 10-2 12 3-4 0-8 1-13 4 0-3 1-4.5 1-7Z",
      };
    case "브론즈":
      return { body: "M9 10 16 6l7 4v9l-7 6-7-6Z", facet: "M9 10 16 6l7 4-7 3.5Z" };
    case "실버":
      return {
        body: "M16 4c3 4 8 7 8 11s-5 9-8 13c-3-4-8-9-8-13s5-7 8-11Z",
        facet: "M16 4c3 4 8 7 8 11-3-1.5-5.5-2-8-2s-5 .5-8 2c0-4 5-7 8-11Z",
      };
    case "골드":
      return {
        body: "M12 6h8l6 6v8l-6 6h-8l-6-6v-8Z",
        facet: "M12 6h8l6 6-10 3.5L6 12Z",
      };
    case "플래티넘":
      return { body: "M16 4l8 5v14l-8 5-8-5V9Z", facet: "M16 4l8 5-8 4-8-4Z" };
    case "다이아몬드":
      return { body: "M10 7h12l5 6-11 12L5 13Z", facet: "M10 7h12l5 6H5Z" };
    case "루비":
      return {
        body: "M9 9c0-2 1-3 3-3h8c2 0 3 1 3 3v8c0 2-1 3-3 3h-8c-2 0-3-1-3-3Z",
        facet: "M9 9c0-2 1-3 3-3h8c2 0 3 1 3 3l-7 4Z",
      };
    default:
      return {
        body: "M5 12l5 4 6-9 6 9 5-4-2 12H7Z",
        facet: "M5 12l5 4 6-9 6 9 5-4-1.5 7H6.5Z",
      };
  }
}

function TierGlyph({ tier, size }: { tier: Tier; size: number }) {
  const c = cut(tier.name);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d={c.body}
        fill={tier.color}
        stroke={tier.color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d={c.facet} fill="#fff" fillOpacity="0.42" />
    </svg>
  );
}

function TierHelpModal({
  currentName,
  onClose,
}: {
  currentName: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // 열려 있는 동안 배경 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // 조상 요소(rise-in 등)의 transform이 position:fixed의 기준을 가로채서 모달이
  // 화면 최상단에 안 뜨고 도넛 근처에 묻히던 문제 → document.body로 포탈해서 탈출.
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] fade-in" />
      <div
        className="relative w-full max-w-[300px] rounded-2xl p-5 pop-in shadow-[0_12px_44px_rgba(0,0,0,0.2)]"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center pressable"
          style={{ color: "var(--text-sub)", background: "var(--surface-pressed)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p
          className="text-[14px] font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          등급 안내
        </p>
        <p className="text-[11px] mt-1 mb-3" style={{ color: "var(--text-faint)" }}>
          모든 계좌 평가금액 합계 기준
        </p>
        <div className="space-y-0.5">
          {TIER_TABLE.map((t) => {
            const active = t.name === currentName;
            return (
              <div
                key={t.name}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px]"
                style={active ? { background: "var(--accent-soft)" } : undefined}
              >
                <span
                  style={{
                    color: "var(--text-strong)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {t.name}
                </span>
                <span className="amount" style={{ color: "var(--text-sub)" }}>
                  {t.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TierEmblem({ tier, size = 32 }: { tier: Tier; size?: number }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      {/* 부모(도넛 중앙)가 pointer-events-none이라 여기서 auto로 되살려 눌리게 한다. */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label={`등급 ${tier.name} · 등급 안내 보기`}
        className="pointer-events-auto flex flex-col items-center gap-1.5"
      >
        <TierGlyph tier={tier} size={size} />
        <span className="flex items-center gap-1 leading-none">
          <span className="text-[11px] font-bold" style={{ color: tier.color }}>
            {tier.name}
          </span>
          <span
            className="flex items-center justify-center rounded-full text-[9px] font-bold leading-none"
            style={{
              width: 13,
              height: 13,
              color: "var(--text-sub)",
              background: "var(--surface-pressed)",
            }}
            aria-hidden="true"
          >
            ?
          </span>
        </span>
      </button>

      {helpOpen && (
        <TierHelpModal
          currentName={tier.name}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </>
  );
}
