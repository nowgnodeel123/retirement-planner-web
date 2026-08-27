// tier.ts — 총 평가자산 규모를 등급(티어)으로 환산한다.
// 파이차트 가운데에 금액을 또 보여주는 대신(총자산은 이미 위에 큼직하게 있음) 등급을 보여준다.
// 경계값은 "미만" 기준. 색상은 손익색(순수 빨강/파랑)과 겹치지 않게 골랐다.

export interface Tier {
  name: string;
  color: string;
  /** 이 등급의 하한(원). 다음 등급까지의 진척도 표시에 쓸 수 있다. */
  floor: number;
}

const TIERS: { max: number; tier: Tier }[] = [
  { max: 10_000_000, tier: { name: "언랭크", color: "#9AA0A6", floor: 0 } },
  { max: 50_000_000, tier: { name: "브론즈", color: "#A9714B", floor: 10_000_000 } },
  { max: 100_000_000, tier: { name: "실버", color: "#8E99A4", floor: 50_000_000 } },
  { max: 500_000_000, tier: { name: "골드", color: "#C79A2E", floor: 100_000_000 } },
  { max: 1_000_000_000, tier: { name: "플래티넘", color: "#3FB6A8", floor: 500_000_000 } },
  { max: 3_000_000_000, tier: { name: "다이아몬드", color: "#4FB6E0", floor: 1_000_000_000 } },
  { max: 5_000_000_000, tier: { name: "루비", color: "#C2405E", floor: 3_000_000_000 } },
];
const TOP_TIER: Tier = { name: "마스터", color: "#7C5CE6", floor: 5_000_000_000 };

export function tierOf(totalAssetKrw: number | null | undefined): Tier {
  if (totalAssetKrw == null || totalAssetKrw < 0) return TIERS[0].tier;
  for (const { max, tier } of TIERS) {
    if (totalAssetKrw < max) return tier;
  }
  return TOP_TIER;
}
