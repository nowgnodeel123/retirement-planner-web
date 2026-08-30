// tier.ts — 총 평가자산 규모를 등급(티어)으로 환산한다.
// 파이차트 가운데에 금액을 또 보여주는 대신(총자산은 이미 위에 큼직하게 있음) 등급을 보여준다.
// 경계값은 "미만" 기준. 색상은 손익색(순수 빨강/파랑)과 겹치지 않게 골랐다.
//
// 경계·이름·색·안내문 라벨의 단일 출처. 예전엔 경계는 여기, 안내 모달의 구간 문구는
// TierEmblem.tsx에 문자열로 따로 있어서 경계를 바꾸면 두 곳을 같이 고쳐야 했다.
// 지금은 라벨을 경계에서 계산하므로 이 배열만 고치면 된다.

export interface Tier {
  name: string;
  color: string;
  /** 이 등급의 하한(원). 다음 등급까지의 진척도 표시에 쓸 수 있다. */
  floor: number;
  /** 이 등급의 상한(원, 미만). 최상위 등급은 상한이 없어 null. */
  ceiling: number | null;
}

export const TIERS: Tier[] = [
  { name: "언랭크", color: "#9AA0A6", floor: 0, ceiling: 10_000_000 },
  { name: "브론즈", color: "#A9714B", floor: 10_000_000, ceiling: 50_000_000 },
  { name: "실버", color: "#8E99A4", floor: 50_000_000, ceiling: 100_000_000 },
  { name: "골드", color: "#C79A2E", floor: 100_000_000, ceiling: 500_000_000 },
  { name: "플래티넘", color: "#3FB6A8", floor: 500_000_000, ceiling: 1_000_000_000 },
  { name: "다이아몬드", color: "#4FB6E0", floor: 1_000_000_000, ceiling: 3_000_000_000 },
  { name: "루비", color: "#C2405E", floor: 3_000_000_000, ceiling: 5_000_000_000 },
  { name: "마스터", color: "#7C5CE6", floor: 5_000_000_000, ceiling: null },
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
