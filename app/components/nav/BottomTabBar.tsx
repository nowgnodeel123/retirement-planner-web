// BottomTabBar.tsx — D-078: 하단 탭바(아이콘+라벨), 포트폴리오/은퇴시뮬레이션 2탭 고정.
// 다크모드: neutral-*/blue-* 하드코딩을 디자인 토큰(CSS 변수)으로 전환 (Ui.tsx와 동일 유형 수정)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useToken } from "@/lib/auth";

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
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
      width="22"
      height="22"
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

const TABS: {
  href: string;
  label: string;
  Icon: (props: { active: boolean }) => React.ReactElement;
}[] = [
  { href: "/portfolio", label: "포트폴리오", Icon: WalletIcon },
  { href: "/", label: "은퇴시뮬레이션", Icon: CompassIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const token = useToken();

  // WHY: 로그인 전 화면(로그인/카카오 콜백)에서는 로그인 기능만 보여야 한다.
  // ProfileMenu와 같은 기준(token 유무)으로 표시 여부를 맞춘다.
  if (!token) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="max-w-[420px] mx-auto flex pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5"
            >
              <span
                style={{
                  color: active ? "var(--accent)" : "var(--text-faint)",
                }}
              >
                <Icon active={active} />
              </span>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: active ? "var(--accent)" : "var(--text-sub)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
