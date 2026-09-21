"use client";

import { useEffect, useState, use } from "react";
import Frame from "@/components/Frame";
import { TopBar, PrimaryButton, GemDot } from "@/components/ui";
import { GemType } from "@/lib/gems";

type Prize = {
  id: string;
  name: string;
  recipe: Partial<Record<GemType, number>>;
  progress: {
    canRedeem: boolean;
    perType: { type: GemType; have: number; need: number }[];
    totalHave: number;
    totalNeed: number;
  };
};

export default function PrizeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetch("/api/prizes")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          const found = data.prizes.find((p: Prize) => p.id === id);
          setPrize(found ?? null);
        }
      });
  }, [id]);

  async function handleRedeem() {
    setRedeeming(true);
    setError(null);
    const res = await fetch(`/api/prizes/${id}/redeem`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setCode(data.code);
    }
    setRedeeming(false);
  }

  if (!prize) {
    return (
      <Frame>
        <TopBar back="/prizes" />
        <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>
      </Frame>
    );
  }

  if (code) {
    return (
      <Frame>
        <TopBar back="/prizes" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="font-bold text-lg" style={{ color: "var(--color-ink)" }}>
            {prize.name} redeemed!
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
            Show this code at the prize desk to collect it.
          </p>
          <div
            className="rounded-[11px] border-2 px-8 py-5 text-4xl font-bold tracking-[0.3em]"
            style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
          >
            {code}
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <TopBar title={prize.name} back="/prizes" />
      <div
        className="rounded-[11px] flex items-center justify-center h-40 mb-5"
        style={{ background: "var(--color-surface-muted)" }}
      >
        <span className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
          prize photo
        </span>
      </div>

      <p className="font-bold mb-3" style={{ color: "var(--color-ink)" }}>
        Recipe
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {prize.progress.perType.map((row) => (
          <div key={row.type} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GemDot type={row.type} />
              <span className="capitalize text-sm" style={{ color: "var(--color-ink)" }}>
                {row.type}
              </span>
            </div>
            <span
              className="text-sm"
              style={{ color: row.have >= row.need ? "var(--color-success)" : "var(--color-ink-soft)" }}
            >
              {row.have} / {row.need}
            </span>
          </div>
        ))}
        {prize.recipe.joker ? (
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-faint)" }}>
            + {prize.recipe.joker} Joker gem(s) required directly — spare Jokers also fill any
            shortfall above.
          </p>
        ) : (
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-faint)" }}>
            Joker gems can fill in for any missing gem above.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm mb-3 text-center" style={{ color: "var(--color-gem-ruby)" }}>
          {error}
        </p>
      )}

      <PrimaryButton
        variant={prize.progress.canRedeem ? "success" : "outline"}
        disabled={!prize.progress.canRedeem || redeeming}
        onClick={handleRedeem}
      >
        {redeeming ? "Redeeming…" : prize.progress.canRedeem ? "Redeem Prize" : "Not enough gems yet"}
      </PrimaryButton>
    </Frame>
  );
}
