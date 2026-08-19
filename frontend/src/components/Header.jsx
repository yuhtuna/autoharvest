import React from "react";
import { Sprout } from "lucide-react";

export function Header({
  fields = [],
  currentFieldId,
  onSelectField,
  telemetry,
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const isOrchard = telemetry?.is_orchard || currentField?.crop_type?.includes("APPLE") || currentField?.crop_type?.includes("GRAPE");

  return (
    <header className="top-nav">
      {/* Brand & Field Mode */}
      <div className="top-nav-brand">
        <div className="top-nav-logo">
          <Sprout size={16} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="top-nav-title">AutoHarvest</span>
            <span 

              style={{ 
                fontSize: "0.65rem", 
                fontWeight: 600, 
                padding: "1px 6px", 
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)"
              }}
            >
              {isOrchard ? "ORCHARD" : "BROADACRE"}
            </span>
          </div>
        </div>
      </div>

      {/* Field Selector & Telemetry Status */}
      <div className="top-nav-controls">
        <select
          value={currentFieldId}
          onChange={(e) => onSelectField(e.target.value)}
          className="field-select"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.crop_display_name})
            </option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>15Hz RTK</span>
        </div>
      </div>
    </header>
  );
}
