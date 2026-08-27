// BottomTabBar.tsx — 하단 내비게이션.
// D-191(요청): 포트폴리오/은퇴시뮬레이션 2탭을 하나의 박스(세그먼트 컨트롤)로 묶고,
// "내 정보"는 그 옆에 별도로 분리된 메뉴 버튼(≡ 3줄 아이콘)으로 뺐다. 이 버튼을
// 누르면 위로 슬라이드하는 팝업 메뉴가 뜨고, 여기서 내 정보/화면 테마/로그아웃에
// 바로 접근한다 — 이전엔 "내 정보" 자체가 세 번째 탭이었지만(D-189), 콘텐츠 탭
// (포트폴리오/시뮬레이션)과 설정류 진입점의 성격이 다르다는 사용자 피드백을 반영해
// 물리적으로도 분리했다. 좌우 2탭 사이의 슬라이드 인디케이터(어떤 탭이 선택됐는지
// 보여주는 애니메이션)는 기존 것을 그대로 유지한다.
// D-195: 알림 설정(준비중 항목)은 MY 탭(app/my/page.tsx)으로 다시 옮기고, 대신 여기에
// 로그아웃을 추가했다 — MY 탭의 "계정" 섹션은 이제 회원탈퇴로 바뀌어 로그아웃 자리가
// 없어졌고, ≡ 메뉴는 "빠른 조작" 성격이라 세션을 끊는 로그아웃이 더 잘 맞는다.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearTokens, getRefreshToken, useToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { setTheme, useTheme } from "@/lib/theme";

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <circle cx="16" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-3 1.5 2-5 3-1.5Z" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.1 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7.6" r="3.6" />
      <path d="M4.5 19.5c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

const TABS: {
  href: string;
  label: string;
  Icon: (props: { active: boolean }) => React.ReactElement;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/portfolio",
    label: "포트폴리오",
    Icon: WalletIcon,
    isActive: (p) => p.startsWith("/portfolio"),
  },
  {
    href: "/simulator",
    label: "은퇴시뮬레이션",
    Icon: CompassIcon,
    isActive: (p) => p.startsWith("/simulator"),
  },
];

function NavMenu({ myActive, onClose }: { myActive: boolean; onClose: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // RTR 도입(D-161/M14) — 로컬 토큰만 지우면 서버에 남은 refreshToken이 계속
  // 유효해서(탈취 시 재사용 가능) 서버 쪽도 함께 무효화한다. D-195: 이 로그아웃은
  // 원래 MY 탭(app/my/page.tsx)에 있었지만, 그 자리는 회원탈퇴로 바뀌고 로그아웃은
  // 여기 ≡ 메뉴로 옮겨왔다.
  async function handleLogout() {
    onClose();
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
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 z-30 w-[208px] rounded-2xl overflow-hidden menu-slide-up"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          router.push("/my");
        }}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors"
        style={{ background: myActive ? "var(--accent-soft)" : "transparent" }}
      >
        <span style={{ color: myActive ? "var(--accent)" : "var(--text-sub)" }}>
          <UserIcon active={myActive} />
        </span>
        <span
          className="text-[14px] font-medium flex-1"
          style={{ color: myActive ? "var(--accent)" : "var(--text-strong)" }}
        >
          내 정보
        </span>
      </button>

      <div className="h-px" style={{ background: "var(--border)" }} />

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>
          화면 테마
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className="text-[12px] font-medium px-2.5 py-1 rounded-lg border"
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
            className="text-[12px] font-medium px-2.5 py-1 rounded-lg border"
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

      <div className="h-px" style={{ background: "var(--border)" }} />

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors"
      >
        <span style={{ color: "var(--error)" }}>
          <LogoutIcon />
        </span>
        <span className="text-[14px] font-medium" style={{ color: "var(--error)" }}>
          로그아웃
        </span>
      </button>
    </div>
  );
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const token = useToken();
  const [menuOpen, setMenuOpen] = useState(false);

  // WHY: 로그인 전 화면(로그인/카카오 콜백)에서는 로그인 기능만 보여야 한다.
  if (!token) return null;

  const activeIndex = TABS.findIndex((tab) => tab.isActive(pathname));
  const myActive = pathname.startsWith("/my");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="max-w-[420px] mx-auto flex items-stretch gap-2 px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {/* 포트폴리오/은퇴시뮬레이션 — 둘만 담긴 박스, 세그먼트 컨트롤 스타일로 선택된
            쪽이 스르륵 슬라이드하는 인디케이터를 그대로 유지한다. */}
        <div
          className="relative flex-1 rounded-2xl border p-1"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="relative grid grid-cols-2">
            <div
              className="absolute inset-y-0 w-1/2 rounded-xl pointer-events-none"
              style={{
                background: "var(--accent-soft)",
                left: activeIndex === 1 ? "50%" : "0%",
                opacity: activeIndex >= 0 ? 1 : 0,
                transition: "left 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease",
              }}
            />
            {TABS.map((tab, i) => {
              const active = i === activeIndex;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative z-10 flex flex-col items-center gap-1 py-2"
                >
                  <span style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
                    <tab.Icon active={active} />
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 내 정보/화면 테마/로그아웃 — ≡ 메뉴 버튼, 눌리면 위로 슬라이드하는 팝업 */}
        <div className="relative flex">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
            className="flex flex-col items-center justify-center gap-1 px-4 rounded-2xl border transition-colors"
            style={{
              borderColor: myActive || menuOpen ? "var(--accent)" : "var(--border)",
              color: myActive ? "var(--accent)" : "var(--text-faint)",
              background: menuOpen ? "var(--accent-soft)" : "transparent",
            }}
          >
            <HamburgerIcon />
            <span
              className="text-[11px] font-medium"
              style={{ color: myActive ? "var(--accent)" : "var(--text-sub)" }}
            >
              메뉴
            </span>
          </button>
          {menuOpen && <NavMenu myActive={myActive} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </nav>
  );
}
