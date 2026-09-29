"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, CircleMarker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";
import Frame from "@/components/Frame";
import { TopBar, GemDot } from "@/components/ui";
import InfoCardCarousel from "@/components/InfoCardCarousel";
import { GemType } from "@/lib/gems";

type LocationDetail = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  proximityRadiusM: number;
  categoryLabel: string | null;
  geotaggedAt: string | null;
  quizPassedAt: string | null;
  gemAwarded: GemType | null;
};

// OSRM's free public demo routing server — no API key, fine for light/pilot use.
// For heavier traffic later, self-hosting OSRM or switching providers is an option.
const OSRM_BASE = "https://router.project-osrm.org/route/v1/foot";

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loc, setLoc] = useState<LocationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "watching" | "error">("idle");
  const [locError, setLocError] = useState<string | null>(null);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);
  const userMarkerRef = useRef<CircleMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const checkingRef = useRef(false);

  function load() {
    fetch(`/api/locations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLoc(data);
      });
  }

  useEffect(load, [id]);

  // Live map: draws a walking route (via OSRM) from the student's current
  // position to this pin, updating as they move.
  useEffect(() => {
    if (!loc || loc.geotaggedAt || !mapDivRef.current || mapInstanceRef.current) return;
    if (loc.lat === 0 && loc.lng === 0) return; // no real coordinates yet — nothing to route to

    let cancelled = false;
    let posWatchId: number | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !mapDivRef.current || mapInstanceRef.current) return;

      const map = L.map(mapDivRef.current, { zoomControl: true }).setView([loc.lat, loc.lng], 18);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      L.circleMarker([loc.lat, loc.lng], {
        radius: 10,
        color: "#fff",
        weight: 2,
        fillColor: "#185FA5",
        fillOpacity: 1,
      }).addTo(map);

      if (!("geolocation" in navigator)) return;

      posWatchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          if (!userMarkerRef.current) {
            userMarkerRef.current = L.circleMarker([userLat, userLng], {
              radius: 7,
              color: "#fff",
              weight: 2,
              fillColor: "#92D344",
              fillOpacity: 1,
            }).addTo(map);
          } else {
            userMarkerRef.current.setLatLng([userLat, userLng]);
          }

          try {
            const res = await fetch(
              `${OSRM_BASE}/${userLng},${userLat};${loc.lng},${loc.lat}?overview=full&geometries=geojson`
            );
            const data = await res.json();
            const coords: [number, number][] | undefined =
              data.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]: [number, number]) => [lat, lng]);
            if (coords) {
              if (routeLineRef.current) {
                routeLineRef.current.setLatLngs(coords);
              } else {
                routeLineRef.current = L.polyline(coords, { color: "#185FA5", weight: 4 }).addTo(map);
              }
              map.fitBounds(L.latLngBounds(coords), { padding: [24, 24] });
            }
          } catch {
            // Routing is a nicety here — proximity detection below doesn't depend on it.
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    });

    return () => {
      cancelled = true;
      if (posWatchId !== null) navigator.geolocation.clearWatch(posWatchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.id, loc?.geotaggedAt, loc?.lat, loc?.lng]);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      routeLineRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Auto-verify proximity in the background — no button.
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
      setLocError("Your browser doesn't support location — try a different device.");
      return;
    }

    setStatus("watching");
    checkingRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (checkingRef.current) return;
        checkingRef.current = true;
        try {
          const res = await fetch(`/api/locations/${id}/geotag`, {
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
        setLocError("Couldn't get your location — check location permissions and try again.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return stopWatching;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.id, loc?.geotaggedAt]);

  if (error) {
    return (
      <Frame>
        <TopBar back="/tour" />
        <p style={{ color: "var(--color-gem-ruby)" }}>{error}</p>
      </Frame>
    );
  }

  if (!loc) {
    return (
      <Frame>
        <TopBar back="/tour" />
        <p style={{ color: "var(--color-ink-soft)" }}>Loading…</p>
      </Frame>
    );
  }

  return (
    <Frame>
      <TopBar title={loc.name} back="/tour" />

      {loc.quizPassedAt ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <p className="font-bold" style={{ color: "var(--color-success)" }}>
            ✓ Explored
          </p>
          {loc.gemAwarded && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ink)" }}>
              Found a <GemDot type={loc.gemAwarded} /> {loc.gemAwarded} gem!
            </div>
          )}
        </div>
      ) : loc.geotaggedAt ? (
        <div className="flex-1 flex flex-col justify-center">
          <InfoCardCarousel
            locationId={loc.id}
            onContinue={() => router.push(`/tour/location/${loc.id}/quiz`)}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div
            ref={mapDivRef}
            className="flex-1 rounded-[11px] overflow-hidden"
            style={{ minHeight: 420, background: "var(--color-surface-muted)" }}
          />
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
            <p className="text-sm text-center" style={{ color: "var(--color-ink-soft)" }}>
              {status === "watching"
                ? "Follow the route — we'll unlock this spot automatically when you arrive."
                : "Waiting for location access…"}
            </p>
          </div>
        </div>
      )}

      {locError && (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--color-gem-ruby)" }}>
          {locError}
        </p>
      )}
    </Frame>
  );
}
