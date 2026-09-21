"use client";

import { useState } from "react";
import Frame from "@/components/Frame";
import { PrimaryButton } from "@/components/ui";

type Result = {
  valid?: boolean;
  alreadyClaimed?: boolean;
  prizeName?: string;
  studentName?: string;
  studentCode?: string;
  error?: string;
};

export default function StaffVerifyPage() {
  const [passcode, setPasscode] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/staff/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, passcode }),
    });
    const data = await res.json();
    setResult(res.ok ? data : { error: data.error });
    setBusy(false);
  }

  return (
    <Frame>
      <h1 className="text-xl font-bold mb-5" style={{ color: "var(--color-ink)" }}>
        Prize Desk — Verify Code
      </h1>
      <form onSubmit={handleCheck} className="flex flex-col gap-3">
        <input
          className="w-full rounded-[11px] border px-4 py-3.5 text-[18px] outline-none"
          style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
          placeholder="Staff passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
        <input
          className="w-full rounded-[11px] border px-4 py-3.5 text-[18px] outline-none uppercase tracking-widest"
          style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
          placeholder="Student's code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Checking…" : "Check code"}
        </PrimaryButton>
      </form>

      {result && (
        <div className="mt-6 text-center">
          {result.error && <p style={{ color: "var(--color-gem-ruby)" }}>{result.error}</p>}
          {result.valid && (
            <>
              <p className="text-2xl mb-2">✅</p>
              <p className="font-bold" style={{ color: "var(--color-success)" }}>
                Valid — {result.prizeName}
              </p>
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
                {result.studentName} ({result.studentCode})
              </p>
            </>
          )}
          {result.alreadyClaimed && (
            <>
              <p className="text-2xl mb-2">⚠️</p>
              <p className="font-bold" style={{ color: "var(--color-gem-ruby)" }}>
                Already claimed — {result.prizeName}
              </p>
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
                {result.studentName}
              </p>
            </>
          )}
        </div>
      )}
    </Frame>
  );
}
