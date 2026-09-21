"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Frame from "@/components/Frame";
import { TopBar, Card, GemChip } from "@/components/ui";
import { GemInventory, GemType, GEM_TYPES } from "@/lib/gems";

type Prize = {
  id: string;
  name: string;
  recipe: Partial<Record<GemType, number>>;
  progress: { canRedeem: boolean; totalHave: number; totalNeed: number };
};

export default function PrizesPage() {
  const [inventory, setInventory] = useState<GemInventory | null>(null);
  const [prizes, setPrizes] = useState<Prize[] | null>(null);

  useEffect(() => {
    fetch("/api/prizes")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setInventory(data.inventory);
          setPrizes(data.prizes);
        }
      });
  }, []);

  return (
    <Frame>
      <TopBar title="Win Merchandise" back="/home" />

      {inventory && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {GEM_TYPES.map((g) => (
            <GemChip key={g} type={g} count={inventory[g]} />
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {!prizes && <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>}
        {prizes?.map((p) => {
          const pct = p.progress.totalNeed
            ? Math.round((p.progress.totalHave / p.progress.totalNeed) * 100)
            : 0;
          return (
            <Link key={p.id} href={`/prizes/${p.id}`}>
              <Card className="p-4 border" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold" style={{ color: "var(--color-ink)" }}>
                    {p.name}
                  </p>
                  {p.progress.canRedeem && (
                    <span className="text-xs font-medium" style={{ color: "var(--color-success)" }}>
                      Ready to redeem
                    </span>
                  )}
                </div>
                <div className="h-2.5 rounded-full w-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: p.progress.canRedeem ? "var(--color-success)" : "var(--color-accent)",
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-soft)" }}>
                  {p.progress.totalHave} / {p.progress.totalNeed} gems collected
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </Frame>
  );
}
