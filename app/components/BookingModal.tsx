"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

interface PlannedRange {
  id: string;
  start: string;
  end: string;
}

interface BookingModalProps {
  range: PlannedRange;
  onClose: () => void;
  onBooked: (rangeId: string) => void; // removes the planned range + refreshes
}

function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Before August = base is LA, trip is to SF. August+ = base is SF, trip is to LA.
function getTripMeta(startDate: string) {
  const month = Number(startDate.split("-")[1]) - 1; // 0-indexed
  const isSFTrip = month < 7;
  return {
    isSFTrip,
    label: isSFTrip ? "SF Trip" : "LA Visit",
    outboundDir: isSFTrip ? "LA → SF" as const : "SF → LA" as const,
    returnDir:   isSFTrip ? "SF → LA" as const : "LA → SF" as const,
    outDepAirport: isSFTrip ? "LAX" : "SFO",
    outArrAirport: isSFTrip ? "SFO" : "LAX",
    retDepAirport: isSFTrip ? "SFO" : "LAX",
    retArrAirport: isSFTrip ? "LAX" : "SFO",
    city: isSFTrip ? "SF" as const : "LA" as const,
  };
}

export default function BookingModal({ range, onClose, onBooked }: BookingModalProps) {
  const meta = getTripMeta(range.start);
  const isMultiDay = range.start !== range.end;

  // Outbound flight fields
  const [outFlightNum, setOutFlightNum]   = useState("");
  const [outAirline, setOutAirline]       = useState("");
  const [outDepTime, setOutDepTime]       = useState("");
  const [outArrTime, setOutArrTime]       = useState("");

  // Return flight fields
  const [hasReturn, setHasReturn]         = useState(isMultiDay);
  const [retFlightNum, setRetFlightNum]   = useState("");
  const [retAirline, setRetAirline]       = useState("");
  const [retDepTime, setRetDepTime]       = useState("");
  const [retArrTime, setRetArrTime]       = useState("");

  // Period label
  const [tripLabel, setTripLabel]         = useState(meta.label);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  async function handleBook() {
    if (!outFlightNum) return;
    setSaving(true);
    setError(null);

    try {
      // Insert outbound flight
      const { error: e1 } = await supabase.from("flights").insert({
        id: `planned-${Date.now()}-out`,
        date: range.start,
        direction: meta.outboundDir,
        flight_number: outFlightNum.toUpperCase(),
        airline: outAirline || "Unknown",
        departure: outDepTime || "TBD",
        arrival: outArrTime || "TBD",
        departure_airport: meta.outDepAirport,
        arrival_airport: meta.outArrAirport,
      });
      if (e1) throw e1;

      // Insert return flight if provided
      if (hasReturn && retFlightNum) {
        const { error: e2 } = await supabase.from("flights").insert({
          id: `planned-${Date.now()}-ret`,
          date: range.end,
          direction: meta.returnDir,
          flight_number: retFlightNum.toUpperCase(),
          airline: retAirline || outAirline || "Unknown",
          departure: retDepTime || "TBD",
          arrival: retArrTime || "TBD",
          departure_airport: meta.retDepAirport,
          arrival_airport: meta.retArrAirport,
        });
        if (e2) throw e2;
      }

      // Insert travel period
      const { error: e3 } = await supabase.from("travel_periods").insert({
        start: range.start,
        end: range.end,
        city: meta.city,
        label: tripLabel || meta.label,
        who: "nicolas",
      });
      if (e3) throw e3;

      onBooked(range.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !!outFlightNum && !saving;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200 }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
        width: "min(480px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
        background: "#1c1c1f", border: "1px solid var(--border)", borderRadius: 12,
        padding: 24, zIndex: 201, display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Book Trip
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {formatDisplay(range.start)}{range.start !== range.end ? ` → ${formatDisplay(range.end)}` : ""}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: meta.isSFTrip ? "#fd5a1e" : "#4a9fd4",
                background: meta.isSFTrip ? "rgba(253,90,30,0.1)" : "rgba(74,159,212,0.1)",
                border: `1px solid ${meta.isSFTrip ? "rgba(253,90,30,0.25)" : "rgba(74,159,212,0.25)"}`,
                borderRadius: 4, padding: "1px 7px",
              }}>
                {meta.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* ── Outbound flight ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: meta.isSFTrip ? "#fd5a1e" : "#4a9fd4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✈ Outbound
            </span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {meta.outDepAirport} → {meta.outArrAirport} · {formatDisplay(range.start)}
            </span>
          </div>
          <FormRow label="Flight #">
            <input
              autoFocus
              type="text" placeholder="DL2267"
              value={outFlightNum} onChange={e => setOutFlightNum(e.target.value.toUpperCase())}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="Airline">
            <input
              type="text" placeholder="Delta Air Lines"
              value={outAirline} onChange={e => setOutAirline(e.target.value)}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="Departs">
            <input type="time" value={outDepTime} onChange={e => setOutDepTime(e.target.value)} style={inputStyle} />
          </FormRow>
          <FormRow label="Arrives">
            <input type="time" value={outArrTime} onChange={e => setOutArrTime(e.target.value)} style={inputStyle} />
          </FormRow>
        </div>

        {/* ── Return flight ── */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#4a9fd4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                ↩ Return
              </span>
              {hasReturn && (
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {meta.retDepAirport} → {meta.retArrAirport} · {formatDisplay(range.end)}
                </span>
              )}
            </div>
            <button
              onClick={() => setHasReturn(h => !h)}
              style={{
                fontSize: 11, fontWeight: 500, cursor: "pointer", borderRadius: 4, padding: "3px 10px",
                background: hasReturn ? "rgba(74,159,212,0.1)" : "var(--bg-elevated)",
                border: `1px solid ${hasReturn ? "rgba(74,159,212,0.3)" : "var(--border)"}`,
                color: hasReturn ? "#4a9fd4" : "var(--text-tertiary)",
              }}
            >
              {hasReturn ? "Added" : "+ Add return"}
            </button>
          </div>

          {hasReturn && (
            <>
              <FormRow label="Flight #">
                <input
                  type="text" placeholder="DL1559"
                  value={retFlightNum} onChange={e => setRetFlightNum(e.target.value.toUpperCase())}
                  style={inputStyle}
                />
              </FormRow>
              <FormRow label="Airline">
                <input
                  type="text" placeholder={outAirline || "Delta Air Lines"}
                  value={retAirline} onChange={e => setRetAirline(e.target.value)}
                  style={inputStyle}
                />
              </FormRow>
              <FormRow label="Departs">
                <input type="time" value={retDepTime} onChange={e => setRetDepTime(e.target.value)} style={inputStyle} />
              </FormRow>
              <FormRow label="Arrives">
                <input type="time" value={retArrTime} onChange={e => setRetArrTime(e.target.value)} style={inputStyle} />
              </FormRow>
            </>
          )}
        </div>

        {/* ── Trip label ── */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <FormRow label="Trip label">
            <input
              type="text" placeholder={meta.label}
              value={tripLabel} onChange={e => setTripLabel(e.target.value)}
              style={inputStyle}
            />
          </FormRow>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, padding: "8px 12px" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleBook}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? "var(--accent)" : "var(--bg-elevated)",
            border: "none", borderRadius: 8, padding: "10px 16px",
            fontSize: 13, fontWeight: 600,
            color: canSubmit ? "#fff" : "var(--text-tertiary)",
            cursor: canSubmit ? "pointer" : "not-allowed", width: "100%",
          }}
        >
          {saving ? "Booking…" : "Confirm & Book"}
        </button>
      </div>
    </>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0f0f10", border: "1px solid var(--border)", borderRadius: 6,
  padding: "7px 10px", fontSize: 13, color: "var(--text-primary)",
  outline: "none", width: "100%", colorScheme: "dark",
};
