"use client";

import { useActionState } from "react";
import { createInquiry, type InquiryActionState } from "./actions";
import type { RoofingSystem } from "@/lib/constants/roofing-systems";

const VALUE_BANDS = [
  { v: "", label: "Not sure / decline to say" },
  { v: "LT_25K", label: "Under $25K" },
  { v: "25K_75K", label: "$25K – $75K" },
  { v: "75K_250K", label: "$75K – $250K" },
  { v: "250K_1M", label: "$250K – $1M" },
  { v: "GT_1M", label: "Over $1M" },
];

export default function InquiryForm({
  crewCompanyId,
  crewSystems,
  disabled,
}: {
  crewCompanyId: string;
  crewSystems: RoofingSystem[];
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<InquiryActionState | undefined, FormData>(
    createInquiry,
    undefined
  );

  return (
    <form
      action={action}
      className="space-y-5 p-6 rounded-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
    >
      <input type="hidden" name="subCompanyId" value={crewCompanyId} />

      {state?.error && (
        <div
          className="rounded-md p-3 text-sm"
          style={{ background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", color: "var(--status-red)" }}
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="font-mono text-[10px] tracking-[0.15em] text-text-secondary">SUBJECT</label>
        <input
          id="subject" name="subject" type="text" required maxLength={200}
          placeholder="50,000 sqft TPO replacement in Plano"
          className="w-full px-3 py-2.5 rounded-md text-sm"
          style={{ background: "var(--bg)", border: "1px solid var(--border-color)", color: "#fff" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="projectSummary" className="font-mono text-[10px] tracking-[0.15em] text-text-secondary">PROJECT SUMMARY</label>
        <textarea
          id="projectSummary" name="projectSummary" required minLength={10} maxLength={4000}
          placeholder="Scope, location, timeline, what makes this job interesting for your crew. Plain language."
          rows={6}
          className="w-full px-3 py-2.5 rounded-md text-sm resize-y"
          style={{ background: "var(--bg)", border: "1px solid var(--border-color)", color: "#fff", fontFamily: "var(--font-inter)" }}
        />
        <span className="text-xs text-text-muted">At least a couple sentences. The more concrete, the better the response.</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] tracking-[0.15em] text-text-secondary">PROJECT SYSTEMS</label>
        <p className="text-xs text-text-muted -mt-1">Only systems this crew works on are shown.</p>
        {crewSystems.length === 0 ? (
          <p className="text-sm text-text-muted">This crew hasn&apos;t listed any systems yet.</p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {crewSystems.map((sys) => (
              <label
                key={sys.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer"
                style={{ background: "var(--bg)", border: "1px solid var(--border-color)" }}
              >
                <input
                  type="checkbox"
                  name="projectSystems"
                  value={sys.id}
                  style={{ accentColor: "var(--brand-yellow)" }}
                />
                <span>{sys.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="estimatedValueBand" className="font-mono text-[10px] tracking-[0.15em] text-text-secondary">
          ESTIMATED VALUE <span className="text-text-muted">(optional)</span>
        </label>
        <select
          id="estimatedValueBand" name="estimatedValueBand"
          className="w-full px-3 py-2.5 rounded-md text-sm"
          style={{ background: "var(--bg)", border: "1px solid var(--border-color)", color: "#fff" }}
        >
          {VALUE_BANDS.map((b) => (
            <option key={b.v} value={b.v}>{b.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border-color)" }}>
        <button
          type="submit"
          disabled={disabled || pending}
          className="px-6 py-2.5 rounded-md text-sm font-bold"
          style={{
            background: disabled ? "var(--bg-card-hi)" : "var(--brand-yellow)",
            color: disabled ? "var(--text-muted)" : "var(--bg)",
            border: disabled ? "1px solid var(--border-color)" : 0,
            cursor: disabled || pending ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            fontFamily: "var(--font-montserrat)",
            letterSpacing: "0.02em",
          }}
        >
          {pending ? "Sending…" : "Send inquiry →"}
        </button>
      </div>
    </form>
  );
}
