"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type React from "react";
import type { Trip, DayPlan, Activity } from "@/types";
import { ExportPDF } from "@/components/ExportPDF";
import dynamic from "next/dynamic";

const MapWrapper = dynamic(
    () => import("@/components/TripMap").then(m => {
        const C = m.TripMap;
        return { default: C };
    }),
    { ssr: false }
);

interface MapApi {
    flyToPin: (d: number, a: number) => void;
    flyToDay: (d: number) => void;
}

interface Props {
    trip: Trip;
    extraHeader?: React.ReactNode;
}

const SLOT_COLORS: Record<string, string> = {
    morning: "#FF9F0A",
    afternoon: "#0A84FF",
    evening: "#BF5AF2",
};

const DAY_ACCENT = ["#0A84FF","#30D158","#FF9F0A","#BF5AF2","#FF453A","#64D2FF","#FFD60A"];

const SlotIcon = ({ slot }: { slot: string }) => {
    if (slot === "morning") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    if (slot === "afternoon") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></svg>;
    return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
};

function ActivityRow({ activity, dayIdx, actIdx, onSelect, isHighlighted }: {
    activity: Activity; dayIdx: number; actIdx: number;
    onSelect: (d: number, a: number) => void; isHighlighted: boolean;
}) {
    const [hov, setHov] = useState(false);
    return (
        <div onClick={() => onSelect(dayIdx, actIdx)}
             onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
             style={{
                 display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                 gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                 background: isHighlighted ? "rgba(10,132,255,.15)" : hov ? "rgba(255,255,255,.06)" : "transparent",
                 border: `1px solid ${isHighlighted ? "rgba(10,132,255,.35)" : "rgba(255,255,255,.05)"}`,
                 transition: "all .18s",
             }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isHighlighted ? "#6bc5ff" : "rgba(255,255,255,.9)", marginBottom: 2 }}>{activity.name}</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.38)", lineHeight: 1.3 }}>{activity.description}</div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right", paddingTop: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)", marginBottom: 2 }}>{activity.duration}</div>
                {activity.cost > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#30D158" }}>~{activity.cost}€</div>}
            </div>
        </div>
    );
}

