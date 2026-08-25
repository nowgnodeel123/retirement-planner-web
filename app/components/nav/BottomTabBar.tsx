// BottomTabBar.tsx — D-078: 하단 탭바(아이콘+라벨), 포트폴리오/내 정보/은퇴시뮬레이션 3탭.
// 다크모드: neutral-*/blue-* 하드코딩을 디자인 토큰(CSS 변수)으로 전환 (Ui.tsx와 동일 유형 수정)
// D-181(UI 리뉴얼): D-172~D-177에서 쓰던 "떠있는 원형 FAB" 가운데 탭을 폐기하고,
// 세 탭을 같은 높이로 나란히 배치하는 통상적인 탭바로 되돌렸다 — 좌우(포트폴리오/
// 은퇴시뮬레이션) 두 탭은 활성 아이콘 뒤에 accent-soft 원형 배경을 두고, 탭 전환 시
// 그 원이 다음 탭 위치로 슬라이드한다(퍼센트 기반 left + CSS transition).
// WHY(가운데 "내 정보" 탭 차별화): 좌우 두 탭은 콘텐츠 화면(포트폴리오/시뮬레이션)이고
// 가운데는 계정/설정 진입점이라는 성격이 달라 구분감이 필요하다는 요청 — 원형 슬라이드
// 인디케이터 대신 다이아몬드(45도 회전 사각형) 배지 + 별도 그린 톤(--tab-my)을 항상
// 씌워서 "여기는 다른 종류의 탭"이라는 걸 아이콘 모양만으로도 알 수 있게 했다. 슬라이드
// 인디케이터는 좌우 두 탭 사이에서만 움직이고 가운데에서는 사라진다.
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
      {/* WHY(완성도): 이전엔 길이 0짜리 path에 round linecap을 얹어 점을 그리는
          트릭을 썼는데, 확대해보면 살짝 타원으로 뭉개져 보였다. 실제 원(circle)
          으로 바꿔 지갑 잠금 부분이 어느 배율에서도 또렷한 점으로 보이게 했다. */}
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
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.1 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* WHY(아이콘 다듬기): 기존엔 머리(원)와 몸통(단순 호)이 이어지는 지점이
          뾰족하게 맞물려 보였다. 머리를 살짝 올리고 어깨선을 더 완만한 곡선으로
          바꿔 아이콘 자체의 완성도를 높였다 — 다이아몬드 안에서 작게 보일 때도
          실루엣이 매끈하게 읽힌다. */}
      <circle cx="12" cy="7.6" r="3.6" />
      <path d="M4.5 19.5c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
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
        {/* 활성 탭 표시 — 좌우(0/2) 두 탭 사이에서만 슬라이드한다. 가운데(1)는 아래
            다이아몬드 배지가 그 역할을 대신하므로 이 원은 숨긴다. */}
        <div
          className="absolute top-2.5 w-11 h-11 rounded-full pointer-events-none"
          style={{
            background: "var(--accent-soft)",
            left:
              activeIndex >= 0
                ? `calc((100% / 3) * ${activeIndex} + (100% / 6) - 22px)`
                : `calc((100% / 6) - 22px)`,
            opacity: activeIndex >= 0 && activeIndex !== 1 ? 1 : 0,
            transition: "left 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease",
          }}
        />

        {TABS.map((tab, i) => {
          const active = i === activeIndex;
          const isMyTab = i === 1;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center gap-1 py-2.5"
            >
              {isMyTab ? (
                // WHY(라인 정렬): 다이아몬드를 좌우 탭과 다른 w-9(36px) 박스에 바로
                // 넣었더니, 좌우 아이콘 슬롯(w-11=44px)보다 8px 작아서 그 아래 라벨이
                // 8px 위로 붙어 세 탭의 글자 줄이 어긋나 보였다(실사용 피드백으로 발견).
                // 좌우와 동일한 44px 슬롯으로 감싸고, 그 안에서만 다이아몬드를 원하는
                // 크기로 중앙 정렬해야 라벨 줄이 항상 같은 높이에 온다.
                <span className="w-11 h-11 flex items-center justify-center">
                  {/* WHY(완성도): 활성일 때 은은한 그림자를 얹어 눌린 배지가 아니라
                      살짝 떠 있는 배지처럼 보이게 했다 — 다른 두 탭의 평면적인
                      accent-soft 원과는 다른 종류의 탭이라는 인상을 강화한다. */}
                  <span
                    className="w-9 h-9 flex items-center justify-center transition-all"
                    style={{
                      transform: "rotate(45deg)",
                      borderRadius: 10,
                      background: active ? "var(--tab-my)" : "var(--tab-my-soft)",
                      border: active ? "none" : "1.5px solid var(--tab-my)",
                      boxShadow: active ? "0 3px 8px -2px var(--tab-my)" : "none",
                    }}
                  >
                    <span style={{ transform: "rotate(-45deg)", color: active ? "#fff" : "var(--tab-my)" }}>
                      <tab.Icon active={active} />
                    </span>
                  </span>
                </span>
              ) : (
                <span
                  className="w-11 h-11 flex items-center justify-center"
                  style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}
                >
                  <tab.Icon active={active} />
                </span>
              )}
              <span
                className="text-[11px] font-medium"
                style={{
                  color: isMyTab
                    ? active
                      ? "var(--tab-my)"
                      : "var(--text-sub)"
                    : active
                      ? "var(--accent)"
                      : "var(--text-sub)",
                }}
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
