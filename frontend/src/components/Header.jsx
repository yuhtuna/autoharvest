import React, { useState } from "react";
import { Sprout, Scan, Bot, FileText, Download, MapPin, FileSpreadsheet, FileCode } from "lucide-react";

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
  const [showExportMenu, setShowExportMenu] = useState(false);

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
              {isOrchard ? "ORCHARD PICKER MODE" : "BROADACRE COMBINE MODE"}

            </span>
          </div>
          <div className="top-nav-subtitle">Agents for Humans • AWS Multi-Agent Precision Agronomy</div>
        </div>
      </div>

      {/* Field Selector & Action Buttons */}
      <div className="top-nav-controls" style={{ position: "relative" }}>
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

        {/* Hero CTA: Scan & Grade Crops Diagnostic Lab */}
        <button
          onClick={onOpenDroneModal}
          className="btn-dock btn-dock-primary"
          style={{ 
            padding: "7px 14px", 
            fontSize: "0.78rem", 
            borderRadius: "8px",
            background: "linear-gradient(135deg, #0284c7, #06b6d4)",
            color: "#ffffff",
            fontWeight: 700,
            border: "1px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.3)"
          }}
        >
          <Scan size={14} />
          <span>Scan & Grade Crops</span>
        </button>

        {/* Export Data Dropdown Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-dock btn-dock-secondary"
            style={{ padding: "7px 12px", fontSize: "0.78rem", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.35)", color: "#fbbf24" }}
          >
            <Download size={14} />
            <span>Export Data</span>
          </button>

          {showExportMenu && (
            <div 
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "rgba(10, 16, 26, 0.98)",
                border: "1px solid var(--border-card)",
                borderRadius: "10px",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                zIndex: 200,
                width: "220px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)"
              }}
            >
              <a
                href="http://localhost:8020/api/v1/export/zones-geojson"
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowExportMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#34d399",
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                <MapPin size={14} /> Export ISO GeoJSON GIS
              </a>

              <a
                href={`http://localhost:8020/api/v1/export/harvest-csv?crop_type=${currentField?.crop_type || "WHEAT_HARD_RED"}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowExportMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.1)",
                  color: "#38bdf8",
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "1px solid rgba(56, 189, 248, 0.25)"
                }}
              >
                <FileSpreadsheet size={14} /> Download Brix CSV Audit
              </a>

              <a
                href={`http://localhost:8020/api/v1/export/mission-json?field_id=${currentFieldId}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowExportMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  background: "rgba(245, 158, 11, 0.1)",
                  color: "#fbbf24",
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "1px solid rgba(245, 158, 11, 0.25)"
                }}
              >
                <FileCode size={14} /> Export Mission Plan JSON
              </a>
            </div>
          )}
        </div>

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
      </div>

    </header>
  );
}


