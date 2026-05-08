"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/auth/signin");
    }, [status, router]);

    if (status === "loading" || status === "unauthenticated") return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#070709" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"
                 style={{ animation: "spin .8s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (activeTrip) {
        return <TripResult trip={activeTrip} onClose={() => setActiveTrip(null)} onSaved={() => {}} />;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#070709" }}>
            <div className="orbs"><div className="o1"/><div className="o2"/><div className="o3"/><div className="o4"/></div>
            <div className="grid-overlay"/>
            <NavBar session={session} onViewChange={setView} activeView={view} />

            <main style={{ position: "relative", zIndex: 1, paddingTop: 80 }}>
                {view === "plan" ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px 80px" }}>
                        <div style={{ width: "100%", maxWidth: 700 }}>
                            <PlannerForm session={session} onResult={setActiveTrip} />
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: "32px 32px 80px" }}>
                        <SavedTrips session={session} onSelect={setActiveTrip} />
                    </div>
                )}
            </main>
        </div>
    );
}