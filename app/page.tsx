"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlannerForm } from "@/components/PlannerForm";
import { TripResult } from "@/components/TripResult";
import { SavedTrips } from "@/components/SavedTrips";
import { NavBar } from "@/components/NavBar";
import type { Trip } from "@/types";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [view, setView] = useState<"plan" | "saved">("plan");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (activeTrip && resultRef.current) {
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 100);
    }
  }, [activeTrip]);

  if (status === "loading" || status === "unauthenticated") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" style={{ animation:"spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    </div>
  );

  return (
    <>
      <div className="orbs"><div className="o1"/><div className="o2"/><div className="o3"/><div className="o4"/></div>
      <div className="grid-overlay"/>

      <NavBar session={session} onViewChange={(v)=>{ setView(v); setActiveTrip(null); }} activeView={view}/>

      <main style={{ position:"relative", zIndex:1, paddingTop:80 }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 24px 80px" }}>
          {view==="plan" ? (
            <>
              <PlannerForm session={session} onResult={setActiveTrip}/>
              {activeTrip && (
                <div ref={resultRef} style={{ marginTop:28 }}>
                  <TripResult trip={activeTrip} onClose={()=>setActiveTrip(null)} onSaved={()=>{}}/>
                </div>
              )}
            </>
          ) : (
            <SavedTrips session={session} onSelect={setActiveTrip}/>
          )}
        </div>
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </>
  );
}
