"use client";

import { useEffect, useRef } from "react";

/**
 * Mounts a Tally form via the official inline iframe with dynamic-height.
 *
 * Usage:
 *   <TallyForm formId="abc123" />
 *   <TallyForm formId="abc123" hideTitle transparentBackground />
 *
 * When `formId` is empty/null, renders a placeholder block so the page
 * never breaks during pre-launch setup. Pass `placeholder` to customize it.
 */

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void };
  }
}

const TALLY_SCRIPT_SRC = "https://tally.so/widgets/embed.js";

type Props = {
  formId: string | undefined | null;
  hideTitle?: boolean;
  transparentBackground?: boolean;
  alignLeft?: boolean;
  placeholder?: React.ReactNode;
  minHeight?: number;
};

export default function TallyForm({
  formId,
  hideTitle = true,
  transparentBackground = true,
  alignLeft = true,
  placeholder,
  minHeight = 320,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formId) return;

    // Inject Tally's official script if not already on the page.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TALLY_SCRIPT_SRC}"]`
    );
    if (existing) {
      // Already loaded — ask Tally to (re)scan for embed iframes.
      if (window.Tally) window.Tally.loadEmbeds();
      else existing.addEventListener("load", () => window.Tally?.loadEmbeds());
      return;
    }
    const script = document.createElement("script");
    script.src = TALLY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => window.Tally?.loadEmbeds();
    document.body.appendChild(script);
  }, [formId]);

  if (!formId) {
    return (
      <div
        style={{
          padding: "36px 20px",
          background: "var(--bg-card-hi)",
          border: "1px dashed var(--border-color)",
          borderRadius: 8,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          textAlign: "center",
          lineHeight: 1.7,
        }}
      >
        {placeholder ?? (
          <>
            <strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "var(--brand-yellow)",
                fontWeight: 600,
              }}
            >
              TALLY FORM EMBED
            </strong>
            Set the form ID via env var to activate (see TALLY.md).
          </>
        )}
      </div>
    );
  }

  // Tally's dynamic-height iframe — the official script auto-resizes it once mounted.
  const src = `https://tally.so/embed/${formId}?${new URLSearchParams({
    alignLeft: alignLeft ? "1" : "0",
    hideTitle: hideTitle ? "1" : "0",
    transparentBackground: transparentBackground ? "1" : "0",
    dynamicHeight: "1",
  })}`;

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <iframe
        data-tally-src={src}
        loading="lazy"
        width="100%"
        height={String(minHeight)}
        frameBorder={0}
        style={{ border: 0, margin: 0, width: "100%", background: "transparent" }}
        title="SubConnects waitlist form"
      />
    </div>
  );
}
