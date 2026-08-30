// app/components/brand/NestMark.tsx — 네스트 브랜드 마크(둥지 아이콘, D-205 4차 디자인).
// 포트폴리오 헤더와 로그인 화면이 같은 마크를 쓰도록 공용 위치로 추출.
// 글리프: 달걀(세로 타원) 하나 + 그 아래 초승달 모양의 둥지 그릇. 둘 다 흰색 실루엣이고,
// 사이의 얇은 틈으로 배경(accent)색이 그대로 비쳐 알과 둥지가 분리돼 읽힌다.
// accent 원형 배경 위 흰색 글리프는 히어로 카드와 같은 의도된 고정 강조색 예외.

export function NestGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <ellipse cx="12" cy="9.5" rx="3.6" ry="4.4" />
      <path d="M3 11.5Q3 21 12 21 21 21 21 11.5 21 15.6 12 15.6 3 15.6 3 11.5Z" />
    </svg>
  );
}

export function NestMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: "var(--accent)" }}
      aria-hidden="true"
    >
      <NestGlyph size={Math.round(size * 0.5625)} />
    </div>
  );
}
