"use client";

import { useState, useEffect } from "react";
import MonthCalendar from "./components/MonthCalendar";
import FlightCard from "./components/FlightCard";
import AddModal from "./components/AddModal";
import FlightDetailModal from "./components/FlightDetailModal";
import TravelPlanner from "./components/TravelPlanner";
import TripCard from "./components/TripCard";
import { Flight, TravelPeriod } from "./data/travel";
import { supabase } from "../lib/supabase";

function mapFlight(row: Record<string, string>): Flight {
  return {
    id: row.id,
    date: row.date,
    direction: row.direction as "LA → SF" | "SF → LA",
    flightNumber: row.flight_number,
    airline: row.airline,
    departure: row.departure,
    arrival: row.arrival,
    departureAirport: row.departure_airport,
    arrivalAirport: row.arrival_airport,
  };
}

function mapPeriod(row: Record<string, string>): TravelPeriod {
  return {
    start: row.start,
    end: row.end,
    city: row.city as "SF" | "LA",
    label: row.label,
  };
}

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [travelPeriods, setTravelPeriods] = useState<TravelPeriod[]>([]);
  const [taylorPeriods, setTaylorPeriods] = useState<TravelPeriod[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [calOffset, setCalOffset] = useState(0);

  async function loadData() {
    const [{ data: flightRows }, { data: periodRows }] = await Promise.all([
      supabase.from("flights").select("*").order("date"),
      supabase.from("travel_periods").select("*").order("start"),
    ]);
    setFlights((flightRows ?? []).map(mapFlight));
    setTravelPeriods((periodRows ?? []).filter((r: Record<string, string>) => r.who === "nicolas").map(mapPeriod));
    setTaylorPeriods((periodRows ?? []).filter((r: Record<string, string>) => r.who === "taylor").map(mapPeriod));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddFlight(flight: Flight) {
    await supabase.from("flights").insert({
      id: flight.id,
      date: flight.date,
      direction: flight.direction,
      flight_number: flight.flightNumber,
      airline: flight.airline,
      departure: flight.departure,
      arrival: flight.arrival,
      departure_airport: flight.departureAirport,
      arrival_airport: flight.arrivalAirport,
    });
    await loadData();
  }

  async function handleAddPeriod(period: TravelPeriod, who: "nicolas" | "taylor") {
    await supabase.from("travel_periods").insert({
      start: period.start,
      end: period.end,
      city: period.city,
      label: period.label,
      who,
    });
    await loadData();
  }

  async function handleSaveFlight(updated: Flight) {
    await supabase.from("flights").update({
      date: updated.date,
      direction: updated.direction,
      flight_number: updated.flightNumber,
      airline: updated.airline,
      departure: updated.departure,
      arrival: updated.arrival,
      departure_airport: updated.departureAirport,
      arrival_airport: updated.arrivalAirport,
    }).eq("id", updated.id);
    await loadData();
  }

  async function handleDeleteFlight(id: string) {
    await supabase.from("flights").delete().eq("id", id);
    await loadData();
  }

  // Use local date — not UTC — so the pill/banner don't flip at 5pm PDT
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

  const upcomingFlights = flights
    .filter((f) => f.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastFlights = flights
    .filter((f) => f.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group flights into trips (outbound LA→SF paired with next SF→LA)
  function groupIntoTrips(flights: Flight[]) {
    const sorted = [...flights].sort((a, b) => a.date.localeCompare(b.date));
    const used = new Set<string>();
    const trips: { outbound: Flight; ret?: Flight }[] = [];
    for (const f of sorted) {
      if (used.has(f.id)) continue;
      if (f.direction === "LA → SF") {
        const ret = sorted.find(r => !used.has(r.id) && r.direction === "SF → LA" && r.date >= f.date);
        trips.push({ outbound: f, ret });
        used.add(f.id);
        if (ret) used.add(ret.id);
      }
    }
    // Any orphaned SF→LA (edge case)
    for (const f of sorted) {
      if (!used.has(f.id)) trips.push({ outbound: f });
    }
    return trips;
  }

  const upcomingTrips = groupIntoTrips(upcomingFlights);
  const pastTrips     = groupIntoTrips(pastFlights);

  const inSF = travelPeriods.some(
    (p) => p.city === "SF" && today >= p.start && today <= p.end
  );

  // ── Current trip (when inSF) ────────────────────────────────────────────────
  const currentPeriod = travelPeriods.find(
    (p) => p.city === "SF" && today >= p.start && today <= p.end
  );
  const currentOutbound = currentPeriod
    ? flights.find((f) => f.direction === "LA → SF" && f.date >= currentPeriod.start && f.date <= currentPeriod.end)
    : undefined;
  const currentReturn = currentPeriod
    ? flights.find((f) => f.direction === "SF → LA" && f.date >= currentPeriod.start && f.date <= currentPeriod.end)
    : undefined;

  // ── Next trip — skips current if in SF ──────────────────────────────────────
  const nextFlightOut = inSF && currentPeriod
    ? flights.filter((f) => f.direction === "LA → SF" && f.date > currentPeriod.end)
             .sort((a, b) => a.date.localeCompare(b.date))[0]
    : upcomingFlights.find((f) => f.direction === "LA → SF");

  const returnFlight = nextFlightOut
    ? flights
        .filter((f) => f.direction === "SF → LA" && f.date >= nextFlightOut.date)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
    : undefined;

  // nextTrip still used for calendar + date range display
  const nextTrip = travelPeriods
    .filter((p) => p.city === "SF" && p.end >= today && (!currentPeriod || p.start > currentPeriod.end))
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  if (loading) return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Loading...</div>
    </main>
  );

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Top nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(15,15,16,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 24px",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {/* Linear-style logo mark */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "linear-gradient(135deg, #5e6ad2, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              N
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              Nic&apos;s Travel
            </span>
            <span style={{ color: "var(--text-tertiary)", fontSize: 14, flexShrink: 0 }}>/</span>
            <span style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              LA ↔ SF
            </span>
          </div>

          {/* Right side: add button + status pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <AddModal onAddFlight={handleAddFlight} onAddPeriod={handleAddPeriod} />
          {/* Status pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 20,
              border: `1px solid ${inSF ? "rgba(94,106,210,0.3)" : "rgba(34,197,94,0.3)"}`,
              background: inSF ? "var(--accent-subtle)" : "rgba(34,197,94,0.08)",
              color: inSF ? "#818cf8" : "#4ade80",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: inSF ? "#818cf8" : "#4ade80",
                flexShrink: 0,
                boxShadow: inSF ? "none" : "0 0 6px #4ade80",
              }}
            />
            {inSF ? "SF" : "LA"}
          </div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Current Trip banner (only when inSF) ── */}
          {inSF && currentPeriod && (
            <div style={{ borderRadius: 12, border: "1px solid rgba(253,90,30,0.25)", background: "transparent", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fd5a1e", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Current Trip
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {formatShortDate(currentPeriod.start)}{currentPeriod.start !== currentPeriod.end ? ` – ${formatShortDate(currentPeriod.end)}` : ""}
                  {currentPeriod.label ? ` · ${currentPeriod.label}` : ""}
                </div>
              </div>
              {/* Two legs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
                {currentOutbound ? (
                  <FlightLeg label="Departed" flight={currentOutbound} color="#fd5a1e" showFlightAware />
                ) : (
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Outbound TBD</span>
                  </div>
                )}
                <div style={{ background: "var(--border-subtle)", margin: "16px 0" }} />
                {currentReturn ? (
                  <FlightLeg label="Returns" flight={currentReturn} color="#4a9fd4" showFlightAware />
                ) : (
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Return TBD</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Next Trip card ── */}
          {nextFlightOut ? (
            <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "transparent", overflow: "hidden" }}>
              <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  <span>✈</span> Next Trip
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {formatShortDate(nextFlightOut.date)}{returnFlight ? ` – ${formatShortDate(returnFlight.date)}` : ""}
                  </div>
                  <a
                    href={buildGCalUrl(nextTrip ?? { start: nextFlightOut.date, end: returnFlight?.date ?? nextFlightOut.date, city: "SF" }, nextFlightOut, returnFlight)}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px", textDecoration: "none", cursor: "pointer" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
                <FlightLeg label="Departs" flight={nextFlightOut} color="#fd5a1e" />
                <div style={{ background: "var(--border-subtle)", margin: "16px 0" }} />
                {returnFlight ? (
                  <FlightLeg label="Returns" flight={returnFlight} color="#4a9fd4" />
                ) : (
                  <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Return TBD</span>
                  </div>
                )}
              </div>
            </div>
          ) : !inSF ? (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No upcoming flights scheduled.</div>
          ) : null}

        </div>

        {/* Calendars */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Calendar
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setCalOffset(o => o - 1)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, fontSize: 16, lineHeight: 1, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", userSelect: "none" }}
                title="Previous months"
              >‹</button>
              <button
                onClick={() => setCalOffset(o => o + 1)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, fontSize: 16, lineHeight: 1, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", userSelect: "none" }}
                title="Next months"
              >›</button>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {[0, 1, 2].map(d => {
              const date = new Date(new Date().getFullYear(), new Date().getMonth() + calOffset + d, 1);
              return (
                <MonthCalendar
                  key={`${date.getFullYear()}-${date.getMonth()}`}
                  year={date.getFullYear()}
                  month={date.getMonth()}
                  travelPeriods={travelPeriods}
                  taylorPeriods={taylorPeriods}
                />
              );
            })}
          </div>
        </section>

        {/* Upcoming Trips */}
        <section>
          <SectionHeader label="Upcoming Trips" count={upcomingTrips.length} />
          {upcomingTrips.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingTrips.map(({ outbound, ret }) => (
                <TripCard
                  key={outbound.id}
                  outbound={outbound}
                  returnFlight={ret}
                  travelPeriods={travelPeriods}
                  onFlightClick={setSelectedFlight}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="No upcoming trips scheduled" />
          )}
        </section>

        {/* Travel Planner */}
        <section>
          <TravelPlanner confirmedPeriods={travelPeriods} onRefresh={loadData} />
        </section>

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <section style={{ opacity: 0.5 }}>
            <SectionHeader label="Past Trips" count={pastTrips.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pastTrips.map(({ outbound, ret }) => (
                <TripCard
                  key={outbound.id}
                  outbound={outbound}
                  returnFlight={ret}
                  travelPeriods={travelPeriods}
                  onFlightClick={setSelectedFlight}
                />
              ))}
            </div>
          </section>
        )}

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", paddingBottom: 16 }}>
          Made with love ♡
        </div>
      </div>

      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onSave={handleSaveFlight}
          onDelete={handleDeleteFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}
    </main>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-tertiary)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 6px",
          }}
        >
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: "var(--text-tertiary)",
        padding: "16px 0",
      }}
    >
      {label}
    </div>
  );
}

function formatShortDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime12(time: string) {
  if (time === "TBD") return "TBD";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function buildGCalUrl(trip: TravelPeriod, outbound: Flight, returnFlight?: Flight) {
  // Google Calendar needs YYYYMMDD; end date is exclusive so add 1 day
  const startDate = trip.start.replace(/-/g, "");
  const [ey, em, ed] = trip.end.split("-").map(Number);
  const endDateExclusive = new Date(ey, em - 1, ed + 1);
  const endDate = endDateExclusive.toISOString().split("T")[0].replace(/-/g, "");

  const details = [
    `✈ Departs: ${outbound.departureAirport} → ${outbound.arrivalAirport} on ${trip.start}`,
    outbound.departure !== "TBD" ? `  ${formatTime12(outbound.departure)} → ${formatTime12(outbound.arrival)} · ${outbound.flightNumber}` : `  ${outbound.flightNumber}`,
    returnFlight ? `\n↩ Returns: ${returnFlight.departureAirport} → ${returnFlight.arrivalAirport} on ${trip.end}` : "",
    returnFlight && returnFlight.departure !== "TBD" ? `  ${formatTime12(returnFlight.departure)} → ${formatTime12(returnFlight.arrival)} · ${returnFlight.flightNumber}` : "",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Nic in San Francisco",
    dates: `${startDate}/${endDate}`,
    details,
    location: "San Francisco, CA",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Maps IATA airline codes to ICAO codes for FlightAware URLs
const IATA_TO_ICAO: Record<string, string> = {
  DL: "DAL", AA: "AAL", UA: "UAL", WN: "SWA",
  B6: "JBU", AS: "ASA", F9: "FFT", NK: "NKS",
  SW: "SWA", G4: "AAY", SY: "SCX",
};

function buildFlightAwareUrl(flightNumber: string) {
  const m = flightNumber.match(/^([A-Z]{2})(\d+)$/);
  if (!m) return `https://www.flightaware.com/live/flight/${flightNumber}`;
  const icao = IATA_TO_ICAO[m[1]] ?? m[1];
  return `https://www.flightaware.com/live/flight/${icao}${m[2]}`;
}

function FlightLeg({ label, flight, color, showFlightAware = false }: {
  label: string; flight: Flight; color: string; showFlightAware?: boolean;
}) {
  return (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>

      {/* Date */}
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
        {formatFullDate(flight.date)}
      </div>

      {/* Airports */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          {flight.departureAirport}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>→</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          {flight.arrivalAirport}
        </span>
      </div>

      {/* Flight time */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {flight.departure !== "TBD"
          ? `${formatTime12(flight.departure)} → ${formatTime12(flight.arrival)}`
          : "Times TBD"}
      </div>

      {/* Flight number — clickable to FlightAware when showFlightAware */}
      {showFlightAware ? (
        <a
          href={buildFlightAwareUrl(flight.flightNumber)}
          target="_blank"
          rel="noopener noreferrer"
          title="Track on FlightAware"
          style={{
            fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
            color: "#818cf8",
            textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 5,
            width: "fit-content",
            borderBottom: "1px dashed rgba(129,140,248,0.45)",
            paddingBottom: 1,
          }}
        >
          {flight.flightNumber}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      ) : (
        <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 500, letterSpacing: "0.04em" }}>
          {flight.flightNumber}
        </div>
      )}
    </div>
  );
}
