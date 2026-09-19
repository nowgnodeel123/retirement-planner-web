// Ui.tsx — 위저드 공용 UI 컴포넌트
// WHY: 입력 검증(음수/문자/앞자리 0)과 스타일을 입력창마다 반복하면
//      반드시 한 곳이 누락된다. NumberInput 하나로 모든 숫자 입력을 통일한다.
//
// 다크모드: neutral-*/blue-*/red-* 같은 Tailwind 고정 색상 대신
// globals.css의 디자인 토큰(--surface, --border, --text-* 등)만 사용한다.
// Tailwind 임의값 문법(`bg-[var(--surface)]`)으로 참조해서 hover/focus/placeholder
// 의사 클래스까지 그대로 살리면서 라이트/다크 전환이 자동으로 따라오게 한다.
import React, { useState } from "react";

// min-h-[44px]를 명시하는 이유: 예전엔 py-3.5(14px)가 우연히 높이를 44px로 맞춰주고
// 있었다. 간격을 4의 배수로 정리하면서 그 우연이 깨졌고, 패딩 값을 바꿀 때마다
// 터치영역이 조용히 44px 밑으로 내려갈 수 있다는 게 드러났다.
// 최소 높이를 직접 적어두면 패딩과 무관하게 보장된다.
export const inputClass =
  "w-full rounded-[var(--r-control)] border px-3 py-3 min-h-[48px] fs-input tappable " +
  "border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] " +
  "placeholder:text-[var(--text-faint)] " +
  "focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] " +
  "hover:border-[var(--text-faint)]";

export const smallInputClass =
  "w-full rounded-[var(--r-chip)] border px-2 py-2 min-h-[48px] fs-input tappable " +
  "border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] " +
  "placeholder:text-[var(--text-faint)] " +
  "focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] " +
  "hover:border-[var(--text-faint)]";

/**
 * 문자열을 안전한 숫자 문자열로 정리한다.
 * - 숫자 이외 문자 제거 (마이너스, 문자, e/E, 콤마 전부 차단)
 * - allowDecimal이면 소수점 1개만 허용
 * - 앞자리 0 제거: "01" → "1" (단 "0", "0.5"는 유지)
 * - maxDigits는 정수부 자릿수 제한 (비현실적 값으로 차트가 깨지는 것 방지)
 * - decimalPlaces는 소수부 자릿수 제한. 금액·환율은 2자리면 되지만 코인 수량처럼
 *   더 잘게 쪼개지는 값이 있어 호출부가 정한다.
 */
function sanitizeNumeric(
  raw: string,
  allowDecimal: boolean,
  maxDigits: number,
  decimalPlaces: number,
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
    ? `${cappedInt}.${decPart.slice(0, decimalPlaces)}`
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
  decimalPlaces = 2,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  allowDecimal?: boolean;
  small?: boolean;
  ariaLabel?: string;
  maxDigits?: number;
  /** 소수부 최대 자릿수. 기본 2(금액·환율 기준). allowDecimal일 때만 의미가 있다. */
  decimalPlaces?: number;
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
          decimalPlaces,
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
    <div className="max-w-[420px] mx-auto bg-[var(--surface)] rounded-3xl p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] border border-[var(--border)]">
      {children}
    </div>
  );
}

/** 입력 필드 묶음을 감싸는 섹션 카드. 옅은 배경으로 카드 배경과 구분한다. */
export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface-pressed)]/70 rounded-2xl border border-[var(--border)] p-5 mb-5">
      {children}
    </div>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5">
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
      <p className="fs-caption text-[var(--text-faint)] mt-2 text-right font-medium">
        {step + 1} / {total} 단계
      </p>
    </div>
  );
}

