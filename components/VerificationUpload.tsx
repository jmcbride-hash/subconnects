"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

type Prefix = "coi" | "license" | "reference";

export function VerificationUpload({
  verificationId,
  prefix,
  label,
  alreadyUploaded,
}: {
  verificationId: string;
  prefix: Prefix;
  label: string;
  alreadyUploaded?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">(
    alreadyUploaded ? "done" : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setProgress(0);
    setStatus("uploading");

    try {
      // 1. Ask the server for a presigned PUT URL.
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          prefix,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          contentLength: file.size,
        }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok || !presign.ok) {
        throw new Error(presign.error || `Presign failed (${presignRes.status})`);
      }

      // 2. PUT the file directly to S3 using XHR (for upload progress).
      await uploadWithProgress(presign.uploadUrl, file, (pct) => setProgress(pct));

      // 3. Tell the server to save the resulting key on the verification row.
      setStatus("saving");
      const attachRes = await fetch("/api/uploads/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, key: presign.key }),
      });
      const attach = await attachRes.json();
      if (!attachRes.ok || !attach.ok) {
        throw new Error(attach.error || `Attach failed (${attachRes.status})`);
      }

      setStatus("done");
      // Refresh the surrounding server-rendered list so it reflects the new state.
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("[VerificationUpload]", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
      style={{ background: "var(--bg)", border: "1px solid var(--border-color)" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-white">{label}</span>
        {status === "idle" && (
          <span className="text-xs text-text-muted">PDF, PNG, JPG, or HEIC · up to 20MB</span>
        )}
        {status === "uploading" && (
          <span className="text-xs text-brand-yellow">Uploading… {progress}%</span>
        )}
        {status === "saving" && (
          <span className="text-xs text-brand-yellow">Finalizing…</span>
        )}
        {status === "done" && (
          <span className="text-xs text-status-green">✓ Uploaded · awaiting admin review</span>
        )}
        {status === "error" && error && (
          <span className="text-xs text-status-red">{error}</span>
        )}
      </div>
      <label
        className="px-3 py-2 rounded-md text-xs font-bold cursor-pointer"
        style={{
          background: status === "done" ? "var(--bg-card-hi)" : "var(--brand-yellow)",
          color: status === "done" ? "var(--text-muted)" : "var(--bg)",
          border: status === "done" ? "1px solid var(--border-color)" : 0,
          fontFamily: "var(--font-montserrat)",
          letterSpacing: "0.04em",
          minWidth: 110,
          textAlign: "center",
        }}
      >
        {status === "done" ? "Replace" : status === "uploading" || status === "saving" ? "Working…" : "Choose file"}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/heic,image/heif"
          className="hidden"
          style={{ display: "none" }}
          onChange={onFileChange}
          disabled={status === "uploading" || status === "saving"}
        />
      </label>
    </div>
  );
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 PUT failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
