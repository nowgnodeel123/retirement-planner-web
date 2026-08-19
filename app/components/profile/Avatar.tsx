// Avatar.tsx — D-177: 닉네임 첫 글자 텍스트 아바타를 대체하는 아이콘 아바타.
// 사람 얼굴/캐릭터 대신 추상 기하 마크 10종을 썼다 — 어색한 합성 얼굴 없이도
// 유저마다 다르게 보이면서, 앱 전역 아이콘(스트로크 기반)과 톤이 맞는다.
// 배정은 가입 시 서버가 무작위 0~9로 고정(User.avatarId, V12) — 여기선 렌더만 담당.
import { CSSProperties } from "react";

export const AVATAR_COUNT = 10;

const AVATAR_BACKGROUNDS = [
  "#A78BFA", // violet
  "#2DD4BF", // teal
  "#FBBF24", // amber
  "#34D399", // emerald
  "#F97316", // orange
  "#C084FC", // purple
  "#FACC15", // yellow
  "#22D3EE", // cyan
  "#F472B6", // pink
  "#94A3B8", // slate
];

function Glyph({ id }: { id: number }) {
  const common = {
    fill: "none",
    stroke: "#fff",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id % AVATAR_COUNT) {
    case 0: // 동심원
      return (
        <>
          <circle cx="12" cy="12" r="7" {...common} />
          <circle cx="12" cy="12" r="1.6" fill="#fff" stroke="none" />
        </>
      );
    case 1: // 삼각형
      return <path d="M12 4 20 18H4Z" {...common} />;
    case 2: // 다이아몬드
      return <path d="M12 3 21 12 12 21 3 12Z" {...common} />;
    case 3: // 플러스
      return <path d="M12 5v14M5 12h14" {...common} />;
    case 4: // 스파클
      return <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" {...common} />;
    case 5: // 육각형
      return <path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" {...common} />;
    case 6: // 화살표
      return <path d="M7 17 17 7M9 7h8v8" {...common} />;
    case 7: // 지그재그
      return <path d="M3 13l4-5 4 5 4-5 4 5 4-5" {...common} />;
    case 8: // 아치
      return <path d="M4 15a8 8 0 0 1 16 0" {...common} />;
    default: // 링
      return <circle cx="12" cy="12" r="6.5" {...common} strokeWidth={3.5} />;
  }
}

export function Avatar({
  avatarId,
  size = 48,
  style,
}: {
  avatarId: number;
  size?: number;
  style?: CSSProperties;
}) {
  const bg = AVATAR_BACKGROUNDS[avatarId % AVATAR_COUNT];
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: bg, ...style }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
      >
        <Glyph id={avatarId} />
      </svg>
    </div>
  );
}
