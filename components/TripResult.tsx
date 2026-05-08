"use client";
import { useState } from "react";
import type { Trip } from "@/types";
import { useTrips } from "@/hooks/useTrips";
import { ItineraryView } from "@/components/ItineraryView";

interface Props { trip: Trip; onClose: () => void; onSaved: () => void; }

export function TripResult({ trip, onClose, onSaved }: Props) {
    const { saveTrip, saving } = useTrips();
    const [saved, setSaved] = useState(!trip.id.startsWith("unsaved-"));
    const [saveAnim, setSaveAnim] = useState(false);

    const handleSave = async () => {
        setSaveAnim(true);
        const ok = await saveTrip(trip);
        if (ok) { setSaved(true); onSaved(); }
        setTimeout(() => setSaveAnim(false), 600);
    };

    const extraHeader = (
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            {/* New trip */}
            <button className="btn-glass" onClick={onClose} style={{ padding: "6px 13px", fontSize: 12 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                New
            </button>
            {/* Save */}
            {!saved ? (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 13px", borderRadius: 100, border: "none", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                        background: "linear-gradient(135deg,rgba(48,209,88,.9),rgba(48,209,88,.6))",
                        color: "#fff", opacity: saving ? .7 : 1,
                        animation: saveAnim ? "squish .5s var(--spring)" : "none",
                        transition: "opacity .2s",
                    }}
                >
                    {saving
                        ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving...</>
                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>Save</>
                    }
                </button>
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 100, background: "rgba(48,209,88,.12)", border: "1px solid rgba(48,209,88,.25)", fontSize: 12, color: "#30D158", fontWeight: 600 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Saved
                </div>
            )}
        </div>
    );

    return <ItineraryView trip={trip} extraHeader={extraHeader} />;
}