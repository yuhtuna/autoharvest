import React, { useState } from "react";
import { 
  Activity, 
  TrendingUp, 
  Cpu, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  CloudRain, 
  Users, 
  AlertTriangle, 
  RotateCcw 
} from "lucide-react";

export function CleanTelemetrySidebar({
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
  onTriggerScenario,
}) {
  const [showChaos, setShowChaos] = useState(false);

  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const isEstop = telemetry?.e_stop_active || false;
  
  // Broadacre grain metrics
  const rpm = telemetry?.engine_rpm ?? 2150;
  const torque = telemetry?.header_torque_nm ?? 680;
  const tank = telemetry?.grain_tank_pct ?? 14.5;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const fuel = telemetry?.fuel_level_pct ?? 88.0;
  const rtkDrift = telemetry?.rtk_drift_mm ?? 14.2;

  // Orchard fruit metrics
  const fruitsPicked = telemetry?.fruits_picked_count ?? 84;
  const gripperCPM = telemetry?.gripper_cycles_cpm ?? 48.0;
  const suctionKpa = telemetry?.suction_kpa ?? 85.0;
  const binPct = Math.min(100.0, (fruitsPicked / 1200.0) * 100.0);

  // Financial summary
  const revenue = missionPlan?.economic_arbitrage?.projected_revenue ?? "$27,710.50";
  const fuelSavings = missionPlan?.economic_arbitrage?.fuel_cost_savings ?? "+$95.23";
  const yieldEst = missionPlan?.yield_prediction_bushels ?? 4324.4;
  const unitStr = isOrchard ? "boxes" : "bu";

  return (
    <aside className="telemetry-sidebar">
      
      {/* 1. Vehicle Telemetry Card */}
      <div className="clean-card">
        <div className="clean-card-title">
          <span>{isOrchard ? "Robotic Rover Telemetry" : "Vehicle Telemetry"}</span>
          <span style={{ fontSize: "0.68rem", color: isEstop ? "#f87171" : "var(--color-brand)" }}>
            {isEstop ? "● E-STOP" : "● Online"}
          </span>
        </div>

        {/* Speed */}
        <div className="metric-row">
          <div className="metric-row-header">
            <span className="metric-label">Forward Speed</span>
            <span className="metric-value">{speed} km/h</span>
          </div>
        </div>

        {/* Dynamic Gauges: Orchard vs Combine */}
        {isOrchard ? (
          <>
            {/* Gripper CPM */}
            <div className="metric-row">
              <div className="metric-row-header">
                <span className="metric-label">Gripper Actuation</span>
                <span className="metric-value">{Math.round(gripperCPM)} CPM</span>
              </div>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill metric-bar-blue" style={{ width: `${Math.min(100, (gripperCPM / 60) * 100)}%` }} />
              </div>
            </div>

            {/* Suction kPa */}
            <div className="metric-row">
              <div className="metric-row-header">
                <span className="metric-label">Vacuum Suction</span>
                <span className="metric-value">{Math.round(suctionKpa)} kPa</span>
              </div>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill metric-bar-amber" style={{ width: `${Math.min(100, (suctionKpa / 100) * 100)}%` }} />
              </div>
            </div>

            {/* Fruit Bin */}
            <div className="metric-row">
              <div className="metric-row-header">
                <span className="metric-label">Fruit Bin Capacity</span>
                <span className="metric-value">{Math.round(fruitsPicked)} / 1,200</span>
              </div>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill metric-bar-brand" style={{ width: `${binPct}%` }} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Engine Load RPM */}
            <div className="metric-row">
              <div className="metric-row-header">
                <span className="metric-label">Engine Load</span>
                <span className="metric-value">{rpm} RPM</span>
              </div>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill metric-bar-blue" style={{ width: `${Math.min(100, (rpm / 2600) * 100)}%` }} />
              </div>
            </div>

            {/* Grain Hopper */}
            <div className="metric-row">
              <div className="metric-row-header">
                <span className="metric-label">Grain Tank Hopper</span>
                <span className="metric-value">{tank}%</span>
              </div>
              <div className="metric-bar-bg">
                <div className="metric-bar-fill metric-bar-amber" style={{ width: `${tank}%` }} />
              </div>
            </div>
          </>
        )}

        {/* Fuel / Battery */}
        <div className="metric-row">
          <div className="metric-row-header">
            <span className="metric-label">{isOrchard ? "Battery Pack" : "Fuel Level"}</span>
            <span className="metric-value">{fuel}%</span>
          </div>
          <div className="metric-bar-bg">
            <div className="metric-bar-fill metric-bar-brand" style={{ width: `${fuel}%` }} />
          </div>
        </div>

        {/* GPS Accuracy */}
        <div className="metric-row" style={{ marginTop: "4px" }}>
          <div className="metric-row-header">
            <span className="metric-label">RTK GPS Accuracy</span>
            <span className="metric-value" style={{ color: "#38bdf8" }}>{rtkDrift}mm FIX</span>
          </div>
        </div>

      </div>

      {/* 2. Harvest Summary Card */}
      <div className="clean-card">
        <div className="clean-card-title">
          <span>Harvest Summary</span>
          <TrendingUp size={13} color="var(--text-muted)" />
        </div>

        <div className="summary-stat-grid">
          
          <div className="summary-stat-box">
            <div className="summary-stat-label">Projected Yield</div>
            <div className="summary-stat-value">{yieldEst.toLocaleString()} <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--text-muted)" }}>{unitStr}</span></div>
          </div>

          <div className="summary-stat-box">
            <div className="summary-stat-label">Net Revenue</div>
            <div className="summary-stat-value" style={{ color: "var(--color-brand)" }}>{revenue}</div>
          </div>

          <div className="summary-stat-box" style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="summary-stat-label">Fuel / Energy Savings</span>
              <span className="mono" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8" }}>{fuelSavings} (32%)</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Autonomous Agents Card */}
      <div className="clean-card">
        <div className="clean-card-title">
          <span>Autonomous Agents</span>
          <Cpu size={13} color="var(--text-muted)" />
        </div>

        <div className="agent-item">
          <span className="metric-label">🌿 CropVision Agronomy</span>
          <span className="agent-status-pill active">● Ready</span>
        </div>

        <div className="agent-item">
          <span className="metric-label">🚜 Kinematics Path Agent</span>
          <span className="agent-status-pill active">● Optimal</span>
        </div>

        <div className="agent-item">
          <span className="metric-label">🌦️ Soil & Climate Nowcast</span>
          <span className="agent-status-pill ready">
            {activeScenario === "STORM_INCOMING" ? "● Storm Alert" : "● Clear"}
          </span>
        </div>

        <div className="agent-item">
          <span className="metric-label">📈 Market Arbitrage</span>
          <span className="agent-status-pill active">● Live</span>
        </div>

        <div className="agent-item">
          <span className="metric-label">🛡️ Safety Hardware Interlock</span>
          <span className={`agent-status-pill ${isEstop ? "warning" : "active"}`}>
            {isEstop ? "● E-STOP" : "● Nominal"}
          </span>
        </div>

      </div>

      {/* 4. Scenario Simulations Trigger Drawer (Clean collapsible) */}
      <div className="clean-card" style={{ padding: "10px 14px" }}>
        <button
          onClick={() => setShowChaos(!showChaos)}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--text-secondary)",
            fontSize: "0.74rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Zap size={13} color="var(--color-amber)" /> Simulate Scenarios
          </span>
          {showChaos ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showChaos && (
          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <button
              onClick={() => onTriggerScenario("STORM_INCOMING")}
              className="speed-pill"
              style={{ padding: "6px", textAlign: "left", fontSize: "0.68rem" }}
            >
              🌧️ Squall Storm
            </button>
            <button
              onClick={() => onTriggerScenario("OBSTACLE_DETECTED")}
              className="speed-pill"
              style={{ padding: "6px", textAlign: "left", fontSize: "0.68rem", color: "#f87171" }}
            >
              🛑 Worker E-Stop
            </button>
            <button
              onClick={() => onTriggerScenario("MARKET_SPIKE")}
              className="speed-pill"
              style={{ padding: "6px", textAlign: "left", fontSize: "0.68rem" }}
            >
              📈 Price Spike +18%
            </button>
            <button
              onClick={() => onTriggerScenario("FUNGAL_BLIGHT")}
              className="speed-pill"
              style={{ padding: "6px", textAlign: "left", fontSize: "0.68rem" }}
            >
              🍄 Blight Spot
            </button>
            <button
              onClick={() => onTriggerScenario("RESET")}
              className="speed-pill"
              style={{ gridColumn: "span 2", padding: "6px", textAlign: "center", fontSize: "0.68rem" }}
            >
              ⟲ Reset Field Conditions
            </button>
          </div>
        )}

      </div>

    </aside>
  );
}
