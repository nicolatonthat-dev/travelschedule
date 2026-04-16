"use client";

import { useState, useEffect, useCallback } from "react";
import { TravelPeriod } from "../data/travel";
import { supabase } from "../../lib/supabase";
import BookingModal from "./BookingModal";

interface PlannedRange {
  id: string;
  start: string;
  end: string;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["S","M","T","W","T","F","S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function nightsBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// After July (month >= 7), Nic is based in SF — planned trips are LA visits
function tripLabel(startDateStr: string) {
  const month = Number(startDateStr.split("-")[1]) - 1; // 0-indexed
  return month >= 7 ? "LA Visit" : "SF Trip";
}
function tripColor(startDateStr: string) {
  const month = Number(startDateStr.split("-")[1]) - 1;
  return month >= 7 ? "#4a9fd4" : "#fd5a1e";
}

// ── Planner month grid ────────────────────────────────────────────────────────

interface PlannerMonthProps {
  year: number;
  month: number;
  confirmedPeriods: TravelPeriod[];
  plannedRanges: PlannedRange[];
  previewStart: string | null;
  previewEnd: string | null;
  selectionStart: string | null;
  today: string;
  onDateClick: (date: string) => void;
  onDateHover: (date: string | null) => void;
}

function PlannerMonth({
  year, month,
  confirmedPeriods, plannedRanges,
  previewStart, previewEnd,
  selectionStart, today,
  onDateClick, onDateHover,
}: PlannerMonthProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const hasConfirmed = cells.some(day => {
    if (!day) return false;
    const d = toDateStr(year, month, day);
    return confirmedPeriods.some(p => p.city === "SF" && d >= p.start && d <= p.end);
  });
  const hasPlanned = cells.some(day => {
    if (!day) return false;
    const d = toDateStr(year, month, day);
    return plannedRanges.some(r => d >= r.start && d <= r.end);
  });

  return (
    <div style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{MONTH_NAMES[month]}</span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{year}</span>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {DAY_NAMES.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const dateStr = toDateStr(year, month, day);
            const isPast = dateStr < today;
            const isToday = dateStr === today;
            const isSelStart = selectionStart === dateStr;

            const isConfirmed = confirmedPeriods.some(p => p.city === "SF" && dateStr >= p.start && dateStr <= p.end);
            const isPlanned   = !isConfirmed && plannedRanges.some(r => dateStr >= r.start && dateStr <= r.end);
            const isPreview   = !isConfirmed && !isPlanned && !!previewStart && !!previewEnd
              && dateStr >= previewStart && dateStr <= previewEnd;

            const col = idx % 7;
            const prevStr = day > 1 ? toDateStr(year, month, day - 1) : null;
            const nextStr = day < daysInMonth ? toDateStr(year, month, day + 1) : null;

            // Confirmed range border-radius
            const prevConf = prevStr ? confirmedPeriods.some(p => p.city === "SF" && prevStr >= p.start && prevStr <= p.end) : false;
            const nextConf = nextStr ? confirmedPeriods.some(p => p.city === "SF" && nextStr >= p.start && nextStr <= p.end) : false;
            const confRowStart = col === 0 || !prevConf;
            const confRowEnd   = col === 6 || !nextConf;

            // Planned range border-radius
            const prevPlan = prevStr ? plannedRanges.some(r => prevStr >= r.start && prevStr <= r.end) : false;
            const nextPlan = nextStr ? plannedRanges.some(r => nextStr >= r.start && nextStr <= r.end) : false;
            const planRowStart = col === 0 || !prevPlan;
            const planRowEnd   = col === 6 || !nextPlan;

            // Preview border-radius
            const prevPrev = prevStr && previewStart && previewEnd ? (prevStr >= previewStart && prevStr <= previewEnd && !confirmedPeriods.some(p => p.city === "SF" && prevStr >= p.start && prevStr <= p.end) && !plannedRanges.some(r => prevStr >= r.start && prevStr <= r.end)) : false;
            const nextPrev = nextStr && previewStart && previewEnd ? (nextStr >= previewStart && nextStr <= previewEnd && !confirmedPeriods.some(p => p.city === "SF" && nextStr >= p.start && nextStr <= p.end) && !plannedRanges.some(r => nextStr >= r.start && nextStr <= r.end)) : false;
            const prevRowStart = col === 0 || !prevPrev || dateStr === previewStart;
            const prevRowEnd   = col === 6 || !nextPrev || dateStr === previewEnd;

            // Determine color layer
            let bg = "transparent";
            let color = isToday ? "var(--text-primary)" : isPast ? "rgba(150,150,150,0.3)" : "var(--text-secondary)";
            let borderRadius = "6px";
            let fontWeight = 400;

            if (isConfirmed) {
              bg = "rgba(253,90,30,0.08)";
              color = "#fd5a1e";
              fontWeight = 600;
              borderRadius = confRowStart && confRowEnd ? "6px" : confRowStart ? "6px 0 0 6px" : confRowEnd ? "0 6px 6px 0" : "0";
            } else if (isPlanned) {
              bg = "rgba(245,158,11,0.13)";
              color = "#f59e0b";
              fontWeight = 600;
              borderRadius = planRowStart && planRowEnd ? "6px" : planRowStart ? "6px 0 0 6px" : planRowEnd ? "0 6px 6px 0" : "0";
            } else if (isPreview) {
              bg = "rgba(245,158,11,0.06)";
              color = "#fbbf24";
              borderRadius = prevRowStart && prevRowEnd ? "6px" : prevRowStart ? "6px 0 0 6px" : prevRowEnd ? "0 6px 6px 0" : "0";
            }

            return (
              <div
                key={idx}
                onClick={() => !isPast && !isConfirmed && onDateClick(dateStr)}
                onMouseEnter={() => !isPast && !isConfirmed && onDateHover(dateStr)}
                onMouseLeave={() => onDateHover(null)}
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 30,
                  fontSize: 12,
                  fontWeight,
                  color,
                  background: bg,
                  borderRadius: isToday && !isConfirmed && !isPlanned && !isPreview ? "4px" : borderRadius,
                  outline: isToday ? `1.5px solid ${isConfirmed ? "#fd5a1e" : isPlanned ? "#f59e0b" : "rgba(255,255,255,0.3)"}` : "none",
                  outlineOffset: -1,
                  cursor: isPast || isConfirmed ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                title={isConfirmed ? "Already booked" : isPlanned ? "Planned" : undefined}
              >
                {day}
                {isSelStart && !isConfirmed && !isPlanned && (
                  <span style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#f59e0b" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
          {hasConfirmed && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(253,90,30,0.14)", border: "1px solid rgba(253,90,30,0.3)" }} />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Booked</span>
            </div>
          )}
          {hasPlanned && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.4)" }} />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Planned</span>
            </div>
          )}
          {!hasConfirmed && !hasPlanned && (
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontStyle: "italic" }}>No trips this month</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-header ────────────────────────────────────────────────────────────────

function SubHeader({ label, count, action }: { label: string; count?: number; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}{count !== undefined ? ` (${count})` : ""}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      {action}
    </div>
  );
}

// ── Main TravelPlanner ────────────────────────────────────────────────────────

interface TravelPlannerProps {
  confirmedPeriods: TravelPeriod[];
  onRefresh: () => void;
}

export default function TravelPlanner({ confirmedPeriods, onRefresh }: TravelPlannerProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [plannedRanges, setPlannedRanges] = useState<PlannedRange[]>([]);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [bookingRange, setBookingRange] = useState<PlannedRange | null>(null);

  // Load planned ranges from Supabase on mount
  const loadPlannedRanges = useCallback(async () => {
    const { data } = await supabase
      .from("planned_ranges")
      .select("*")
      .order("start_date");
    if (data) {
      setPlannedRanges(data.map((r: Record<string, string>) => ({
        id: r.id,
        start: r.start_date,
        end: r.end_date,
      })));
    }
  }, []);

  useEffect(() => { loadPlannedRanges(); }, [loadPlannedRanges]);

  // All months from current month through December of current year
  const year = now.getFullYear();
  const months = Array.from({ length: 12 - now.getMonth() }, (_, i) => ({
    year,
    month: now.getMonth() + i,
  }));

  const previewStart = selectionStart && hoverDate
    ? (selectionStart <= hoverDate ? selectionStart : hoverDate) : null;
  const previewEnd = selectionStart && hoverDate
    ? (selectionStart <= hoverDate ? hoverDate : selectionStart) : null;

  async function handleDateClick(date: string) {
    if (!selectionStart) {
      setSelectionStart(date);
    } else {
      let start = selectionStart <= date ? selectionStart : date;
      let end   = selectionStart <= date ? date : selectionStart;
      setSelectionStart(null);
      setHoverDate(null);

      // Find existing ranges that overlap or are adjacent (touching) to the new range.
      // Adjacent = the day after one range is the first day of another.
      const overlapping = plannedRanges.filter(r =>
        r.start <= addDays(end, 1) && r.end >= addDays(start, -1)
      );

      // Merge: take earliest start and latest end across all overlapping + new range
      for (const r of overlapping) {
        if (r.start < start) start = r.start;
        if (r.end > end) end = r.end;
      }

      const newId = `${Date.now()}`;
      const overlappingIds = overlapping.map(r => r.id);

      // Update local state: remove overlapping, add merged
      setPlannedRanges(prev => [
        ...prev.filter(r => !overlappingIds.includes(r.id)),
        { id: newId, start, end },
      ]);

      // Sync to Supabase: delete old overlapping rows, insert merged row
      if (overlappingIds.length > 0) {
        await supabase.from("planned_ranges").delete().in("id", overlappingIds);
      }
      await supabase.from("planned_ranges").insert({
        id: newId,
        start_date: start,
        end_date: end,
      });
    }
  }

  // Confirmed periods sorted by date, only future or current
  const bookedList = confirmedPeriods
    .filter(p => p.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));

  // Planned ranges sorted by date
  const plannedSorted = [...plannedRanges].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Travel Planner
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        {selectionStart && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#f59e0b" }}>Now click an end date</span>
            <button
              onClick={() => { setSelectionStart(null); setHoverDate(null); }}
              style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Instruction */}
      {!selectionStart && plannedRanges.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          Click a start date to mark a potential trip. Trips before August are treated as SF visits; August and later as LA visits.
        </div>
      )}

      {/* All months through December */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {months.map(({ year: y, month: m }) => (
          <PlannerMonth
            key={`${y}-${m}`}
            year={y}
            month={m}
            confirmedPeriods={confirmedPeriods}
            plannedRanges={plannedRanges}
            previewStart={previewStart}
            previewEnd={previewEnd}
            selectionStart={selectionStart}
            today={today}
            onDateClick={handleDateClick}
            onDateHover={setHoverDate}
          />
        ))}
      </div>

      {/* ── Already Booked ── */}
      <div style={{ marginBottom: 24 }}>
        <SubHeader label="Already Booked" count={bookedList.length} />
        {bookedList.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "10px 0" }}>No upcoming booked trips.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bookedList.map((p, i) => {
              const nights = nightsBetween(p.start, p.end);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(253,90,30,0.18)", borderRadius: 8, padding: "10px 14px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#fd5a1e", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {formatDisplay(p.start)}{p.start !== p.end ? <> &rarr; {formatDisplay(p.end)}</> : null}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {nights === 0 ? "Day trip" : `${nights} night${nights !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#fd5a1e", background: "rgba(253,90,30,0.08)", border: "1px solid rgba(253,90,30,0.2)", borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
                    {p.label ?? "SF Trip"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Planned ── */}
      <div>
        <SubHeader
          label="Planned"
          count={plannedSorted.length}
          action={plannedSorted.length > 0 ? (
            <button
              onClick={async () => {
                const ids = plannedRanges.map(r => r.id);
                setPlannedRanges([]);
                await supabase.from("planned_ranges").delete().in("id", ids);
              }}
              style={{ fontSize: 11, color: "var(--text-tertiary)", background: "transparent", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}
            >
              Clear all
            </button>
          ) : undefined}
        />
        {plannedSorted.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "10px 0" }}>
            No planned trips yet — click dates on the calendar above to add some.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {plannedSorted.map(r => {
              const nights = nightsBetween(r.start, r.end);
              const label = tripLabel(r.start);
              const color = tripColor(r.start);
              const bgColor = label === "LA Visit" ? "rgba(74,159,212,0.08)" : "rgba(253,90,30,0.08)";
              const borderColor = label === "LA Visit" ? "rgba(74,159,212,0.2)" : "rgba(253,90,30,0.2)";
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 14px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {formatDisplay(r.start)}{r.start !== r.end ? <> &rarr; {formatDisplay(r.end)}</> : null}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {nights === 0 ? "Day trip" : `${nights} night${nights !== 1 ? "s" : ""}`}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, color, background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setBookingRange(r)}
                      style={{
                        fontSize: 11, fontWeight: 600, cursor: "pointer", borderRadius: 5, padding: "4px 10px",
                        background: "var(--accent)", border: "none", color: "#fff", whiteSpace: "nowrap",
                      }}
                    >
                      Book
                    </button>
                    <button
                      onClick={async () => {
                        setPlannedRanges(prev => prev.filter(x => x.id !== r.id));
                        await supabase.from("planned_ranges").delete().eq("id", r.id);
                      }}
                      style={{ fontSize: 14, color: "var(--text-tertiary)", background: "transparent", border: "none", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {bookingRange && (
        <BookingModal
          range={bookingRange}
          onClose={() => setBookingRange(null)}
          onBooked={async (id) => {
            setPlannedRanges(prev => prev.filter(r => r.id !== id));
            setBookingRange(null);
            onRefresh();
            await supabase.from("planned_ranges").delete().eq("id", id);
          }}
        />
      )}
    </div>
  );
}
