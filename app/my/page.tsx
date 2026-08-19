// app/my/page.tsx — 하단 탭 "MY". 기존에 우측 상단 드롭다운(ProfileMenu)에 있던
// 마이페이지/테마/약관/로그아웃을 전용 화면으로 승격했다(D-171). 토스·뱅크샐러드류
// 앱의 MY 탭 구성을 참고 — 상단 프로필(닉네임 탭하면 수정), 아래 섹션별 메뉴 목록.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getRefreshToken } from "@/lib/auth";
import { setTheme, useTheme } from "@/lib/theme";
import { api, ApiError } from "@/lib/api";
import { ErrorBanner, PrimaryButton, SecondaryButton } from "@/app/components/wizard/Ui";

type MeResponse = {
  id: number;
  email: string | null;
  nickname: string;
  provider: string;
};

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-faint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
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

function MenuRow({
  label,
  onClick,
  href,
  disabled,
  badge,
  danger,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  badge?: string;
  danger?: boolean;
}) {
  const content = (
    <>
      <span
        className="text-[15px] font-medium"
        style={{ color: danger ? "var(--error)" : "var(--text-strong)" }}
      >
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        {badge && (
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            {badge}
          </span>
        )}
        {!disabled && !danger && <ChevronIcon />}
      </span>
    </>
  );

  const className =
    "w-full flex items-center justify-between px-4 py-3.5 text-left rounded-xl transition-colors";
  const style = disabled
    ? { opacity: 0.5, cursor: "not-allowed" as const }
    : { background: "var(--surface)" };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className} style={style}>
      {content}
    </button>
  );
}

export default function MyPage() {
  const router = useRouter();
  const theme = useTheme();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<MeResponse>("/api/users/me").then((data) => {
      setMe(data);
      setNickname(data.nickname);
    });
  }, []);

  async function handleSaveNickname() {
    setSaving(true);
    setNicknameError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/nickname", {
        nickname,
      });
      setMe(updated);
      setEditingNickname(false);
    } catch (e) {
      setNicknameError(e instanceof ApiError ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  // RTR 도입(D-161/M14) — 로컬 토큰만 지우면 서버에 남은 refreshToken이 계속
  // 유효해서(탈취 시 재사용 가능) 서버 쪽도 함께 무효화한다.
  async function handleLogout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post<void>("/api/auth/logout", { refreshToken });
      } catch {
        // best-effort — 로컬 로그아웃은 아래에서 무조건 진행
      }
    }
    clearTokens();
    router.push("/");
  }

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-7">
      <h1 className="text-[22px] font-bold mb-6" style={{ color: "var(--text-strong)" }}>
        내 정보
      </h1>

      {/* 프로필 — 닉네임 탭하면 인라인 수정 */}
      <div
        className="rounded-2xl border p-4 mb-2"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-semibold flex-shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {(me?.nickname ?? "나").slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            {editingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  autoFocus
                  className="flex-1 min-w-0 rounded-lg border px-2.5 py-1.5 text-[15px]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNickname(me?.nickname ?? "");
                  setNicknameError(null);
                  setEditingNickname(true);
                }}
                className="flex items-center gap-1.5"
              >
                <span className="text-[16px] font-bold" style={{ color: "var(--text-strong)" }}>
                  {me?.nickname ?? " "}
                </span>
                <ChevronIcon />
              </button>
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
              <SecondaryButton
                onClick={() => setEditingNickname(false)}
                className="flex-1"
              >
                취소
              </SecondaryButton>
              <PrimaryButton
                onClick={handleSaveNickname}
                loading={saving}
                disabled={nickname.trim().length === 0}
                className="flex-1"
              >
                저장
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      <SectionLabel>일반</SectionLabel>
      <div
        className="rounded-2xl border px-4 py-3.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-medium" style={{ color: "var(--text-strong)" }}>
            화면 테마
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border"
              style={
                theme === "light"
                  ? { borderColor: "var(--accent)", color: "var(--accent)" }
                  : { borderColor: "var(--border)", color: "var(--text-sub)" }
              }
            >
              라이트
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border"
              style={
                theme === "dark"
                  ? { borderColor: "var(--accent)", color: "var(--accent)" }
                  : { borderColor: "var(--border)", color: "var(--text-sub)" }
              }
            >
              다크
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <MenuRow label="알림 설정" disabled badge="준비중" />
      </div>

      <SectionLabel>지원</SectionLabel>
      <div className="space-y-1">
        <MenuRow
          label="기능 제안하기"
          href="mailto:nowgnodeel123@gmail.com?subject=%EB%84%A4%EC%8A%A4%ED%8A%B8%20%EA%B8%B0%EB%8A%A5%20%EC%A0%9C%EC%95%88"
        />
        <MenuRow label="이용약관" href="/terms" />
        <MenuRow label="개인정보처리방침" href="/privacy" />
      </div>

      <SectionLabel>계정</SectionLabel>
      <div className="space-y-1 mb-8">
        <MenuRow label="로그아웃" onClick={handleLogout} danger />
      </div>
    </div>
  );
}
