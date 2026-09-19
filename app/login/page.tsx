// app/login/page.tsx — 로그인/회원가입/아이디·비밀번호 찾기 화면
// (M12: DevTokenGate 대체, 이후 세션: 디자인 리뉴얼 + 회원가입 필드 확장 + 계정 찾기)
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL, ApiError } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { ErrorBanner, inputClass, PrimaryButton, SecondaryButton } from "@/app/components/wizard/Ui";
import { NestMark } from "@/app/components/brand/NestMark";
import { SectionLabel } from "@/app/components/ui/Section";
import {
  BirthDateInput,
  birth8ToIso,
  isValidBirth8,
} from "@/app/components/ui/BirthDateInput";

type Mode = "login" | "signup" | "findEmail" | "resetPassword";
type Gender = "MALE" | "FEMALE";
type TokenResponse = { accessToken: string; refreshToken: string };
type SendCodeResponse = { devCode: string };
type VerifyCodeResponse = { verified: boolean };
type FindEmailResponse = { maskedEmail: string };

const CODE_TTL_MS = 5 * 60 * 1000; // 백엔드 PhoneVerificationService.CODE_TTL과 동일(5분)

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.86 1.93 5.37 4.82 6.77-.21.78-.76 2.84-.87 3.28-.14.55.2.55.42.4.17-.12 2.7-1.83 3.8-2.58.59.08 1.2.13 1.83.13 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.26a12 12 0 0 0 0 10.78l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-3.1 3.9M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function sanitizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "").slice(0, 11);
}

function GenderToggle({
  value,
  onChange,
}: {
  value: Gender | null;
  onChange: (g: Gender) => void;
}) {
  // 이전엔 버튼 두 개가 한 줄을 통째로 차지해서, 값이 둘뿐인 입력치고 폼에서 가장
  // 큰 덩어리였다. 라벨을 왼쪽에 두고 선택지를 오른쪽 세그먼트로 몰아 가로 폭만 줄인다.
  // 높이(min-h-[44px])는 그대로 둔다 — 모바일이 1차 표면이라 최소 터치영역이 우선이고,
  // 여기서 높이까지 줄이면 "컴팩트"가 아니라 누르기 어려운 버튼이 된다.
  return (
    // 세로 padding을 두지 않는다 — 안쪽 버튼(44px)이 행 높이를 결정하게 해서
    // 전체 높이가 기존(46px)과 같게 유지된다. 줄인 건 가로 폭이지 터치 높이가 아니다.
    <div
      className="flex items-center justify-between gap-3 rounded-xl border pl-3 pr-1"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="fs-body" style={{ color: "var(--text-faint)" }}>
        성별
      </span>
      <div className="flex gap-2" role="group" aria-label="성별">
        {(["MALE", "FEMALE"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            aria-pressed={value === g}
            className={`min-h-[44px] px-5 rounded-[var(--r-control)] border fs-title font-medium tappable ${
              value === g
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-sub)] hover:border-[var(--text-faint)]"
            }`}
          >
            {g === "MALE" ? "남성" : "여성"}
          </button>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  focusOnMount,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  autoFocus?: boolean;
  /** WHY: 마운트 시점엔 아직 모르고 이펙트에서 뒤늦게 결정되는 포커스(예: 기억된
   * 이메일이 있으면 비밀번호로 건너뛰기)는 autoFocus 속성으로 표현하면 서버/
   * 클라이언트 초기 렌더가 달라져 하이드레이션 경고가 난다. ref로 직접 focus()를
   * 호출해 이 값이 true로 바뀌는 순간에만 포커스를 옮긴다. */
  focusOnMount?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus();
  }, [focusOnMount]);

  function checkCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
  }

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          placeholder={placeholder}
          className={`${inputClass} pr-11`}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          // 회원가입에는 비밀번호 칸이 둘(입력/확인)이라 placeholder가 사라지면 구분이 안 된다.
          // placeholder를 그대로 접근성 이름으로 승격시킨다.
          aria-label={placeholder}
        />
        {/* 아이콘은 18px 그대로지만 누르는 영역은 44×44로 넓힌다.
            예전엔 버튼이 아이콘 크기(18×18) 그대로여서 WCAG 2.5.8(AA, 24×24)에
            한참 못 미쳤다 — 비밀번호를 잘못 쳤는지 확인하려고 누르는 버튼이라
            정확히 못 누르면 화면을 못 넘어간다. right-0인 이유: 넓힌 44px의
            가운데가 예전 아이콘 위치(오른쪽에서 21px)와 거의 겹쳐서
            보이는 모습은 그대로 유지된다. */}
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-sub)]"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {capsLockOn && !show && (
        <p className="fs-body mt-2 ml-1" style={{ color: "var(--accent)" }}>
          Caps Lock이 켜져 있어요
        </p>
      )}
    </div>
  );
}

