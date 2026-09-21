"use client";

import { useEffect, useState } from "react";
import Frame from "@/components/Frame";
import { Card } from "@/components/ui";
import Link from "next/link";
import { GemInventory } from "@/lib/gems";

type MeResponse = {
  student: { displayName: string };
  totalGems: number;
  shardsAvailable: number;
  inventory: GemInventory;
  explorationProgress: { completed: number; total: number };
};

export default function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setMe(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Frame>
        <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>
      </Frame>
    );
  }

  if (!me) {
    return (
      <Frame>
        <p style={{ color: "var(--color-ink-soft)" }}>
          Not logged in.{" "}
          <Link href="/login" style={{ color: "var(--color-accent)" }}>
            Log in
          </Link>
        </p>
      </Frame>
    );
  }

  const pct = me.explorationProgress.total
    ? Math.round((me.explorationProgress.completed / me.explorationProgress.total) * 100)
    : 0;

  return (
    <Frame>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-lg" style={{ color: "var(--color-ink)" }}>
          hi, {me.student.displayName.toLowerCase()}
        </span>
        <span className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
          gems: {me.totalGems}   shards: {me.shardsAvailable % 5}/5
        </span>
      </div>

      <Link href="/prizes" className="block mt-5">
        <Card
          muted
          className="h-24 flex items-center justify-center font-bold text-lg"
          style={{ color: "var(--color-ink)" }}
        >
          Win Merchandise
        </Card>
      </Link>

      <Link href="/tour" className="block mt-5">
        <div
          className="h-[180px] rounded-[11px] relative overflow-hidden flex items-end justify-center"
          style={{ background: "var(--color-surface-muted)" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ color: "var(--color-ink-faint)" }}
          >
            campus map image
          </div>
          <div
            className="relative w-full py-2.5 text-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0))" }}
          >
            Campus Tour
          </div>
        </div>
      </Link>

      <Card className="mt-5 p-4" style={{ background: "var(--color-surface-muted)" }}>
        <p className="font-bold mb-3" style={{ color: "var(--color-ink)" }}>
          Exploration Progress
        </p>
        <div className="h-3 rounded-full w-full overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-ink-soft)" }}>
          {me.explorationProgress.completed} / {me.explorationProgress.total} locations explored
        </p>
      </Card>

      <div className="flex-1" />
      <Link
        href="/shards"
        className="text-center text-sm underline mt-4"
        style={{ color: "var(--color-ink-soft)" }}
      >
        Combine shards
      </Link>
    </Frame>
  );
}
