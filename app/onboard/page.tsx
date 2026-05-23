import Link from "next/link";
import s from "./onboard.module.css";

export const metadata = { title: "Get started · SubConnects" };

export default function OnboardPage() {
  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>STEP 1 OF 2 · CHOOSE YOUR SIDE</div>
      <h1 className={s.title}>Which side are you on?</h1>
      <p className={s.subtitle}>
        SubConnects is a two-sided network. Contractors hire verified crews; crews build a verified
        profile that travels with them. Pick which one you are and we&apos;ll take it from there.
      </p>

      <div className={s.roleGrid}>
        <Link href="/onboard/contractor" className={s.roleCard}>
          <div className={s.roleLabel}>FOR HIRING CREWS</div>
          <h2 className={s.roleTitle}>I&apos;m a Contractor.</h2>
          <p className={s.roleBody}>
            You run a commercial roofing operation and need verified crews to staff jobs.
            $299/month gets you full directory access.
          </p>
        </Link>
        <Link href="/onboard/crew" className={s.roleCard}>
          <div className={s.roleLabel}>FOR GETTING HIRED</div>
          <h2 className={s.roleTitle}>I&apos;m a Sub Crew.</h2>
          <p className={s.roleBody}>
            You install roofs. You want to be verified, get found by serious contractors, and
            build a reputation. Free at the baseline.
          </p>
        </Link>
      </div>
    </div>
  );
}