export function Field({
  label,
  unit,
  badge,
  children,
}: {
  label: string;
  unit: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="fs-title text-[var(--text-sub)] font-medium">
        {label}
      </label>
      {badge}
      <div className="flex items-center gap-2 mt-2">
        {children}
        {/* 단위 폭을 고정한다 — 안 그러면 "세"(1글자)와 "만원"(2글자)의 폭 차이가 그대로
            입력창 폭 차이로 밀려나, 세로로 쌓인 필드들의 오른쪽 끝이 12px씩 어긋난다.
            가장 넓은 단위(만원) 기준. */}
        <span className="fs-title text-[var(--text-faint)] whitespace-nowrap min-w-[1.75rem]">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function SmallField({
  label,
  unit,
  badge,
  children,
}: {
  label: string;
  unit: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="fs-body text-[var(--text-sub)] font-medium">
        {label}
      </label>
      {badge}
      <div className="flex items-center gap-2 mt-1">
        {children}
        {/* Field와 같은 이유로 폭 고정(위 주석 참조). 이쪽은 fs-body라 기준값이 작다. */}
        <span className="fs-body text-[var(--text-faint)] whitespace-nowrap min-w-[1.5rem]">
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * D-218: 이 입력값이 사용자가 친 게 아니라 포트폴리오에서 자동으로 채워졌음을 알리는 배지.
 * WHY 굳이 표시하는가: 값이 말없이 들어차 있으면 사용자는 그게 어디서 온 숫자인지 모른 채
 * 그냥 넘어간다. 출처를 밝혀야 "내 계좌 기준이구나"를 이해하고, 틀렸을 때 고칠 생각을 한다.
 */
export function PrefillBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-2 align-middle rounded-full bg-[var(--accent-soft)] px-2 py-1 fs-caption font-medium text-[var(--accent)]">
      <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 012 0v9.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V2z" />
        <path d="M3 15a1 1 0 112 0v1h10v-1a1 1 0 112 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1z" />
      </svg>
      불러옴
    </span>
  );
}

/**
 * D-218: 프리필이 실제 자산보다 적게 잡혔을 수 있다는 경고.
 * 대시보드는 시세 미조회 자산을 조용히 빼도 되지만(총자산이 조금 작게 보일 뿐),
 * 시뮬레이터에서는 그게 곧 "은퇴 나이가 실제보다 늦게 나오는 틀린 답"이 된다.
 * 그래서 여기서만은 degrade를 반드시 눈에 보이게 만든다.
 */
export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-4 py-3 mb-4">
      <svg
        className="w-4 h-4 text-[var(--warning)] mt-1 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <p className="fs-body text-[var(--warning)] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/**
 * 경고가 아닌 중립 안내(예: "지난번 입력을 불러왔어요").
 *
 * WHY NoticeBanner를 그대로 쓰지 않는가: 그건 호박색 경고 배너이고, globals.css에서
 * --warning은 "시세 조회 실패처럼 값이 실제와 다를 수 있다"는 신호 전용으로 정해둔
 * 토큰이다. 값이 채워졌다는 사실을 그 색으로 알리면 사용자는 뭔가 잘못됐다고 읽는다.
 * 같은 배너 형태를 쓰되 색과 아이콘만 액센트 계열 정보 톤으로 바꾼다.
 */
export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-4 py-3 mb-4">
      <svg
        className="w-4 h-4 text-[var(--accent)] mt-1 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <p className="fs-body text-[var(--accent)] leading-relaxed">{children}</p>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="fs-body text-[var(--text-faint)] leading-relaxed">
      {children}
    </p>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  className = "",
  type = "button",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      // min-h를 44 → 52로 올렸다. 44px은 "닿을 수 있는" 최소치(WCAG AAA)지
      // "편한" 크기가 아니다. 화면의 주 동작(다음/저장/등록)은 한 화면에 하나뿐이라
      // 키워도 밀리는 게 없고, 움직이는 버스에서 한 손으로 누르는 상황이 기준이다.
      // 그림자는 옛 강조색(파랑)이 하드코딩돼 있어 청록 버튼 아래 파란 빛이 번졌다.
      // --shadow-accent는 --accent에서 파생되므로 강조색을 바꿔도 따라온다.
      className={`relative rounded-[var(--r-button)] bg-[var(--accent)] text-[var(--on-accent)] py-3 min-h-[52px] fs-title font-semibold
        shadow-[var(--shadow-accent)]
        tappable
        hover:brightness-110 active:brightness-95
        disabled:shadow-none ${className}`}
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
      // 주 버튼과 나란히 서는 자리라 높이를 같이 맞춘다 — 1~2px만 어긋나도
      // 두 버튼이 한 줄에 있을 때 바로 눈에 띈다.
      className={`rounded-[var(--r-button)] border border-[var(--border)] bg-[var(--surface)] py-3 min-h-[52px] fs-title font-medium text-[var(--text)]
        tappable hover:bg-[var(--surface-pressed)] hover:border-[var(--text-faint)] ${className}`}
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
/**
 * onRetry를 주면 배너 안에 "다시 시도" 버튼이 붙는다.
 *
 * WHY: 복구 테스트(백엔드를 죽이고 화면을 확인)에서, 에러 문구는 뜨는데 사용자가
 * 할 수 있는 게 새로고침밖에 없다는 걸 발견했다. 통신 실패는 대부분 일시적이라
 * 그 자리에서 한 번 더 시도할 경로가 있어야 한다 — 새로고침은 스크롤 위치와
 * 화면 상태를 통째로 날린다.
 */
export function ErrorBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[var(--error)]/25 bg-[var(--error-soft)] px-4 py-3 mb-3">
      <svg
        className="w-4 h-4 text-[var(--error)] mt-1 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="fs-title text-[var(--error)] leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-2 min-h-[44px] px-3 -ml-3 fs-body font-semibold text-[var(--error)] underline underline-offset-2 disabled:opacity-60"
          >
            {retrying ? "다시 시도하는 중…" : "다시 시도"}
          </button>
        )}
      </div>
    </div>
  );
}
