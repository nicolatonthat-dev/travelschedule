"use client";

import { useState } from "react";
import { PlannedRange } from "../data/travel";

interface EditPlannedModalProps {
  range: PlannedRange;
  onClose: () => void;
  onSave: (updated: PlannedRange) => void;
}

export default function EditPlannedModal({ range, onClose, onSave }: EditPlannedModalProps) {
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!start || !end) {
      setError("Both dates are required.");
      return;
    }
    if (start > end) {
      setError("Start date must be on or before end date.");
      return;
    }
    onSave({ id: range.id, start, end, who: range.who });
  }

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
        width: "min(420px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
        background: "#1c1c1f", border: "1px solid var(--border)", borderRadius: 12,
        padding: 24, zIndex: 201, display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Edit Planned Trip
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Date inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Start date">
            <input
              type="date"
              value={start}
              onChange={e => { setStart(e.target.value); setError(null); }}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="End date">
            <input
              type="date"
              value={end}
              onChange={e => { setEnd(e.target.value); setError(null); }}
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

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "10px 16px",
              fontSize: 13, fontWeight: 600,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: "var(--accent)", border: "none",
              borderRadius: 8, padding: "10px 16px",
              fontSize: 13, fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
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
