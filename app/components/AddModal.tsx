"use client";

import { useState } from "react";
import { Flight, TravelPeriod } from "../data/travel";

interface AddModalProps {
  onAddFlight: (flight: Flight) => void;
  onAddPeriod: (period: TravelPeriod, who: "nicolas" | "taylor") => void;
}

type Tab = "flight" | "period";

export default function AddModal({ onAddFlight, onAddPeriod }: AddModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("flight");

  // Flight form
  const [direction, setDirection] = useState<"LA → SF" | "SF → LA">("LA → SF");
  const [date, setDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");

  // Period form
  const [who, setWho] = useState<"nicolas" | "taylor">("nicolas");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [label, setLabel] = useState("Work trip");

  function handleAddFlight() {
    if (!date || !flightNumber) return;
    const isOutbound = direction === "LA → SF";
    const flight: Flight = {
      id: `custom-${Date.now()}`,
      date,
      direction,
      airline: airline || "Unknown",
      flightNumber: flightNumber.toUpperCase(),
      departure: departure || "TBD",
      arrival: arrival || "TBD",
      departureAirport: isOutbound ? "LAX" : "SFO",
      arrivalAirport: isOutbound ? "SFO" : "LAX",
    };
    onAddFlight(flight);
    setOpen(false);
    setDate(""); setFlightNumber(""); setAirline(""); setDeparture(""); setArrival("");
  }

  function handleAddPeriod() {
    if (!periodStart || !periodEnd) return;
    const period: TravelPeriod = { start: periodStart, end: periodEnd, city: "SF", label: label || "Trip" };
    onAddPeriod(period, who);
    setOpen(false);
    setPeriodStart(""); setPeriodEnd(""); setLabel("Work trip"); setWho("nicolas");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Add flight or dates"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 6,
          border: "1px solid var(--border)", background: "var(--bg-elevated)",
          color: "var(--text-secondary)", cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
        }}
      >
        +
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />

          <div style={{
            position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
            width: "min(460px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
            background: "#1c1c1f", border: "1px solid var(--border)", borderRadius: 12,
            padding: 24, zIndex: 101, display: "flex", flexDirection: "column", gap: 20,
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Add</span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, background: "var(--bg-elevated)", borderRadius: 8, padding: 3 }}>
              {(["flight", "period"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: tab === t ? "#2a2a2e" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                }}>
                  {t === "flight" ? "Flight" : "Travel Period"}
                </button>
              ))}
            </div>

            {tab === "flight" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FormRow label="Direction">
                  <select value={direction} onChange={(e) => setDirection(e.target.value as "LA → SF" | "SF → LA")} style={selectStyle}>
                    <option value="LA → SF">LA → SF</option>
                    <option value="SF → LA">SF → LA</option>
                  </select>
                </FormRow>
                <FormRow label="Date">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
                </FormRow>
                <FormRow label="Flight #">
                  <input type="text" placeholder="DL2267" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} style={inputStyle} />
                </FormRow>
                <FormRow label="Airline">
                  <input type="text" placeholder="Delta Air Lines" value={airline} onChange={(e) => setAirline(e.target.value)} style={inputStyle} />
                </FormRow>
                <FormRow label="Departs">
                  <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} style={inputStyle} />
                </FormRow>
                <FormRow label="Arrives">
                  <input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} style={inputStyle} />
                </FormRow>
                <button onClick={handleAddFlight} disabled={!date || !flightNumber} style={submitStyle(!date || !flightNumber)}>
                  Add Flight
                </button>
              </div>
            )}

            {tab === "period" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FormRow label="Who">
                  <select value={who} onChange={(e) => setWho(e.target.value as "nicolas" | "taylor")} style={selectStyle}>
                    <option value="nicolas">Nicolas</option>
                    <option value="taylor">Taylor</option>
                  </select>
                </FormRow>
                <FormRow label="Start">
                  <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
                </FormRow>
                <FormRow label="End">
                  <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={inputStyle} />
                </FormRow>
                <FormRow label="Label">
                  <input type="text" placeholder="Work trip" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
                </FormRow>
                <button onClick={handleAddPeriod} disabled={!periodStart || !periodEnd} style={submitStyle(!periodStart || !periodEnd)}>
                  Add Period
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 12 }}>
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

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

function submitStyle(disabled: boolean): React.CSSProperties {
  return {
    marginTop: 4, background: disabled ? "var(--bg-elevated)" : "var(--accent)",
    border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600,
    color: disabled ? "var(--text-tertiary)" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer", width: "100%",
  };
}
