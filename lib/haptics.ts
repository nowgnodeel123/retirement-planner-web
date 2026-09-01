// lib/haptics.ts — 촉각 피드백.
//
// 원칙: 화면에 이미 시각적 변화가 있는 동작에는 햅틱을 얹지 않는다. 일반 버튼처럼
// 눌린 상태가 눈에 보이는 곳까지 진동시키면 금세 소음이 되어 정작 필요한 순간의
// 신호가 묻힌다. 대신 "손가락이 화면을 붙잡았는지"가 눈으로 확인되지 않는 제스처
// — 꾹 눌러 잡기, 순서가 한 칸 넘어가기, 놓아서 확정하기 — 에만 쓴다.
//
// 지원 범위: Web Vibration API는 안드로이드 크롬 계열에서 동작하고 iOS 사파리는
// 지원하지 않는다(navigator.vibrate 자체가 없음). 미지원 기기에서는 조용히 no-op이
// 되도록 감싸두었으므로 호출부는 분기할 필요가 없다.
type Haptic = "grab" | "step" | "drop";

// 길이는 짧게 — 20ms를 넘기면 "울린다"고 느껴진다. 잡기가 가장 또렷하고,
// 한 칸 이동은 거의 인지되지 않을 만큼 얕게, 확정은 두 번 끊어 마무리감을 준다.
const PATTERN: Record<Haptic, number | number[]> = {
  grab: 18,
  step: 8,
  drop: [12, 28, 16],
};

export function haptic(kind: Haptic): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate?.bind(navigator);
  if (!vibrate) return;
  try {
    vibrate(PATTERN[kind]);
  } catch {
    // 일부 브라우저는 사용자 제스처 밖 호출을 예외로 던진다 — 피드백이라 무시해도 된다.
  }
}
