"use client";

import { TravelPeriod } from "../data/travel";

interface MonthCalendarProps {
  year: number;
  month: number;
  travelPeriods: TravelPeriod[];
  taylorPeriods: TravelPeriod[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isInPeriods(dateStr: string, periods: TravelPeriod[]): boolean {
  return periods.some((p) => p.city === "SF" && dateStr >= p.start && dateStr <= p.end);
}

function isRangeStart(dateStr: string, periods: TravelPeriod[]) {
  return periods.some((p) => p.city === "SF" && p.start === dateStr);
}

function isRangeEnd(dateStr: string, periods: TravelPeriod[]) {
  return periods.some((p) => p.city === "SF" && p.end === dateStr);
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export default function MonthCalendar({ year, month, travelPeriods, taylorPeriods }: MonthCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Check if any day this month has both together
  const hasTogetherDays = cells.some((day) => {
    if (!day) return false;
    const dateStr = toDateString(year, month, day);
    return isInPeriods(dateStr, travelPeriods) && isInPeriods(dateStr, taylorPeriods);
  });

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Month header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {MONTH_NAMES[month]}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{year}</span>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        {/* Day name headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {DAY_NAMES.map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-tertiary)",
                padding: "2px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const dateStr = toDateString(year, month, day);
            const nicolasInSF = isInPeriods(dateStr, travelPeriods);
            const taylorInSF = isInPeriods(dateStr, taylorPeriods);
            const together = nicolasInSF && taylorInSF;
            const isToday = dateStr === today;

            // Check neighbours for row-aware rounded corners
            const col = idx % 7; // 0=Sun, 6=Sat
            const prevDay = day > 1 ? toDateString(year, month, day - 1) : null;
            const nextDay = day < daysInMonth ? toDateString(year, month, day + 1) : null;
            const prevInSF = prevDay ? isInPeriods(prevDay, travelPeriods) : false;
            const nextInSF = nextDay ? isInPeriods(nextDay, travelPeriods) : false;
            const isRowStart = col === 0 || !prevInSF;
            const isRowEnd = col === 6 || !nextInSF;

            let bg = "transparent";
            let color = isToday ? "var(--text-primary)" : "var(--text-secondary)";

            if (nicolasInSF) {
              bg = "rgba(253,90,30,0.03)";
              color = "#fd5a1e";
            }

            const borderRadius = nicolasInSF
              ? isRowStart && isRowEnd
                ? "6px"
                : isRowStart
                ? "6px 0 0 6px"
                : isRowEnd
                ? "0 6px 6px 0"
                : "0"
              : "6px";

            return (
              <div
                key={idx}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 30,
                  fontSize: 12,
                  fontWeight: nicolasInSF ? 600 : 400,
                  color,
                  background: bg,
                  borderRadius,
                  outline: isToday
                    ? `1.5px solid ${nicolasInSF ? "#fd5a1e" : "rgba(255,255,255,0.35)"}`
                    : "none",
                  outlineOffset: -1,
                  borderRadius: isToday && !nicolasInSF ? "4px" : borderRadius,
                  cursor: "default",
                }}
                title={
                  together
                    ? "Nicolas & Taylor in SF ♡"
                    : nicolasInSF
                    ? "Nicolas in SF"
                    : "Nicolas in LA"
                }
              >
                {day}
                {together && (
                  <span
                    style={{
                      position: "absolute",
                      top: 1,
                      right: 3,
                      fontSize: 7,
                      lineHeight: 1,
                      color: "#4a9fd4",
                    }}
                  >
                    ♥
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "rgba(253,90,30,0.14)",
                border: "1px solid rgba(253,90,30,0.3)",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>SF</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>LA</span>
          </div>
          {hasTogetherDays && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: "#4a9fd4" }}>♥</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Together</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
