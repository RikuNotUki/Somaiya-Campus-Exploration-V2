"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import Frame from "@/components/Frame";
import { TopBar } from "@/components/ui";

type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  categoryLabel: string | null;
  unlocked: boolean;
  geotaggedAt: string | null;
  quizPassedAt: string | null;
};

// Fallback center if a location's coordinates haven't been set yet (still 0,0).
const CAMPUS_FALLBACK_CENTER: [number, number] = [19.0728, 72.899];

export default function TourMapPage() {
  const router = useRouter();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [locations, setLocations] = useState<MapLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingCoords, setMissingCoords] = useState(false);

  useEffect(() => {
    fetch("/api/tour/map")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLocations(data.locations);
      });
  }, []);

  useEffect(() => {
    if (!locations || !mapDivRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapDivRef.current || mapInstanceRef.current) return;

      const withCoords = locations.filter((l) => l.lat !== 0 || l.lng !== 0);
      setMissingCoords(withCoords.length < locations.length);

      const center: [number, number] =
        withCoords.length > 0 ? [withCoords[0].lat, withCoords[0].lng] : CAMPUS_FALLBACK_CENTER;

      const map = L.map(mapDivRef.current, { zoomControl: true }).setView(center, 17);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      for (const loc of locations) {
        const lat = loc.lat || CAMPUS_FALLBACK_CENTER[0];
        const lng = loc.lng || CAMPUS_FALLBACK_CENTER[1];
        const color = !loc.unlocked ? "#B4B2A9" : loc.quizPassedAt ? "#92D344" : "#185FA5";

        const marker: CircleMarker = L.circleMarker([lat, lng], {
          radius: 9,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: loc.unlocked ? 1 : 0.55,
        }).addTo(map);

        const popupHtml = loc.unlocked
          ? `<div style="font-family:Arial,sans-serif;min-width:150px;">
               <p style="font-weight:bold;margin:0 0 4px 0;font-size:13px;">${loc.name}</p>
               <p style="margin:0 0 8px 0;font-size:11px;color:#5f5e5a;">${loc.categoryLabel ?? ""}</p>
               <button id="nav-${loc.id}" style="background:#185FA5;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">${
                 loc.quizPassedAt ? "View" : "Navigate here"
               }</button>
             </div>`
          : `<div style="font-family:Arial,sans-serif;min-width:150px;">
               <p style="font-weight:bold;margin:0 0 4px 0;font-size:13px;">${loc.name}</p>
               <p style="margin:0;font-size:11px;color:#D73636;">Locked — finish Institute Tour & Campus History first</p>
             </div>`;

        marker.bindPopup(popupHtml);
        marker.on("popupopen", () => {
          const btn = document.getElementById(`nav-${loc.id}`);
          btn?.addEventListener("click", () => router.push(`/tour/location/${loc.id}`));
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locations, router]);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <Frame>
      <TopBar title="Campus Tour" back="/home" />
      {error && (
        <div
          className="mb-3 p-3 rounded-[11px] text-sm"
          style={{ background: "var(--color-surface-muted)", color: "var(--color-gem-ruby)" }}
        >
          {error}
        </div>
      )}
      {missingCoords && !error && (
        <div
          className="mb-3 p-3 rounded-[11px] text-xs"
          style={{ background: "var(--color-surface-muted)", color: "var(--color-ink-soft)" }}
        >
          Some spots don&apos;t have real coordinates yet, so they&apos;re shown at a fallback
          point — add them in content/locations.csv.
        </div>
      )}
      <div
        ref={mapDivRef}
        className="flex-1 rounded-[11px] overflow-hidden"
        style={{ minHeight: 420, background: "var(--color-surface-muted)" }}
      />
      <div
        className="flex items-center justify-center gap-4 mt-3 text-[11px]"
        style={{ color: "var(--color-ink-soft)" }}
      >
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#185FA5" }} /> To explore
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#92D344" }} /> Explored
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#B4B2A9" }} /> Locked
        </span>
      </div>
    </Frame>
  );
}
