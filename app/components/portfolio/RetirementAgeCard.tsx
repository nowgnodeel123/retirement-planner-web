// RetirementAgeCard.tsx — D-219: 포트폴리오 메인의 "은퇴 가능 나이" 카드.
//
// WHY 이 카드가 있는가(D-217): 경쟁사는 자산 현황(데이터)을 보여주고, 네스트는 그게
// 은퇴 시점에 충분한지(답)를 보여준다는 게 제품의 차별화 문구다. 그런데 그 '답'이
// 위저드를 열어야만 나오면 매일 여는 화면에서는 차별화가 보이지 않는다.
// 이 카드가 그 문구를 화면에 실체로 올려놓는 자리다.
//
// 값은 저장된 게 아니라 매번 계산된 것이다(D-050) — 주식이 오르면 나이가 앞당겨진다.
import Link from "next/link";
import { RetirementAgeCardResponse } from "./types";

export function RetirementAgeCard({
  card,
}: {
  card: RetirementAgeCardResponse | "hidden" | null;
}) {
  // 조회 실패. 카드 자리를 통째로 비운다 — 안내 문구로 대체하면 이미 시뮬레이터를 돌린
  // 사용자에게 거짓 상태를 보여주게 된다.
  if (card === "hidden") {
    return null;
  }

  if (card === null) {
    return (
      <div className="mb-3 animate-pulse">
        <div
          className="w-full h-[76px] rounded-2xl"
          style={{ background: "var(--surface-pressed)" }}
        />
      </div>
    );
  }

  // 시뮬레이터를 한 번도 안 돌린 사용자. 임의의 기본값으로 그럴듯한 나이를 지어내지
  // 않고(월소득·목표 생활비는 사용자만 아는 값), 한 번 돌려보라고 안내만 한다.
  if (!card.hasProfile) {
    return (
      <Link
        href="/simulator"
        className="flex items-center justify-between rounded-[var(--r-button)] px-4 py-3 border tappable
          hover:brightness-[0.98] active:scale-[0.99]"
        style={{
          marginBottom: "var(--rhythm-section)",
          background: "var(--accent-soft)",
          borderColor: "var(--border)",
        }}
      >
        <div>
          <p
            className="font-semibold fs-body"
            style={{ color: "var(--accent)" }}
          >
            이 자산이면 몇 살에 은퇴할 수 있을까요?
          </p>
          <p className="mt-1 fs-caption" style={{ color: "var(--text-sub)" }}>
            한 번 계산해두면 여기에 계속 표시돼요
          </p>
        </div>
        <span className="fs-body" style={{ color: "var(--accent)" }}>
          →
        </span>
      </Link>
    );
  }

  // 탐색 상한 나이까지도 목표를 못 채우는 경우. 축하 톤으로 나이를 크게 띄우면 오해를 부르므로
  // 문구와 색을 바꾼다(위저드 결과 화면의 feasible 처리와 같은 규칙).
  // 상한값(현재 75)은 문구에 박지 않고 estimatedRetirementAge를 그대로 쓴다 — infeasible일 때
  // 서버가 이 필드에 탐색 상한을 실어주므로, 백엔드 MAX_SEARCH_AGE가 바뀌어도 문구가 낡지 않는다.
  const infeasible = card.feasible === false;

  return (
    <Link
      href="/simulator"
      className="block rounded-[var(--r-button)] px-4 py-3 border tappable
        hover:brightness-[0.98] active:scale-[0.99]"
      style={{
        marginBottom: "var(--rhythm-section)",
        background: infeasible ? "var(--warning-soft)" : "var(--accent-soft)",
        borderColor: infeasible ? "var(--warning)" : "var(--border)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <p
          className="font-medium fs-caption"
          style={{ color: "var(--text-sub)" }}
        >
          지금 자산이면
        </p>
        {/* --text-faint는 흰 배경 기준으로 잡힌 색이라, 이 카드의 accent-soft 위에서는
            라이트 4.49 / 다크 4.13으로 AA(4.5)에 아슬하게 못 미쳤다(실측).
            한 단계 진한 --text-sub로 올린다 — 위계상으로도 이 줄은 각주가 아니라
            "무슨 기준으로 계산했는지"를 밝히는 전제라 각주보다 뚜렷한 게 맞다. */}
        <span className="fs-caption" style={{ color: "var(--text-sub)" }}>
          월 {card.targetMonthlyExpense?.toLocaleString()}만원 기준
        </span>
      </div>

      {infeasible ? (
        <p
          className="font-bold mt-1 fs-title"
          style={{ color: "var(--warning)" }}
        >
          {card.estimatedRetirementAge}세까지도 목표를 채우기 어려워요
        </p>
      ) : (
        <p
          className="font-bold mt-1 fs-metric"
          style={{ color: "var(--text-strong)" }}
        >
          {card.estimatedRetirementAge}세에 은퇴 가능
        </p>
      )}

      {card.excludedCount > 0 && (
        <p className="mt-1 fs-caption" style={{ color: "var(--warning)" }}>
          시세를 못 가져온 자산 {card.excludedCount}건은 빠져 있어요
        </p>
      )}
    </Link>
  );
}
