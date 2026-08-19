import RequireAuth from "@/app/components/auth/RequireAuth";

export default function MyLayout({
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
