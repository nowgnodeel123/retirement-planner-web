// src/app/page.tsx
import RetirementWizard from "@/app/components/wizard/RetirementWizard";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-24">
      <RetirementWizard />
    </main>
  );
}
