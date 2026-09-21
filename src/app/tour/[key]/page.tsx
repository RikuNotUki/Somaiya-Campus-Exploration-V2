"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import { TopBar, PrimaryButton, GemDot } from "@/components/ui";
import { GemType } from "@/lib/gems";

type Location = {
  id: string;
  name: string;
  did_you_know: string | null;
  info_md: string | null;
  proximity_radius_m: number;
  geotaggedAt: string | null;
  quizPassedAt: string | null;
  gemAwarded: GemType | null;
};

export default function TourCategoryPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const router = useRouter();
  const [categoryLabel, setCategoryLabel] = useState("");
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch(`/api/categories/${key}/locations`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
          return;
        }
        setCategoryLabel(data.category.label);
        setLocations(data.locations);
      });
  }

  useEffect(load, [key]);

  if (!locations) {
    return (
      <Frame>
        <TopBar back="/tour" />
        <p style={{ color: message ? "var(--color-gem-ruby)" : "var(--color-ink-soft)" }}>
          {message ?? "Loading…"}
        </p>
      </Frame>
    );
  }

  const loc = locations[index];
  const completedCount = locations.filter((l) => l.quizPassedAt).length;

  async function handleGeotag() {
    setBusy(true);
    setMessage(null);
    if (!("geolocation" in navigator)) {
      setMessage("Your browser doesn't support location — try a different device.");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch(`/api/locations/${loc.id}/geotag`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error ?? "Couldn't geo-tag this spot.");
        } else if (!data.arrived) {
          setMessage(data.message);
        } else {
          load();
        }
        setBusy(false);
      },
      () => {
        setMessage("Couldn't get your location — check location permissions.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Frame>
      <TopBar back="/tour" />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="w-full max-w-[280px] rounded-[22px] border p-5 flex flex-col"
          style={{ borderColor: "var(--color-border-strong)", minHeight: 390 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm capitalize" style={{ color: "var(--color-ink-soft)" }}>
              {categoryLabel}
            </span>
            <span className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
              {index + 1} / {locations.length}
            </span>
          </div>
          <div
            className="h-32 rounded-[11px] flex items-center justify-center mb-3"
            style={{ background: "var(--color-surface-muted)" }}
          >
            <span className="text-sm" style={{ color: "var(--color-ink-faint)" }}>
              photo
            </span>
          </div>
          <p className="font-bold mb-2" style={{ color: "var(--color-ink)" }}>
            {loc.name}
          </p>
          {loc.did_you_know && (
            <p className="text-sm mb-3" style={{ color: "var(--color-ink-soft)" }}>
              <span className="font-bold" style={{ color: "var(--color-ink)" }}>
                Did you know?{" "}
              </span>
              {loc.did_you_know}
            </p>
          )}

          {loc.quizPassedAt ? (
            <div className="mt-auto flex items-center gap-2 text-sm" style={{ color: "var(--color-success)" }}>
              ✓ Explored{loc.gemAwarded && (
                <>
                  {" "}
                  — found a <GemDot type={loc.gemAwarded} size={14} /> {loc.gemAwarded}!
                </>
              )}
            </div>
          ) : loc.geotaggedAt ? (
            <PrimaryButton onClick={() => router.push(`/tour/${key}/quiz/${loc.id}`)}>
              Take the quiz
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleGeotag} disabled={busy}>
              {busy ? "Checking your location…" : "I'm here — geo-tag"}
            </PrimaryButton>
          )}

          {message && (
            <p className="text-xs mt-2 text-center" style={{ color: "var(--color-gem-ruby)" }}>
              {message}
            </p>
          )}

          <div className="flex items-center justify-center gap-10 mt-4">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="text-lg disabled:opacity-30"
              style={{ color: "var(--color-ink-faint)" }}
            >
              ←
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(locations.length - 1, i + 1))}
              disabled={index === locations.length - 1}
              className="text-lg disabled:opacity-30"
              style={{ color: "var(--color-ink-faint)" }}
            >
              →
            </button>
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: "var(--color-ink-soft)" }}>
          {completedCount} / {locations.length} explored in {categoryLabel}
        </p>
      </div>
    </Frame>
  );
}
