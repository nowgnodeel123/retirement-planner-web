import RequireAuth from "@/app/components/auth/RequireAuth";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // pb-24는 고정 하단 탭바에 콘텐츠가 가리지 않게 하는 여백이다.
  // 하위 페이지 컨테이너에 같은 여백을 또 주지 말 것 — 이중으로 걸리면
  // 문서 높이가 항상 100vh를 넘어 모든 화면이 조금씩 스크롤된다.
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RequireAuth>{children}</RequireAuth>
    </div>
  );
}
