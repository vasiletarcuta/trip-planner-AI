"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <>
      <div className="orbs"><div className="o1"/><div className="o2"/><div className="o3"/><div className="o4"/></div>
      <div className="grid-overlay"/>

      <main style={{
        position:"relative", zIndex:1, minHeight:"100vh",
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"24px",
      }}>
        {/* Badge */}
        <div className="anim-fadeUp" style={{ animationDelay:".05s", marginBottom:28 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 16px", borderRadius:100,
            background:"rgba(10,132,255,.12)", border:"1px solid rgba(10,132,255,.28)",
            fontSize:11, fontWeight:700, letterSpacing:.8, textTransform:"uppercase",
            color:"var(--accent)",
          }}>
            <svg width="7" height="7" viewBox="0 0 10 10" fill="var(--accent)"><circle cx="5" cy="5" r="5"/></svg>
            Powered by Groq AI + OpenWeatherMap
          </div>
        </div>

        {/* Headline */}
        <h1 className="anim-fadeUp" style={{
          animationDelay:".1s",
          fontSize:"clamp(48px,9vw,96px)", fontWeight:700,
          letterSpacing:"-3px", lineHeight:.95, textAlign:"center",
          marginBottom:22,
          background:"linear-gradient(160deg,#fff 0%,rgba(255,255,255,.65) 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
        }}>
          Plan your<br/>
          <span style={{
            background:"linear-gradient(130deg,#0A84FF 0%,#30D158 50%,#FF9F0A 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>perfect trip.</span>
        </h1>

        {/* Subtext */}
        <p className="anim-fadeUp" style={{
          animationDelay:".15s",
          fontSize:17, color:"var(--text-2)", maxWidth:440,
          textAlign:"center", lineHeight:1.6, letterSpacing:"-.2px", marginBottom:48,
        }}>
          AI builds your day-by-day itinerary with real weather forecasts, activities, meals and budget tracking.
        </p>

        {/* Feature pills */}
        <div className="anim-fadeUp" style={{ animationDelay:".2s", display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginBottom:48 }}>
          {[
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>, label:"Smart Itineraries" },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round"><path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 1 0-9.78 2.096A4.001 4.001 0 0 0 3 15z"/></svg>, label:"Live Weather" },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label:"Budget Tracking" },
            { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>, label:"Save Trips" },
          ].map((f,i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:7, padding:"7px 14px",
              background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)",
              borderRadius:100, fontSize:12, fontWeight:500, color:"var(--text-2)",
            }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="anim-fadeUp" style={{ animationDelay:".25s" }}>
          <button className="btn-primary" onClick={handleSignIn} disabled={loading}
            style={{ fontSize:16, padding:"17px 40px", opacity:loading?.7:1 }}>
            {loading ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin .8s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in...</>
            ) : (
              <><svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</>
            )}
          </button>
        </div>

        <p style={{ marginTop:20, fontSize:11, color:"var(--text-3)", letterSpacing:.3 }}>
          Secure sign-in · Data saved to Firebase
        </p>
      </main>
    </>
  );
}
