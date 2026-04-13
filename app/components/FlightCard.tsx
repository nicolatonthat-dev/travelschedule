"use client";

import { Flight } from "../data/travel";

interface FlightCardProps {
  flight: Flight;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatTime(time: string) {
  if (time === "TBD") return "TBD";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${dayName}, ${MONTH_NAMES[month - 1]} ${day}`;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const isOutbound = flight.direction === "LA → SF";

  return (
    <div
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Direction icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isOutbound ? "rgba(253,90,30,0.1)" : "rgba(0,90,156,0.15)",
          border: `1px solid ${isOutbound ? "rgba(253,90,30,0.25)" : "rgba(0,90,156,0.35)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {isOutbound ? "↗" : "↙"}
      </div>

      {/* Route info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {flight.departureAirport}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>→</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {flight.arrivalAirport}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: isOutbound ? "#fd5a1e" : "#4a9fd4",
              background: isOutbound ? "rgba(253,90,30,0.08)" : "rgba(0,90,156,0.12)",
              border: `1px solid ${isOutbound ? "rgba(253,90,30,0.2)" : "rgba(0,90,156,0.3)"}`,
              borderRadius: 4,
              padding: "1px 6px",
              whiteSpace: "nowrap",
            }}
          >
            {isOutbound ? "SF" : "Home"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {formatDate(flight.date)} · {flight.flightNumber}
          {flight.confirmation && (
            <span style={{ marginLeft: 6, color: "var(--text-tertiary)" }}>
              · <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{flight.confirmation}</span>
            </span>
          )}
        </div>
      </div>

      {/* Times */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {flight.departure === "TBD" ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Times TBD</span>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(flight.departure)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>–</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(flight.arrival)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
