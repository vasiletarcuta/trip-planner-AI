"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Trip, DayPlan, Activity } from "@/types";
import type { TripMapHandle } from "@/components/TripMap";

const TripMap = dynamic(
  () => import("@/components/TripMap").then(m => m.TripMap),
  { ssr: false }
);

interface Props {
  trip: Trip;
  extraHeader?: React.ReactNode;
}

const SLOT_COLORS: Record<string, string> = {
  morning: "#FF9F0A",
  afternoon: "#0A84FF",
  evening: "#BF5AF2",
};

const SlotIcon = ({ slot }: { slot: string }) => {
  if (slot === "morning") return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
  if (slot === "afternoon") return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/>
    </svg>
  );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
};

function ActivityRow({ activity, dayIdx, actIdx, onSelect, isHighlighted }: {
  activity: Activity; dayIdx: number; actIdx: number;
  onSelect: (dayIdx: number, actIdx: number) => void;
  isHighlighted: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(dayIdx, actIdx)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 13px", borderRadius: 10, cursor: "pointer",
        background: isHighlighted ? "rgba(10,132,255,.18)" : hov ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.04)",
        border: `1px solid ${isHighlighted ? "rgba(10,132,255,.4)" : "rgba(255,255,255,.07)"}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
        transform: hov ? "translateX(3px)" : "none",
        boxShadow: isHighlighted ? "0 0 0 1px rgba(10,132,255,.3)" : "none",
        transition: "all .25s var(--spring)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
          {isHighlighted && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          )}
          {activity.name}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-2)", lineHeight: 1.4 }}>{activity.description}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 2 }}>{activity.duration}</div>
        {activity.cost > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#30D158" }}>~{activity.cost}€</div>}
      </div>
    </div>
  );
}

export function ItineraryView({ trip, extraHeader }: Props) {
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);
  const [highlightedPin, setHighlightedPin] = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const mapRef = useRef<TripMapHandle>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Click activity → fly map to pin
  const handleActivityClick = useCallback((dayIdx: number, actIdx: number) => {
    setHighlightedPin({ dayIdx, actIdx });
    mapRef.current?.flyToPin(dayIdx, actIdx);
    setTimeout(() => setHighlightedPin(null), 2500);
  }, []);

  // Click day header → fly map to day bounds
  const handleDayClick = useCallback((dayIdx: number) => {
    setActiveDayIdx(prev => {
      const next = prev === dayIdx ? null : dayIdx;
      if (next !== null) mapRef.current?.flyToDay(next);
      return next;
    });
  }, []);

  // Click map pin → highlight activity + scroll to card
  const handlePinClick = useCallback((dayIdx: number, actIdx: number) => {
    setActiveDayIdx(dayIdx);
    setHighlightedPin({ dayIdx, actIdx });
    const el = cardRefs.current[dayIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedPin(null), 2500);
  }, []);

  const displayedDays = activeDayIdx !== null
    ? trip.itinerary.filter((_, i) => i === activeDayIdx)
    : trip.itinerary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Trip header */}
      <div style={{ marginBottom: 20 }}>
        {extraHeader}
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-1px", marginBottom: 8 }}>{trip.destination}</h2>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-2)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {trip.dateFrom} → {trip.dateTo}
          </span>
          <span style={{ color: "#30D158", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ~{trip.totalEstimatedCost} {trip.currency}
          </span>
          <span style={{ textTransform: "capitalize" }}>{trip.style}</span>
        </div>
      </div>

      {/* Split layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

        {/* LEFT — Itinerary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Day filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <button
              onClick={() => setActiveDayIdx(null)}
              style={{
                padding: "5px 14px", borderRadius: 100, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                background: activeDayIdx === null ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.06)",
                color: activeDayIdx === null ? "#fff" : "var(--text-2)",
                transition: "all .25s var(--spring)",
                transform: activeDayIdx === null ? "scale(1.05)" : "scale(1)",
              }}
            >All</button>
            {trip.itinerary.map((day, i) => (
              <button
                key={i}
                onClick={() => handleDayClick(i)}
                style={{
                  padding: "5px 14px", borderRadius: 100, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                  background: activeDayIdx === i ? "rgba(10,132,255,.3)" : "rgba(255,255,255,.06)",
                  color: activeDayIdx === i ? "var(--accent)" : "var(--text-2)",
                  border: `1px solid ${activeDayIdx === i ? "rgba(10,132,255,.4)" : "transparent"}`,
                  transition: "all .25s var(--spring)",
                  transform: activeDayIdx === i ? "scale(1.05)" : "scale(1)",
                }}
              >
                Day {day.day}
              </button>
            ))}
          </div>

          {/* General tips */}
          {trip.generalTips?.length > 0 && activeDayIdx === null && (
            <div className="glass-sm" style={{ padding: "12px 16px", marginBottom: 12, background: "rgba(48,209,88,.05)", borderColor: "rgba(48,209,88,.14)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#30D158", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                General Tips
              </div>
              {trip.generalTips.map((t, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text-2)", display: "flex", gap: 7, marginBottom: i < trip.generalTips.length - 1 ? 4 : 0 }}>
                  <span style={{ color: "#30D158", flexShrink: 0 }}>·</span>{t}
                </div>
              ))}
            </div>
          )}

          {/* Day cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayedDays.map((day, displayIdx) => {
              const realIdx = trip.itinerary.indexOf(day);
              const isActiveDay = activeDayIdx === realIdx;
              return (
                <div key={day.day} ref={el => { cardRefs.current[realIdx] = el; }}
                  className="glass-sm"
                  style={{
                    overflow: "hidden",
                    animation: `fadeUp .4s var(--ease) both`,
                    animationDelay: `${displayIdx * .06}s`,
                    boxShadow: isActiveDay ? "0 0 0 1.5px var(--accent), 0 8px 24px rgba(10,132,255,.2)" : "none",
                    transition: "box-shadow .3s var(--spring)",
                  }}
                >
                  {/* Day header */}
                  <button
                    onClick={() => handleDayClick(realIdx)}
                    style={{
                      width: "100%", padding: "14px 18px", display: "flex", alignItems: "center",
                      justifyContent: "space-between", background: "transparent",
                      border: "none", cursor: "pointer", color: "var(--text)", fontFamily: "inherit",
                      borderBottom: "1px solid rgba(255,255,255,.07)", transition: "background .2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: isActiveDay ? "linear-gradient(135deg,rgba(10,132,255,.5),rgba(48,209,88,.3))" : "linear-gradient(135deg,rgba(10,132,255,.2),rgba(48,209,88,.12))",
                        border: `1px solid ${isActiveDay ? "rgba(10,132,255,.5)" : "rgba(255,255,255,.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "var(--accent)",
                        transition: "all .3s",
                      }}>{day.day}</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-.2px" }}>Day {day.day} — {day.date}</div>
                        {day.weather && (
                          <div style={{ fontSize: 10, color: "var(--text-2)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 1 0-9.78 2.096A4.001 4.001 0 0 0 3 15z"/></svg>
                            {day.weather.description} · {day.weather.temp_min}–{day.weather.temp_max}°C
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#30D158" }}>~{day.estimatedCost}€</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeLinecap="round"
                        style={{ transform: isActiveDay ? "rotate(180deg)" : "none", transition: "transform .3s var(--spring)" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>

                  {/* Day body — always show if it's the only one visible, else only if active */}
                  {(isActiveDay || activeDayIdx === null) && (
                    <div style={{ padding: "14px 18px" }}>
                      {(["morning", "afternoon", "evening"] as const).filter(s => day[s]?.length > 0).map(slot => {
                        let actIdxCounter = slot === "morning" ? 0 : slot === "afternoon" ? (day.morning?.length || 0) : (day.morning?.length || 0) + (day.afternoon?.length || 0);
                        return (
                          <div key={slot} style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: SLOT_COLORS[slot] }}>
                              <SlotIcon slot={slot}/>{slot}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {day[slot].map((act, i) => {
                                const currentIdx = actIdxCounter + i;
                                return (
                                  <ActivityRow
                                    key={i} activity={act}
                                    dayIdx={realIdx} actIdx={currentIdx}
                                    onSelect={handleActivityClick}
                                    isHighlighted={highlightedPin?.dayIdx === realIdx && highlightedPin?.actIdx === currentIdx}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {day.meals?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-2)", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                            Meals
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                            {day.meals.map((m, i) => (
                              <div key={i} style={{ padding: "9px 11px", borderRadius: 9, background: "rgba(255,159,10,.07)", border: "1px solid rgba(255,159,10,.14)" }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: "var(--accent-orange)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 3 }}>{m.type}</div>
                                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 2 }}>{m.suggestion}</div>
                                <div style={{ fontSize: 10, color: "var(--text-2)" }}>{m.cuisine} · ~{m.estimatedCost}€</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {day.tips?.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(10,132,255,.07)", border: "1px solid rgba(10,132,255,.13)" }}>
                          {day.tips.map((t, i) => (
                            <div key={i} style={{ display: "flex", gap: 7, marginBottom: i < day.tips.length - 1 ? 5 : 0 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                              <span style={{ fontSize: 10, color: "var(--text-2)", lineHeight: 1.4 }}>{t}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Sticky map */}
        <div style={{
          position: "sticky", top: 96,
          borderRadius: 16, overflow: "hidden",
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
          height: "calc(100vh - 120px)",
          display: "flex", flexDirection: "column",
        }}>
          <TripMap
            ref={mapRef}
            itinerary={trip.itinerary}
            destination={trip.destination}
            activeDayIdx={activeDayIdx}
            onPinClick={handlePinClick}
          />
        </div>
      </div>
    </div>
  );
}
