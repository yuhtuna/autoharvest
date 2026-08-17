import React from "react";
import { 
  Sprout, 
  Satellite, 
  CloudRain, 
  TrendingUp, 
  ShieldAlert, 
  Radio, 
  Cpu, 
  Zap 
} from "lucide-react";

export function Header({
  fields = [],
  currentFieldId,
  onSelectField,
  telemetry,
  activeScenario,
  missionPlan,
  onOpenDroneModal,
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const safetyStatus = telemetry?.safety_status || missionPlan?.safety_status || "GEOFENCE_ACTIVE_ALL_CLEAR";
  const eStop = telemetry?.e_stop_active || safetyStatus.includes("ESTOP") || safetyStatus.includes("WARNING") || safetyStatus.includes("BREACH");
  const safetyText = eStop 
    ? (safetyStatus.includes("ESTOP") ? "E-STOP: OBSTACLE DETECTED" : safetyStatus)
    : "SAFETY GUARD: ALL CLEAR";
  const stormActive = activeScenario === "STORM_INCOMING";
  const isOrchard = telemetry?.is_orchard || currentField?.crop_type?.includes("APPLE") || currentField?.crop_type?.includes("GRAPE");

  return (
    <header className="glass-panel" style={{ margin: "12px 18px 0 18px", padding: "12px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Logo & Platform Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div 
            style={{ 
              width: "42px", 
              height: "42px", 
              borderRadius: "10px", 
              background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)"
            }}
          >
            <Sprout size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.25rem", color: "#f9fafb", margin: 0, fontWeight: 800 }}>
                AUTOHARVEST
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: "0.65rem" }}>
                <Zap size={11} /> 5-Agent Fleet Core
              </span>
              <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>
                {isOrchard ? "🍎 ORCHARD ROBOTIC PICKER" : "🌾 BROADACRE COMBINE FLEET"}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
              Autonomous Precision Agronomy & Cyber-Physical Harvester Fleet
            </p>
          </div>
        </div>

        {/* Field Selector & Drone Video Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
            FIELD:
          </span>
          <select
            value={currentFieldId}
            onChange={(e) => onSelectField(e.target.value)}
            style={{
              background: "rgba(17, 24, 39, 0.9)",
              color: "#f3f4f6",
              border: "1px solid var(--border-color)",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
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
              fontSize: "0.8rem",
              padding: "7px 12px"
            }}
          >
            📹 Live Drone AI Vision
          </button>
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          
          {/* RTK Lock */}
          <div className="badge badge-cyan" title="Centimeter-level RTK GPS positioning lock">
            <Satellite size={13} />
            <span>RTK: {telemetry?.rtk_drift_mm ?? 14}mm</span>
          </div>

          {/* Weather Status */}
          <div className={`badge ${stormActive ? "badge-red" : "badge-emerald"}`}>
            <CloudRain size={13} />
            <span>
              {stormActive ? "STORM: ETA 4.5h" : "WEATHER: CLEAR (36h)"}
            </span>
          </div>

          {/* Commodity Price */}
          <div className="badge badge-amber">
            <TrendingUp size={13} />
            <span>
              {currentField?.crop_type === "APPLES_HONEYCRISP" 
                ? "HONEYCRISP: $38.50/box" 
                : currentField?.crop_type === "GRAPES_CABERNET"
                ? "CABERNET: $2,850/ton"
                : currentField?.crop_type === "WHEAT_HARD_RED"
                ? "WHEAT: $6.42/bu"
                : "CORN: $4.85/bu"}
            </span>
          </div>

          {/* Safety Supervisor Interlock */}
          <div className={`badge ${eStop ? "badge-red" : "badge-emerald"}`}>
            {eStop ? <ShieldAlert size={13} /> : <Radio size={13} />}
            <span>{safetyText}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
