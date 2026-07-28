// app/login/page.tsx — 로그인/회원가입 화면 (M12: DevTokenGate 대체, 이후 세션: 디자인 리뉴얼 + 회원가입 필드 확장)
"use client";

import { useState } from "react";
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

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.86 1.93 5.37 4.82 6.77-.21.78-.76 2.84-.87 3.28-.14.55.2.55.42.4.17-.12 2.7-1.83 3.8-2.58.59.08 1.2.13 1.83.13 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z" />
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

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [phone, setPhone] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetPhoneVerification() {
    setCodeSent(false);
    setDevCode(null);
    setCode("");
    setPhoneVerified(false);
    setPhoneError(null);
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
    } catch (e) {
      setPhoneError(e instanceof ApiError ? e.message : "인증번호 발송에 실패했어요.");
    } finally {
      setPhoneSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length === 0) return;
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
        nickname.trim().length > 0 &&
        birthDate.length > 0 &&
        gender !== null &&
        phoneVerified)) &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, nickname, name, birthDate, gender, phone };
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className={inputClass}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (8자 이상)"
                className={inputClass}
                autoComplete="new-password"
              />
              <div>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 확인"
                  className={inputClass}
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
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 (20자 이내)"
                maxLength={20}
                className={inputClass}
                autoComplete="nickname"
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
                    {codeSent ? "재발송" : "인증번호 발송"}
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      placeholder="인증번호 6자리"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={code.length === 0 || phoneSubmitting}
                      className="shrink-0 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]
                        transition-all hover:bg-[var(--surface-pressed)] disabled:opacity-40"
                    >
                      확인
                    </button>
                  </div>
                </>
              )}

              {phoneError && (
                <p className="text-xs text-[var(--error)] ml-1">{phoneError}</p>
              )}
            </div>
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
            setError(null);
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
