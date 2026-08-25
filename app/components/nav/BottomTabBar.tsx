// BottomTabBar.tsx — D-078: 하단 탭바(아이콘+라벨), 포트폴리오/내 정보/은퇴시뮬레이션 3탭.
// 다크모드: neutral-*/blue-* 하드코딩을 디자인 토큰(CSS 변수)으로 전환 (Ui.tsx와 동일 유형 수정)
// D-181(UI 리뉴얼): D-172~D-177에서 쓰던 "떠있는 원형 FAB" 가운데 탭을 폐기하고,
// 세 탭을 같은 높이로 나란히 배치하는 통상적인 탭바로 되돌렸다 — 대신 활성 탭 아이콘
// 뒤에 accent-soft 원형 배경을 두고, 탭 전환 시 그 원이 다음 탭 위치로 부드럽게
// 슬라이드하는 인터랙션을 추가했다(퍼센트 기반 left + CSS transition, 그리드 폭이
// 바뀌어도 항상 탭 중앙에 오도록).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useToken } from "@/lib/auth";

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
      <path d="M16 13h.01" />
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
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
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
    href: "/my",
    label: "내 정보",
    Icon: UserIcon,
    isActive: (p) => p.startsWith("/my"),
  },
  {
    href: "/",
    label: "은퇴시뮬레이션",
    Icon: CompassIcon,
    isActive: (p) => p === "/",
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const token = useToken();

  // WHY: 로그인 전 화면(로그인/카카오 콜백)에서는 로그인 기능만 보여야 한다.
  if (!token) return null;

  const activeIndex = TABS.findIndex((tab) => tab.isActive(pathname));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="max-w-[420px] mx-auto relative grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {/* 활성 탭 표시 — 퍼센트 기반 위치라 그리드 폭이 달라져도 항상 탭 중앙에 온다 */}
        <div
          className="absolute top-2.5 w-11 h-11 rounded-full pointer-events-none"
          style={{
            background: "var(--accent-soft)",
            left:
              activeIndex >= 0
                ? `calc((100% / 3) * ${activeIndex} + (100% / 6) - 22px)`
                : `calc((100% / 6) - 22px)`,
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
              className="relative flex flex-col items-center gap-1 py-2.5"
            >
              <span
                className="w-11 h-11 flex items-center justify-center"
                style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}
              >
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
    </nav>
  );
}
