"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import { TopBar, GemDot } from "@/components/ui";
import InfoCardCarousel from "@/components/InfoCardCarousel";
import { GemType } from "@/lib/gems";

type Location = {
  id: string;
  name: string;
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
  const [status, setStatus] = useState<"idle" | "watching" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const checkingRef = useRef(false); // prevents overlapping geotag POSTs while a watch is firing rapidly

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

  const loc = locations?.[index];

  // Automatically watches the student's position in the background and
  // verifies proximity the moment they're close enough — no button to tap.
  useEffect(() => {
    function stopWatching() {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    if (!loc || loc.geotaggedAt) {
      stopWatching();
      setStatus("idle");
      return;
    }

    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("Your browser doesn't support location — try a different device.");
      return;
    }

    setStatus("watching");
    setMessage(null);
    checkingRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (checkingRef.current) return;
        checkingRef.current = true;
        try {
          const res = await fetch(`/api/locations/${loc.id}/geotag`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          const data = await res.json();
          if (res.ok && data.arrived) {
            stopWatching();
            load();
          }
        } finally {
          checkingRef.current = false;
        }
      },
      () => {
        setStatus("error");
        setMessage("Couldn't get your location — check location permissions and try again.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return stopWatching;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.id, loc?.geotaggedAt]);

  if (!locations || !loc) {
    return (
      <Frame>
        <TopBar back="/tour" />
        <p style={{ color: message ? "var(--color-gem-ruby)" : "var(--color-ink-soft)" }}>
          {message ?? "Loading…"}
        </p>
      </Frame>
    );
  }

  const completedCount = locations.filter((l) => l.quizPassedAt).length;

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
          <p className="font-bold mb-3" style={{ color: "var(--color-ink)" }}>
            {loc.name}
          </p>

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
            <InfoCardCarousel
              locationId={loc.id}
              onContinue={() => router.push(`/tour/${key}/quiz/${loc.id}`)}
            />
          ) : (
            // Nothing about this spot is revealed until proximity is verified —
            // just a quiet status while it checks in the background.
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
              <p className="text-sm text-center" style={{ color: "var(--color-ink-soft)" }}>
                {status === "watching"
                  ? "Walk to this spot — we'll unlock it automatically."
                  : "Waiting for location access…"}
              </p>
            </div>
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
