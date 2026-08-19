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
import { deleteUnit, deleteHarvestZone } from "../services/api";


export function CleanTelemetrySidebar({
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
  onTriggerScenario,
}) {
  const [showChaos, setShowChaos] = useState(false);
  const [expandedAgentIdx, setExpandedAgentIdx] = useState(null);

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

      {/* 3. Autonomous Agents Card with Live Thought Stream */}
      <div className="clean-card">
        <div className="clean-card-title">
          <span>AWS Multi-Agent Fleet</span>
          <span style={{ fontSize: "0.64rem", color: "#38bdf8", fontWeight: 700 }}>Bedrock AgentCore</span>
        </div>

        {[
          {
            name: "CropVision™ Spectrometry",
            icon: "🌿",
            status: isOrchard ? "14.8°Bx Prime" : "NDVI 0.733",
            agentKey: "CropVision",
            pillClass: "active",
          },
          {
            name: "Kinematics Dubins Path",
            icon: "🚜",
            status: "● -32% Fuel",
            agentKey: "Kinematics",
            pillClass: "active",
          },
          {
            name: "Soil & Climate Nowcast",
            icon: "🌦️",
            status: activeScenario === "STORM_INCOMING" ? "● Squall ETA 4.5h" : "● Optimal Window",
            agentKey: "Soil",
            pillClass: "ready",
          },
          {
            name: "CBOT Market Arbitrage",
            icon: "📈",
            status: "● $6.42 / bu",
            agentKey: "Market",
            pillClass: "active",
          },
          {
            name: "ISO 25119 Safety Guard",
            icon: "🛡️",
            status: isEstop ? "● E-STOP <15ms" : "● Nominal <15ms",
            agentKey: "Safety",
            pillClass: isEstop ? "warning" : "active",
          },
        ].map((item, idx) => {
          const isExpanded = expandedAgentIdx === idx;
          const agentStream = missionPlan?.agent_thought_stream?.find(
            (a) => a.agent.toLowerCase().includes(item.agentKey.toLowerCase())
          );

          return (
            <div key={idx} style={{ borderBottom: idx < 4 ? "1px solid rgba(255,255,255,0.04)" : "none", paddingBottom: "4px" }}>
              <div 
                className="agent-item"
                onClick={() => setExpandedAgentIdx(isExpanded ? null : idx)}
                style={{ cursor: "pointer", borderRadius: "4px", padding: "4px", transition: "background 0.2s" }}
              >
                <span className="metric-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{item.icon}</span>
                  <span style={{ color: isExpanded ? "#38bdf8" : "inherit" }}>{item.name}</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`agent-status-pill ${item.pillClass}`}>{item.status}</span>
                  {isExpanded ? <ChevronUp size={12} color="#9ca3af" /> : <ChevronDown size={12} color="#9ca3af" />}
                </div>
              </div>

              {isExpanded && (
                <div 
                  style={{
                    margin: "4px 0 8px 0",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    fontSize: "0.68rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                    <span>🧠 REASONING TRACE</span>
                    <span className="mono">{(agentStream?.confidence ? (agentStream.confidence * 100).toFixed(1) : "98.5")}% Conf</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#e2e8f0", lineHeight: 1.35 }}>
                    {agentStream?.thoughts ? (
                      agentStream.thoughts.map((t, tIdx) => (
                        <div key={tIdx} style={{ display: "flex", gap: "5px" }}>
                          <span style={{ color: "#38bdf8" }}>•</span>
                          <span>{t}</span>
                        </div>
                      ))
                    ) : (
                      <div>Evaluating real-time constraint satisfaction matrix across fleet...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* 3.5 Active Deployed Units & Mapped Zones */}
      <div className="clean-card">
        <div className="clean-card-title">
          <span>Active Deployments & Zones</span>
          <span style={{ fontSize: "0.64rem", color: "#34d399", fontWeight: 700 }}>
            {(telemetry?.deployed_units?.length || 0) + (telemetry?.harvest_zones?.length || 0)} Active
          </span>
        </div>

        {/* Deployed Units List */}
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", marginTop: "2px" }}>
          FLEET UNITS ({telemetry?.deployed_units?.length || 0})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
          {telemetry?.deployed_units?.map((u) => (
            <div 
              key={u.id} 
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 6px",
                borderRadius: "5px",
                background: "rgba(17, 24, 39, 0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.68rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: u.color || "#38bdf8" }} />
                <span style={{ color: "#f3f4f6", fontWeight: 600 }}>{u.unit_name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{u.status}</span>
                {u.unit_type !== "COMBINE_HARVESTER" && (
                  <button
                    onClick={async () => {
                      try { await deleteUnit(u.id); } catch (e) { console.error(e); }
                    }}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "1px 3px" }}
                    title="Remove unit"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mapped Zones List */}
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
          HARVEST ZONES ({telemetry?.harvest_zones?.length || 0})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {telemetry?.harvest_zones?.map((z) => (
            <div 
              key={z.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 6px",
                borderRadius: "5px",
                background: "rgba(17, 24, 39, 0.6)",
                border: `1px solid ${z.color_hex}44`,
                fontSize: "0.68rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: z.color_hex || "#10b981" }} />
                <span style={{ color: z.color_hex || "#10b981", fontWeight: 600 }}>{z.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{z.area_hectares} ha</span>
                <button
                  onClick={async () => {
                    try { await deleteHarvestZone(z.id); } catch (e) { console.error(e); }
                  }}
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "1px 3px" }}
                  title="Remove zone"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
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
