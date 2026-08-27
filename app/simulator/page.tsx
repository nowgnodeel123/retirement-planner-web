// app/simulator/page.tsx — 은퇴 시뮬레이터.
// D-201: 예전엔 루트(/)에 있었으나, 로그인 후 기본 진입 화면을 포트폴리오로 정하면서
// 시뮬레이터를 전용 경로로 옮겼다. 하단 탭바의 "은퇴시뮬레이션"이 이 경로를 가리킨다.
import RetirementWizard from "@/app/components/wizard/RetirementWizard";
import RequireAuth from "@/app/components/auth/RequireAuth";

export default function SimulatorPage() {
  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RequireAuth>
        <RetirementWizard />
      </RequireAuth>
    </main>
  );
}
