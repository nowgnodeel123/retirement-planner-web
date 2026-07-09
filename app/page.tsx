// src/app/page.tsx
import RetirementWizard from "@/app/components/wizard/RetirementWizard";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <RetirementWizard />
    </main>
  );
}
