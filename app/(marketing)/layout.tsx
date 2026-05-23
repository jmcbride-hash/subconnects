import Link from "next/link";
import s from "./landing.module.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className={s.nav} aria-label="Primary">
        <div className={`${s.container} ${s.navInner}`}>
          <Link href="/" className={s.logo}>
            <span className={s.logoMark} aria-hidden>SC</span>
            <span>SUB&nbsp;CONNECTS</span>
          </Link>
          <div className={s.navLinks}>
            <Link className={s.navLink} href="/how-it-works">How it works</Link>
            <Link className={s.navLink} href="/for-contractors">For Contractors</Link>
            <Link className={s.navLink} href="/for-crews">For Crews</Link>
            <Link className={s.navLink} href="/sign-in" style={{ color: "var(--text-muted)" }}>Sign in</Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer
        style={{
          padding: "32px 24px",
          borderTop: "1px solid var(--border-color)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        VERIFIED · TRUSTED · PERFORMANCE-DRIVEN
        <div style={{ marginTop: 12, fontSize: 11, letterSpacing: "0.05em" }}>
          © 2026 SubConnects · <Link href="/how-it-works" style={{ color: "var(--text-muted)" }}>How it works</Link>
        </div>
      </footer>
    </>
  );
}
