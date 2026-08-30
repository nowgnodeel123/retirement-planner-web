// OrderEditHeader.tsx — 순서 편집 화면(계좌/자산 공용) 헤더.
// 확인은 우측 상단 체크 표시 하나로 끝낸다(하단 고정 바 폐기). 배경 없이 선만 있는
// accent(초록) 체크 — 편집 화면의 유일한 주 동작이라 채워진 버튼까지는 필요 없다.
// 하단 고정 바를 쓰지 않는 이유: 목록이 길어지면 저장 버튼이 스크롤 위치에 따라 가려지고
// 드래그 중 손가락에 닿는다. 취소는 왼쪽 텍스트 버튼으로 남겨 되돌릴 길을 열어둔다.
"use client";

export function OrderEditHeader({
  title,
  description,
  onCancel,
  onConfirm,
  saving,
  disabled = false,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <h1
          className="text-[20px] font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          {title}
        </h1>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-[13px] font-medium px-1.5 py-1 rounded-lg"
            style={{ color: "var(--text-sub)", opacity: saving ? 0.5 : 1 }}
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || disabled}
            aria-label="이 순서로 저장"
            className="w-10 h-10 flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{
              background: "transparent",
              color: disabled ? "var(--text-faint)" : "var(--accent)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <span
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--accent)",
                }}
              />
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p
        className="text-[13px] mt-1 leading-relaxed"
        style={{ color: "var(--text-faint)" }}
      >
        {description}
      </p>
    </div>
  );
}
