import React from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertOctagon, 
  Zap, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  Sprout, 
  Compass, 
  Fuel,
  Sparkles,
  ChevronRight
} from "lucide-react";

export function Sidebar({
  telemetry,
  missionPlan,
  isSimulationRunning,
  isPaused,
  onControlFleet,
  onOpenDrawerTab,
}) {
  const isOrchard = telemetry?.is_orchard || false;
  const isEstop = telemetry?.e_stop_active || false;
  const progressPct = telemetry?.cut_progress_pct ?? 0.0;
  const fruitsPicked = telemetry?.fruits_picked_count ?? 0;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const heading = telemetry?.heading_deg ?? 180.0;
  const fuel = telemetry?.fuel_level_pct ?? 88.0;

  // Grain Combine Metrics
  const rpm = telemetry?.engine_rpm ?? 2150;
  const torque = telemetry?.header_torque_nm ?? 680;
  const tank = telemetry?.grain_tank_pct ?? 14.5;

  // Orchard Metrics
  const gripperCPM = telemetry?.gripper_cycles_cpm ?? 48.0;
  const suctionKpa = telemetry?.suction_kpa ?? 85.0;
  const binPct = Math.min(100.0, (fruitsPicked / 1200.0) * 100.0);

  // Radial Dial Percentages
  const dial1Pct = isOrchard ? Math.min(1.0, gripperCPM / 60.0) : Math.min(1.0, rpm / 2600.0);
  const dial2Pct = isOrchard ? Math.min(1.0, suctionKpa / 100.0) : Math.min(1.0, torque / 900.0);

  // Circumference for Circular Progress Ring
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius; // ~263.89
  const progressRingOffset = circumference * (1 - (isOrchard ? binPct : progressPct) / 100.0);

  return (
    <aside className="sidebar">
      
      {/* 1. Fleet Status & Primary Controls */}
      <div className={`sidebar-card ${isEstop ? "glow-red" : ""}`}>
        <div className="sidebar-card-header">
          <span className="sidebar-card-title">
            {isOrchard ? "🍎 ORCHARD FLEET STATUS" : "🚜 FLEET MISSION STATUS"}
          </span>
          <span className={`badge ${isEstop ? "badge-red" : (isSimulationRunning ? "badge-emerald" : "badge-amber")}`}>
            {isEstop ? "E-STOP ACTIVE" : (isSimulationRunning ? (isPaused ? "PAUSED" : "ACTIVE") : "READY")}
          </span>
        </div>

        {/* Big Circular Progress + Speed Readout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", margin: "8px 0 14px 0" }}>
          
          {/* Circular Donut Ring */}
          <div style={{ position: "relative", width: "100px", height: "100px" }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                fill="none"
                stroke={isEstop ? "#ef4444" : "var(--color-cyan)"}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={progressRingOffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dashoffset 0.25s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f9fafb" }}>
                {isOrchard ? Math.round(fruitsPicked) : `${Math.round(progressPct)}%`}
              </span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                {isOrchard ? "Picked" : "Harvested"}
              </span>
            </div>
          </div>

          {/* Speed & Heading Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>FORWARD SPEED</div>
              <div className="mono" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>
                {speed} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>km/h</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>HEADING</div>
              <div className="mono" style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                {heading}° COMPASS
              </div>
            </div>
          </div>

        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          {!isSimulationRunning || isPaused ? (
            <button
              onClick={() => onControlFleet(isPaused ? "RESUME" : "START_HARVEST")}
              className="btn btn-primary"
              style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
            >
              <Play size={16} /> {isPaused ? "RESUME FLEET" : "START FLEET"}
            </button>
          ) : (
            <button
              onClick={() => onControlFleet("PAUSE")}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
            >
              <Pause size={16} /> PAUSE FLEET
            </button>
          )}

          <button
            onClick={() => onControlFleet("RESET")}
            className="btn btn-secondary"
            style={{ padding: "10px 14px" }}
            title="Reset Simulation to Initial State"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Speed Multipliers & E-STOP Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => onControlFleet(isSimulationRunning ? "START_HARVEST" : "RESUME", mult)}
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "0.72rem", minWidth: "32px" }}
              >
                {mult}x
              </button>
            ))}
          </div>

          <button
            onClick={() => onControlFleet("TRIGGER_ESTOP")}
            className="btn btn-danger"
            style={{ padding: "5px 12px", fontSize: "0.75rem" }}
          >
            <AlertOctagon size={13} /> E-STOP
          </button>
        </div>

      </div>

      {/* 2. Live Telemetry Gauges */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="sidebar-card-title">
            {isOrchard ? "ROBOTIC ARM SENSORS" : "CAN-BUS HARVESTER HUD"}
          </span>
          <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>
            {isOrchard ? "4x DELTA ARMS" : "ISOBUS 250kbps"}
          </span>
        </div>

        {/* Dual Gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          
          {/* Dial 1 */}
          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>
              {isOrchard ? "GRIPPER CYCLES" : "ENGINE RPM"}
            </div>
            <div style={{ position: "relative", width: "70px", height: "70px", margin: "4px auto" }}>
              <svg width="70" height="70" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--color-cyan)"
                  strokeWidth="9"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - dial1Pct)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.15s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f9fafb" }}>
                  {isOrchard ? Math.round(gripperCPM) : rpm}
                </span>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                  {isOrchard ? "CPM" : "RPM"}
                </span>
              </div>
            </div>
          </div>

          {/* Dial 2 */}
          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>
              {isOrchard ? "SUCTION VACUUM" : "AUGER TORQUE"}
            </div>
            <div style={{ position: "relative", width: "70px", height: "70px", margin: "4px auto" }}>
              <svg width="70" height="70" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--color-amber)"
                  strokeWidth="9"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - dial2Pct)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.15s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f9fafb" }}>
                  {isOrchard ? Math.round(suctionKpa) : torque}
                </span>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                  {isOrchard ? "kPa" : "Nm"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Collection Tank / Bin Bar */}
        <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              {isOrchard ? "FRUIT BIN (1,200 MAX)" : "GRAIN HOPPER (460 bu)"}
            </span>
            <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fbbf24" }}>
              {isOrchard ? `${Math.round(fruitsPicked)} (${binPct.toFixed(1)}%)` : `${tank}%`}
            </span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${isOrchard ? binPct : tank}%`,
                height: "100%",
                background: "linear-gradient(90deg, #10b981, #f59e0b)",
                transition: "width 0.2s ease"
              }}
            />
          </div>
        </div>

        {/* Fuel & Power */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Fuel size={12} color="#fbbf24" /> Battery / Diesel:
          </span>
          <span className="mono" style={{ fontWeight: 700, color: "#f3f4f6" }}>{fuel}%</span>
        </div>

      </div>

      {/* 3. AI Insights Summary (Click opens bottom drawer) */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="sidebar-card-title">AI AGENT FLEET</span>
          <button
            onClick={() => onOpenDrawerTab("AGENTS")}
            style={{ background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "2px" }}
          >
            Details <ChevronRight size={12} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          
          <div className="agent-chip" onClick={() => onOpenDrawerTab("AGENTS")}>
            <span className="agent-name">🌿 CropVision Agronomy</span>
            <span className="agent-conf" style={{ color: "var(--color-emerald)" }}>98%</span>
          </div>

          <div className="agent-chip" onClick={() => onOpenDrawerTab("AGENTS")}>
            <span className="agent-name">🚜 Kinematics Path Agent</span>
            <span className="agent-conf" style={{ color: "var(--color-emerald)" }}>99%</span>
          </div>

          <div className="agent-chip" onClick={() => onOpenDrawerTab("AGENTS")}>
            <span className="agent-name">🌦️ Soil & Climate Agent</span>
            <span className="agent-conf" style={{ color: "var(--color-emerald)" }}>98%</span>
          </div>

          <div className="agent-chip" onClick={() => onOpenDrawerTab("AGENTS")}>
            <span className="agent-name">📈 Market & Logistics</span>
            <span className="agent-conf" style={{ color: "var(--color-emerald)" }}>99%</span>
          </div>

          <div className="agent-chip" onClick={() => onOpenDrawerTab("AGENTS")}>
            <span className="agent-name">🛡️ Safety Hardware Guard</span>
            <span className="agent-conf" style={{ color: "var(--color-cyan)" }}>100%</span>
          </div>

        </div>

      </div>

    </aside>
  );
}
