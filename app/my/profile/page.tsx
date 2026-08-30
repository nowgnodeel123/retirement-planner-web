// app/my/profile/page.tsx — D-177: 프로필 카드를 눌러 들어오는 개인정보 수정 화면.
// 닉네임 인라인 수정은 기존 MY 탭에서 이리로 옮겨왔고, 여기에 이름/생년월일/성별/
// 휴대전화번호/비밀번호 변경까지 한데 모았다. 카카오 유저는 비밀번호가 없고
// 이 필드들을 가입 때 수집하지도 않아(D-121) 개인정보/비밀번호 섹션 자체를 숨긴다.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Avatar } from "@/app/components/profile/Avatar";
import { Toast } from "@/app/components/portfolio/Toast";
import {
  ErrorBanner,
  inputClass,
  PrimaryButton,
  SecondaryButton,
} from "@/app/components/wizard/Ui";

type Gender = "MALE" | "FEMALE";

type MeResponse = {
  id: number;
  email: string | null;
  nickname: string;
  provider: string;
  avatarId: number;
  name: string | null;
  birthDate: string | null;
  gender: Gender | null;
  phone: string | null;
};

type SendCodeResponse = { devCode: string };
type VerifyCodeResponse = { verified: boolean };

const TODAY = new Date().toISOString().slice(0, 10);
const CODE_TTL_MS = 5 * 60 * 1000; // 백엔드 PhoneVerificationService.CODE_TTL과 동일(5분)

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
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
    <p
      className="text-[12px] font-semibold px-1 mb-2 mt-6 first:mt-0"
      style={{ color: "var(--text-faint)" }}
    >
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

// login/page.tsx의 동명 컴포넌트와 거의 동일 — 재사용처가 이제 2곳이지만, 로그인
// 화면은 여러 세션에 걸쳐 다듬어온 민감한 인증 표면이라 공유 추출보다 이 화면
// 전용 로컬 사본을 두는 쪽이 회귀 위험이 낮다고 판단했다(이 레포의 기존 로컬
// 컴포넌트 관행과 동일).
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
  const [capsLockOn, setCapsLockOn] = useState(false);

  function checkCapsLock(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
  }

  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
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
      {capsLockOn && !show && (
        <p className="text-xs mt-1.5 ml-1" style={{ color: "var(--accent)" }}>
          Caps Lock이 켜져 있어요
        </p>
      )}
    </div>
  );
}

