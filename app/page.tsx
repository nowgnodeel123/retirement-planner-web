// src/app/page.tsx
import RetirementWizard from "@/app/components/wizard/RetirementWizard";
import RequireAuth from "@/app/components/auth/RequireAuth";

export default function Home() {
  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <RequireAuth>
        <RetirementWizard />
      </RequireAuth>
    </main>
  );
}
