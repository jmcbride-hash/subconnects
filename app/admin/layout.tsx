import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import s from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <div className={s.topbarInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/admin" className={s.logo}>
              <span className={s.logoMark} aria-hidden>SC</span>
              <span>SUB&nbsp;CONNECTS</span>
            </Link>
            <span className={s.adminBadge}>ADMIN</span>
          </div>
          <div className={s.crumbs}>
            <Link href="/admin">Queue</Link>
            <span className={s.crumbSep}>·</span>
            <Link href="/admin/verifications">Verifications</Link>
          </div>
          <div className={s.userMenu}>
            <span className={s.userMail}>{ctx.user.email}</span>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className={s.signoutBtn}>Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>
        VERIFIED · TRUSTED · PERFORMANCE-DRIVEN  ·  INTERNAL
      </footer>
    </div>
  );
}
