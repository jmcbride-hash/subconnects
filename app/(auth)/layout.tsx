import s from "./auth.module.css";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <Link href="/" className={s.logo}>
          <span className={s.logoMark} aria-hidden>SC</span>
          <span>SUB&nbsp;CONNECTS</span>
        </Link>
        <Link href="/" className={s.topLink}>← Back to site</Link>
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</footer>
    </div>
  );
}
