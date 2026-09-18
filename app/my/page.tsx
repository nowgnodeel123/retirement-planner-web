// app/my/page.tsx — 하단 탭 "MY". 기존에 우측 상단 드롭다운(ProfileMenu)에 있던
// 마이페이지/테마/약관/로그아웃을 전용 화면으로 승격했다(D-171). 토스·뱅크샐러드류
// 앱의 MY 탭 구성을 참고 — 상단 프로필(탭하면 개인정보 수정 화면 D-177), 아래 섹션별 메뉴 목록.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearTokens, getRefreshToken } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Avatar } from "@/app/components/profile/Avatar";
import { WithdrawModal } from "@/app/components/profile/WithdrawModal";
import { SectionLabel } from "@/app/components/ui/Section";
import {
  FONT_SCALE_LABEL,
  FontScale,
  setFontScale,
  useFontScale,
} from "@/lib/fontScale";
import { setTheme, useTheme } from "@/lib/theme";

type MeResponse = {
  id: number;
  email: string | null;
  nickname: string;
  provider: string;
  avatarId: number;
};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-faint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function MenuRow({
  label,
  onClick,
  href,
  disabled,
  badge,
  danger,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  badge?: string;
  danger?: boolean;
}) {
  const content = (
    <>
      <span
        className="fs-title font-medium"
        style={{ color: danger ? "var(--error)" : "var(--text-strong)" }}
      >
        {label}
      </span>
      <span className="flex items-center gap-2">
        {badge && (
          <span className="fs-caption" style={{ color: "var(--text-faint)" }}>
            {badge}
          </span>
        )}
        {!disabled && !danger && <ChevronIcon />}
      </span>
    </>
  );

  const className =
    "w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-colors";
  // WHY: disabled여도 background를 지우면 안 된다 — 카드 표면이 통째로 사라져
  // 바로 위 카드와 이어지지 않고 붕 뜬 것처럼 보이는 버그가 있었다(실제 QA에서
  // "알림 설정" 행으로 발견). 배경은 항상 유지하고 opacity만 낮춰 "같은 카드
  // 그룹 안의 비활성 항목"으로 보이게 한다.
  const style = disabled
    ? { opacity: 0.5, cursor: "not-allowed" as const, background: "var(--surface)" }
    : { background: "var(--surface)" };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className} style={style}>
      {content}
    </button>
  );
}

/**
 * 설정 행 안의 세그먼트 선택. 화면 테마와 글자 크기가 형태가 같아서 하나로 묶었다 —
 * 같은 모양을 두 번 적으면 한쪽만 고쳐지는 일이 생긴다(섹션 라벨이 네 벌로 갈라졌던 것과
 * 같은 경로다).
 *
 * 고르는 즉시 적용되고 저장 버튼은 없다. 결과가 화면에 바로 보이기 때문에
 * "적용됐나?"를 따로 확인시켜줄 필요가 없다.
 */
