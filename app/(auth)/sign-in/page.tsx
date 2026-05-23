"use client";

import { useActionState } from "react";
import Link from "next/link";
import s from "../auth.module.css";
import { signIn, type SignInState } from "./actions";

export default function SignInPage() {
  const [state, formAction, pending] = useActionState<SignInState | undefined, FormData>(
    signIn,
    undefined
  );

  return (
    <div className={s.card}>
      <div className={s.eyebrow}>SIGN IN</div>
      <h1 className={s.title}>Welcome back.</h1>
      <p className={s.subtitle}>The verified workforce network. Direct, professional, trust-driven.</p>

      {state?.error && <div className={s.error}>{state.error}</div>}

      <form action={formAction} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="email">EMAIL</label>
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
            autoComplete="current-password"
            required
            className={s.input}
            placeholder="Your password"
          />
        </div>
        <button type="submit" className={s.submit} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className={s.alt}>
        New to SubConnects? <Link href="/sign-up">Create an account</Link>
      </div>
    </div>
  );
}
