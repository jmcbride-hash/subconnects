import Link from "next/link";
import s from "../(auth)/auth.module.css";

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <Link href="/" className={s.logo}>
          <span className={s.logoMark} aria-hidden>SC</span>
          <span>SUB&nbsp;CONNECTS</span>
        </Link>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className={s.topLink} style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>
            Sign out
          </button>
        </form>
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>VERIFIED · TRUSTED · PERFORMANCE-DRIVEN</footer>
    </div>
  );
}
