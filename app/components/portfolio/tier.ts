// tier.ts — 총 평가자산 규모를 등급(티어)으로 환산한다.
// 파이차트 가운데에 금액을 또 보여주는 대신(총자산은 이미 위에 큼직하게 있음) 등급을 보여준다.
// 경계값은 "미만" 기준. 색상은 손익색(순수 빨강/파랑)과 겹치지 않게 골랐다.
//
// 경계·이름·색·안내문 라벨의 단일 출처. 예전엔 경계는 여기, 안내 모달의 구간 문구는
// TierEmblem.tsx에 문자열로 따로 있어서 경계를 바꾸면 두 곳을 같이 고쳐야 했다.
// 지금은 라벨을 경계에서 계산하므로 이 배열만 고치면 된다.

export interface Tier {
  name: string;
  /**
   * 광물 글리프(그래픽)에 쓰는 색. WCAG 1.4.11(비텍스트 대비 3:1) 대상이라
   * 원래 광물 느낌을 그대로 유지한다.
   */
  color: string;
  /**
   * **등급 이름 텍스트**용 CSS 클래스. 글리프 색을 그대로 텍스트에 쓰면 AA(4.5:1)에 걸린다 —
   * 실측 결과 라이트에서 6개(플래티넘 2.48, 다이아몬드 2.31 등), 다크에서 3개가 미달이었다.
   * 광택 있는 광물색은 원래 밝아서 흰 배경 위 텍스트로는 안 맞는다.
   *
   * 실제 색은 globals.css의 `.tier-label-*`에 있다. 인라인 style이 아니라 클래스인 이유:
   * 테마마다 필요한 방향이 반대(라이트는 어둡게, 다크는 밝게)라 값이 두 벌인데,
   * JS로 테마를 읽어 고르면 서버 렌더(라이트)와 클라이언트가 달라져 하이드레이션 경고가 난다
   * (S-041에서 localStorage를 useState 초기값으로 읽다가 같은 문제를 겪었다).
   * CSS면 `.dark` 선택자가 알아서 처리하고 전환도 즉시 따라온다.
   */
  labelClass: string;
  /** 이 등급의 하한(원). 다음 등급까지의 진척도 표시에 쓸 수 있다. */
  floor: number;
  /** 이 등급의 상한(원, 미만). 최상위 등급은 상한이 없어 null. */
  ceiling: number | null;
}

// labelColor 뒤 괄호는 해당 테마 배경 위 실측 대비. 색을 바꾸면 반드시 다시 잴 것.
export const TIERS: Tier[] = [
  { name: "언랭크", color: "#9AA0A6", labelClass: "tier-label-unranked", floor: 0, ceiling: 10_000_000 },
  { name: "브론즈", color: "#A9714B", labelClass: "tier-label-bronze", floor: 10_000_000, ceiling: 50_000_000 },
  { name: "실버", color: "#8E99A4", labelClass: "tier-label-silver", floor: 50_000_000, ceiling: 100_000_000 },
  { name: "골드", color: "#C79A2E", labelClass: "tier-label-gold", floor: 100_000_000, ceiling: 500_000_000 },
  { name: "플래티넘", color: "#3FB6A8", labelClass: "tier-label-platinum", floor: 500_000_000, ceiling: 1_000_000_000 },
  { name: "다이아몬드", color: "#4FB6E0", labelClass: "tier-label-diamond", floor: 1_000_000_000, ceiling: 3_000_000_000 },
  { name: "루비", color: "#C2405E", labelClass: "tier-label-ruby", floor: 3_000_000_000, ceiling: 5_000_000_000 },
  { name: "마스터", color: "#7C5CE6", labelClass: "tier-label-master", floor: 5_000_000_000, ceiling: null },
];


export function tierOf(totalAssetKrw: number | null | undefined): Tier {
  if (totalAssetKrw == null || totalAssetKrw < 0) return TIERS[0];
  return (
    TIERS.find((t) => t.ceiling === null || totalAssetKrw < t.ceiling) ??
    TIERS[TIERS.length - 1]
  );
}

/** 경계값을 한국식 단위로. 등급 경계는 전부 천만·억 단위라 두 갈래면 충분하다. */
function unit(won: number): string {
  return won >= 100_000_000
    ? `${won / 100_000_000}억`
    : `${won / 10_000_000}천만`;
}

/** 등급 안내표에 쓰는 구간 문구. 경계에서 계산하므로 따로 관리하지 않는다. */
export function tierRangeLabel(tier: Tier): string {
  if (tier.ceiling === null) return `${unit(tier.floor)}원 이상`;
  if (tier.floor === 0) return `${unit(tier.ceiling)}원 미만`;
  return `${unit(tier.floor)} ~ ${unit(tier.ceiling)}원`;
}
