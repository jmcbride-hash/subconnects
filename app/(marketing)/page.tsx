import Link from "next/link";
import s from "./landing.module.css";

export const metadata = {
  title: "SubConnects — The Verified Workforce Network for Roofing",
  description:
    "Verified roofing crews and verified commercial contractors. Pick your side.",
};

export default function HomePage() {
  return (
    <section
      style={{
        // Single-screen home: fill the space between nav and footer.
        minHeight: "calc(100vh - 240px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px clamp(20px, 4vw, 56px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Yellow glow accent — same brand pattern as the prior hero */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(900px 500px at 80% 10%, rgba(248,188,1,0.10), transparent 60%), radial-gradient(700px 400px at 0% 90%, rgba(248,188,1,0.05), transparent 60%)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 880,
          textAlign: "center",
        }}
      >
        <span className={s.heroEyebrow}>
          <span className={s.heroDot} />
          THE VERIFIED WORKFORCE NETWORK FOR ROOFING
        </span>

        <h1 className={s.heroTitle} style={{ marginTop: 0 }}>
          Find roofing crews you can <span className={s.accent}>actually trust</span>.
        </h1>

        <p className={s.heroSub} style={{ marginTop: 24 }}>
          Verified commercial roofing contractors. Verified labor-only crews.
          One trust layer between them. Pick your side to get started.
        </p>

        <div className={s.heroCtas} style={{ marginTop: 48, justifyContent: "center" }}>
          <Link className={`${s.btn} ${s.btnPrimary}`} href="/for-contractors">
            I&apos;m a Contractor <span className={s.btnArrow} aria-hidden>→</span>
          </Link>
          <Link className={`${s.btn} ${s.btnSecondary}`} href="/for-crews">
            I&apos;m a Sub Crew <span className={s.btnArrow} aria-hidden>→</span>
          </Link>
        </div>

        <p
          style={{
            marginTop: 56,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          NOW BUILDING&nbsp;&nbsp;·&nbsp;&nbsp;FIRST METRO:{" "}
          <span style={{ color: "var(--brand-yellow)" }}>DALLAS-FORT WORTH</span>
        </p>
      </div>
    </section>
  );
}
