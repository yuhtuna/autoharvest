import React from "react";
import { Sprout, Zap, Video } from "lucide-react";

export function Header({
  fields = [],
  currentFieldId,
  onSelectField,
  telemetry,
  onOpenDroneModal,
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const isOrchard = telemetry?.is_orchard || currentField?.crop_type?.includes("APPLE") || currentField?.crop_type?.includes("GRAPE");

  return (
    <header 
      className="glass-panel" 
      style={{ 
        margin: "10px 16px 0 16px", 
        padding: "10px 18px", 
        borderRadius: "14px",
        flexShrink: 0 
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Logo & Platform Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div 
            style={{ 
              width: "38px", 
              height: "38px", 
              borderRadius: "10px", 
              background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(16, 185, 129, 0.35)"
            }}
          >
            <Sprout size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.15rem", color: "#f9fafb", margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
                AUTOHARVEST
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: "0.62rem" }}>
                <Zap size={10} /> 5-Agent Fleet Core
              </span>
              <span className="badge badge-cyan" style={{ fontSize: "0.62rem" }}>
                {isOrchard ? "🍎 ORCHARD ROBOTIC PICKER" : "🌾 COMBINE HARVESTER"}
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
              Autonomous Precision Agronomy & Cyber-Physical Multi-Agent Fleet
            </p>
          </div>
        </div>

        {/* Field Selector & Drone Video Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
            FIELD PARCEL:
          </span>
          <select
            value={currentFieldId}
            onChange={(e) => onSelectField(e.target.value)}
            style={{
              background: "rgba(17, 24, 39, 0.9)",
              color: "#f3f4f6",
              border: "1px solid var(--border-color)",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none"
            }}
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.crop_display_name})
              </option>
            ))}
          </select>

          {/* Drone Video AI Modal Trigger Button */}
          <button
            onClick={onOpenDroneModal}
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
              boxShadow: "0 0 16px rgba(6, 182, 212, 0.35)",
              fontSize: "0.78rem",
              padding: "7px 12px"
            }}
          >
            <Video size={14} /> Live Drone AI Vision
          </button>
        </div>

      </div>
    </header>
  );
}
