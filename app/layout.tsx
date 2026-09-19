import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomTabBar from "./components/nav/BottomTabBar";
import ThemeInit from "./components/nav/ThemeInit";

export const metadata: Metadata = {
  title: "네스트 — 지금 자산으로 은퇴가 준비될까요?",
  description:
    "내 자산을 정리하고, 은퇴 시점에 충분한지 역산해보는 자산관리 앱",
};

/**
 * WHY 이게 없으면 안 되나 — 두 가지가 조용히 깨져 있었다.
 *
 * 1) `viewportFit: "cover"`가 없으면 `env(safe-area-inset-*)`가 **항상 0**이다.
 *    BottomTabBar는 이미 `pb-[calc(env(safe-area-inset-bottom)+8px)]`로 홈 인디케이터를
 *    피하도록 짜여 있었는데, 그 계산이 통째로 죽은 코드였다. 아이폰에서는 탭바가
 *    홈 인디케이터에 깔려서 맨 아래 탭이 잘 안 눌린다 — 데스크톱 브라우저로만 보면
 *    절대 안 보이는 결함이다.
 *
 * 2) themeColor가 없으면 모바일 브라우저의 주소창·상태바 영역이 기본 흰색으로 남는다.
 *    다크모드로 앱을 보고 있는데 화면 위아래만 흰 띠가 남아서, 테마를 바꿔도
 *    "덜 바뀐" 느낌이 든다. media 쿼리로 테마별 값을 준다.
 *
 * maximumScale/userScalable은 **일부러 건드리지 않는다.** 확대를 막는 건 저시력
 * 사용자에게 치명적이고(WCAG 1.4.4), 이 앱은 60세도 쓸 수 있어야 한다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
