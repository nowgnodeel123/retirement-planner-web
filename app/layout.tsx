import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "./components/nav/BottomTabBar";
import ThemeInit from "./components/nav/ThemeInit";

export const metadata: Metadata = {
  title: "네스트 — 지금 자산으로 은퇴가 준비될까요?",
  description:
    "내 자산을 정리하고, 은퇴 시점에 충분한지 역산해보는 자산관리 앱",
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
