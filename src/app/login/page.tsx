"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import { PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Frame>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: "var(--color-ink)" }}>
          Sign Up
        </h1>
        <div className="space-y-3">
          <input
            className="w-full rounded-[11px] border px-4 py-3.5 text-[18px] outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
            placeholder="Pre-Set User"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            autoCapitalize="none"
          />
          <input
            className="w-full rounded-[11px] border px-4 py-3.5 text-[18px] outline-none"
            style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}
            placeholder="Pre-Set Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm mt-3" style={{ color: "var(--color-gem-ruby)" }}>
            {error}
          </p>
        )}
        <div className="flex-1" />
        <PrimaryButton variant="outline" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </PrimaryButton>
      </form>
    </Frame>
  );
}