function SegmentedRow<T extends string>({
  label,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  /** icon을 주면 글자 대신 아이콘만 보여준다. 접근성 이름은 label이 맡는다.
      previewSize를 주면 그 크기로 라벨을 그린다 — 고르기 전에 결과를 미리 보여주는 용도. */
  options: { value: T; label: string; icon?: React.ReactNode; previewSize?: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: "var(--surface)" }}
    >
      <span className="fs-title font-medium" style={{ color: "var(--text-strong)" }}>
        {label}
      </span>
      <div className="flex gap-2" role="group" aria-label={ariaLabel}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              aria-label={o.icon ? o.label : undefined}
              title={o.icon ? o.label : undefined}
              className={`font-medium min-h-[44px] rounded-lg border flex items-center justify-center ${
                o.icon ? "w-11" : "px-3"
              } ${o.previewSize ? "" : "fs-body"}`}
              style={{
                ...(active
                  ? { borderColor: "var(--accent)", color: "var(--accent)" }
                  : { borderColor: "var(--border)", color: "var(--text-sub)" }),
                ...(o.previewSize ? { fontSize: o.previewSize } : null),
              }}
            >
              {o.icon ?? o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 각 버튼의 라벨을 그 배율의 **실제 본문 크기**로 그린다 — "작게"는 작은 글자로,
 * "크게"는 큰 글자로. 고르기 전에 결과를 눈으로 비교할 수 있다.
 *
 * WHY --fs-scale을 타지 않는 고정 px인가: 이 버튼들이 현재 배율까지 따라가면
 * "크게"를 고른 뒤 세 버튼이 통째로 커져서 **서로의 차이**가 아니라 현재 상태만
 * 보이게 된다. 미리보기는 현재 설정과 무관해야 세 선택지를 비교할 수 있다.
 * 값은 globals.css의 --fs-body(13px)와 배율(0.92 / 1 / 1.1)에서 그대로 끌어온 것이라
 * 실제로 적용될 본문 크기와 정확히 같다.
 */
const FONT_SCALE_PREVIEW: Record<FontScale, string> = {
  small: "calc(13px * 0.92)",
  normal: "13px",
  large: "calc(13px * 1.1)",
};

function FontScaleRow() {
  const scale = useFontScale();
  const options = (["small", "normal", "large"] as const).map((v) => ({
    value: v,
    label: FONT_SCALE_LABEL[v],
    previewSize: FONT_SCALE_PREVIEW[v],
  }));

  return (
    <SegmentedRow
      label="글자 크기"
      ariaLabel="글자 크기"
      options={options}
      value={scale}
      onChange={setFontScale}
    />
  );
}

/** 화면 테마 — 하단 ≡ 팝업 메뉴에 있던 것을 이리로 옮겼다(팝업 자체를 없앴다). */
function ThemeRow() {
  const theme = useTheme();
  return (
    <SegmentedRow
      label="화면 테마"
      ariaLabel="화면 테마"
      options={[
        { value: "light" as const, label: "라이트", icon: <SunIcon /> },
        { value: "dark" as const, label: "다크", icon: <MoonIcon /> },
      ]}
      value={theme}
      onChange={setTheme}
    />
  );
}

export default function MyPage() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    api.get<MeResponse>("/api/users/me").then(setMe);
  }, []);

  // 로그아웃이 ≡ 메뉴에서 다시 이 화면으로 돌아왔다(D-195 뒤집음). "계정" 섹션에
  // 로그아웃 → 회원탈퇴 순으로 둔다 — 되돌릴 수 있는 것이 위, 되돌릴 수 없는 것이 아래다.
  //
  // RTR(D-161/M14) — 로컬 토큰만 지우면 서버에 남은 refreshToken이 계속 유효해서
  // (탈취 시 재사용 가능) 서버 쪽도 함께 무효화한다. 서버 호출 실패는 삼킨다:
  // 네트워크가 안 되는데 로컬 세션까지 못 끊으면 사용자가 로그아웃 자체를 못 한다.
  async function handleLogout() {
    setLoggingOut(true);
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post<void>("/api/auth/logout", { refreshToken });
      } catch {
        // best-effort
      }
    }
    clearTokens();
    // "/" 는 토큰을 보고 다시 /login으로 replace 하는 중계 화면이라 한 번 더 튄다 —
    // 로그아웃 직후엔 목적지가 확정이므로 바로 보낸다.
    router.replace("/login");
  }

  async function handleWithdraw(currentPassword: string | null) {
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await api.delete("/api/users/me", { currentPassword });
      clearTokens();
      router.replace("/login");
    } catch (e) {
      setWithdrawError(e instanceof ApiError ? e.message : "탈퇴 처리 중 문제가 발생했어요.");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="max-w-[420px] w-full mx-auto px-5 pt-10">
      {/* D-176: 페이지 제목("내 정보") 텍스트 제거 — 탭 자체가 이미 떠있는 원형
          버튼으로 명확히 구분되고, 진입하자마자 보이는 프로필 카드가 곧 이 화면이
          뭔지 스스로 설명한다. 제목 공간이 빠진 만큼 상단 여백을 pt-7→pt-10으로
          살짝 늘려 프로필 카드가 화면 끝에 바로 붙어 답답해 보이지 않게 했다. */}

      {/* 프로필 — 탭하면 개인정보 수정 화면(D-177)으로 이동. 닉네임 인라인 수정은
          그 화면으로 옮겼다 — 여기는 요약(아바타+닉네임+이메일)만 보여주는
          진입점 역할로 단순화. */}
      <Link
        href="/my/profile"
        className="rounded-2xl border p-4 mb-2 flex items-center gap-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {me ? (
          <Avatar avatarId={me.avatarId} size={48} />
        ) : (
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "var(--border)" }} />
        )}
        <div className="flex-1 min-w-0">
          <span className="fs-title font-bold" style={{ color: "var(--text-strong)" }}>
            {me?.nickname ?? " "}
          </span>
          {me?.email && (
            <p className="fs-body mt-1 truncate" style={{ color: "var(--text-faint)" }}>
              {me.email}
            </p>
          )}
        </div>
        <ChevronIcon />
      </Link>

      {/* D-195를 뒤집는다 — 화면 테마가 ≡ 팝업 메뉴에서 이 목록으로 돌아왔다.
          로그아웃이 빠지고 테마까지 옮기면 그 메뉴에 남는 건 "설정" 하나뿐이라
          팝업 자체를 없앴다(BottomTabBar). 설정은 한 화면에 모여 있는 게 찾기 쉽다. */}
      <SectionLabel>일반</SectionLabel>
      <div className="space-y-1">
        <ThemeRow />
        <FontScaleRow />
        <MenuRow label="알림 설정" disabled badge="준비중" />
      </div>

      <SectionLabel>지원</SectionLabel>
      <div className="space-y-1">
        <MenuRow
          label="기능 제안하기"
          href="mailto:nowgnodeel123@gmail.com?subject=%EB%84%A4%EC%8A%A4%ED%8A%B8%20%EA%B8%B0%EB%8A%A5%20%EC%A0%9C%EC%95%88"
        />
        <MenuRow label="이용약관" href="/terms" />
        <MenuRow label="개인정보처리방침" href="/privacy" />
      </div>

      <SectionLabel>계정</SectionLabel>
      <div className="space-y-1 mb-8">
        <MenuRow
          label="로그아웃"
          onClick={handleLogout}
          badge={loggingOut ? "로그아웃 중…" : undefined}
        />
        <MenuRow
          label="회원탈퇴"
          onClick={() => {
            setWithdrawError(null);
            setShowWithdrawModal(true);
          }}
          danger
        />
      </div>

      {showWithdrawModal && (
        <WithdrawModal
          isLocal={me?.provider === "LOCAL"}
          loading={withdrawing}
          error={withdrawError}
          onConfirm={handleWithdraw}
          onCancel={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
}
