// app/my/page.tsx — 하단 탭 "MY". 기존에 우측 상단 드롭다운(ProfileMenu)에 있던
// 마이페이지/테마/약관/로그아웃을 전용 화면으로 승격했다(D-171). 토스·뱅크샐러드류
// 앱의 MY 탭 구성을 참고 — 상단 프로필(탭하면 개인정보 수정 화면 D-177), 아래 섹션별 메뉴 목록.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearTokens, getRefreshToken } from "@/lib/auth";
import { setTheme, useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import { Avatar } from "@/app/components/profile/Avatar";

type MeResponse = {
  id: number;
  email: string | null;
  nickname: string;
  provider: string;
  avatarId: number;
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
  // WHY: disabled여도 background를 지우면 안 된다 — 카드 표면이 통째로 사라져
  // 바로 위 카드와 이어지지 않고 붕 뜬 것처럼 보이는 버그가 있었다(실제 QA에서
  // "알림 설정" 행으로 발견). 배경은 항상 유지하고 opacity만 낮춰 "같은 카드
  // 그룹 안의 비활성 항목"으로 보이게 한다.
  const style = disabled
    ? { opacity: 0.5, cursor: "not-allowed" as const, background: "var(--surface)" }
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

  useEffect(() => {
    api.get<MeResponse>("/api/users/me").then(setMe);
  }, []);

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
    <div className="max-w-[420px] w-full mx-auto px-5 pt-10">
      {/* D-176: 페이지 제목("내 정보") 텍스트 제거 — 탭 자체가 이미 떠있는 원형
          버튼으로 명확히 구분되고, 진입하자마자 보이는 프로필 카드가 곧 이 화면이
          뭔지 스스로 설명한다. 제목 공간이 빠진 만큼 상단 여백을 pt-7→pt-10으로
          살짝 늘려 프로필 카드가 화면 끝에 바로 붙어 답답해 보이지 않게 했다. */}

      {/* 프로필 — 탭하면 개인정보 수정 화면(D-177)으로 이동. 닉네임 인라인 수정은
          그 화면으로 옮겼다 — 여기는 요약(아바타+닉네임+이메일)만 보여주는
          진입점 역할로 단순화. */}
      <Link
        href="/my/profile"
        className="rounded-2xl border p-4 mb-2 flex items-center gap-3.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {me ? (
          <Avatar avatarId={me.avatarId} size={48} />
        ) : (
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "var(--border)" }} />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[16px] font-bold" style={{ color: "var(--text-strong)" }}>
            {me?.nickname ?? " "}
          </span>
          {me?.email && (
            <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>
              {me.email}
            </p>
          )}
        </div>
        <ChevronIcon />
      </Link>

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
