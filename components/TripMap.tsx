"use client";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import type { DayPlan } from "@/types";
import { geocode, setDestinationContext } from "@/services/geocode";

export interface MapPin {
  name: string;
  description: string;
  coords: [number, number];
  day: number;
  dayIdx: number;
  slot: string;
  activityIdx: number;
  color: string;
}

export interface TripMapHandle {
  flyToPin: (dayIdx: number, activityIdx: number) => void;
  flyToDay: (dayIdx: number) => void;
}

interface Props {
  itinerary: DayPlan[];
  destination: string;
  activeDayIdx: number | null;
  onPinClick: (dayIdx: number, activityIdx: number) => void;
}

const SLOT_COLORS: Record<string, string> = {
  morning: "#FF9F0A",
  afternoon: "#0A84FF",
  evening: "#BF5AF2",
};

export const TripMap = forwardRef<TripMapHandle, Props>(function TripMap(
    { itinerary, destination, activeDayIdx, onPinClick }, ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const lRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylineRef = useRef<any>(null);
  const initRef = useRef(false);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);

  // Expose flyTo methods
  useImperativeHandle(ref, () => ({
    flyToPin(dayIdx: number, activityIdx: number) {
      const pin = pins.find(p => p.dayIdx === dayIdx && p.activityIdx === activityIdx);
      if (pin && mapRef.current) {
        mapRef.current.flyTo(pin.coords, 15, { duration: 1.2 });
        const key = `${dayIdx}-${activityIdx}`;
        const marker = markersRef.current.get(key);
        if (marker) setTimeout(() => marker.openPopup(), 1300);
      }
    },
    flyToDay(dayIdx: number) {
      const dayPins = pins.filter(p => p.dayIdx === dayIdx);
      if (!dayPins.length || !mapRef.current || !lRef.current) return;
      if (dayPins.length === 1) {
        mapRef.current.flyTo(dayPins[0].coords, 14, { duration: 1.0 });
      } else {
        const bounds = lRef.current.latLngBounds(dayPins.map(p => p.coords));
        mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.0 });
      }
    },
  }), [pins]);

  // Geocode all activities
  useEffect(() => {
    const activities: { name: string; description: string; day: number; dayIdx: number; slot: string; actIdx: number }[] = [];
    itinerary.forEach((day, dayIdx) => {
      let actIdx = 0;
      (["morning", "afternoon", "evening"] as const).forEach(slot => {
        (day[slot] || []).forEach(act => {
          activities.push({ name: act.name, description: act.description, day: day.day, dayIdx, slot, actIdx: actIdx++ });
        });
      });
    });

    setTotal(activities.length);
    setLoaded(0);
    setPins([]);
    setLoading(true);

    let cancelled = false;
    (async () => {
      // Prime destination context first (1 geocode call)
      await setDestinationContext(destination);
      for (const act of activities) {
        if (cancelled) break;
        await new Promise(r => setTimeout(r, 1100));
        const coords = await geocode(act.name, destination);
        setLoaded(l => l + 1);
        if (coords && !cancelled) {
          setPins(prev => [...prev, {
            name: act.name, description: act.description,
            coords, day: act.day, dayIdx: act.dayIdx,
            slot: act.slot, activityIdx: act.actIdx,
            color: SLOT_COLORS[act.slot] || "#0A84FF",
          }]);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [itinerary, destination]);

  // Init map once
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    import("leaflet").then(L => {
      if ((containerRef.current as any)?._leaflet_id) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([48, 16], 5);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      lRef.current = L;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; lRef.current = null; initRef.current = false; }
    };
  }, []);

  // Update markers + polylines when pins or activeDayIdx changes
  useEffect(() => {
    if (!mapRef.current || !lRef.current) return;
    const L = lRef.current;
    const map = mapRef.current;

    // Clear markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    // Clear polyline
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }

    const visiblePins = activeDayIdx !== null ? pins.filter(p => p.dayIdx === activeDayIdx) : pins;
    const bounds: [number, number][] = [];

    // Draw polyline arrows between pins in order
    if (visiblePins.length > 1) {
      const coords = visiblePins.map(p => p.coords);
      // Main line
      polylineRef.current = L.polyline(coords, {
        color: activeDayIdx !== null ? SLOT_COLORS[visiblePins[0]?.slot] || "#0A84FF" : "rgba(255,255,255,0.3)",
        weight: 2,
        dashArray: "6 8",
        opacity: 0.7,
      }).addTo(map);

      // Arrow decorators (manual — one arrow per segment midpoint)
      for (let i = 0; i < coords.length - 1; i++) {
        const from = coords[i];
        const to = coords[i + 1];
        const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
        const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI);
        const arrowIcon = L.divIcon({
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          html: `<div style="transform:rotate(${angle}deg);color:rgba(255,255,255,0.5);font-size:13px;line-height:1">→</div>`,
        });
        const arrowMarker = L.marker(mid, { icon: arrowIcon, interactive: false }).addTo(map);
        markersRef.current.set(`arrow-${i}`, arrowMarker);
      }
    }

    // Draw pins
    visiblePins.forEach(pin => {
      const key = `${pin.dayIdx}-${pin.activityIdx}`;
      const isActive = activeDayIdx === null || pin.dayIdx === activeDayIdx;

      const icon = L.divIcon({
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
        html: `<div style="
          width:34px;height:34px;border-radius:50% 50% 50% 0;
          background:${isActive ? pin.color : "rgba(255,255,255,0.15)"};
          border:2.5px solid rgba(255,255,255,${isActive ? "0.9" : "0.3"});
          transform:rotate(-45deg);
          box-shadow:0 4px 14px rgba(0,0,0,0.5)${isActive ? `,0 0 0 6px ${pin.color}22` : ""};
          display:flex;align-items:center;justify-content:center;
          transition:all .3s;
        "><span style="transform:rotate(45deg);font-size:11px;font-weight:700;color:${isActive ? "#fff" : "rgba(255,255,255,0.4)"};">${pin.day}</span></div>`,
      });

      const marker = L.marker(pin.coords, { icon })
          .addTo(map)
          .bindPopup(`
          <div style="font-family:-apple-system,sans-serif;min-width:160px;padding:2px">
            <div style="font-size:10px;font-weight:700;color:${pin.color};text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px">
              Day ${pin.day} · ${pin.slot}
            </div>
            <div style="font-size:14px;font-weight:700;margin-bottom:4px;color:#111">${pin.name}</div>
            <div style="font-size:12px;color:#555;line-height:1.4">${pin.description}</div>
          </div>
        `, { maxWidth: 220 });

      marker.on("click", () => onPinClick(pin.dayIdx, pin.activityIdx));
      markersRef.current.set(key, marker);
      bounds.push(pin.coords);
    });

    if (bounds.length > 0) {
      map.fitBounds(lRef.current.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [pins, activeDayIdx, onPinClick]);

  return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

        {/* Header */}
        <div style={{
          padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {activeDayIdx !== null ? `Day ${activeDayIdx + 1}` : "All Days"}
            {loading && total > 0 && (
                <span style={{ fontSize: 10, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {loaded}/{total}
            </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-2)" }}>
            {Object.entries(SLOT_COLORS).map(([slot, color]) => (
                <div key={slot} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                  {slot}
                </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ position: "relative", flex: 1 }}>
          <div ref={containerRef} style={{ height: "100%", width: "100%", minHeight: 300 }} />
          {pins.length === 0 && loading && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                background: "rgba(5,5,10,.85)", backdropFilter: "blur(8px)", pointerEvents: "none",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Locating {loaded}/{total}</div>
              </div>
          )}
        </div>
      </div>
  );
});