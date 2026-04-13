"use client";

import { useState } from "react";
import { Flight } from "../data/travel";

interface FlightDetailModalProps {
  flight: Flight;
  onSave: (flight: Flight) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function FlightDetailModal({ flight, onSave, onDelete, onClose }: FlightDetailModalProps) {
  const [direction, setDirection] = useState(flight.direction);
  const [date, setDate] = useState(flight.date);
  const [flightNumber, setFlightNumber] = useState(flight.flightNumber);
  const [airline, setAirline] = useState(flight.airline);
  const [departure, setDeparture] = useState(flight.departure === "TBD" ? "" : flight.departure);
  const [arrival, setArrival] = useState(flight.arrival === "TBD" ? "" : flight.arrival);
  const [confirmation, setConfirmation] = useState(flight.confirmation ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    if (!date || !flightNumber) return;
    const isOutbound = direction === "LA → SF";
    onSave({
      ...flight,
      date,
      direction,
      airline: airline || "Unknown",
      flightNumber: flightNumber.toUpperCase(),
      departure: departure || "TBD",
      arrival: arrival || "TBD",
      departureAirport: isOutbound ? "LAX" : "SFO",
      arrivalAirport: isOutbound ? "SFO" : "LAX",
      confirmation: confirmation || undefined,
    });
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} />

      <div style={{
        position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
        width: "min(460px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
        background: "#1c1c1f", border: "1px solid var(--border)", borderRadius: 12,
        padding: 24, zIndex: 101, display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Edit Flight</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Form */}
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
            <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} style={inputStyle} />
          </FormRow>
          <FormRow label="Airline">
            <input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} style={inputStyle} />
          </FormRow>
          <FormRow label="Departs">
            <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} style={inputStyle} />
          </FormRow>
          <FormRow label="Arrives">
            <input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} style={inputStyle} />
          </FormRow>
          <FormRow label="Confirmation">
            <input type="text" placeholder="Optional" value={confirmation} onChange={(e) => setConfirmation(e.target.value.toUpperCase())} style={inputStyle} />
          </FormRow>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleSave} disabled={!date || !flightNumber} style={{
            background: !date || !flightNumber ? "var(--bg-elevated)" : "var(--accent)",
            border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600,
            color: !date || !flightNumber ? "var(--text-tertiary)" : "#fff",
            cursor: !date || !flightNumber ? "not-allowed" : "pointer", width: "100%",
          }}>
            Save Changes
          </button>

          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} style={{
              background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
              padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#f87171",
              cursor: "pointer", width: "100%",
            }}>
              Delete Flight
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmingDelete(false)} style={{
                flex: 1, background: "transparent", border: "1px solid var(--border)", borderRadius: 8,
                padding: "10px 0", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={() => { onDelete(flight.id); onClose(); }} style={{
                flex: 1, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8,
                padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#f87171", cursor: "pointer",
              }}>
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      </div>
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
