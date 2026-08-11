// ConfirmModal.tsx — D-056: 삭제 등 파괴적 액션 전 확인 모달.
"use client";

import { SecondaryButton } from "@/app/components/wizard/Ui";

export function ConfirmModal({
  title,
  description,
  confirmLabel = "삭제",
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
          {title}
        </p>
        <p
          className="text-[13px] leading-relaxed mb-5"
          style={{ color: "var(--text-sub)" }}
        >
          {description}
        </p>
        <div className="flex gap-2">
          <SecondaryButton onClick={onCancel} className="flex-1">
            취소
          </SecondaryButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl bg-red-500 text-white py-3.5 text-[15px] font-semibold
              transition-all duration-150 hover:bg-red-600 active:scale-[0.98]
              disabled:opacity-40 disabled:active:scale-100"
          >
            {loading ? "삭제 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