/**
 * 휴대전화 인증 입력+발송+확인을 하나로 묶은 컴포넌트.
 * WHY: 회원가입/아이디 찾기/비밀번호 찾기 세 화면이 전부 같은 인증 절차를
 * 쓴다. 부모는 인증된 전화번호 하나(onVerified)만 받으면 되고, 발송/타이머/
 * 만료 등 내부 상태는 이 컴포넌트가 전부 캡슐화한다. 부모가 mode를 바꿔
 * key를 새로 주면 완전히 새 상태로 리마운트된다.
 */
function PhoneVerificationField({
  onVerified,
  autoFocus,
}: {
  onVerified: (phone: string | null) => void;
  autoFocus?: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!codeSent) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [codeSent]);

  const remainingMs = codeExpiresAt ? Math.max(0, codeExpiresAt - now) : 0;
  const codeExpired = codeExpiresAt !== null && remainingMs <= 0;
  const remainingLabel = `${Math.floor(remainingMs / 60000)}:${String(
    Math.floor((remainingMs % 60000) / 1000),
  ).padStart(2, "0")}`;

  function resetVerification() {
    setCodeSent(false);
    setDevCode(null);
    setCode("");
    setVerified(false);
    setError(null);
    setCodeExpiresAt(null);
    onVerified(null);
  }

  function handlePhoneChange(value: string) {
    setPhone(sanitizePhone(value));
    if (codeSent || verified) resetVerification();
  }

  async function handleSendCode() {
    if (phone.length < 10) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<SendCodeResponse>("/api/auth/phone/send-code", { phone });
      setDevCode(res.devCode);
      setCodeSent(true);
      setCode("");
      setCodeExpiresAt(Date.now() + CODE_TTL_MS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "인증번호 발송에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length === 0 || codeExpired) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<VerifyCodeResponse>("/api/auth/phone/verify-code", { phone, code });
      if (res.verified) {
        setVerified(true);
        onVerified(phone);
      } else {
        setError("인증번호가 올바르지 않아요.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "인증에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!verified) handleSendCode();
            }
          }}
          placeholder="휴대전화번호 (- 없이 숫자만)"
          className={inputClass}
          disabled={verified}
          autoFocus={autoFocus}
          aria-label="휴대전화번호"
        />
        {!verified && (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={phone.length < 10 || submitting}
            className="shrink-0 rounded-[var(--r-control)] px-4 fs-title font-medium tappable
              hover:brightness-95 disabled:opacity-40 whitespace-nowrap"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {submitting ? "발송 중..." : codeSent ? "재발송" : "인증번호 발송"}
          </button>
        )}
        {verified && (
          <span className="shrink-0 flex items-center gap-1 text-[var(--accent)] fs-title font-medium px-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            인증완료
          </span>
        )}
      </div>

      {codeSent && !verified && (
        <>
          {devCode && (
            <p className="fs-body text-[var(--text-faint)] ml-1">
              개발용 인증번호: <span className="font-semibold text-[var(--text-sub)]">{devCode}</span>
              {" "}— 실제 서비스에서는 SMS로 발송됩니다.
            </p>
          )}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVerifyCode();
                  }
                }}
                placeholder="인증번호 6자리"
                className={`${inputClass} pr-14`}
                disabled={codeExpired}
                autoFocus
              />
              <span
                className="absolute right-3.5 top-1/2 -translate-y-1/2 fs-body font-medium tabular-nums"
                style={{ color: codeExpired ? "var(--error)" : "var(--text-faint)" }}
              >
                {codeExpired ? "만료됨" : remainingLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={code.length === 0 || submitting || codeExpired}
              className="shrink-0 rounded-[var(--r-control)] px-4 fs-title font-medium tappable
                hover:brightness-95 disabled:opacity-40"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {submitting ? "확인 중..." : "확인"}
            </button>
          </div>
          {codeExpired && (
            <p className="fs-body text-[var(--error)] ml-1">인증번호가 만료됐어요. 재발송해주세요.</p>
          )}
        </>
      )}

      {error && <p className="fs-body text-[var(--error)] ml-1">{error}</p>}
    </div>
  );
}

