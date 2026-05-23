"use client";

import { useActionState } from "react";
import Link from "next/link";
import s from "../onboard.module.css";
import { createContractorCompany, type ContractorOnboardState } from "./actions";

export default function ContractorOnboardPage() {
  const [state, action, pending] = useActionState<ContractorOnboardState | undefined, FormData>(
    createContractorCompany,
    undefined
  );

  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>STEP 2 OF 2 · CONTRACTOR PROFILE</div>
      <h1 className={s.title}>Tell us about your company.</h1>
      <p className={s.subtitle}>
        Takes about 3 minutes. After you submit, our team kicks off verification — we&apos;ll
        contact you for insurance and license documents within 1 business day.
      </p>

      <form action={action} className={s.formCard} noValidate>
        {state?.error && <div className={s.error}>{state.error}</div>}

        <div className={s.sectionHead}>COMPANY DETAILS</div>
        <div className={s.field}>
          <label className={s.label} htmlFor="legalName">LEGAL COMPANY NAME</label>
          <input id="legalName" name="legalName" className={s.input} required placeholder="Acme Roofing Holdings LLC" />
        </div>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="displayName">DISPLAY NAME</label>
            <input id="displayName" name="displayName" className={s.input} required placeholder="Acme Roofing" />
            <div className={s.hint}>What contractors and crews will see.</div>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="primaryPhone">PRIMARY PHONE</label>
            <input id="primaryPhone" name="primaryPhone" type="tel" className={s.input} required placeholder="(214) 555-0123" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="website">WEBSITE <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
          <input id="website" name="website" type="url" className={s.input} placeholder="https://acmeroofing.com" />
        </div>

        <div className={s.sectionHead}>HEADQUARTERS</div>
        <div className={s.field}>
          <label className={s.label} htmlFor="hqStreet">STREET ADDRESS</label>
          <input id="hqStreet" name="hqStreet" className={s.input} required placeholder="1234 Commerce St" autoComplete="street-address" />
        </div>
        <div className={s.rowTri}>
          <div className={s.field}>
            <label className={s.label} htmlFor="hqCity">CITY</label>
            <input id="hqCity" name="hqCity" className={s.input} required placeholder="Dallas" autoComplete="address-level2" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="hqState">STATE</label>
            <input id="hqState" name="hqState" className={s.input} required placeholder="TX" maxLength={2} autoComplete="address-level1" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="hqPostalCode">ZIP</label>
            <input id="hqPostalCode" name="hqPostalCode" className={s.input} required placeholder="75201" autoComplete="postal-code" />
          </div>
        </div>

        <div className={s.sectionHead}>LICENSE / BUSINESS REGISTRATION</div>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="licenseNumber">LICENSE OR REGISTRATION #</label>
            <input id="licenseNumber" name="licenseNumber" className={s.input} required placeholder="TX-1234567890" />
            <div className={s.hint}>State contractor license, city registration, or Secretary of State filing #.</div>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="licenseState">ISSUING STATE</label>
            <input id="licenseState" name="licenseState" className={s.input} required placeholder="TX" maxLength={2} />
          </div>
        </div>

        <div className={s.sectionHead}>COMPANY PROFILE</div>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label} htmlFor="yearFounded">YEAR FOUNDED <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <input id="yearFounded" name="yearFounded" type="number" min={1900} max={new Date().getFullYear()} className={s.input} placeholder="2014" />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="employeeCountBand">EMPLOYEE COUNT</label>
            <select id="employeeCountBand" name="employeeCountBand" className={s.select} required defaultValue="">
              <option value="" disabled>Select a range</option>
              <option value="1-10">1 - 10</option>
              <option value="11-50">11 - 50</option>
              <option value="51-200">51 - 200</option>
              <option value="201+">201+</option>
            </select>
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="about">ABOUT YOUR COMPANY <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
          <textarea id="about" name="about" className={s.textarea} placeholder="Commercial flat roofing in DFW since 2014. TPO and EPDM specialists. We pay our subs on time." />
          <div className={s.hint}>One short paragraph. Plain language, no marketing fluff.</div>
        </div>

        <div className={s.sectionHead}>VERIFICATION DOCUMENTS</div>
        <div className={s.field}>
          <div className={s.file}>
            <strong>UPLOAD ON YOUR DASHBOARD</strong>
            After you submit this form, you&apos;ll land on your dashboard where you can upload your
            Certificate of Insurance and license documentation. Our team verifies them within 1 business day.
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
