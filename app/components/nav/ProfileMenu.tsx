"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getRefreshToken, useToken } from "@/lib/auth";
import { setTheme, useTheme } from "@/lib/theme";
import { api, ApiError } from "@/lib/api";

type MeResponse = {
  id: number;
  email: string | null;
  nickname: string;
  provider: string;
};

export default function ProfileMenu() {
  const token = useToken();
  const theme = useTheme();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!token) return null; // 비로그인 상태에선 표시 안 함

  // RTR 도입(D-161/M14) — 로컬 토큰만 지우면 서버에 남은 refreshToken이 계속
  // 유효해서(탈취 시 재사용 가능) 서버 쪽도 함께 무효화한다. 실패해도(네트워크 등)
  // 로컬 로그아웃은 그대로 진행 — 사용자를 로그아웃 화면에 가두지 않는다.
  async function handleLogout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post<void>("/api/auth/logout", { refreshToken });
      } catch {
        // best-effort — 로컬 토큰 삭제는 아래에서 무조건 진행
      }
    }
    clearTokens();
    setOpen(false);
    router.push("/");
  }

  return (
    <div ref={ref} className="fixed top-3 right-3 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-200"
        aria-label="프로필 메뉴"
      >
        나
      </button>

      {open && (
        <div className="mt-2 w-48 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg overflow-hidden">
          <button
            onClick={() => {
              setShowMyPage(true);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            마이페이지
          </button>

          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-700">
            <p className="text-xs text-neutral-400 mb-2">화면 테마</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  theme === "light"
                    ? "border-blue-500 text-blue-500"
                    : "border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-300"
                }`}
              >
                라이트
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${
                  theme === "dark"
                    ? "border-blue-500 text-blue-500"
                    : "border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-300"
                }`}
              >
                다크
              </button>
            </div>
          </div>

          <button
            disabled
            className="w-full text-left px-4 py-3 text-sm text-neutral-300 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-700 cursor-not-allowed"
          >
            알림 설정 <span className="text-[10px]">(준비중)</span>
          </button>

          {/* M9(D-066): 앱 내 기능요청 피드백 채널 — mailto로 기본 메일 앱 실행 */}
          <a
            href="mailto:nowgnodeel123@gmail.com?subject=%EB%84%A4%EC%8A%A4%ED%8A%B8%20%EA%B8%B0%EB%8A%A5%20%EC%A0%9C%EC%95%88"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            기능 제안하기
          </a>

          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            이용약관
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            개인정보처리방침
          </a>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-500 border-t border-neutral-100 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-neutral-700"
          >
            로그아웃
          </button>
        </div>
      )}

      {showMyPage && <MyPageModal onClose={() => setShowMyPage(false)} />}
    </div>
  );
}

function MyPageModal({ onClose }: { onClose: () => void }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<MeResponse>("/api/users/me").then((data) => {
      setMe(data);
      setNickname(data.nickname);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<MeResponse>("/api/users/me/nickname", {
        nickname,
      });
      setMe(updated);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-800 p-5">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
          마이페이지
        </h2>

        {me?.email && (
          <p className="text-xs text-neutral-400 mb-3">{me.email}</p>
        )}

        <label className="text-xs text-neutral-500 dark:text-neutral-400">
          닉네임
        </label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="w-full mt-1 mb-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent text-sm text-neutral-800 dark:text-neutral-100"
        />
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 text-sm text-neutral-600 dark:text-neutral-300"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || nickname.trim().length === 0}
            className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
