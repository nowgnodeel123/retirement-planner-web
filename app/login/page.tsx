// app/login/page.tsx — 로그인/회원가입 화면 (M12: DevTokenGate 대체, 이후 세션: 디자인 리뉴얼 + 회원가입 필드 확장)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { ErrorBanner, inputClass, PrimaryButton } from "@/app/components/wizard/Ui";

type Mode = "login" | "signup";
type Gender = "MALE" | "FEMALE";
type TokenResponse = { accessToken: string };
type SendCodeResponse = { devCode: string };
type VerifyCodeResponse = { verified: boolean };

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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pr-11`}
        autoComplete={autoComplete}
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
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // WHY: 인증번호 유효시간(5분)이 얼마나 남았는지 보여줘야 "왜 인증이 안 되지"
  // 라는 의문 없이 재발송을 유도할 수 있다. 백엔드 PhoneVerificationService의
  // TTL과 같은 값(CODE_TTL_MS)을 프론트에서 그대로 표시용으로 사용한다.
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

  function resetPhoneVerification() {
    setCodeSent(false);
    setDevCode(null);
    setCode("");
    setPhoneVerified(false);
    setPhoneError(null);
    setCodeExpiresAt(null);
  }

  // WHY(모드 전환 시 초기화): 로그인에 쓰던 값이 회원가입 쪽에 그대로 남아있으면
  // "이거 왜 안 지워지지"라는 혼란을 준다. 모드를 바꿀 땐 완전히 새 폼으로
  // 시작한다.
  function resetForm() {
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setBirthDate("");
    setGender(null);
    setPhone("");
    setAgreedToTerms(false);
    setError(null);
    resetPhoneVerification();
  }

  function handlePhoneChange(value: string) {
    setPhone(sanitizePhone(value));
    if (codeSent || phoneVerified) resetPhoneVerification();
  }

  async function handleSendCode() {
    if (phone.length < 10) return;
    setPhoneSubmitting(true);
    setPhoneError(null);
    try {
      const res = await api.post<SendCodeResponse>("/api/auth/phone/send-code", { phone });
      setDevCode(res.devCode);
      setCodeSent(true);
      setCode("");
      setCodeExpiresAt(Date.now() + CODE_TTL_MS);
    } catch (e) {
      setPhoneError(e instanceof ApiError ? e.message : "인증번호 발송에 실패했어요.");
    } finally {
      setPhoneSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length === 0 || codeExpired) return;
    setPhoneSubmitting(true);
    setPhoneError(null);
    try {
      const res = await api.post<VerifyCodeResponse>("/api/auth/phone/verify-code", { phone, code });
      if (res.verified) {
        setPhoneVerified(true);
      } else {
        setPhoneError("인증번호가 올바르지 않아요.");
      }
    } catch (e) {
      setPhoneError(e instanceof ApiError ? e.message : "인증에 실패했어요.");
    } finally {
      setPhoneSubmitting(false);
    }
  }

  const passwordMismatch =
    mode === "signup" && passwordConfirm.length > 0 && password !== passwordConfirm;

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === "login" ||
      (password.length >= 8 &&
        password === passwordConfirm &&
        name.trim().length > 0 &&
        birthDate.length > 0 &&
        gender !== null &&
        phoneVerified &&
        agreedToTerms)) &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      // WHY(닉네임 필드 제거): 회원가입 폼에서 닉네임을 따로 받지 않고 이름을
      // 그대로 초기 닉네임으로 사용한다. 다른 닉네임을 쓰고 싶으면 가입 후
      // 마이페이지에서 바꾸면 된다 — 폼 필드 하나를 줄이는 게 더 중요하다고 판단.
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, nickname: name, name, birthDate, gender, phone };
      const res = await api.post<TokenResponse>(path, body);
      setToken(res.accessToken);
      router.replace("/portfolio");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "요청 처리 중 문제가 발생했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-16 pb-16">
      <div className="text-center mb-8">
        <p className="text-2xl font-bold tracking-tight text-[var(--text-strong)] mb-1.5">
          NEST
        </p>
        <p className="text-sm text-[var(--text-faint)]">
          지금 자산으로 은퇴가 준비될지 확인해보세요.
        </p>
      </div>

      <div className="w-full max-w-[380px] bg-[var(--surface)] rounded-3xl p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] border border-[var(--border)]">
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

        {error && <ErrorBanner message={error} />}

        {mode === "login" ? (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className={inputClass}
              autoComplete="email"
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </div>
        ) : (
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
                  <p className="text-xs text-[var(--error)] mt-1.5 ml-1">
                    비밀번호가 일치하지 않아요.
                  </p>
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="휴대전화번호 (- 없이 숫자만)"
                  className={inputClass}
                  disabled={phoneVerified}
                />
                {!phoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={phone.length < 10 || phoneSubmitting}
                    className="shrink-0 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]
                      transition-all hover:bg-[var(--surface-pressed)] disabled:opacity-40 whitespace-nowrap"
                  >
                    {phoneSubmitting
                      ? "발송 중..."
                      : codeSent
                        ? "재발송"
                        : "인증번호 발송"}
                  </button>
                )}
                {phoneVerified && (
                  <span className="shrink-0 flex items-center gap-1 text-[var(--accent)] text-sm font-medium px-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M4 10.5l3.5 3.5L16 6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    인증완료
                  </span>
                )}
              </div>

              {codeSent && !phoneVerified && (
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
                        placeholder="인증번호 6자리"
                        className={`${inputClass} pr-14`}
                        disabled={codeExpired}
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
                      disabled={code.length === 0 || phoneSubmitting || codeExpired}
                      className="shrink-0 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]
                        transition-all hover:bg-[var(--surface-pressed)] disabled:opacity-40"
                    >
                      {phoneSubmitting ? "확인 중..." : "확인"}
                    </button>
                  </div>
                  {codeExpired && (
                    <p className="text-xs text-[var(--error)] ml-1">
                      인증번호가 만료됐어요. 재발송해주세요.
                    </p>
                  )}
                </>
              )}

              {phoneError && (
                <p className="text-xs text-[var(--error)] ml-1">{phoneError}</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--accent)] flex-shrink-0"
              />
              <span className="text-[13px] text-[var(--text-sub)] leading-relaxed">
                (필수) 이용약관 및 개인정보처리방침에 동의합니다
              </span>
            </label>
          </div>
        )}

        <div className="mt-6">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            className="w-full"
          >
            {mode === "login" ? "로그인" : "회원가입"}
          </PrimaryButton>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            resetForm();
          }}
          className="w-full text-center text-sm text-[var(--text-faint)] mt-4"
        >
          {mode === "login" ? (
            <>
              계정이 없으신가요?{" "}
              <span className="text-[var(--accent)] font-medium">
                회원가입
              </span>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <span className="text-[var(--accent)] font-medium">
                로그인
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