const LAST_EMAIL_KEY = "nest_last_email";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // WHY: 토스/네이버/구글 등 대부분의 서비스가 마지막으로 로그인한 이메일을
  // 기억해뒀다가 다음 방문 때 미리 채워준다. 비밀번호는 저장하지 않는다.
  // SSR과 클라이언트가 항상 ""로 동일하게 시작해야 하이드레이션 불일치가
  // 안 생긴다 — localStorage 조회는 마운트 후 이펙트에서만 한다.
  const [email, setEmail] = useState("");
  const [hasRememberedEmail, setHasRememberedEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  // 아이디 찾기 결과 / 비밀번호 재설정 결과
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LAST_EMAIL_KEY);
    if (saved) {
      // localStorage를 렌더에서 읽으면 SSR/CSR 초기값이 어긋나 하이드레이션 경고가 난다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(saved);
      setHasRememberedEmail(true);
    }
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    const saved = next === "login" ? localStorage.getItem(LAST_EMAIL_KEY) : null;
    setEmail(saved ?? "");
    setHasRememberedEmail(!!saved);
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setBirthDate("");
    setGender(null);
    setAgreedToTerms(false);
    setVerifiedPhone(null);
    setFoundEmail(null);
    setResetDone(false);
    setError(null);
  }

  const passwordMismatch =
    mode === "signup" && passwordConfirm.length > 0 && password !== passwordConfirm;
  const resetPasswordMismatch =
    mode === "resetPassword" && passwordConfirm.length > 0 && password !== passwordConfirm;

  const canSubmit =
    mode === "login"
      ? email.trim().length > 0 && password.length > 0 && !submitting
      : mode === "signup"
        ? email.trim().length > 0 &&
          password.length >= 8 &&
          password === passwordConfirm &&
          name.trim().length > 0 &&
          isValidBirth8(birthDate) &&
          gender !== null &&
          verifiedPhone !== null &&
          agreedToTerms &&
          !submitting
        : mode === "findEmail"
          ? verifiedPhone !== null && !submitting
          : email.trim().length > 0 &&
            password.length >= 8 &&
            password === passwordConfirm &&
            verifiedPhone !== null &&
            !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        const res = await api.post<TokenResponse>("/api/auth/login", { email, password });
        setTokens(res.accessToken, res.refreshToken);
        localStorage.setItem(LAST_EMAIL_KEY, email);
        router.replace("/portfolio");
      } else if (mode === "signup") {
        // WHY(닉네임 필드 제거): 회원가입 폼에서 닉네임을 따로 받지 않고 이름을
        // 그대로 초기 닉네임으로 사용한다. 다른 닉네임을 쓰고 싶으면 가입 후
        // 마이페이지에서 바꾸면 된다.
        const res = await api.post<TokenResponse>("/api/auth/signup", {
          email, password, nickname: name, name,
          birthDate: birth8ToIso(birthDate),
          gender, phone: verifiedPhone,
        });
        setTokens(res.accessToken, res.refreshToken);
        localStorage.setItem(LAST_EMAIL_KEY, email);
        router.replace("/portfolio");
      } else if (mode === "findEmail") {
        const res = await api.post<FindEmailResponse>("/api/auth/find-email", { phone: verifiedPhone });
        setFoundEmail(res.maskedEmail);
      } else {
        await api.post<void>("/api/auth/reset-password", {
          email, phone: verifiedPhone, newPassword: password,
        });
        setResetDone(true);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "요청 처리 중 문제가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "findEmail" ? "아이디(이메일) 찾기" : mode === "resetPassword" ? "비밀번호 재설정" : null;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-5 pt-16 pb-16"
      style={{
        background:
          "radial-gradient(ellipse 640px 420px at 50% -8%, var(--accent-soft), transparent), var(--bg)",
      }}
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <NestMark size={34} />
          <p className="fs-metric font-bold tracking-tight text-[var(--text-strong)]">
            NEST
          </p>
        </div>
        <p className="fs-title text-[var(--text-faint)]">
          지금 자산으로 은퇴가 준비될지 확인해보세요.
        </p>
      </div>

      <div
        className="w-full max-w-[380px] bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)]"
        style={{ boxShadow: "var(--shadow-float)" }}
      >
        {/* 소셜 로그인은 로그인 화면에만 둔다 — 회원가입을 고른 사용자는 이메일로
            가입하겠다고 이미 정한 것이라, 그 위에 다른 가입 경로를 다시 얹으면
            폼을 채우던 흐름이 끊긴다. 카카오로 시작하려는 사용자는 로그인 화면에서
            바로 누르면 되고, 그 버튼이 곧 가입도 겸한다. */}
        {mode === "login" && (
          <>
            <div className="flex flex-col gap-2">
              {/* 구글은 자리만 잡아둔 상태다 — OAuth 클라이언트 자격(구글 클라우드
                  콘솔 발급)이 아직 없어서 누를 수 있게 해두면 실패 화면으로 간다.
                  비활성으로 두되 위치는 확정해, 자격이 생기면 href만 채우면 되게 한다. */}
              <button
                type="button"
                disabled
                aria-label="구글로 시작하기 (준비중)"
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 fs-title font-semibold
                  border border-[var(--border)] bg-[var(--surface)] text-[var(--text-faint)] cursor-not-allowed"
                style={{ opacity: 0.6 }}
              >
                <GoogleIcon />
                구글로 시작하기
                <span className="fs-body font-normal">(준비중)</span>
              </button>
              <a
                href={`${API_BASE_URL}/oauth2/authorization/kakao`}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 fs-title font-semibold
                  bg-[#FEE500] text-[#191600] tappable hover:brightness-95"
              >
                <KakaoIcon />
                카카오로 시작하기
              </a>
            </div>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="fs-body text-[var(--text-faint)]">또는</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          </>
        )}

        {title && (
          <p className="fs-metric font-bold text-[var(--text-strong)] mb-5">{title}</p>
        )}

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleFormSubmit} className="rise-in" key={mode}>
        {mode === "login" && (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className={inputClass}
              autoComplete="email"
              autoFocus
              aria-label="이메일"
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="비밀번호"
              autoComplete="current-password"
              focusOnMount={hasRememberedEmail}
            />
          </div>
        )}

        {mode === "signup" && (
          <div>
            <SectionLabel>계정 정보</SectionLabel>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className={inputClass}
                autoComplete="email"
                autoFocus
                // placeholder는 값이 들어차면 사라져서 라벨 노릇을 못 한다.
                // 비밀번호 칸·프로필 화면에서 이미 쓰는 방식으로 맞춘다.
                aria-label="이메일"
              />
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="비밀번호 (8자 이상)"
                autoComplete="new-password"
              />
              <div>
                <PasswordInput
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                />
                {passwordMismatch && (
                  <p className="fs-body text-[var(--error)] mt-2 ml-1">비밀번호가 일치하지 않아요.</p>
                )}
              </div>
            </div>

            <SectionLabel>프로필</SectionLabel>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                maxLength={50}
                className={inputClass}
                autoComplete="name"
                aria-label="이름"
              />
              <BirthDateInput
                value={birthDate}
                onChange={setBirthDate}
                className={inputClass}
              />
              <GenderToggle value={gender} onChange={setGender} />
            </div>

            <SectionLabel>본인 확인</SectionLabel>
            <PhoneVerificationField key={mode} onVerified={setVerifiedPhone} />

            {/* py-1.5인 이유: 체크박스는 16px이지만 label 아무 데나 눌러도 토글되므로
                실제 터치 대상은 이 줄 전체다. 그런데 그 줄 높이가 20~23px이라
                WCAG 2.5.8(AA, 24×24)을 아슬아슬하게 못 넘겼다. 동의는 안 하면
                가입 자체가 막히는 필수 항목이라 여기서 헛손질하면 진행이 멈춘다. */}
            <label className="flex items-start gap-2 mt-6 py-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-[var(--accent)] flex-shrink-0"
              />
              <span className="fs-body text-[var(--text-sub)] leading-relaxed">
                (필수){" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  이용약관
                </Link>{" "}
                및{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  개인정보처리방침
                </Link>
                에 동의합니다
              </span>
            </label>
          </div>
        )}

        {mode === "findEmail" && (
          <div>
            {foundEmail ? (
              <div className="text-center py-2">
                <p className="fs-title text-[var(--text-sub)] mb-2">가입하신 이메일이에요</p>
                <p className="fs-metric font-bold text-[var(--text-strong)] mb-6">{foundEmail}</p>
                <PrimaryButton onClick={() => switchMode("login")} className="w-full">
                  로그인하러 가기
                </PrimaryButton>
              </div>
            ) : (
              <>
                <p className="fs-title text-[var(--text-sub)] mb-4">
                  가입할 때 인증한 휴대전화번호로 본인 확인 후 이메일을 알려드려요.
                </p>
                <PhoneVerificationField key={mode} onVerified={setVerifiedPhone} autoFocus />
              </>
            )}
          </div>
        )}

        {mode === "resetPassword" && (
          <div>
            {resetDone ? (
              <div className="text-center py-2">
                <p className="fs-title text-[var(--text-sub)] mb-6">
                  비밀번호가 재설정됐어요. 새 비밀번호로 로그인해주세요.
                </p>
                <PrimaryButton onClick={() => switchMode("login")} className="w-full">
                  로그인하러 가기
                </PrimaryButton>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입한 이메일"
                  className={inputClass}
                  autoComplete="email"
                  autoFocus
                />
                <PhoneVerificationField key={mode} onVerified={setVerifiedPhone} />
                <div>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="새 비밀번호 (8자 이상)"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <PasswordInput
                    value={passwordConfirm}
                    onChange={setPasswordConfirm}
                    placeholder="새 비밀번호 확인"
                    autoComplete="new-password"
                  />
                  {resetPasswordMismatch && (
                    <p className="fs-body text-[var(--error)] mt-2 ml-1">비밀번호가 일치하지 않아요.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!((mode === "findEmail" && foundEmail) || (mode === "resetPassword" && resetDone)) && (
          <div className="mt-6">
            <PrimaryButton
              type="submit"
              onClick={() => {}}
              disabled={!canSubmit}
              loading={submitting}
              className="w-full"
            >
              {mode === "login"
                ? "로그인"
                : mode === "signup"
                  ? "회원가입"
                  : mode === "findEmail"
                    ? "아이디 찾기"
                    : "비밀번호 재설정"}
            </PrimaryButton>
          </div>
        )}
        </form>

        {/* 계정을 못 찾은 사람이 누르는 줄이라 가장 잘 눌려야 하는데, 글자만 있어
            높이가 21~23px로 WCAG 2.5.8(AA, 24×24)에 못 미쳤다. py로 높이를 벌리고
            gap을 줄여 두 버튼이 붙어 보이지 않게 맞춘다.

            구분자 "|"는 --border 색이라 대비가 1.22였다. 다만 이건 뜻을 담은 글자가
            아니라 두 버튼을 가르는 장식이라, 대비를 억지로 올려 눈에 띄게 만드는 대신
            실제 구분선(1px 막대)으로 바꾸고 보조기기에는 감춘다. */}
        {mode === "login" && (
          <div className="flex items-center justify-center gap-1 mt-4 fs-title text-[var(--text-faint)]">
            <button type="button" onClick={() => switchMode("findEmail")} className="px-3 min-h-[44px] rounded-[var(--r-chip)] tappable hover:text-[var(--text-sub)]">
              아이디 찾기
            </button>
            <span aria-hidden="true" className="w-px h-3 flex-shrink-0" style={{ background: "var(--border)" }} />
            <button type="button" onClick={() => switchMode("resetPassword")} className="px-3 min-h-[44px] rounded-[var(--r-chip)] tappable hover:text-[var(--text-sub)]">
              비밀번호 재설정
            </button>
          </div>
        )}

        {(mode === "login" || mode === "signup") && (
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center fs-title text-[var(--text-faint)] mt-4 min-h-[44px] rounded-[var(--r-chip)] tappable"
          >
            {mode === "login" ? (
              <>
                계정이 없으신가요? <span className="text-[var(--accent)] font-medium">회원가입</span>
              </>
            ) : (
              <>
                이미 계정이 있으신가요? <span className="text-[var(--accent)] font-medium">로그인</span>
              </>
            )}
          </button>
        )}

        {(mode === "findEmail" || mode === "resetPassword") && !(foundEmail || resetDone) && (
          <SecondaryButton onClick={() => switchMode("login")} className="w-full mt-3">
            로그인으로 돌아가기
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
