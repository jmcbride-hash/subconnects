"use client";

import { useActionState } from "react";
import Link from "next/link";
import s from "../onboard.module.css";
import { createCrewCompany, type CrewOnboardState } from "./actions";
import { ROOFING_SYSTEMS_BY_CATEGORY, CATEGORY_LABELS } from "@/lib/constants/roofing-systems";

export default function CrewOnboardPage() {
  const [state, action, pending] = useActionState<CrewOnboardState | undefined, FormData>(
    createCrewCompany,
    undefined
  );

  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>STEP 2 OF 2 · CREW PROFILE</div>
      <h1 className={s.title}>Tell us about your crew.</h1>
      <p className={s.subtitle}>
        Takes about 5 minutes. We&apos;ll call every reference and verify your documents by hand —
        that&apos;s the whole point of being on this network.
      </p>

      <form action={action} className={s.formCard} noValidate>
        {state?.error && <div className={s.error}>{state.error}</div>}

        <div className={s.sectionHead}>CREW DETAILS</div>
        <div className={s.field}>
          <label className={s.label} htmlFor="legalName">LEGAL CREW / COMPANY NAME</label>
          <input id="legalName" name="legalName" className={s.input} required placeholder="Lone Star Roofing Crews LLC" />
        </div>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="displayName">DISPLAY NAME</label>
            <input id="displayName" name="displayName" className={s.input} required placeholder="Lone Star Crews" />
            <div className={s.hint}>What contractors will see in search.</div>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="primaryPhone">PHONE</label>
            <input id="primaryPhone" name="primaryPhone" type="tel" className={s.input} required placeholder="(214) 555-0188" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="website">WEBSITE <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
          <input id="website" name="website" type="url" className={s.input} placeholder="https://lonestarcrews.com" />
        </div>
        <div className={s.rowTri}>
          <div className={s.field}>
            <label className={s.label} htmlFor="foremanName">FOREMAN NAME</label>
            <input id="foremanName" name="foremanName" className={s.input} required placeholder="Mike Torres" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="crewSize">CREW SIZE</label>
            <input id="crewSize" name="crewSize" type="number" min={1} max={500} className={s.input} required placeholder="6" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="yearsInTrade">YEARS IN TRADE</label>
            <input id="yearsInTrade" name="yearsInTrade" type="number" min={0} max={80} className={s.input} placeholder="12" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" name="willingToTravel" style={{ width: 16, height: 16, accentColor: "var(--brand-yellow)" }} />
            <span>We&apos;ll travel for overnight jobs outside our base radius.</span>
          </label>
        </div>

        <div className={s.sectionHead}>BASE & SERVICE AREA</div>
        <div className={s.field}>
          <label className={s.label} htmlFor="baseStreet">BASE STREET ADDRESS</label>
          <input id="baseStreet" name="baseStreet" className={s.input} required placeholder="5678 Industrial Blvd" autoComplete="street-address" />
        </div>
        <div className={s.rowTri}>
          <div className={s.field}>
            <label className={s.label} htmlFor="baseCity">CITY</label>
            <input id="baseCity" name="baseCity" className={s.input} required placeholder="Fort Worth" autoComplete="address-level2" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="baseState">STATE</label>
            <input id="baseState" name="baseState" className={s.input} required placeholder="TX" maxLength={2} autoComplete="address-level1" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="basePostalCode">ZIP</label>
            <input id="basePostalCode" name="basePostalCode" className={s.input} required placeholder="76102" autoComplete="postal-code" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="serviceRadiusMiles">SERVICE RADIUS (MILES)</label>
          <input id="serviceRadiusMiles" name="serviceRadiusMiles" type="number" min={1} max={500} className={s.input} required placeholder="75" />
          <div className={s.hint}>How far you typically travel from your base for day jobs.</div>
        </div>

        <div className={s.sectionHead}>SYSTEMS YOU WORK ON</div>
        <div className={s.hint} style={{ marginBottom: 12 }}>Pick all that apply. You&apos;ll be able to earn skill-specific badges later.</div>
        {Object.entries(ROOFING_SYSTEMS_BY_CATEGORY).map(([cat, systems]) => (
          systems.length > 0 && (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 8 }}>
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS].toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {systems.map((sys) => (
                  <label key={sys.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" name="systems" value={sys.id} style={{ accentColor: "var(--brand-yellow)" }} />
                    <span>{sys.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        ))}

        <div className={s.sectionHead}>ABOUT THE CREW <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></div>
        <div className={s.field}>
          <textarea id="about" name="about" className={s.textarea} placeholder="Commercial TPO and EPDM crew based in Fort Worth. 12 years in the trade. Foreman has GAF Master training." />
          <div className={s.hint}>One short paragraph. What you specialize in. Plain language.</div>
        </div>

        <div className={s.sectionHead}>REFERENCES</div>
        <div className={s.hint} style={{ marginBottom: 16 }}>
          Two required, three preferred. Contractors you&apos;ve worked with who&apos;ll vouch for you. We call every one.
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: 18, background: "var(--bg)", border: "1px solid var(--border-color)", borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--brand-yellow)", marginBottom: 12 }}>
              REFERENCE #{i + 1} {i < 2 ? "(required)" : "(optional)"}
            </div>
            <div className={s.row}>
              <div className={s.field} style={{ marginBottom: 10 }}>
                <label className={s.label} htmlFor={`ref_name_${i}`}>CONTACT NAME</label>
                <input id={`ref_name_${i}`} name={`ref_name_${i}`} className={s.input} placeholder="Jane Doe" />
              </div>
              <div className={s.field} style={{ marginBottom: 10 }}>
                <label className={s.label} htmlFor={`ref_phone_${i}`}>PHONE</label>
                <input id={`ref_phone_${i}`} name={`ref_phone_${i}`} type="tel" className={s.input} placeholder="(214) 555-0144" />
              </div>
            </div>
            <div className={s.row}>
              <div className={s.field} style={{ marginBottom: 10 }}>
                <label className={s.label} htmlFor={`ref_company_${i}`}>THEIR COMPANY <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <input id={`ref_company_${i}`} name={`ref_company_${i}`} className={s.input} placeholder="Doe Commercial Roofing" />
              </div>
              <div className={s.field} style={{ marginBottom: 10 }}>
                <label className={s.label} htmlFor={`ref_completed_${i}`}>LAST JOB COMPLETED <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <input id={`ref_completed_${i}`} name={`ref_completed_${i}`} type="date" className={s.input} />
              </div>
            </div>
            <div className={s.field} style={{ marginBottom: 0 }}>
              <label className={s.label} htmlFor={`ref_summary_${i}`}>LAST JOB SUMMARY <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
              <input id={`ref_summary_${i}`} name={`ref_summary_${i}`} className={s.input} placeholder="50,000 sqft TPO replacement in Plano, May 2025" />
            </div>
          </div>
        ))}

        <div className={s.sectionHead}>VERIFICATION DOCUMENTS</div>
        <div className={s.field}>
          <div className={s.file}>
            <strong>UPLOAD ON YOUR DASHBOARD</strong>
            After you submit this form, you&apos;ll land on your dashboard where you can upload your
            Certificate of Insurance and business registration. Our team also calls each reference
            you submitted above.
          </div>
        </div>

        <div className={s.actions}>
          <Link href="/onboard" className={s.back}>← Change role</Link>
          <button type="submit" className={s.submit} disabled={pending}>
            {pending ? "Saving…" : "Submit for verification"}
          </button>
        </div>
      </form>
    </div>
  );
}
