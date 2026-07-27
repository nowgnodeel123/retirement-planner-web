// app/login/page.tsx — 로그인/회원가입 화면 (M12: DevTokenGate 대체)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import {
  ErrorBanner,
  inputClass,
  PrimaryButton,
  WizardCard,
} from "@/app/components/wizard/Ui";

type Mode = "login" | "signup";
type TokenResponse = { accessToken: string };

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === "login" || nickname.trim().length > 0) &&
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
          : { email, password, nickname };
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
    <div className="max-w-[420px] mx-auto px-5 pt-16">
      <p className="text-xl font-bold text-[var(--text-strong)] mb-1">
        네스트
      </p>
      <p className="text-sm text-[var(--text-faint)] mb-6">
        지금 자산으로 은퇴가 준비될지 확인해보세요.
      </p>

      <WizardCard>
        <a
          href={`${API_BASE_URL}/oauth2/authorization/kakao`}
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-[15px] font-semibold
            bg-[#FEE500] text-[#191600] transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
        >
          카카오로 시작하기
        </a>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-faint)]">또는</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {error && <ErrorBanner message={error} />}

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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "signup" && (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (20자 이내)"
              maxLength={20}
              className={inputClass}
              autoComplete="nickname"
            />
          )}
        </div>

        <div className="mt-4">
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
      </WizardCard>
    </div>
  );
}
