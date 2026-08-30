// RenameModal.tsx — 이름 수정 모달. ConfirmModal과 동일한 시각 패턴.
// 계좌와 자산(종목)이 함께 쓴다 — title만 다르다.
"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, inputClass } from "@/app/components/wizard/Ui";

export function RenameModal({
  title,
  currentName,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  currentName: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(currentName);
  const trimmed = name.trim();

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
          className="text-[16px] font-semibold mb-4"
          style={{ color: "var(--text-strong)" }}
        >
          {title}
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) {
              e.preventDefault();
              onConfirm(trimmed);
            }
          }}
          maxLength={50}
          autoFocus
          className={inputClass}
        />
        {error && (
          <p className="text-xs mt-2" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <SecondaryButton onClick={onCancel} className="flex-1">
            취소
          </SecondaryButton>
          <PrimaryButton
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed || loading}
            loading={loading}
            className="flex-1"
          >
            저장
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
