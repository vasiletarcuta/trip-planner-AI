"use client";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  session: Session | null;
  onViewChange: (v: "plan" | "saved") => void;
  activeView: "plan" | "saved";
}

export function NavBar({ session, onViewChange, activeView }: Props) {
  return (
    <nav style={{
      position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
      zIndex:100, display:"flex", alignItems:"center", gap:6, padding:"7px 10px",
      background:"rgba(15,15,18,.65)",
      backdropFilter:"blur(40px) saturate(200%)", WebkitBackdropFilter:"blur(40px) saturate(200%)",
      border:"1px solid rgba(255,255,255,.1)", borderRadius:100,
      boxShadow:"0 8px 32px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.07)",
      whiteSpace:"nowrap",
    }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px" }}>
        <div style={{
          width:26, height:26, borderRadius:8, flexShrink:0,
          background:"linear-gradient(135deg,#0A84FF,#30D158)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <span style={{ fontSize:14, fontWeight:700, letterSpacing:"-.4px" }}>TripAI</span>
      </div>

      <div style={{ width:1, height:18, background:"rgba(255,255,255,.1)" }}/>

      {[
        { key:"plan", label:"Plan", icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
        { key:"saved", label:"Saved", icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
      ].map(item => (
        <button key={item.key} onClick={() => onViewChange(item.key as any)} style={{
          display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
          borderRadius:100, border:"none", cursor:"pointer", fontFamily:"inherit",
          fontSize:13, fontWeight:500,
          background: activeView===item.key ? "rgba(255,255,255,.13)" : "transparent",
          color: activeView===item.key ? "#fff" : "rgba(255,255,255,.5)",
          transition:"all .25s var(--spring)",
        }}>
          {item.icon}{item.label}
        </button>
      ))}

      <div style={{ width:1, height:18, background:"rgba(255,255,255,.1)" }}/>

      {session ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:4 }}>
          {session.user?.image
            ? <img src={session.user.image} alt="" style={{ width:26, height:26, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,.18)", flexShrink:0 }}/>
            : <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(10,132,255,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{session.user?.name?.[0]}</div>
          }
          <button onClick={() => signOut({ callbackUrl:"/auth/signin" })} style={{
            padding:"6px 12px", borderRadius:100, border:"1px solid rgba(255,255,255,.1)",
            background:"transparent", color:"rgba(255,255,255,.45)", fontSize:12,
            fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
          }}
            onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,.8)")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,.45)")}
          >Sign out</button>
        </div>
      ) : null}
    </nav>
  );
}
