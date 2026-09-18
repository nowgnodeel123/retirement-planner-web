// Section.tsx — 화면을 "이름 있는 구역"으로 끊는 공용 컴포넌트.
//
// 왜 만들었나: 화면마다 카드가 세로로 쌓여 있는데 각 카드가 무엇인지 말해주는 이름이
// 없어서, 사용자 피드백에 반복해서 "붕 뜬다"가 나왔다. D-231에서 수직 리듬 토큰
// (--rhythm-tight/group/section/block)을 세웠지만 간격만으로는 묶음의 경계를 못 만든다 —
// 간격은 "이건 저것과 다르다"까지만 말하고 "이 묶음은 무엇이다"는 말하지 못한다.
// 그래서 묶음마다 라벨을 얹고, 라벨과 본문 사이 간격은 --rhythm-tight, 섹션 사이는
// --rhythm-section으로 고정해 화면 전체에서 같은 리듬이 반복되게 한다.
//
// 장식(구분선·배경 박스)을 더 넣지 않은 이유: 이미 .card가 배경 + 헤어라인 테두리 +
// elevation을 갖고 있어서, 여기에 섹션 배경까지 깔면 표면이 3겹으로 쌓인다(페이지 →
// 섹션 → 카드). D-205에서 글래스를 철회하며 정한 미니멀리즘 기준과도 어긋난다.
// 이름 + 일정한 리듬만으로 구분감을 만든다.
//
// action: 섹션에 딸린 조작(정렬·추가 등)을 라벨 오른쪽에 둔다. 조작을 카드 안이나
// 화면 상단 헤더에 흩어두면 "이 버튼이 무엇에 작용하는가"가 안 드러난다 —
// 라벨 옆에 붙어 있으면 작용 대상이 그 섹션이라는 게 위치만으로 설명된다.
// 일원화 메모: 이 개념이 예전엔 네 군데에 따로 있었다 —
//   app/my/page.tsx의 SectionLabel, app/my/profile/page.tsx의 SectionLabel(동일 복사본),
//   app/login/page.tsx의 SectionLabel(tracking-wide·여백만 다른 변종),
//   그리고 화면마다 흩어진 인라인 <p className="fs-body font-semibold">.
// 색까지 갈려 있었다(--text-faint vs --text-sub). 같은 것이 네 벌이면 하나를 고쳐도
// 나머지가 안 따라오므로 여기로 모았다. 색은 --text-sub로 통일한다 — 섹션 라벨은
// 화면 구조를 읽는 단서라 각주(--text-faint)보다 한 단계 뚜렷해야 한다.
import type { ReactNode } from "react";

export function SectionHeader({
  label,
  action,
  hint,
}: {
  label: string;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <div
      className="flex items-end justify-between gap-2 px-1"
      style={{ marginBottom: "var(--rhythm-tight)" }}
    >
      <div className="min-w-0">
        <h2
          className="fs-body font-semibold"
          style={{ color: "var(--text-sub)" }}
        >
          {label}
        </h2>
        {hint && (
          <p className="fs-caption mt-1" style={{ color: "var(--text-faint)" }}>
            {hint}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-1 flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * 설정 화면처럼 "라벨 + 행 묶음"이 반복되는 목록용 라벨.
 * SectionHeader와 달리 우측 조작(action)을 받지 않고 위쪽 여백을 스스로 준다.
 */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="fs-body font-semibold px-1 first:mt-0"
      style={{
        marginTop: "var(--rhythm-section)",
        marginBottom: "var(--rhythm-tight)",
        color: "var(--text-sub)",
      }}
    >
      {children}
    </p>
  );
}

export function Section({
  label,
  action,
  hint,
  children,
  /** 화면의 첫 섹션이면 위 여백을 없앤다. */
  first = false,
  className,
}: {
  label?: string;
  action?: ReactNode;
  hint?: string;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <section
      className={className}
      style={{ marginTop: first ? 0 : "var(--rhythm-section)" }}
    >
      {label && <SectionHeader label={label} action={action} hint={hint} />}
      {children}
    </section>
  );
}

/**
 * 한 장의 카드 안에서 항목을 끊는 구분선. 항목마다 카드를 따로 띄우면 화면이
 * 조각나 보이는 문제(D-236에서 수익 목록으로 이미 겪음)를 카드 한 장 + 구분선으로
 * 푼다. 첫 항목 위에는 선을 긋지 않는다.
 */
export function RowDivider() {
  return (
    <div
      aria-hidden="true"
      style={{ height: 1, background: "var(--border)", opacity: 0.7 }}
    />
  );
}
