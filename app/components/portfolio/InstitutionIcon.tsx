// InstitutionIcon.tsx — 기관유형(증권사/거래소)별 컬러 원형 아이콘.
// 계좌 카드에서 분리해 추출(계좌 목록 섹션 헤더가 사라진 뒤 기관 구분을 이 아이콘이 담당).
import { InstitutionType } from "./types";

// 색을 두 가지 이유로 바꿨다.
//
// 1) 거래소(주황)가 **라이트 모드에서 안 보였다.** 주황 글리프(#f5a623)를 같은 주황
//    틴트 위에 올려서 대비가 1.86이었다 — WCAG 1.4.11(비텍스트 3:1)의 절반 수준이고,
//    계좌가 증권사인지 거래소인지를 알려주는 건 카드에서 이 아이콘뿐이다.
//    눈으로는 "연한 주황이네" 정도로만 보여서 결함으로 인식되지 않았다.
//
// 2) 증권사가 파랑(#3182f6)이었다. 이 앱에서 파랑은 **손실**이고(D-049),
//    레포 규칙도 카테고리 색에 순수 빨강·파랑을 금지한다. 손익 숫자가 빨강·파랑으로
//    깔린 포트폴리오 화면에서 계좌 아이콘만 파랑인 건 읽는 사람을 헷갈리게 한다.
//    보라는 국내주식 카테고리(--category-domestic-stock)가 쓰는 색조라
//    앱이 이미 가진 색 어휘 안에 있다.
//
// 테마별로 값이 다른 이유: 글리프는 틴트 위에 올라가는데, 밝은 배경에서는 어두워야 하고
// 어두운 배경에서는 밝아야 대비가 선다. 한 값으로는 양쪽을 만족시킬 수 없다.
type IconStyle = { bg: string; color: string };

const institutionIconStyle: Record<
  InstitutionType,
  { light: IconStyle; dark: IconStyle }
> = {
  // 글리프/틴트 대비 — 라이트 3.98, 다크 5.05
  SECURITIES: {
    light: { bg: "rgba(124,92,230,0.12)", color: "#7c5ce6" },
    dark: { bg: "rgba(167,139,250,0.16)", color: "#a78bfa" },
  },
  // 글리프/틴트 대비 — 라이트 4.32, 다크 6.45
  EXCHANGE: {
    light: { bg: "rgba(168,90,16,0.12)", color: "#a85a10" },
    dark: { bg: "rgba(245,166,35,0.16)", color: "#f5a623" },
  },
};

export function InstitutionIcon({ type }: { type: InstitutionType }) {
  const s = institutionIconStyle[type];
  // 테마 분기를 JS로 읽으면 서버 렌더와 클라이언트가 달라져 하이드레이션 경고가 난다
  // (S-041과 같은 패턴). CSS 변수로 내려 `.dark`가 알아서 고르게 한다.
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 institution-icon"
      style={
        {
          "--icon-bg": s.light.bg,
          "--icon-color": s.light.color,
          "--icon-bg-dark": s.dark.bg,
          "--icon-color-dark": s.dark.color,
        } as React.CSSProperties
      }
    >
      {type === "SECURITIES" && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l5-5 4 3 8-8" />
          <path d="M15 7h5v5" />
        </svg>
      )}
      {type === "EXCHANGE" && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4v16M7 4h6.5a3.5 3.5 0 0 1 0 7H7m0 0h7a3.5 3.5 0 0 1 0 7H7" />
          <path d="M10 3v2.5M13 3v2.5M10 18.5V21M13 18.5V21" />
        </svg>
      )}
    </div>
  );
}
