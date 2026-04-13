import MonthCalendar from "./components/MonthCalendar";
import FlightCard from "./components/FlightCard";
import { travelPeriods, taylorPeriods, flights } from "./data/travel";

export default function Home() {
  const today = new Date().toISOString().split("T")[0];

  const upcomingFlights = flights
    .filter((f) => f.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastFlights = flights
    .filter((f) => f.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const inSF = travelPeriods.some(
    (p) => p.city === "SF" && today >= p.start && today <= p.end
  );

  const nextTrip = travelPeriods
    .filter((p) => p.city === "SF" && p.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  const nextFlightOut = upcomingFlights.find((f) => f.direction === "LA → SF");

  // Return flight: the SF→LA flight on or before the next trip's end date
  const returnFlight = nextTrip
    ? flights
        .filter((f) => f.direction === "SF → LA" && f.date <= nextTrip.end && f.date >= nextTrip.start)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
    : undefined;

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
              Nicolas&apos;s Travel
            </span>
            <span style={{ color: "var(--text-tertiary)", fontSize: 14, flexShrink: 0 }}>/</span>
            <span style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              LA ↔ SF
            </span>
          </div>

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
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero status card */}
        {inSF ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(94,106,210,0.2)",
              background: "linear-gradient(135deg, rgba(94,106,210,0.08) 0%, rgba(139,92,246,0.05) 100%)",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                I&apos;m in San Francisco
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Check the calendar below for my return date
              </div>
            </div>
          </div>
        ) : nextFlightOut ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              overflow: "hidden",
            }}
          >
            {/* Banner label */}
            <div
              style={{
                padding: "10px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                <span>✈</span> Next Trip
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {nextTrip && (
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {formatShortDate(nextTrip.start)} – {formatShortDate(nextTrip.end)}
                  </div>
                )}
                {nextTrip && (
                  <a
                    href={buildGCalUrl(nextTrip, nextFlightOut, returnFlight)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Two legs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
              {/* Outbound leg */}
              <FlightLeg
                label="Departs"
                flight={nextFlightOut}
                color="#fd5a1e"
              />

              {/* Divider */}
              <div style={{ background: "var(--border-subtle)", margin: "16px 0" }} />

              {/* Return leg */}
              {returnFlight ? (
                <FlightLeg
                  label="Returns"
                  flight={returnFlight}
                  color="#4a9fd4"
                />
              ) : (
                <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Return TBD</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No upcoming flights scheduled.</div>
        )}

        {/* Calendars */}
        <section>
          <SectionHeader label="Calendar" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <MonthCalendar year={2026} month={3} travelPeriods={travelPeriods} taylorPeriods={taylorPeriods} />
            <MonthCalendar year={2026} month={4} travelPeriods={travelPeriods} taylorPeriods={taylorPeriods} />
            <MonthCalendar year={2026} month={5} travelPeriods={travelPeriods} taylorPeriods={taylorPeriods} />
          </div>
        </section>

        {/* Upcoming Flights */}
        <section>
          <SectionHeader label="Upcoming Flights" count={upcomingFlights.length} />
          {upcomingFlights.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {upcomingFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          ) : (
            <EmptyState label="No upcoming flights scheduled" />
          )}
        </section>

        {/* Past Flights */}
        {pastFlights.length > 0 && (
          <section style={{ opacity: 0.5 }}>
            <SectionHeader label="Past Flights" count={pastFlights.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pastFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          </section>
        )}

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", paddingBottom: 16 }}>
          Made with love ♡
        </div>
      </div>
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

import { Flight, TravelPeriod } from "./data/travel";

function buildGCalUrl(trip: TravelPeriod, outbound: Flight, returnFlight?: Flight) {
  // Google Calendar needs YYYYMMDD; end date is exclusive so add 1 day
  const startDate = trip.start.replace(/-/g, "");
  const [ey, em, ed] = trip.end.split("-").map(Number);
  const endDateExclusive = new Date(ey, em - 1, ed + 1);
  const endDate = endDateExclusive.toISOString().split("T")[0].replace(/-/g, "");

  const details = [
    `✈ Departs: ${outbound.departureAirport} → ${outbound.arrivalAirport} on ${trip.start}`,
    outbound.departure !== "TBD" ? `  ${formatTime12(outbound.departure)} → ${formatTime12(outbound.arrival)} · ${outbound.flightNumber}` : `  ${outbound.flightNumber}`,
    outbound.confirmation ? `  Confirmation: ${outbound.confirmation}` : "",
    returnFlight ? `\n↩ Returns: ${returnFlight.departureAirport} → ${returnFlight.arrivalAirport} on ${trip.end}` : "",
    returnFlight && returnFlight.departure !== "TBD" ? `  ${formatTime12(returnFlight.departure)} → ${formatTime12(returnFlight.arrival)} · ${returnFlight.flightNumber}` : "",
    returnFlight?.confirmation ? `  Confirmation: ${returnFlight.confirmation}` : "",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Nicolas in San Francisco",
    dates: `${startDate}/${endDate}`,
    details,
    location: "San Francisco, CA",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function FlightLeg({ label, flight, color }: { label: string; flight: Flight; color: string }) {
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

      {/* Flight number */}
      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        {flight.flightNumber}
      </div>

      {/* Confirmation ID */}
      {flight.confirmation && (
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
          {flight.confirmation}
        </div>
      )}
    </div>
  );
}
