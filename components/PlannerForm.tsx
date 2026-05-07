"use client";
import { useState } from "react";
import type { Session } from "next-auth";
import type { Trip, TripRequest } from "@/types";
import { useTrips } from "@/hooks/useTrips";

interface Props {
  session: Session | null;
  onResult: (trip: Trip) => void;
}

const STYLES = [
  { key:"relaxed",   label:"Relaxed",   color:"#30D158", icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg> },
  { key:"adventure", label:"Adventure", color:"#FF9F0A", icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 17l6-8 4 4 3-4 5 8H3z"/><circle cx="17" cy="7" r="2"/></svg> },
  { key:"cultural",  label:"Cultural",  color:"#BF5AF2", icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg> },
  { key:"foodie",    label:"Foodie",    color:"#FF453A", icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> },
];

const CURRENCIES = ["EUR","USD","GBP","RON","JPY","AUD"];

const today = new Date().toISOString().split("T")[0];
const nextWeek = new Date(Date.now()+7*86400000).toISOString().split("T")[0];

export function PlannerForm({ session, onResult }: Props) {
  const [form, setForm] = useState<TripRequest>({
    destination:"", dateFrom:today, dateTo:nextWeek,
    budget:1000, currency:"EUR", style:"cultural",
  });
  const [hovStyle, setHovStyle] = useState<string|null>(null);
  const { generating, error, generateTrip } = useTrips();

  const days = form.dateFrom && form.dateTo
    ? Math.max(1, Math.ceil((new Date(form.dateTo).getTime()-new Date(form.dateFrom).getTime())/86400000)+1)
    : 0;

  const handleSubmit = async () => {
    if (!form.destination.trim()) return;
    const trip = await generateTrip(form);
    if (trip) onResult(trip);
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize:11, fontWeight:700, color:"var(--text-2)", letterSpacing:.9, textTransform:"uppercase", marginBottom:9 }}>{children}</div>
  );

  return (
    <div className="glass anim-scaleIn" style={{
      padding:36, position:"relative", overflow:"hidden",
      boxShadow:"0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)",
    }}>
      {/* shimmer top */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)" }}/>

      {/* DESTINATION */}
      <div style={{ marginBottom:24 }}>
        <Label>Destination</Label>
        <div className="input-icon">
          <span className="icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </span>
          <input className="input" style={{ fontSize:16, fontWeight:500 }}
            placeholder="Paris, Tokyo, New York..."
            value={form.destination}
            onChange={e=>setForm(f=>({...f,destination:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          />
        </div>
      </div>

      {/* DATES */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <div>
          <Label>Departure</Label>
          <div className="input-icon">
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <input className="input" type="date" min={today}
              value={form.dateFrom}
              onChange={e=>setForm(f=>({...f,dateFrom:e.target.value}))}
            />
          </div>
        </div>
        <div>
          <Label>Return</Label>
          <div className="input-icon">
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <input className="input" type="date" min={form.dateFrom||today}
              value={form.dateTo}
              onChange={e=>setForm(f=>({...f,dateTo:e.target.value}))}
            />
          </div>
        </div>
      </div>

      {days > 0 && (
        <div style={{ marginTop:-14, marginBottom:20, fontSize:12, color:"var(--accent)", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {days} day{days!==1?"s":""} trip
        </div>
      )}

      {/* BUDGET + CURRENCY */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:24 }}>
        <div>
          <Label>Total Budget</Label>
          <div className="input-icon">
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            <input className="input" type="number" min={1}
              value={form.budget}
              onChange={e=>setForm(f=>({...f,budget:parseFloat(e.target.value)||0}))}
            />
          </div>
        </div>
        <div>
          <Label>Currency</Label>
          <select className="input" value={form.currency}
            onChange={e=>setForm(f=>({...f,currency:e.target.value}))}
            style={{ cursor:"pointer", appearance:"none", width:90 }}>
            {CURRENCIES.map(c=><option key={c} value={c} style={{background:"#111"}}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* STYLE */}
      <div style={{ marginBottom:30 }}>
        <Label>Travel Style</Label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {STYLES.map(s=>{
            const active = form.style===s.key;
            const hov = hovStyle===s.key;
            return (
              <button key={s.key}
                onClick={()=>setForm(f=>({...f,style:s.key as any}))}
                onMouseEnter={()=>setHovStyle(s.key)}
                onMouseLeave={()=>setHovStyle(null)}
                style={{
                  padding:"14px 8px", borderRadius:14, border:"1px solid",
                  borderColor: active ? s.color : "rgba(255,255,255,.1)",
                  background: active ? `${s.color}18` : hov ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.03)",
                  cursor:"pointer", fontFamily:"inherit",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  color: active ? s.color : "var(--text-2)",
                  transform: active ? "scale(1.06)" : hov ? "scale(1.03)" : "scale(1)",
                  boxShadow: active ? `0 6px 20px ${s.color}22` : "none",
                  transition:"all .35s var(--spring)",
                }}>
                {s.icon}
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:.2 }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom:14, padding:"11px 14px", borderRadius:10, background:"rgba(255,69,58,.12)", border:"1px solid rgba(255,69,58,.25)", color:"#FF453A", fontSize:13 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit}
        disabled={generating||!form.destination.trim()||days<=0}
        style={{ width:"100%", padding:"16px", fontSize:15, borderRadius:14, opacity:generating||!form.destination.trim()?0.6:1 }}>
        {generating ? (
          <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Generating...</>
        ) : (
          <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Generate Itinerary</>
        )}
      </button>
    </div>
  );
}
