// src/app/page.tsx
import RetirementWizard from "@/app/components/wizard/RetirementWizard";

export default function Home() {
  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RetirementWizard />
    </main>
  );
}
