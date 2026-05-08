"use client";
import { useState } from "react";
import type { Trip } from "@/types";

interface Props { trip: Trip; }

export function ExportPDF({ trip }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const M = 14;
      const CW = W - M * 2;
      let y = 0;

      const newPage = () => {
        doc.addPage();
        y = M;
      };
      const gap = (n: number) => { y += n; };
      const check = (need: number) => { if (y + need > 282) newPage(); };

      // ── COVER HEADER ──
      doc.setFillColor(5, 5, 10);
      doc.rect(0, 0, W, 48, "F");

      // accent line
      doc.setFillColor(10, 132, 255);
      doc.rect(0, 0, 4, 48, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text(trip.destination, M + 4, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 160, 200);
      doc.text(`${trip.dateFrom}  →  ${trip.dateTo}    ${trip.days} days    ${trip.style}`, M + 4, 30);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(48, 209, 88);
      doc.text(`~${trip.totalEstimatedCost} ${trip.currency}`, M + 4, 40);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 80, 100);
      doc.text("TripAI", W - M, 44, { align: "right" });

      y = 56;

      // ── GENERAL TIPS ──
      if (trip.generalTips?.length) {
        check(30);
        doc.setFillColor(240, 250, 244);
        doc.roundedRect(M, y, CW, 7 + trip.generalTips.length * 6, 3, 3, "F");
        doc.setFillColor(48, 209, 88);
        doc.roundedRect(M, y, 3, 7 + trip.generalTips.length * 6, 1, 1, "F");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 120, 60);
        doc.text("GENERAL TIPS", M + 6, y + 5);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 60, 40);
        doc.setFontSize(8.5);
        trip.generalTips.forEach(tip => {
          const lines = doc.splitTextToSize(`· ${tip}`, CW - 10);
          doc.text(lines, M + 6, y);
          y += lines.length * 5.5;
        });
        gap(6);
      }

      // ── DAYS ──
      const SLOT_BG: Record<string, [number,number,number]> = {
        morning:   [255, 248, 230],
        afternoon: [230, 242, 255],
        evening:   [245, 235, 255],
      };
      const SLOT_FG: Record<string, [number,number,number]> = {
        morning:   [180, 100, 0],
        afternoon: [10, 80, 180],
        evening:   [100, 20, 180],
      };
      const SLOT_ACCENT: Record<string, [number,number,number]> = {
        morning:   [255, 159, 10],
        afternoon: [10, 132, 255],
        evening:   [191, 90, 242],
      };

      for (const day of trip.itinerary) {
        check(20);

        // ── Day header ──
        doc.setFillColor(15, 15, 25);
        doc.roundedRect(M, y, CW, 14, 3, 3, "F");

        // colored left strip per day
        const dayColors: [number,number,number][] = [
          [10,132,255],[48,209,88],[255,159,10],[191,90,242],[255,69,58],[100,210,255],[255,220,0]
        ];
        const [dr, dg, db] = dayColors[(day.day - 1) % dayColors.length];
        doc.setFillColor(dr, dg, db);
        doc.roundedRect(M, y, 3, 14, 1, 1, "F");

        // Day number circle
        doc.setFillColor(dr, dg, db);
        doc.circle(M + 11, y + 7, 4.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(String(day.day), M + 11, y + 9.2, { align: "center" });

        // Day title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Day ${day.day}  —  ${day.date}`, M + 19, y + 6);

        // Weather
        if (day.weather) {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(160, 190, 220);
          doc.text(`${day.weather.description}  ${day.weather.temp_min}–${day.weather.temp_max}°C`, M + 19, y + 11);
        }

        // Cost
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(dr, dg, db);
        doc.text(`~${day.estimatedCost}€`, W - M - 2, y + 8.5, { align: "right" });

        y += 17;

        // ── Activity slots ──
        for (const slot of ["morning", "afternoon", "evening"] as const) {
          if (!day[slot]?.length) continue;
          check(10);

          const [ar, ag, ab] = SLOT_ACCENT[slot];
          const [fr, fg, fb] = SLOT_FG[slot];

          // Slot label
          doc.setFillColor(ar, ag, ab);
          doc.circle(M + 3, y + 2.5, 1.5, "F");
          doc.setTextColor(fr, fg, fb);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text(slot.toUpperCase(), M + 6, y + 4);
          y += 7;

          for (const act of day[slot]) {
            check(11);
            const [bgr, bgg, bgb] = SLOT_BG[slot];
            doc.setFillColor(bgr, bgg, bgb);
            doc.roundedRect(M, y, CW, 9, 2, 2, "F");

            // Name
            doc.setTextColor(20, 20, 30);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            const nameMax = CW * 0.55;
            const nameTrimmed = doc.splitTextToSize(act.name, nameMax)[0];
            doc.text(nameTrimmed, M + 3, y + 6);

            // Description
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 120);
            doc.setFontSize(7);
            const descMax = CW * 0.45;
            const descTrimmed = doc.splitTextToSize(act.description, descMax)[0];
            doc.text(descTrimmed, M + 3, y + 6 + 0.1, { baseline: "hanging" });

            // Duration
            doc.setTextColor(120, 120, 140);
            doc.setFontSize(7.5);
            doc.text(act.duration, W - M - (act.cost > 0 ? 16 : 2), y + 6, { align: "right" });

            // Cost
            if (act.cost > 0) {
              doc.setFont("helvetica", "bold");
              doc.setTextColor(40, 160, 80);
              doc.setFontSize(7.5);
              doc.text(`~${act.cost}€`, W - M - 1, y + 6, { align: "right" });
            }

            y += 10.5;
          }
          gap(2);
        }

        // ── Meals ──
        if (day.meals?.length) {
          check(16);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 120, 0);
          doc.setFillColor(255, 159, 10);
          doc.circle(M + 3, y + 2.5, 1.5, "F");
          doc.text("MEALS", M + 6, y + 4);
          y += 7;

          const mw = (CW - 4) / 3;
          check(12);
          day.meals.forEach((m, i) => {
            const mx = M + i * (mw + 2);
            doc.setFillColor(255, 250, 238);
            doc.roundedRect(mx, y, mw, 11, 2, 2, "F");
            doc.setDrawColor(255, 210, 120);
            doc.roundedRect(mx, y, mw, 11, 2, 2, "S");
            doc.setTextColor(160, 90, 0);
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.text(m.type.toUpperCase(), mx + 2, y + 3.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(7.5);
            const sug = doc.splitTextToSize(m.suggestion, mw - 4)[0];
            doc.text(sug, mx + 2, y + 7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(40, 160, 80);
            doc.setFontSize(7);
            doc.text(`~${m.estimatedCost}€`, mx + mw - 2, y + 7.5, { align: "right" });
          });
          y += 14;
        }

        // ── Tips ──
        if (day.tips?.length) {
          check(10);
          const tipH = 5 + day.tips.length * 5;
          doc.setFillColor(232, 242, 255);
          doc.roundedRect(M, y, CW, tipH, 2, 2, "F");
          doc.setFillColor(10, 132, 255);
          doc.roundedRect(M, y, 2.5, tipH, 1, 1, "F");
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 60, 140);
          day.tips.forEach((t, i) => {
            const lines = doc.splitTextToSize(t, CW - 8);
            doc.text(lines, M + 5, y + 4 + i * 5);
          });
          y += tipH + 2;
        }

        gap(7);
      }

      // ── FOOTER on every page ──
      const total = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setDrawColor(220, 225, 235);
        doc.line(M, 289, W - M, 289);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 170, 185);
        doc.text(`${trip.destination} · ${trip.dateFrom} – ${trip.dateTo}`, M, 293);
        doc.text(`TripAI  ·  Page ${p} of ${total}`, W - M, 293, { align: "right" });
      }

      doc.save(`${trip.destination.replace(/[^a-z0-9]/gi, "_")}_itinerary.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
      <button onClick={handleExport} disabled={loading} className="btn-glass"
              style={{ padding: "6px 13px", fontSize: 12, opacity: loading ? 0.6 : 1, flexShrink: 0 }}>
        {loading ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   style={{ animation: "spin .8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Exporting...
            </>
        ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </>
        )}
      </button>
  );
}