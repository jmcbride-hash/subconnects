/**
 * App shell — wraps the contractor + sub authenticated routes.
 *
 * At Stage 0 this is a stub. Once Supabase Auth is wired into real flows,
 * this layout will require a session and redirect unauthenticated visitors.
 */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="max-w-container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-[family-name:var(--font-montserrat)] font-extrabold tracking-[0.12em] text-sm">
            SUB&nbsp;CONNECTS
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted">
            APP · STAGE 0 PLACEHOLDER
          </span>
        </div>
      </div>
      <main className="max-w-container mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
