// BottomTabBar.tsx — D-078: 하단 탭바(아이콘+라벨), 포트폴리오/은퇴시뮬레이션 2탭 고정.
// 다크모드: neutral-*/blue-* 하드코딩을 디자인 토큰(CSS 변수)으로 전환 (Ui.tsx와 동일 유형 수정)
// D-172: 가운데 "내 정보" 탭을 평범한 아이콘+라벨에서 카메라 앱 스타일의 떠있는
// 원형 버튼으로 교체 — 좌우 두 탭 사이, 탭바 상단 경계선 위로 절반쯤 튀어나오게
// 배치했다. 다른 두 탭보다 확실히 눈에 띄어야 진입점 역할을 하므로, 항상 accent로
// 채우고(비활성 상태에서도) --bg색 테두리로 감싸 탭바 배경에서 "떠 있는" 느낌을 준다.
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

function UserIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
    </svg>
  );
}

const SIDE_TABS: {
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
  if (!token) return null;

  const myActive = pathname.startsWith("/my");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="max-w-[420px] mx-auto grid grid-cols-3 relative pb-[env(safe-area-inset-bottom)]">
        {/* 좌측: 포트폴리오 */}
        {(() => {
          const { href, label, Icon } = SIDE_TABS[0];
          const active = pathname.startsWith(href);
          return (
            <Link href={href} className="flex flex-col items-center gap-1 py-2.5">
              <span style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
                <Icon active={active} />
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
              >
                {label}
              </span>
            </Link>
          );
        })()}

        {/* 가운데: 내 정보 — 떠있는 원형 버튼. 라벨 없이 아이콘만(D-176) — 좌우
            두 탭과 달리 이 버튼은 이미 색·형태·위치로 충분히 도드라져서 텍스트
            라벨이 군더더기였다. D-177: 테두리를 페이지 배경(--bg, 라이트에서도
            살짝 회색빛)에서 카드 표면색(--surface, 라이트=순백)으로 바꿔 더
            또렷하게 "떠 있는" 느낌을 주고, 단색 채우기 대신 좌상단에서 옅게
            내려오는 화이트 하이라이트를 얹어 유리질/입체감을 냈다 — 색상은
            하드코딩하지 않고 --accent 위에 반투명 흰 그라데이션만 겹쳐서
            라이트/다크 양쪽에 자동으로 맞는다. */}
        <div className="relative py-2.5">
          <Link
            href="/my"
            aria-label="내 정보"
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-150 active:scale-95"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.38), rgba(255,255,255,0) 55%), var(--accent)",
              border: "4px solid var(--surface)",
              boxShadow: myActive
                ? "0 1px 2px rgba(15,23,42,0.08), 0 8px 20px rgba(49,130,246,0.4)"
                : "0 1px 2px rgba(15,23,42,0.06), 0 6px 16px rgba(49,130,246,0.28)",
            }}
          >
            <UserIcon />
          </Link>
        </div>

        {/* 우측: 은퇴시뮬레이션 */}
        {(() => {
          const { href, label, Icon } = SIDE_TABS[1];
          const active = pathname === href;
          return (
            <Link href={href} className="flex flex-col items-center gap-1 py-2.5">
              <span style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
                <Icon active={active} />
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: active ? "var(--accent)" : "var(--text-sub)" }}
              >
                {label}
              </span>
            </Link>
          );
        })()}
      </div>
    </nav>
  );
}
