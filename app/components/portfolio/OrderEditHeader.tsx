// OrderEditHeader.tsx — 순서 편집 화면(계좌/자산 공용) 헤더.
// 확인은 우측 상단 "저장" 텍스트 버튼 하나로 끝낸다(하단 고정 바 폐기). 체크 아이콘만
// 두었더니 무엇이 일어나는지 읽히지 않아 글자로 바꿨다 — 취소와 나란히 놓여 대비도 분명해진다.
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
          className="fs-metric font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          {title}
        </h1>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="fs-body font-medium px-3 min-h-[44px] inline-flex items-center rounded-[var(--r-chip)] tappable"
            style={{ color: "var(--text-sub)", opacity: saving ? 0.5 : 1 }}
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || disabled}
            aria-label="이 순서로 저장"
            // 이 화면에서 바꾼 순서를 확정하는 유일한 수단인데 28px이었다 —
            // 가장 중요한 버튼이 화면에서 가장 작은 상태였다.
            className="fs-body font-bold px-3 min-h-[44px] rounded-[var(--r-chip)] flex items-center gap-2 tappable"
            style={{
              background: "transparent",
              color: disabled ? "var(--text-faint)" : "var(--accent)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving && (
              <span
                className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--accent)",
                }}
              />
            )}
            저장
          </button>
        </div>
      </div>

      <p
        className="fs-body mt-1 leading-relaxed"
        style={{ color: "var(--text-faint)" }}
      >
        {description}
      </p>
    </div>
  );
}
