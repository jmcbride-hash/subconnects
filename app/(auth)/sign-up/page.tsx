"use client";

import { useActionState } from "react";
import Link from "next/link";
import s from "../auth.module.css";
import { signUp, type SignUpState } from "./actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState<SignUpState | undefined, FormData>(
    signUp,
    undefined
  );

  return (
    <div className={s.card}>
      <div className={s.eyebrow}>CREATE AN ACCOUNT</div>
      <h1 className={s.title}>Get on the verified network.</h1>
      <p className={s.subtitle}>
        Contractors and crews both start here. We&apos;ll ask which side you&apos;re on after sign-up.
      </p>

      {state?.error && <div className={s.error}>{state.error}</div>}
      {state?.ok && (
        <div className={s.success}>
          Check <strong>{state.email}</strong> for a confirmation link to finish signing up.
        </div>
      )}

      {!state?.ok && (
        <form action={formAction} noValidate>
          <div className={s.field}>
            <label className={s.label} htmlFor="fullName">FULL NAME</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className={s.input}
              placeholder="Your name"
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="email">WORK EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={s.input}
              placeholder="you@company.com"
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="password">PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              className={s.input}
              placeholder="At least 10 characters"
            />
            <div className={s.hint}>10+ characters. Use a passphrase if you can.</div>
          </div>
          <button type="submit" className={s.submit} disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <div className={s.alt}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </div>
    </div>
  );
}
