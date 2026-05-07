"use client";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import type { Trip } from "@/types";
import { useTrips } from "@/hooks/useTrips";
import { ItineraryView } from "@/components/ItineraryView";

interface Props { session: Session | null; onSelect: (trip: Trip) => void; }

export function SavedTrips({ session, onSelect }: Props) {
  const { trips, loading, fetchTrips, deleteTrip } = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => { if (session) fetchTrips(); }, [session]);

  if (!session) return (
    <div className="glass" style={{ padding: 60, textAlign: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" style={{ display: "block", margin: "0 auto 14px" }}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-.3px" }}>Sign in to view saved trips</div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>Your itineraries sync to the cloud</div>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  // Show selected trip inline with map
  if (selectedTrip) {
    return (
      <div className="anim-fadeIn">
        <ItineraryView
          trip={selectedTrip}
          extraHeader={
            <button className="btn-glass" onClick={() => setSelectedTrip(null)}
              style={{ padding: "8px 14px", fontSize: 12, marginBottom: 16, display: "inline-flex" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to saved trips
            </button>
          }
        />
      </div>
    );
  }

  if (!trips.length) return (
    <div className="glass" style={{ padding: 60, textAlign: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" style={{ display: "block", margin: "0 auto 14px" }}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-.3px" }}>No saved trips yet</div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>Generate and save your first itinerary</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.8px", marginBottom: 20 }}>
        Saved Trips
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-2)", marginLeft: 10 }}>{trips.length} trips</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {trips.map((trip, i) => (
          <TripCard key={trip.id} trip={trip} idx={i}
            onSelect={() => setSelectedTrip(trip)}
            onDelete={() => deleteTrip(trip.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, onSelect, onDelete, idx }: { trip: Trip; onSelect: () => void; onDelete: () => void; idx: number }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onSelect}
      style={{
        position: "relative", cursor: "pointer",
        background: hov ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.07)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${hov ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.1)"}`,
        borderRadius: 16, padding: "18px",
        transform: hov ? "translateY(-4px) scale(1.01)" : "none",
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,.3)" : "0 4px 16px rgba(0,0,0,.15)",
        transition: "all .4s var(--spring)",
        animation: `fadeUp .45s var(--ease) both`, animationDelay: `${idx * .06}s`,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 12,
        background: "linear-gradient(135deg,rgba(10,132,255,.28),rgba(48,209,88,.18))",
        border: "1px solid rgba(255,255,255,.1)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.4px", marginBottom: 8 }}>{trip.destination}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: "var(--text-2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {trip.dateFrom} → {trip.dateTo}
        </span>
        <span style={{ color: "#30D158", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {trip.totalEstimatedCost} {trip.currency}
        </span>
        <span style={{ textTransform: "capitalize" }}>{trip.style}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 9, color: "var(--text-3)" }}>
        {new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: "absolute", top: 12, right: 12, width: 26, height: 26,
          borderRadius: 7, border: "none", background: "rgba(255,255,255,.07)",
          color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all .25s var(--spring)",
        }}
        onMouseEnter={e => { (e.currentTarget.style.background = "rgba(255,69,58,.22)"); (e.currentTarget.style.color = "#FF453A"); (e.currentTarget.style.transform = "scale(1.15)"); }}
        onMouseLeave={e => { (e.currentTarget.style.background = "rgba(255,255,255,.07)"); (e.currentTarget.style.color = "var(--text-3)"); (e.currentTarget.style.transform = "scale(1)"); }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  );
}
