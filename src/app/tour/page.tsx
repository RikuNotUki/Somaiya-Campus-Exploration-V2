"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Frame from "@/components/Frame";
import { TopBar, Card } from "@/components/ui";
import { CategoryProgress } from "@/lib/progress";

export default function TourPage() {
  const [categories, setCategories] = useState<CategoryProgress[] | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setCategories(data.categories);
      });
  }, []);

  return (
    <Frame>
      <TopBar title="Campus Tour" back="/home" />
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={c.unlocked ? `/tour/${c.key}` : "#"}
            className={c.unlocked ? "" : "pointer-events-none"}
          >
            <Card
              className="p-4 flex items-center justify-between border"
              style={{ borderColor: "var(--color-border)", opacity: c.unlocked ? 1 : 0.5 }}
            >
              <div>
                <p className="font-bold" style={{ color: "var(--color-ink)" }}>
                  {c.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-soft)" }}>
                  {c.unlocked
                    ? `${c.completedLocations} / ${c.totalLocations} explored`
                    : "Locked — finish Institute Tour & Campus History first"}
                </p>
              </div>
              <span style={{ color: "var(--color-ink-faint)" }}>›</span>
            </Card>
          </Link>
        ))}
        {!categories && <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>}
      </div>
    </Frame>
  );
}
