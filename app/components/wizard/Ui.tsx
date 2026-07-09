// Ui.tsx — 위저드 공용 UI 컴포넌트
// WHY: 입력 검증(음수/문자/앞자리 0)과 스타일을 입력창마다 반복하면
//      반드시 한 곳이 누락된다. NumberInput 하나로 모든 숫자 입력을 통일한다.
import React, { useState } from "react";

export const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-base " +
  "text-neutral-800 transition-all " +
  "focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 " +
  "hover:border-neutral-300 " +
  "placeholder:text-neutral-300";

export const smallInputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2.5 text-base " +
  "text-neutral-800 transition-all " +
  "focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 " +
  "hover:border-neutral-300 " +
  "placeholder:text-neutral-300";

/**
 * 문자열을 안전한 숫자 문자열로 정리한다.
 * - 숫자 이외 문자 제거 (마이너스, 문자, e/E, 콤마 전부 차단)
 * - allowDecimal이면 소수점 1개만 허용
 * - 앞자리 0 제거: "01" → "1" (단 "0", "0.5"는 유지)
 * - 최대 자릿수 제한 (비현실적 값으로 차트가 깨지는 것 방지)
 */
function sanitizeNumeric(
  raw: string,
  allowDecimal: boolean,
  maxDigits: number,
): string {
  let s = raw.replace(/,/g, "");
  s = s.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
  if (allowDecimal) {
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    }
  }
  s = s.replace(/^0+(?=\d)/, "");
  const [intPart, decPart] = s.split(".");
  const cappedInt = intPart.slice(0, maxDigits);
  return decPart !== undefined
    ? `${cappedInt}.${decPart.slice(0, 2)}`
    : cappedInt;
}

function parseNumeric(text: string): number | "" {
  if (text === "" || text === ".") return "";
  return Number(text);
}

/** 정수 입력은 천 단위 콤마를 실시간으로 찍어 보여준다 (금융앱 표준 UX). */
function formatDisplay(text: string, allowDecimal: boolean): string {
  if (text === "" || allowDecimal) return text;
  return Number(text).toLocaleString();
}

/**
 * 숫자 전용 입력창.
 * type="text" + inputMode를 쓰는 이유: type="number"는 e, +, - 를
 * 브라우저가 허용해버리고, 모바일 브라우저마다 동작이 달라서
 * 직접 문자열을 정리하는 쪽이 모든 환경에서 일관된다.
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  allowDecimal = false,
  small = false,
  ariaLabel,
  maxDigits = 7,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  allowDecimal?: boolean;
  small?: boolean;
  ariaLabel?: string;
  maxDigits?: number;
}) {
  // WHY: "부모가 value를 바꾸면 표시 텍스트도 맞춘다"는 동기화 로직을
  // useEffect 안에서 setState로 하면 렌더→이펙트→재렌더의 이중 렌더가
  // 매번 발생한다. React 공식 문서가 권장하는 "렌더링 중 상태 조정"
  // 패턴을 쓰면 같은 렌더 사이클 안에서 처리되어 추가 렌더가 없다.
  const [text, setText] = useState(value === "" ? "" : String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value === "" ? "" : String(value));
  }

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={formatDisplay(text, allowDecimal)}
      onChange={(e) => {
        const cleaned = sanitizeNumeric(
          e.target.value,
          allowDecimal,
          maxDigits,
        );
        setText(cleaned);
        onChange(parseNumeric(cleaned));
      }}
      className={small ? smallInputClass : inputClass}
    />
  );
}

/** 위저드 전체를 감싸는 최상위 카드. 은은한 그림자로 배경과 분리한다. */
export function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[420px] mx-auto bg-white rounded-3xl p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] border border-neutral-100">
      {children}
    </div>
  );
}

/** 입력 필드 묶음을 감싸는 섹션 카드. 옅은 회색 배경으로 흰 배경과 구분한다. */
export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50/70 rounded-2xl border border-neutral-100 p-5 mb-5">
      {children}
    </div>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? "bg-blue-500" : "bg-neutral-100"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-neutral-400 mt-2 text-right font-medium">
        {step + 1} / {total} 단계
      </p>
    </div>
  );
}

export function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="text-sm text-neutral-500 font-medium">{label}</label>
      <div className="flex items-center gap-2 mt-1.5">
        {children}
        <span className="text-sm text-neutral-400 whitespace-nowrap">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function SmallField({
  label,
  unit,
  children,
}: {
  label: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-neutral-500 font-medium">{label}</label>
      <div className="flex items-center gap-1.5 mt-1">
        {children}
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-neutral-400 leading-relaxed">{children}</p>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-2xl bg-blue-500 text-white py-3.5 text-[15px] font-semibold
        shadow-[0_4px_14px_rgba(59,130,246,0.3)]
        transition-all duration-150
        hover:bg-blue-600 active:scale-[0.98] active:bg-blue-700
        disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 ${className}`}
    >
      <span className={loading ? "opacity-0" : ""}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border border-neutral-200 bg-white py-3.5 text-[15px] font-medium text-neutral-600
        transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * 검증/서버 에러를 현재 화면에서 바로 보여주는 배너.
 * WHY: 위저드 바깥에 따로 떨어져 있으면 스크롤해야 보이거나, 어느 단계
 * 에러인지 헷갈릴 수 있다. 버튼 바로 위에 둬서 화면 이동 없이 바로 인지되게 한다.
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-3">
      <svg
        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm text-red-600 leading-relaxed">{message}</p>
    </div>
  );
}
