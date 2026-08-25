// BottomTabBar.tsx — 하단 내비게이션.
// D-182(요청): 포트폴리오/은퇴시뮬레이션 2탭을 하나의 박스(세그먼트 컨트롤)로 묶고,
// "내 정보"는 그 옆에 별도로 분리된 메뉴 버튼(≡ 3줄 아이콘)으로 뺐다. 이 버튼을
// 누르면 위로 슬라이드하는 팝업 메뉴가 뜨고, 여기서 내 정보/알림 설정/화면 테마에
// 바로 접근한다 — 이전엔 "내 정보" 자체가 세 번째 탭이었지만(D-181), 콘텐츠 탭
// (포트폴리오/시뮬레이션)과 설정류 진입점의 성격이 다르다는 사용자 피드백을 반영해
// 물리적으로도 분리했다. 좌우 2탭 사이의 슬라이드 인디케이터(어떤 탭이 선택됐는지
// 보여주는 애니메이션)는 기존 것을 그대로 유지한다.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToken } from "@/lib/auth";
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
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
    href: "/",
    label: "은퇴시뮬레이션",
    Icon: CompassIcon,
    isActive: (p) => p === "/",
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

      <div className="w-full flex items-center gap-2.5 px-4 py-3 opacity-50">
        <span style={{ color: "var(--text-sub)" }}>
          <BellIcon />
        </span>
        <span className="text-[14px] font-medium flex-1" style={{ color: "var(--text-strong)" }}>
          알림 설정
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          준비중
        </span>
      </div>

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

        {/* 내 정보/알림 설정/화면 테마 — ≡ 메뉴 버튼, 눌리면 위로 슬라이드하는 팝업 */}
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
