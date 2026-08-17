import React from "react";
import { Sprout, Video, Bot, FileText } from "lucide-react";

export function Header({
  fields = [],
  currentFieldId,
  onSelectField,
  telemetry,
  onOpenDroneModal,
  onOpenCopilotModal,
  onOpenReportModal,
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const isOrchard = telemetry?.is_orchard || currentField?.crop_type?.includes("APPLE") || currentField?.crop_type?.includes("GRAPE");

  return (
    <header className="top-nav">
      
      {/* Brand & Mode */}
      <div className="top-nav-brand">
        <div className="top-nav-logo">
          <Sprout size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="top-nav-title">AutoHarvest Fleet OS</span>
            <span 
              style={{ 
                fontSize: "0.68rem", 
                fontWeight: 600, 
                padding: "2px 8px", 
                borderRadius: "9999px",
                background: isOrchard ? "rgba(56, 189, 248, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: isOrchard ? "#38bdf8" : "#34d399",
                border: isOrchard ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)"
              }}
            >
              {isOrchard ? "🍎 Orchard Picker Mode" : "🌾 Combine Fleet Mode"}
            </span>
          </div>
          <div className="top-nav-subtitle">Autonomous Precision Agronomy & Multi-Agent Robotics</div>
        </div>
      </div>

      {/* Field Selector & Action Buttons */}
      <div className="top-nav-controls">
        <select
          value={currentFieldId}
          onChange={(e) => onSelectField(e.target.value)}
          className="field-select"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.crop_display_name}
            </option>
          ))}
        </select>

        {/* AgriCopilot AI Assistant Button */}
        <button
          onClick={onOpenCopilotModal}
          className="btn-dock btn-dock-secondary"
          style={{ padding: "7px 12px", fontSize: "0.78rem", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8" }}
        >
          <Bot size={14} />
          <span>Ask AgriCopilot</span>
        </button>

        {/* Executive Mission Report Button */}
        <button
          onClick={onOpenReportModal}
          className="btn-dock btn-dock-secondary"
          style={{ padding: "7px 12px", fontSize: "0.78rem", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399" }}
        >
          <FileText size={14} />
          <span>Mission Report</span>
        </button>

        {/* Drone Video Feed Button */}
        <button
          onClick={onOpenDroneModal}
          className="btn-dock btn-dock-primary"
          style={{ padding: "7px 12px", fontSize: "0.78rem", borderRadius: "8px" }}
        >
          <Video size={14} />
          <span>Live Drone Feed</span>
        </button>
      </div>

    </header>
  );
}
