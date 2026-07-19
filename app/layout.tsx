import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomTabBar from "./components/nav/BottomTabBar";
import "./globals.css";
import ProfileMenu from "./components/nav/ProfileMenu";
import ThemeInit from "./components/nav/ThemeInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "네스트 — 지금 자산으로 은퇴가 준비될까요?",
  description:
    "내 자산을 정리하고, 은퇴 시점에 충분한지 역산해보는 자산관리 앱",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-100 dark:bg-neutral-900">
        <ThemeInit />
        <ProfileMenu />
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