function PhoneVerificationField({
  onVerified,
}: {
  onVerified: (phone: string | null) => void;
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
          placeholder="새 휴대전화번호 (- 없이 숫자만)"
          className={inputClass}
          disabled={verified}
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

export default function ProfileEditPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 닉네임 (MY 탭에서 이리로 이동)
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [savingNickname, setSavingNickname] = useState(false);

  // 이름/생년월일/성별
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // 이메일(로그인 아이디) 변경
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // 휴대전화번호 변경
  const [changingPhone, setChangingPhone] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingPhone, setSavingPhone] = useState(false);
  // 인증 필드를 초기화하려고 key를 바꿔 강제 리마운트한다. 렌더에서 읽는 값이라 state가 맞다.
  const [phoneFieldKey, setPhoneFieldKey] = useState(0);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get<MeResponse>("/api/users/me").then((data) => {
      setMe(data);
      setNickname(data.nickname);
      setName(data.name ?? "");
      setBirthDate(data.birthDate ?? "");
      setGender(data.gender);
    });
  }, []);

  async function handleSaveNickname() {
    setSavingNickname(true);
    setNicknameError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/nickname", { nickname });
      setMe(updated);
      setEditingNickname(false);
      setToast("닉네임이 변경됐어요.");
    } catch (e) {
      setNicknameError(e instanceof ApiError ? e.message : "저장에 실패했어요.");
    } finally {
      setSavingNickname(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/profile", {
        name,
        birthDate,
        gender,
      });
      setMe(updated);
      setToast("개인정보가 변경됐어요.");
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : "저장에 실패했어요.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setEmailError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/email", {
        email: newEmail,
        currentPassword: emailPassword,
      });
      setMe(updated);
      setChangingEmail(false);
      setNewEmail("");
      setEmailPassword("");
      setToast("이메일이 변경됐어요.");
    } catch (e) {
      setEmailError(e instanceof ApiError ? e.message : "변경에 실패했어요.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePhone() {
    if (!verifiedPhone) return;
    setSavingPhone(true);
    setPhoneError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/phone", { phone: verifiedPhone });
      setMe(updated);
      setChangingPhone(false);
      setVerifiedPhone(null);
      setPhoneFieldKey((k) => k + 1);
      setToast("휴대전화번호가 변경됐어요.");
    } catch (e) {
      setPhoneError(e instanceof ApiError ? e.message : "변경에 실패했어요.");
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않아요.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch<void>("/api/users/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setToast("비밀번호가 변경됐어요.");
    } catch (e) {
      setPasswordError(e instanceof ApiError ? e.message : "변경에 실패했어요.");
    } finally {
      setSavingPassword(false);
    }
  }

  const isLocal = me?.provider === "LOCAL";

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-6 pb-10">
      <button
        onClick={() => router.push("/my")}
        className="flex items-center gap-1 text-[13px] mb-5"
        style={{ color: "var(--text-sub)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        내 정보
      </button>

      {/* 아바타 + 닉네임 */}
      <div
        className="rounded-2xl border p-4 mb-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3.5">
          {me ? (
            <Avatar avatarId={me.avatarId} size={48} />
          ) : (
            <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "var(--border)" }} />
          )}
          <div className="flex-1 min-w-0">
            {editingNickname ? (
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full rounded-lg border px-2.5 py-1.5 text-[15px]"
                style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text-strong)" }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold truncate" style={{ color: "var(--text-strong)" }}>
                  {me?.nickname ?? " "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNickname(me?.nickname ?? "");
                    setNicknameError(null);
                    setEditingNickname(true);
                  }}
                  aria-label="닉네임 수정"
                  className="flex items-center gap-1 flex-shrink-0 text-[12px] font-medium px-2 py-1 rounded-lg"
                  style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
                >
                  <PencilIcon />
                  수정
                </button>
              </div>
            )}
            {me?.email && (
              <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>
                {me.email}
              </p>
            )}
          </div>
        </div>

        {editingNickname && (
          <div className="mt-3">
            {nicknameError && (
              <div className="mb-2.5">
                <ErrorBanner message={nicknameError} />
              </div>
            )}
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setEditingNickname(false)} className="flex-1">
                취소
              </SecondaryButton>
              <PrimaryButton
                onClick={handleSaveNickname}
                loading={savingNickname}
                disabled={nickname.trim().length === 0}
                className="flex-1"
              >
                저장
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      {!isLocal && me && (
        <p className="text-[12px] px-1 mt-3 leading-relaxed" style={{ color: "var(--text-faint)" }}>
          카카오 로그인 계정이에요. 이름·생년월일·비밀번호 같은 개인정보는 카카오 계정에서 관리돼요.
        </p>
      )}

      {isLocal && (
        <>
          <SectionLabel>개인정보</SectionLabel>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
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
            {profileError && (
              <div className="mt-3">
                <ErrorBanner message={profileError} />
              </div>
            )}
            <PrimaryButton
              onClick={handleSaveProfile}
              loading={savingProfile}
              disabled={name.trim().length === 0 || birthDate.length === 0 || gender === null}
              className="w-full mt-3"
            >
              저장
            </PrimaryButton>

            <div className="h-px my-4" style={{ background: "var(--border)" }} />

            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-sub)" }}>
                이메일 (로그인 아이디)
              </span>
              {!changingEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setNewEmail(me?.email ?? "");
                    setEmailError(null);
                    setChangingEmail(true);
                  }}
                  className="text-[12px] font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  변경
                </button>
              )}
            </div>
            {!changingEmail ? (
              <p className="text-[15px] font-semibold" style={{ color: "var(--text-strong)" }}>
                {me?.email ?? "-"}
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="새 이메일"
                  className={inputClass}
                  autoComplete="email"
                />
                <PasswordInput
                  value={emailPassword}
                  onChange={setEmailPassword}
                  placeholder="현재 비밀번호로 확인"
                  autoComplete="current-password"
                />
                {emailError && <ErrorBanner message={emailError} />}
                <div className="flex gap-2">
                  <SecondaryButton
                    onClick={() => {
                      setChangingEmail(false);
                      setNewEmail("");
                      setEmailPassword("");
                      setEmailError(null);
                    }}
                    className="flex-1"
                  >
                    취소
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSaveEmail}
                    loading={savingEmail}
                    disabled={newEmail.trim().length === 0 || emailPassword.length === 0}
                    className="flex-1"
                  >
                    저장
                  </PrimaryButton>
                </div>
              </div>
            )}

            <div className="h-px my-4" style={{ background: "var(--border)" }} />

            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-sub)" }}>
                휴대전화번호
              </span>
              {!changingPhone && (
                <button
                  type="button"
                  onClick={() => setChangingPhone(true)}
                  className="text-[12px] font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  변경
                </button>
              )}
            </div>
            {!changingPhone ? (
              <p className="text-[15px] font-semibold" style={{ color: "var(--text-strong)" }}>
                {me?.phone ?? "-"}
              </p>
            ) : (
              <div className="mt-2">
                <PhoneVerificationField key={phoneFieldKey} onVerified={setVerifiedPhone} />
                {phoneError && (
                  <div className="mt-3">
                    <ErrorBanner message={phoneError} />
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <SecondaryButton
                    onClick={() => {
                      setChangingPhone(false);
                      setVerifiedPhone(null);
                      setPhoneError(null);
                      setPhoneFieldKey((k) => k + 1);
                    }}
                    className="flex-1"
                  >
                    취소
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSavePhone}
                    loading={savingPhone}
                    disabled={!verifiedPhone}
                    className="flex-1"
                  >
                    저장
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>

          <SectionLabel>비밀번호 변경</SectionLabel>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="flex flex-col gap-3">
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="현재 비밀번호"
                autoComplete="current-password"
              />
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="새 비밀번호 (8자 이상)"
                autoComplete="new-password"
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="새 비밀번호 확인"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <div className="mt-3">
                <ErrorBanner message={passwordError} />
              </div>
            )}
            {passwordSuccess && !passwordError && (
              <p className="text-[13px] mt-3" style={{ color: "var(--accent)" }}>
                비밀번호가 변경됐어요.
              </p>
            )}
            <PrimaryButton
              onClick={handleChangePassword}
              loading={savingPassword}
              disabled={
                currentPassword.length === 0 ||
                newPassword.length === 0 ||
                confirmPassword.length === 0
              }
              className="w-full mt-3"
            >
              비밀번호 변경
            </PrimaryButton>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
