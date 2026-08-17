import React, { useState } from "react";
import { 
  Eye, 
  Compass, 
  CloudSun, 
  DollarSign, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export function AgentThoughtCards({ missionPlan }) {
  const [expandedAgent, setExpandedAgent] = useState(null);

  const agents = missionPlan?.agent_thought_stream || [
    {
      agent: "CropVision Agronomy Agent",
      role: "Multimodal Vision & Agronomy",
      status: "COMPLETED",
      summary: "NDVI 0.824 | Ripeness: A_PRIME (94.2% Dry Matter) | Yield: 4,250 bu",
      confidence: 0.984,
      thoughts: [
        "Ingested 4-band multispectral tile (NIR, Red, Green, Blue). Computed mean NDVI: 0.824.",
        "Segmented canopy reflectance spectrum across 48.5 ha field.",
        "Calculated dry matter metric: 94.2%. Ripeness classified as A_PRIME.",
        "Predicted net harvest yield: 4,250.0 bushels."
      ]
    },
    {
      agent: "Kinematics & Path Agent",
      role: "Robotics & Trajectory Planning",
      status: "COMPLETED",
      summary: "10 swaths (142 waypoints) | Fuel saved: 32% ($480.00)",
      confidence: 0.991,
      thoughts: [
        "Decomposed field polygon into 10 parallel Boustrophedon swaths.",
        "Set cutter width: 9.14m with 15cm ground clearance.",
        "Synthesized 142 trajectory waypoints with Dubins headland curve transitions.",
        "Optimized path kinematics: reduced turning slip by 32%, saving $480.00 in diesel."
      ]
    },
    {
      agent: "Soil & Climate Telemetry Agent",
      role: "Environmental & Trafficability Forecasting",
      status: "COMPLETED",
      summary: "Moisture: 18.4% | Urgency: HIGH (Pre-Storm Window: 6.2h) | Compaction: LOW",
      confidence: 0.978,
      thoughts: [
        "Ingested 12 LoRaWAN probe arrays: Soil moisture at 18.4%, Temp 22.1°C.",
        "Soil compaction risk evaluated as 'LOW_OPTIMAL' with trafficability 'EXCELLENT'.",
        "Analyzed NOAA NEXRAD radar Doppler feed: Dew point 16.4°C.",
        "Mission Urgency Level: HIGH (Pre-Storm Window: 6.2 hours)."
      ]
    },
    {
      agent: "Market & Logistics Agent",
      role: "Commodity Arbitrage & Silo Routing",
      status: "COMPLETED",
      summary: "Spot: $6.42/bu | Net Rev: $27,285.00 | Destination: SILO_VALLEY_TERMINAL",
      confidence: 0.985,
      thoughts: [
        "Polled Chicago Board of Trade (CBOT) live futures for Wheat: Spot rate at $6.42/bu.",
        "Calculated moisture dockage: Grain at 14.2% incurs $0.03/bu drying fee.",
        "Evaluated 3 regional grain terminals. Selected SILO_VALLEY_TERMINAL.",
        "Projected Net Revenue with Fuel Savings: $27,285.00."
      ]
    },
    {
      agent: "Fleet Safety Guard Agent",
      role: "Deterministic Hardware Supervisor",
      status: "COMPLETED",
      summary: "Status: GEOFENCE_ACTIVE_ALL_CLEAR | Interlock Latency: 14.8ms",
      confidence: 0.999,
      thoughts: [
        "Hardware supervisor heartbeat OK (Loop latency: 12.4ms < 50ms SLA).",
        "Geofence lock verified: Harvester within safety boundary.",
        "LiDAR 3D point cloud & FLIR Thermal channels 100% clear."
      ]
    },
  ];

  const getAgentIcon = (name) => {
    if (name.includes("Vision")) return <Eye size={16} color="var(--color-emerald)" />;
    if (name.includes("Kinematics") || name.includes("Path")) return <Compass size={16} color="var(--color-cyan)" />;
    if (name.includes("Soil") || name.includes("Telemetry")) return <CloudSun size={16} color="var(--color-amber)" />;
    if (name.includes("Market")) return <DollarSign size={16} color="#34d399" />;
    return <ShieldCheck size={16} color="#f87171" />;
  };

  const getBorderColor = (name) => {
    if (name.includes("Vision")) return "var(--color-emerald)";
    if (name.includes("Kinematics")) return "var(--color-cyan)";
    if (name.includes("Soil")) return "var(--color-amber)";
    if (name.includes("Market")) return "#34d399";
    return "#f87171";
  };

  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      
      {/* Title */}
      <div 
        style={{ 
          padding: "12px 16px", 
          borderBottom: "1px solid var(--border-color)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={18} color="var(--color-cyan)" />
          <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>
            MULTI-AGENT THOUGHT STREAM
          </h3>
        </div>
        <span className="badge badge-cyan" style={{ fontSize: "0.68rem" }}>
          <Sparkles size={11} /> 5 Cooperating Agents
        </span>
      </div>

      {/* Cards List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {agents.map((agent, idx) => {
          const isExpanded = expandedAgent === idx;
          const borderColor = getBorderColor(agent.agent);

          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                background: "rgba(13, 20, 32, 0.75)",
                borderColor: isExpanded ? borderColor : "rgba(255, 255, 255, 0.08)",
                padding: "10px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onClick={() => setExpandedAgent(isExpanded ? null : idx)}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getAgentIcon(agent.agent)}
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f3f4f6" }}>
                    {agent.agent}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {agent.confidence && (
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-emerald)", fontWeight: 600 }}>
                      {Math.round(agent.confidence * 100)}% Conf
                    </span>
                  )}
                  <span style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </div>

              {/* Role Subtitle */}
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                {agent.role}
              </div>

              {/* Summary */}
              <div 
                style={{ 
                  fontSize: "0.78rem", 
                  color: "#d1d5db", 
                  background: "rgba(0, 0, 0, 0.25)", 
                  padding: "6px 8px", 
                  borderRadius: "6px",
                  borderLeft: `3px solid ${borderColor}`,
                  lineHeight: "1.3"
                }}
              >
                {agent.summary}
              </div>

              {/* Expanded Step-by-Step Thought Trace */}
              {isExpanded && agent.thoughts && (
                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    REASONING STEP EXECUTION TRACE:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {agent.thoughts.map((step, sIdx) => (
                      <div key={sIdx} style={{ display: "flex", gap: "6px", fontSize: "0.74rem", color: "#9ca3af", lineHeight: "1.35" }}>
                        <span style={{ color: borderColor, fontWeight: 700 }}>#{sIdx + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
