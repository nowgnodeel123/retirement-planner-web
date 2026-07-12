import DevTokenGate from "@/app/components/portfolio/DevTokenGate";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 pb-24">
      <DevTokenGate>{children}</DevTokenGate>
    </div>
  );
}
