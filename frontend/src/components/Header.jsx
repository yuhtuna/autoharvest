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
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const eStop = telemetry?.e_stop_active || false;
  const stormActive = activeScenario === "STORM_INCOMING";

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
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
              Autonomous Precision Agronomy & Cyber-Physical Harvester Fleet
            </p>
          </div>
        </div>

        {/* Field Selector Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
            ACTIVE FIELD:
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
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          
          {/* RTK Lock */}
          <div className="badge badge-cyan" title="Centimeter-level RTK GPS positioning lock">
            <Satellite size={13} />
            <span>RTK FIX: {telemetry?.rtk_drift_mm ?? 14}mm DRIFT</span>
          </div>

          {/* Weather Status */}
          <div className={`badge ${stormActive ? "badge-red" : "badge-emerald"}`}>
            <CloudRain size={13} />
            <span>
              {stormActive ? "STORM NOWCAST: ETA 4.5h" : "WEATHER: OPTIMAL (36h)"}
            </span>
          </div>

          {/* CBOT Commodity Price */}
          <div className="badge badge-amber">
            <TrendingUp size={13} />
            <span>CBOT {currentField?.crop_type === "WHEAT_HARD_RED" ? "WHEAT: $6.42" : currentField?.crop_type === "CORN_YELLOW_DENT" ? "CORN: $4.85" : "SOY: $12.10"}</span>
          </div>

          {/* Safety Supervisor Interlock */}
          <div className={`badge ${eStop ? "badge-red" : "badge-emerald"}`}>
            {eStop ? <ShieldAlert size={13} /> : <Radio size={13} />}
            <span>{eStop ? "E-STOP ACTIVE" : "SAFETY GUARD: ALL CLEAR"}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
