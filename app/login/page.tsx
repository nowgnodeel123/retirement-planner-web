// app/login/page.tsx — 로그인/회원가입/아이디·비밀번호 찾기 화면
// (M12: DevTokenGate 대체, 이후 세션: 디자인 리뉴얼 + 회원가입 필드 확장 + 계정 찾기)
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { ErrorBanner, inputClass, PrimaryButton, SecondaryButton } from "@/app/components/wizard/Ui";

type Mode = "login" | "signup" | "findEmail" | "resetPassword";
type Gender = "MALE" | "FEMALE";
type TokenResponse = { accessToken: string };
type SendCodeResponse = { devCode: string };
type VerifyCodeResponse = { verified: boolean };
type FindEmailResponse = { maskedEmail: string };

const TODAY = new Date().toISOString().slice(0, 10);
const CODE_TTL_MS = 5 * 60 * 1000; // 백엔드 PhoneVerificationService.CODE_TTL과 동일(5분)

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.86 1.93 5.37 4.82 6.77-.21.78-.76 2.84-.87 3.28-.14.55.2.55.42.4.17-.12 2.7-1.83 3.8-2.58.59.08 1.2.13 1.83.13 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z" />
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--text-faint)] tracking-wide mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function GenderToggle({
  value,
  onChange,
}: {
  value: Gender | null;
  onChange: (g: Gender) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["MALE", "FEMALE"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`rounded-xl border py-3 text-sm font-medium transition-all ${
            value === g
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-sub)] hover:border-[var(--text-faint)]"
          }`}
        >
          {g === "MALE" ? "남성" : "여성"}
        </button>
      ))}
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
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-sub)]"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {capsLockOn && !show && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "var(--accent)" }}>
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
        />
        {!verified && (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={phone.length < 10 || submitting}
            className="shrink-0 rounded-xl px-4 text-sm font-medium transition-all
              hover:brightness-95 disabled:opacity-40 whitespace-nowrap"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {submitting ? "발송 중..." : codeSent ? "재발송" : "인증번호 발송"}
          </button>
        )}
        {verified && (
          <span className="shrink-0 flex items-center gap-1 text-[var(--accent)] text-sm font-medium px-2">
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
            <p className="text-xs text-[var(--text-faint)] ml-1">
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums"
                style={{ color: codeExpired ? "var(--error)" : "var(--text-faint)" }}
              >
                {codeExpired ? "만료됨" : remainingLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={code.length === 0 || submitting || codeExpired}
              className="shrink-0 rounded-xl px-4 text-sm font-medium transition-all
                hover:brightness-95 disabled:opacity-40"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {submitting ? "확인 중..." : "확인"}
            </button>
          </div>
          {codeExpired && (
            <p className="text-xs text-[var(--error)] ml-1">인증번호가 만료됐어요. 재발송해주세요.</p>
          )}
        </>
      )}

      {error && <p className="text-xs text-[var(--error)] ml-1">{error}</p>}
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
          birthDate.length > 0 &&
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
        setToken(res.accessToken);
        localStorage.setItem(LAST_EMAIL_KEY, email);
        router.replace("/portfolio");
      } else if (mode === "signup") {
        // WHY(닉네임 필드 제거): 회원가입 폼에서 닉네임을 따로 받지 않고 이름을
        // 그대로 초기 닉네임으로 사용한다. 다른 닉네임을 쓰고 싶으면 가입 후
        // 마이페이지에서 바꾸면 된다.
        const res = await api.post<TokenResponse>("/api/auth/signup", {
          email, password, nickname: name, name, birthDate, gender, phone: verifiedPhone,
        });
        setToken(res.accessToken);
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
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-[15px] font-extrabold"
            style={{ background: "linear-gradient(155deg, var(--accent), #1b64da)" }}
          >
            N
          </div>
          <p className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
            NEST
          </p>
        </div>
        <p className="text-sm text-[var(--text-faint)]">
          지금 자산으로 은퇴가 준비될지 확인해보세요.
        </p>
      </div>

      <div
        className="w-full max-w-[380px] bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)]"
        style={{ boxShadow: "0 8px 32px rgba(49,130,246,0.10)" }}
      >
        {(mode === "login" || mode === "signup") && (
          <>
            <a
              href={`${API_BASE_URL}/oauth2/authorization/kakao`}
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-[15px] font-semibold
                bg-[#FEE500] text-[#191600] transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
            >
              <KakaoIcon />
              카카오로 시작하기
            </a>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-faint)]">또는</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          </>
        )}

        {title && (
          <p className="text-lg font-bold text-[var(--text-strong)] mb-5">{title}</p>
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
                  <p className="text-xs text-[var(--error)] mt-1.5 ml-1">비밀번호가 일치하지 않아요.</p>
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
              />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={TODAY}
                className={inputClass}
                aria-label="생년월일"
              />
              <GenderToggle value={gender} onChange={setGender} />
            </div>

            <SectionLabel>본인 확인</SectionLabel>
            <PhoneVerificationField key={mode} onVerified={setVerifiedPhone} />

            <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--accent)] flex-shrink-0"
              />
              <span className="text-[13px] text-[var(--text-sub)] leading-relaxed">
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
                <p className="text-sm text-[var(--text-sub)] mb-2">가입하신 이메일이에요</p>
                <p className="text-lg font-bold text-[var(--text-strong)] mb-6">{foundEmail}</p>
                <PrimaryButton onClick={() => switchMode("login")} className="w-full">
                  로그인하러 가기
                </PrimaryButton>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--text-sub)] mb-4">
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
                <p className="text-sm text-[var(--text-sub)] mb-6">
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
                    <p className="text-xs text-[var(--error)] mt-1.5 ml-1">비밀번호가 일치하지 않아요.</p>
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

        {mode === "login" && (
          <div className="flex items-center justify-center gap-3 mt-4 text-sm text-[var(--text-faint)]">
            <button type="button" onClick={() => switchMode("findEmail")} className="hover:text-[var(--text-sub)]">
              아이디 찾기
            </button>
            <span className="text-[var(--border)]">|</span>
            <button type="button" onClick={() => switchMode("resetPassword")} className="hover:text-[var(--text-sub)]">
              비밀번호 재설정
            </button>
          </div>
        )}

        {(mode === "login" || mode === "signup") && (
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-sm text-[var(--text-faint)] mt-4"
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
