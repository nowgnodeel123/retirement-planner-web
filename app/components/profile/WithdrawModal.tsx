// WithdrawModal.tsx — 회원탈퇴 확인 모달. ConfirmModal(D-056)과 같은 셸(바텀시트+오버레이+
// --error 빨강 확인 버튼)을 쓰되, LOCAL 계정은 본인확인용 현재 비밀번호 입력이 추가로 필요하다
// (카카오 계정은 비밀번호가 없어 확인 문구만으로 진행).
"use client";

import { useState } from "react";
import { ErrorBanner, inputClass, SecondaryButton } from "@/app/components/wizard/Ui";

export function WithdrawModal({
  isLocal,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  isLocal: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: (currentPassword: string | null) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-6 shadow-[0_-4px_32px_rgba(0,0,0,0.12)]"
        style={{ background: "var(--surface)" }}
      >
        <p
          className="text-[16px] font-semibold mb-1.5"
          style={{ color: "var(--text-strong)" }}
        >
          정말 탈퇴할까요?
        </p>
        <p
          className="text-[13px] leading-relaxed mb-5"
          style={{ color: "var(--text-sub)" }}
        >
          탈퇴하면 등록한 모든 계좌·자산·거래 내역이 함께 삭제돼요. 이 작업은
          되돌릴 수 없어요.
        </p>

        {isLocal && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="현재 비밀번호로 확인"
            className={`${inputClass} mb-3`}
            autoComplete="current-password"
            autoFocus
          />
        )}

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="flex gap-2">
          <SecondaryButton onClick={onCancel} className="flex-1">
            취소
          </SecondaryButton>
          <button
            type="button"
            onClick={() => onConfirm(isLocal ? password : null)}
            disabled={loading || (isLocal && password.length === 0)}
            className="flex-1 rounded-2xl text-white py-3.5 text-[15px] font-semibold
              transition-all duration-150 hover:brightness-110 active:scale-[0.98]
              disabled:opacity-40 disabled:active:scale-100"
            style={{ background: "var(--error)" }}
          >
            {loading ? "탈퇴 처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
