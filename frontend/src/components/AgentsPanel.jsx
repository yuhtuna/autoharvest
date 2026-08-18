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
  RotateCcw,
  Shield,
  Gauge,
  Compass,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Bot
} from "lucide-react";

export function AgentsPanel({
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
  onTriggerScenario,
  onOpenCopilotWithQuery
}) {
  const [expandedAgent, setExpandedAgent] = useState("CropVision");

  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const isEstop = telemetry?.e_stop_active || false;
  
  // Telemetry metrics
  const rpm = telemetry?.engine_rpm ?? 2150;
  const torque = telemetry?.header_torque_nm ?? 680;
  const tank = telemetry?.grain_tank_pct ?? 14.5;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const fuel = telemetry?.fuel_level_pct ?? 88.0;
  const rtkDrift = telemetry?.rtk_drift_mm ?? 14.2;
  const fruitsPicked = telemetry?.fruits_picked_count ?? 84;
  const gripperCPM = telemetry?.gripper_cycles_cpm ?? 48.0;
  const suctionKpa = telemetry?.suction_kpa ?? 85.0;

  // Financial summary
  const revenue = missionPlan?.economic_arbitrage?.projected_revenue ?? "$27,710.50";
  const fuelSavings = missionPlan?.economic_arbitrage?.fuel_cost_savings ?? "+$95.23";
  const yieldEst = missionPlan?.yield_prediction_bushels ?? 4324.4;
  const unitStr = isOrchard ? "boxes" : "bu";

  const agents = [
    {
      id: "CropVision",
      name: "CropVision™ Spectrometry Agent",
      role: "Spatial AI & Ripeness Vision",
      icon: "🌿",
      model: "YOLOv8 + Claude 3.5 Sonnet Vision",
      status: isOrchard ? "14.8°Bx Prime (Grade A)" : "NDVI 0.733 Active",
      confidence: 99.2,
      latency: "18ms",
      summary: "Evaluates hyperspectral NDVI matrices and HSV optical Brix sugar content to identify prime harvest parcels.",
      directives: [
        "Identified optimum ripeness clusters on central trellis rows.",
        "Zero fungal sporulation detected across primary canopy.",
        "Ripeness threshold verified at 94.2% harvest-ready."
      ]
    },
    {
      id: "Kinematics",
      name: "Kinematics Dubins Path Agent",
      role: "Dubins Trajectory & Fuel Optimization",
      icon: "🚜",
      model: "Dubins Geometry Core",
      status: "-32% Fuel Optimized",
      confidence: 98.6,
      latency: "8ms",
      summary: "Generates smooth, curvature-constrained Boustrophedon swaths and headland turn circles minimizing fuel burn.",
      directives: [
        "Generated continuous tangent arcs connecting swaths 3 to 4.",
        "Reduced turn radius to 4.2m with zero row overlap.",
        "Fuel consumption lowered by 32.4% vs traditional broadcast paths."
      ]
    },
    {
      id: "Soil",
      name: "Soil & Microclimate Agent",
      role: "Trafficability & Weather Prediction",
      icon: "🌦️",
      model: "LoRaWAN Physics Model",
      status: activeScenario === "STORM_INCOMING" ? "Squall Alert (ETA 4.5h)" : "Optimal Soil Window",
      confidence: 97.4,
      latency: "12ms",
      summary: "Ingests LoRaWAN soil probes, humidity sensors, and Doppler radar to prevent soil compaction and rain damage.",
      directives: [
        "Soil moisture rated at 18.4% — soil trafficability rating 9.2/10.",
        activeScenario === "STORM_INCOMING" 
          ? "⚠️ Incoming storm front detected in 4.5h. Swath velocity boosted +1.2 km/h."
          : "Window clear for next 36 hours. Dew point within safe thresh."
      ]
    },
    {
      id: "Market",
      name: "CBOT Market Arbitrage Agent",
      role: "Financial Futures & Silo Logistics",
      icon: "📈",
      model: "CBOT Commodities Engine",
      status: "$6.42 / bu (+3.2%)",
      confidence: 96.8,
      latency: "24ms",
      summary: "Monitors real-time CBOT futures, local elevator basis bids, and drying penalty costs to maximize net farm revenue.",
      directives: [
        "Locked forward basis contract at Valley Terminal elevator.",
        "Moisture penalty avoided by harvesting prior to precipitation window.",
        "Net projected revenue arbitrage: $27,710.50."
      ]
    },
    {
      id: "Safety",
      name: "ISO 25119 Safety Guard Agent",
      role: "Hardware Interlock & Geofencing",
      icon: "🛡️",
      model: "Deterministic Safety Kernel",
      status: isEstop ? "EMERGENCY STOP ENGAGED" : "Nominal (<15ms Interlock)",
      confidence: 99.9,
      latency: "<15ms",
      summary: "Hardware-level obstacle collision avoidance, human geofence rings, and RTK GNSS drift boundary supervision.",
      directives: [
        isEstop 
          ? "🛑 E-STOP ACTIVATED: Obstacle within 15m safety halo. Throttle disabled."
          : "All geofence safety zones nominal. RTK drift within 12.4mm tolerance."
      ]
    }
  ];

  return (
    <div className="agents-panel-container">
      
      {/* 1. Top Vehicle Telemetry & Production Strip */}
      <div className="telemetry-strip">
        
        <div className="telemetry-stat-card">
          <div className="stat-card-label">VEHICLE VELOCITY</div>
          <div className="stat-card-val mono">{speed} <span className="stat-unit">km/h</span></div>
          <div className="stat-card-sub">RTK Drift: <span style={{ color: "#38bdf8" }}>{rtkDrift}mm</span></div>
        </div>

        <div className="telemetry-stat-card">
          <div className="stat-card-label">{isOrchard ? "FRUITS PICKED" : "GRAIN HOPPER"}</div>
          <div className="stat-card-val mono">
            {isOrchard ? `${fruitsPicked} / 1200` : `${tank}%`}
          </div>
          <div className="stat-card-sub">
            {isOrchard ? `${gripperCPM} CPM Gripper` : `${rpm} RPM Engine Load`}
          </div>
        </div>

        <div className="telemetry-stat-card">
          <div className="stat-card-label">FUEL & ENERGY</div>
          <div className="stat-card-val mono" style={{ color: fuel > 20 ? "#34d399" : "#f87171" }}>
            {fuel}%
          </div>
          <div className="stat-card-sub">Savings: <span style={{ color: "#34d399" }}>{fuelSavings}</span></div>
        </div>

        <div className="telemetry-stat-card">
          <div className="stat-card-label">PROJECTED YIELD</div>
          <div className="stat-card-val mono" style={{ color: "#fbbf24" }}>
            {yieldEst.toLocaleString()} <span className="stat-unit">{unitStr}</span>
          </div>
          <div className="stat-card-sub">Net Rev: <span style={{ color: "#34d399" }}>{revenue}</span></div>
        </div>

        <div className="telemetry-stat-card">
          <div className="stat-card-label">SAFETY STATUS</div>
          <div className="stat-card-val mono" style={{ color: isEstop ? "#f87171" : "#34d399", fontSize: "1.1rem" }}>
            {isEstop ? "🛑 E-STOP" : "✓ NOMINAL"}
          </div>
          <div className="stat-card-sub">ISO 25119 Active</div>
        </div>

      </div>

      {/* 2. Main 5-Agent Visual Matrix */}
      <div className="agents-matrix-grid">
        {agents.map((agent) => {
          const isExpanded = expandedAgent === agent.id;
          const agentStream = missionPlan?.agent_thought_stream?.find(
            (a) => a.agent.toLowerCase().includes(agent.id.toLowerCase())
          );

          return (
            <div 
              key={agent.id} 
              className={`agent-card ${isExpanded ? "agent-card-active" : ""}`}
              onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
            >
              {/* Card Header */}
              <div className="agent-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="agent-card-icon">{agent.icon}</div>
                  <div>
                    <div className="agent-card-name">{agent.name}</div>
                    <div className="agent-card-role">{agent.role}</div>
                  </div>
                </div>
                <div className="agent-confidence-pill">
                  {agent.confidence}% Conf
                </div>
              </div>

              {/* Status & Model Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 6px 0" }}>
                <span className="agent-status-badge">
                  {agent.status}
                </span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  ⚡ {agent.latency}
                </span>
              </div>

              {/* Summary */}
              <p className="agent-card-summary">
                {agent.summary}
              </p>

              {/* Reasoning Trace (Accordion) */}
              <div className="agent-reasoning-container">
                <div className="reasoning-header">
                  <span>🧠 AUTONOMOUS REASONING TRACE</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {isExpanded && (
                  <div className="reasoning-body">
                    {agentStream?.thoughts ? (
                      agentStream.thoughts.map((t, idx) => (
                        <div key={idx} className="reasoning-step">
                          <span className="step-dot">•</span>
                          <span>{t}</span>
                        </div>
                      ))
                    ) : (
                      agent.directives.map((d, idx) => (
                        <div key={idx} className="reasoning-step">
                          <span className="step-dot">•</span>
                          <span>{d}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Scenario Simulations Action Bar */}
      <div className="scenario-action-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={16} color="var(--color-amber)" />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)" }}>
            FIELD SCENARIO SIMULATION INJECTORS:
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => onTriggerScenario("STORM_INCOMING")}
            className={`btn-scenario ${activeScenario === "STORM_INCOMING" ? "active" : ""}`}
          >
            🌧️ Incoming Squall Storm
          </button>

          <button
            onClick={() => onTriggerScenario("OBSTACLE_DETECTED")}
            className={`btn-scenario ${activeScenario === "OBSTACLE_DETECTED" ? "active-danger" : ""}`}
          >
            🛑 Field Worker Geofence
          </button>

          <button
            onClick={() => onTriggerScenario("MARKET_SPIKE")}
            className={`btn-scenario ${activeScenario === "MARKET_SPIKE" ? "active" : ""}`}
          >
            📈 CBOT Basis Spike (+18%)
          </button>

          <button
            onClick={() => onTriggerScenario("FUNGAL_BLIGHT")}
            className={`btn-scenario ${activeScenario === "FUNGAL_BLIGHT" ? "active" : ""}`}
          >
            🍄 Foliar Pathogen Outbreak
          </button>

          <button
            onClick={() => onTriggerScenario("RESET")}
            className="btn-scenario"
            style={{ background: "rgba(255, 255, 255, 0.06)" }}
          >
            ⟲ Reset Nominal Conditions
          </button>
        </div>
      </div>

    </div>
  );
}
