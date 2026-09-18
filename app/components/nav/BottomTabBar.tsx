// BottomTabBar.tsx — 하단 내비게이션.
// D-191(요청): 포트폴리오/은퇴시뮬레이션 2탭을 하나의 박스(세그먼트 컨트롤)로 묶고,
// "내 정보"는 그 옆에 별도로 분리된 메뉴 버튼(≡ 3줄 아이콘)으로 뺐다. 이 버튼을
// 설정 진입점은 포트폴리오 헤더의 톱니바퀴 하나로 모았다 — 하단에도 두면 같은 화면에
// 같은 목적지가 둘이 된다. 화면 테마와
// 바로 접근한다 — 이전엔 "내 정보" 자체가 세 번째 탭이었지만(D-189), 콘텐츠 탭
// (포트폴리오/시뮬레이션)과 설정류 진입점의 성격이 다르다는 사용자 피드백을 반영해
// 물리적으로도 분리했다. 좌우 2탭 사이의 슬라이드 인디케이터(어떤 탭이 선택됐는지
// 보여주는 애니메이션)는 기존 것을 그대로 유지한다.
// D-195: 알림 설정(준비중 항목)은 MY 탭(app/my/page.tsx)으로 다시 옮기고, 대신 여기에
// 로그아웃은 다시 MY(설정) 화면의 "계정" 섹션으로 돌려보냈다(D-195 뒤집음) —
// 세션을 끊는 것과 계정을 없애는 것은 같은 "계정" 묶음에 있어야 찾기 쉽고,
// ≡ 메뉴에 파괴적 조작이 섞여 있으면 빠른 조작 중 잘못 누를 여지가 생긴다.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useToken } from "@/lib/auth";
import { SCREEN } from "./labels";

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

function ReceiptIcon({ active }: { active: boolean }) {
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
      <path d="M6 3h12v18l-3-1.6-3 1.6-3-1.6L6 21V3Z" />
      <path d="M9.5 8.5h5M9.5 12.5h5" />
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

const TABS: {
  href: string;
  label: string;
  Icon: (props: { active: boolean }) => React.ReactElement;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/portfolio",
    label: SCREEN.portfolio,
    Icon: WalletIcon,
    isActive: (p) => p.startsWith("/portfolio"),
  },
  {
    href: "/settlement",
    label: SCREEN.settlement,
    Icon: ReceiptIcon,
    isActive: (p) => p.startsWith("/settlement"),
  },
  {
    href: "/simulator",
    label: SCREEN.simulator,
    Icon: CompassIcon,
    isActive: (p) => p.startsWith("/simulator"),
  },
];

// 탭바를 숨길 화면들. 목록이 늘어날 때 여기만 고치면 되도록 한곳에 모아둔다.
const FULLSCREEN_FLOWS = [
  /^\/privacy$/,
  /^\/terms$/,
  /^\/portfolio\/order$/,
  /^\/portfolio\/accounts\/new$/,
  /^\/portfolio\/accounts\/[^/]+\/order$/,
  /^\/portfolio\/accounts\/[^/]+\/assets\/new$/,
  /^\/my\/profile$/,
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const token = useToken();

  // WHY: 로그인 전 화면(로그인/카카오 콜백)에서는 로그인 기능만 보여야 한다.
  if (!token) return null;
  // 등록·편집처럼 "끝내고 나가는" 플로우와 법적 문서 화면에서는 탭바를 숨긴다.
  // 이 화면들은 전부 자체 뒤로가기/취소를 갖고 있어 탈출구가 사라지지 않는다.
  // 반대로 계좌 상세·자산 상세 같은 조회 화면은 탭 안의 하위 화면이라 탭바를 유지한다.
  if (FULLSCREEN_FLOWS.some((re) => re.test(pathname))) return null;

  const activeIndex = TABS.findIndex((tab) => tab.isActive(pathname));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="max-w-[420px] mx-auto flex items-stretch px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {/* 포트폴리오/결산/은퇴 — 세 콘텐츠 탭을 담은 박스. 선택된 쪽이 스르륵 슬라이드하는
            인디케이터를 그대로 유지한다(M15에서 2칸 → 3칸). */}
        <div
          className="relative flex-1 rounded-2xl border p-1"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="relative grid grid-cols-3">
            <div
              className="absolute inset-y-0 w-1/3 rounded-xl pointer-events-none"
              style={{
                background: "var(--accent-soft)",
                left: activeIndex > 0 ? `${(activeIndex * 100) / 3}%` : "0%",
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
                    className="fs-caption font-medium"
                    style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </nav>
  );
}
