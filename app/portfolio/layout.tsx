import RequireAuth from "@/app/components/portfolio/RequireAuth";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RequireAuth>{children}</RequireAuth>
    </div>
  );
}
