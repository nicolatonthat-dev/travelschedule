"use client";

import { Flight, TravelPeriod } from "../data/travel";

interface TripCardProps {
  outbound: Flight;
  returnFlight?: Flight;
  travelPeriods: TravelPeriod[];
  onFlightClick: (flight: Flight) => void;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES_SHORT[date.getDay()]}, ${MONTH_NAMES[m - 1]} ${d}`;
}

function formatShort(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

function formatTime(time: string) {
  if (!time || time === "TBD") return "TBD";
  const [h, min] = time.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${p}`;
}

function nightsBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function buildGCalUrl(outbound: Flight, returnFlight?: Flight) {
  const startDate = outbound.date.replace(/-/g, "");
  const endRaw = returnFlight?.date ?? outbound.date;
  const [ey, em, ed] = endRaw.split("-").map(Number);
  const endDate = new Date(ey, em - 1, ed + 1).toISOString().split("T")[0].replace(/-/g, "");

  const lines = [
    `✈ Departs: ${outbound.departureAirport} → ${outbound.arrivalAirport}`,
    outbound.departure !== "TBD"
      ? `  ${formatTime(outbound.departure)} → ${formatTime(outbound.arrival)} · ${outbound.flightNumber}`
      : `  ${outbound.flightNumber}`,
  ];
  if (returnFlight) {
    lines.push(`↩ Returns: ${returnFlight.departureAirport} → ${returnFlight.arrivalAirport}`);
    if (returnFlight.departure !== "TBD") {
      lines.push(`  ${formatTime(returnFlight.departure)} → ${formatTime(returnFlight.arrival)} · ${returnFlight.flightNumber}`);
    }
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Nic in San Francisco",
    dates: `${startDate}/${endDate}`,
    details: lines.join("\n"),
    location: outbound.arrivalAirport === "SFO" ? "San Francisco, CA" : "Los Angeles, CA",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Flight row inside a trip card ─────────────────────────────────────────────

function FlightRow({ flight, onClick }: { flight: Flight; onClick: () => void }) {
  const isOut = flight.direction === "LA → SF";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 16px",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Direction icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: isOut ? "rgba(253,90,30,0.1)" : "rgba(0,90,156,0.15)",
        border: `1px solid ${isOut ? "rgba(253,90,30,0.25)" : "rgba(0,90,156,0.35)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13,
      }}>
        {isOut ? "↗" : "↙"}
      </div>

      {/* Route + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {flight.departureAirport}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>→</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {flight.arrivalAirport}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {formatDate(flight.date)} · {flight.flightNumber}
        </div>
      </div>

      {/* Times */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {flight.departure === "TBD" ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Times TBD</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(flight.departure)}<span style={{ color: "var(--text-tertiary)", fontWeight: 400, margin: "0 4px" }}>–</span>{formatTime(flight.arrival)}
          </span>
        )}
      </div>

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", flexShrink: 0, opacity: 0.5 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

// ── Main TripCard ─────────────────────────────────────────────────────────────

export default function TripCard({ outbound, returnFlight, travelPeriods, onFlightClick }: TripCardProps) {
  const isOutbound = outbound.direction === "LA → SF";
  const endDate = returnFlight?.date ?? outbound.date;
  const nights = nightsBetween(outbound.date, endDate);

  // Find matching travel period for the label
  const period = travelPeriods.find(p =>
    outbound.date >= p.start && outbound.date <= p.end
  );
  const tripLabel = period?.label ?? (isOutbound ? "SF Trip" : "LA Visit");

  const accentColor = isOutbound ? "#fd5a1e" : "#4a9fd4";
  const accentBg    = isOutbound ? "rgba(253,90,30,0.1)"  : "rgba(74,159,212,0.1)";
  const accentBorder = isOutbound ? "rgba(253,90,30,0.25)" : "rgba(74,159,212,0.25)";

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 10,
      overflow: "hidden",
      background: "transparent",
    }}>
      {/* Trip header */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Label badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, color: accentColor,
            background: accentBg, border: `1px solid ${accentBorder}`,
            borderRadius: 4, padding: "2px 8px",
          }}>
            {tripLabel}
          </span>
          {/* Date range */}
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {outbound.date === endDate
              ? formatShort(outbound.date)
              : `${formatShort(outbound.date)} – ${formatShort(endDate)}`}
          </span>
          {/* Duration */}
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {nights === 0 ? "Day trip" : `${nights} night${nights !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Calendar add button */}
        <a
          href={buildGCalUrl(outbound, returnFlight)}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: 6,
            border: "1px solid var(--border)", background: "var(--bg-elevated)",
            color: "var(--text-tertiary)", textDecoration: "none", flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </a>
      </div>

      {/* Flight rows */}
      <FlightRow flight={outbound} onClick={() => onFlightClick(outbound)} />
      {returnFlight && (
        <>
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 16px" }} />
          <FlightRow flight={returnFlight} onClick={() => onFlightClick(returnFlight)} />
        </>
      )}
      {!returnFlight && (
        <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}>
          Return TBD
        </div>
      )}
    </div>
  );
}
