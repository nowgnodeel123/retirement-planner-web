import DevTokenGate from "@/app/components/portfolio/DevTokenGate";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <DevTokenGate>{children}</DevTokenGate>
    </div>
  );
}