export function ItineraryView({ trip, extraHeader }: Props) {
    const [openDayIdx, setOpenDayIdx] = useState<number>(0);
    const [highlightedPin, setHighlightedPin] = useState<{ dayIdx: number; actIdx: number } | null>(null);
    const [mapMounted, setMapMounted] = useState(false);
    const mapApiRef = useRef<MapApi | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollPanelRef = useRef<HTMLDivElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => { setMapMounted(true); }, []);

    const handleMapReady = useCallback((api: MapApi) => {
        mapApiRef.current = api;
    }, []);

    const handleActivityClick = useCallback((dayIdx: number, actIdx: number) => {
        setHighlightedPin({ dayIdx, actIdx });
        mapApiRef.current?.flyToPin(dayIdx, actIdx);
        setTimeout(() => setHighlightedPin(null), 2500);
    }, []);

    const handleDayClick = useCallback((dayIdx: number) => {
        setOpenDayIdx(prev => {
            const next = prev === dayIdx ? -1 : dayIdx;
            if (next !== -1) {
                mapApiRef.current?.flyToDay(next);
                setTimeout(() => cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
            }
            return next;
        });
    }, []);

    const handlePinClick = useCallback((dayIdx: number, actIdx: number) => {
        setOpenDayIdx(dayIdx);
        setHighlightedPin({ dayIdx, actIdx });
        setTimeout(() => cardRefs.current[dayIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
        setTimeout(() => setHighlightedPin(null), 2500);
    }, []);

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: "#070709", zIndex: 200 }}>
            {/* TOPBAR */}
            <div style={{
                height: 50, flexShrink: 0, display: "flex", alignItems: "center",
                padding: "0 16px", gap: 10,
                background: "rgba(7,7,9,0.97)", backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(255,255,255,.06)", zIndex: 20,
            }}>
                {extraHeader}
                <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-.4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.destination}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", whiteSpace: "nowrap" }}>{trip.dateFrom} → {trip.dateTo}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#30D158", whiteSpace: "nowrap" }}>~{trip.totalEstimatedCost} {trip.currency}</span>
                </div>
                <ExportPDF trip={trip} />
            </div>

            {/* BODY 50/50 */}
            <div style={{ height: "calc(100vh - 50px)", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>

                {/* LEFT */}
                <div
                    ref={scrollPanelRef}
                    onScroll={e => setShowScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
                    style={{ overflowY: "auto", overflowX: "hidden", borderRight: "1px solid rgba(255,255,255,.05)", padding: "12px 12px 32px 16px", position: "relative" }}>
                    {/* Scroll to top button */}
                    {showScrollTop && (
                        <button
                            onClick={() => scrollPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                            style={{
                                position: "sticky", top: 8, float: "right", zIndex: 10,
                                width: 28, height: 28, borderRadius: "50%",
                                background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
                                color: "rgba(255,255,255,.6)", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(10px)", transition: "all .2s",
                                marginBottom: -28,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.2)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="18 15 12 9 6 15"/>
                            </svg>
                        </button>
                    )}
                    {trip.generalTips?.length > 0 && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 10, background: "rgba(48,209,88,.06)", border: "1px solid rgba(48,209,88,.14)" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#30D158", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                                Tips
                            </div>
                            {trip.generalTips.map((t: string, i: number) => (
                                <div key={`tip-${i}`} style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "flex", gap: 7, marginBottom: i < trip.generalTips.length - 1 ? 5 : 0, lineHeight: 1.45 }}>
                                    <span style={{ color: "#30D158", flexShrink: 0 }}>·</span>{t}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {trip.itinerary.map((day: DayPlan, realIdx: number) => {
                            const isOpen = openDayIdx === realIdx;
                            const accent = DAY_ACCENT[realIdx % DAY_ACCENT.length];
                            return (
                                <div key={`day-${realIdx}`} ref={el => { cardRefs.current[realIdx] = el; }}
                                     style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${isOpen ? `${accent}35` : "rgba(255,255,255,.07)"}`, background: isOpen ? "rgba(255,255,255,.03)" : "transparent", transition: "border-color .2s, background .2s" }}
                                >
                                    <button onClick={() => handleDayClick(realIdx)} style={{
                                        width: "100%", padding: "0", display: "flex", alignItems: "stretch",
                                        background: "transparent", border: "none", cursor: "pointer", color: "var(--text)", fontFamily: "inherit",
                                    }}>
                                        <div style={{ width: 52, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isOpen ? `${accent}18` : "rgba(255,255,255,.03)", borderRight: `1px solid ${isOpen ? `${accent}30` : "rgba(255,255,255,.06)"}`, padding: "14px 0", transition: "background .2s" }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: isOpen ? accent : "rgba(255,255,255,.25)", letterSpacing: 1, textTransform: "uppercase" }}>Day</span>
                                            <span style={{ fontSize: 22, fontWeight: 800, color: isOpen ? accent : "rgba(255,255,255,.4)", lineHeight: 1.1, letterSpacing: "-1px" }}>{day.day}</span>
                                        </div>
                                        <div style={{ flex: 1, padding: "12px 12px 12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: isOpen ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.6)", letterSpacing: "-.2px" }}>{day.date}</div>
                                            {day.weather && (
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", display: "flex", alignItems: "center", gap: 4 }}>
                                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(100,180,255,.5)" strokeWidth="2" strokeLinecap="round"><path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 1 0-9.78 2.096A4.001 4.001 0 0 0 3 15z"/></svg>
                                                    {day.weather.description} · {day.weather.temp_min}–{day.weather.temp_max}°C
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: "12px 12px 12px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#30D158" }}>~{day.estimatedCost}€</span>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeLinecap="round"
                                                 style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .25s var(--spring)", flexShrink: 0 }}>
                                                <polyline points="6 9 12 15 18 9"/>
                                            </svg>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div style={{ padding: "4px 12px 14px 12px", borderTop: `1px solid ${accent}20` }}>
                                            {(["morning", "afternoon", "evening"] as const).filter(s => day[s]?.length > 0).map(slot => {
                                                const before = slot === "morning" ? 0 : slot === "afternoon" ? (day.morning?.length || 0) : (day.morning?.length || 0) + (day.afternoon?.length || 0);
                                                return (
                                                    <div key={`slot-${realIdx}-${slot}`} style={{ marginTop: 12 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: SLOT_COLORS[slot] }}>
                                                            <SlotIcon slot={slot}/>{slot}
                                                        </div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                            {day[slot].map((act: Activity, i: number) => (
                                                                <ActivityRow key={`act-${realIdx}-${slot}-${i}`} activity={act} dayIdx={realIdx} actIdx={before + i}
                                                                             onSelect={handleActivityClick}
                                                                             isHighlighted={highlightedPin?.dayIdx === realIdx && highlightedPin?.actIdx === before + i}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {day.meals?.length > 0 && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginBottom: 6 }}>Meals</div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
                                                        {day.meals.map((m: any, i: number) => (
                                                            <div key={`meal-${realIdx}-${i}`} style={{ padding: "7px 9px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}>
                                                                <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: .6, marginBottom: 3 }}>{m.type}</div>
                                                                <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,.75)", marginBottom: 2, lineHeight: 1.3 }}>{m.suggestion}</div>
                                                                <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>~{m.estimatedCost}€</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {day.tips?.length > 0 && (
                                                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(10,132,255,.06)", border: "1px solid rgba(10,132,255,.12)" }}>
                                                    {day.tips.map((t: string, i: number) => (
                                                        <div key={`tip-day-${realIdx}-${i}`} style={{ display: "flex", gap: 6, marginBottom: i < day.tips.length - 1 ? 4 : 0, fontSize: 10, color: "rgba(255,255,255,.4)", lineHeight: 1.4 }}>
                                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(10,132,255,.6)" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                                                            {t}
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

                {/* RIGHT — map */}
                <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {mapMounted && (
                        <MapWrapper
                            itinerary={trip.itinerary}
                            destination={trip.destination}
                            activeDayIdx={openDayIdx >= 0 ? openDayIdx : null}
                            onPinClick={handlePinClick}
                            onMapReady={handleMapReady}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}