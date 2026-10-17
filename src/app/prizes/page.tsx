"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Frame from "@/components/Frame";
import { TopBar, Card, GemChip, GemDot } from "@/components/ui";
import { GemInventory, GemType, GEM_TYPES } from "@/lib/gems";

type Prize = {
  id: string;
  name: string;
  imageUrl: string | null;
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
          const required = (Object.entries(p.recipe) as [GemType, number][]).filter(
            ([, need]) => need > 0
          );
          return (
            <Link key={p.id} href={`/prizes/${p.id}`}>
              <Card className="p-4 border flex gap-3" style={{ borderColor: "var(--color-border)" }}>
                <div
                  className="w-14 h-14 rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "var(--color-surface-muted)" }}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px]" style={{ color: "var(--color-ink-faint)" }}>
                      photo
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-3 flex-wrap">
                    {required.map(([type, need]) => {
                      const have = Math.min(inventory?.[type] ?? 0, need);
                      const met = have >= need;
                      return (
                        <div key={type} className="flex items-center gap-1.5">
                          <GemDot type={type} size={16} />
                          <span
                            className="text-xs font-medium"
                            style={{ color: met ? "var(--color-success)" : "var(--color-ink-soft)" }}
                          >
                            {have}/{need}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Frame>
  );
}
