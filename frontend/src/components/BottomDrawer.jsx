import React, { useState } from "react";
import { 
  Cpu, 
  Zap, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown, 
  CloudRain, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Fuel,
  Building2
} from "lucide-react";

export function BottomDrawer({
  activeTab,
  onSelectTab,
  isExpanded,
  onToggleExpand,
  missionPlan,
  activeScenario,
  onTriggerScenario,
  cropType,
}) {
  const currentScenario = activeScenario || "NORMAL_HARVEST";
  const thoughts = missionPlan?.agent_thought_stream || [];

  return (
    <div className={`glass-panel bottom-drawer ${isExpanded ? "expanded" : "collapsed"}`} style={{ borderRadius: "0 0 14px 14px", borderTop: "1px solid var(--border-color)" }}>
      
      {/* Tab Headers Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10, 16, 26, 0.95)", borderBottom: "1px solid var(--border-color)" }}>
        
        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === "AGENTS" ? "active" : ""}`}
            onClick={() => {
              onSelectTab("AGENTS");
              if (!isExpanded) onToggleExpand();
            }}
          >
            <Cpu size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            5-Agent Insights ({thoughts.length > 0 ? "5 Active" : "Ready"})
          </button>

          <button
            className={`drawer-tab ${activeTab === "CHAOS" ? "active" : ""}`}
            onClick={() => {
              onSelectTab("CHAOS");
              if (!isExpanded) onToggleExpand();
            }}
          >
            <Zap size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Chaos & Scenarios {currentScenario !== "NORMAL_HARVEST" && `[${currentScenario}]`}
          </button>

          <button
            className={`drawer-tab ${activeTab === "MARKET" ? "active" : ""}`}
            onClick={() => {
              onSelectTab("MARKET");
              if (!isExpanded) onToggleExpand();
            }}
          >
            <TrendingUp size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Market & Elevator Silos
          </button>
        </div>

        <button
          onClick={onToggleExpand}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.75rem",
            fontWeight: 600
          }}
        >
          {isExpanded ? (
            <>
              <ChevronDown size={15} /> Collapse
            </>
          ) : (
            <>
              <ChevronUp size={15} /> Expand Details
            </>
          )}
        </button>

      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="drawer-content">
          
          {/* TAB 1: 5-Agent Detailed Reasoning Streams */}
          {activeTab === "AGENTS" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
              {thoughts.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(10, 15, 25, 0.75)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f3f4f6" }}>
                      {card.agent_name}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                      {card.confidence_score ? `${Math.round(card.confidence_score * 100)}%` : "OK"}
                    </span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
                    {card.thought_trace?.slice(0, 3).map((step, sIdx) => (
                      <li
                        key={sIdx}
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.35,
                          position: "relative",
                          paddingLeft: "10px"
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, color: "var(--color-cyan)" }}>›</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Chaos & Scenario Injections */}
          {activeTab === "CHAOS" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                TRIGGER REAL-TIME CYBER-PHYSICAL CHAOS SCENARIOS:
              </div>

              <div className="chaos-grid">
                
                <button
                  onClick={() => onTriggerScenario("STORM_INCOMING")}
                  className={`chaos-btn ${currentScenario === "STORM_INCOMING" ? "active" : ""}`}
                >
                  <CloudRain size={15} color="#38bdf8" />
                  <div>
                    <div style={{ fontWeight: 700 }}>Squall Storm Front</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>ETA 4.5h • Accelerate swaths</div>
                  </div>
                </button>

                <button
                  onClick={() => onTriggerScenario("OBSTACLE_DETECTED")}
                  className={`chaos-btn ${currentScenario === "OBSTACLE_DETECTED" ? "active" : ""}`}
                >
                  <Users size={15} color="#ef4444" />
                  <div>
                    <div style={{ fontWeight: 700, color: "#fca5a5" }}>Worker in Row (E-STOP)</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Thermal IR &lt;50ms interlock</div>
                  </div>
                </button>

                <button
                  onClick={() => onTriggerScenario("MARKET_SPIKE")}
                  className={`chaos-btn ${currentScenario === "MARKET_SPIKE" ? "active" : ""}`}
                >
                  <TrendingUp size={15} color="#fbbf24" />
                  <div>
                    <div style={{ fontWeight: 700 }}>CBOT Price Spike +18%</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Re-route to premium terminal</div>
                  </div>
                </button>

                <button
                  onClick={() => onTriggerScenario("FUNGAL_BLIGHT")}
                  className={`chaos-btn ${currentScenario === "FUNGAL_BLIGHT" ? "active" : ""}`}
                >
                  <AlertTriangle size={15} color="#ec4899" />
                  <div>
                    <div style={{ fontWeight: 700 }}>Fungal Head Blight Spot</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Isolate infected parcel</div>
                  </div>
                </button>

              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => onTriggerScenario("RESET")}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.72rem", padding: "4px 10px" }}
                >
                  <RotateCcw size={12} /> Reset to Nominal Field Conditions
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Market Arbitrage & Silo Queues */}
          {activeTab === "MARKET" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              
              {/* Financial Breakdown */}
              <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px" }}>
                  ECONOMIC ARBITRAGE SUMMARY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Projected Net Revenue:</span>
                    <span className="mono" style={{ fontWeight: 800, color: "var(--color-emerald)", fontSize: "0.95rem" }}>
                      {missionPlan?.economic_arbitrage?.projected_revenue ?? "$27,710.50"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Autonomous Fuel Savings:</span>
                    <span className="mono" style={{ color: "var(--color-cyan)", fontWeight: 700 }}>
                      {missionPlan?.economic_arbitrage?.fuel_cost_savings ?? "+$95.23 (32%)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Moisture Drying Penalty:</span>
                    <span className="mono" style={{ color: "var(--color-amber)" }}>
                      {missionPlan?.economic_arbitrage?.drying_cost_total ?? "-$420.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Regional Elevators */}
              <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px" }}>
                  DISPATCH DESTINATION QUEUES
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.74rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "#f3f4f6" }}>Platte Valley Terminal (14.2 km)</span>
                    <span className="badge badge-emerald" style={{ fontSize: "0.6rem" }}>OPTIMAL QUEUE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)" }}>BNSF West Rail Hub (28.5 km)</span>
                    <span className="badge badge-amber" style={{ fontSize: "0.6rem" }}>CONGESTED (92%)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
