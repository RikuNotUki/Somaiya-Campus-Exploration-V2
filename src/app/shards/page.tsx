"use client";

import { useEffect, useState } from "react";
import Frame from "@/components/Frame";
import { TopBar, PrimaryButton, GemDot } from "@/components/ui";

export default function ShardsPage() {
  const [shardsAvailable, setShardsAvailable] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setShardsAvailable(data.shardsAvailable);
      });
  }

  useEffect(load, []);

  async function handleCombine() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/shards/combine", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
    } else {
      setMessage("Crystallised 1 Joker Gem!");
      load();
    }
    setBusy(false);
  }

  const inCurrentSet = shardsAvailable !== null ? shardsAvailable % 5 : 0;
  const canCombine = (shardsAvailable ?? 0) >= 5;

  return (
    <Frame>
      <TopBar title="Combine Shards" back="/home" />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-9 h-9 rotate-45 rounded-[4px]"
              style={{
                background: i < inCurrentSet ? "var(--color-gem-joker)" : "var(--color-surface-muted)",
                border: `1.4px solid var(--color-border-strong)`,
              }}
            />
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
          {shardsAvailable === null
            ? "Loading…"
            : canCombine
            ? "You have enough shards to crystallise a Joker Gem!"
            : `${inCurrentSet}/5 shards — ${5 - inCurrentSet} more to crystallise a Joker Gem.`}
        </p>
        <div className="w-full max-w-[220px]">
          <PrimaryButton onClick={handleCombine} disabled={!canCombine || busy}>
            {busy ? "Combining…" : "Combine (needs 5)"}
          </PrimaryButton>
        </div>
        {message && (
          <div className="flex items-center gap-2">
            <GemDot type="joker" />
            <p className="text-sm font-medium" style={{ color: "var(--color-success)" }}>
              {message}
            </p>
          </div>
        )}
      </div>
    </Frame>
  );
}
