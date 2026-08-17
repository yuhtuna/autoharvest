import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertOctagon, 
  CloudLightning, 
  Users, 
  TrendingUp, 
  Bug, 
  CheckCircle2,
  FastForward,
  Gauge
} from "lucide-react";

export function ChaosControlPanel({
  onControlFleet,
  onTriggerScenario,
  activeScenario,
  isSimulationRunning,
  isPaused,
  eStopActive,
}) {
  const [speed, setSpeed] = useState(1.5);

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    onControlFleet("SET_SPEED", newSpeed);
  };

  return (
    <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
      
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Gauge size={18} color="var(--color-amber)" />
          <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>
            FLEET CONTROLS & CHAOS INJECTION
          </h3>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>
          LIVE INTERACTIVE DEMO
        </span>
      </div>

      {/* Primary Simulator Control Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr", gap: "8px" }}>
        
        {/* Play / Pause Button */}
        {!isSimulationRunning || isPaused ? (
          <button
            onClick={() => onControlFleet(isSimulationRunning ? "RESUME" : "START_HARVEST", speed)}
            className="btn btn-primary"
            style={{ fontSize: "0.8rem", padding: "8px 10px" }}
          >
            <Play size={15} fill="#ffffff" />
            <span>{isSimulationRunning ? "RESUME" : "START FLEET"}</span>
          </button>
        ) : (
          <button
            onClick={() => onControlFleet("PAUSE", speed)}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "8px 10px", borderColor: "var(--color-amber)", color: "#fbbf24" }}
          >
            <Pause size={15} />
            <span>PAUSE</span>
          </button>
        )}

        {/* Reset Button */}
        <button
          onClick={() => onControlFleet("RESET", speed)}
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "8px 10px" }}
          title="Reset Harvester to Start"
        >
          <RotateCcw size={14} />
          <span>RESET</span>
        </button>

        {/* Speed Multiplier */}
        <div style={{ display: "flex", background: "rgba(10, 15, 25, 0.7)", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "2px" }}>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                flex: 1,
                border: "none",
                background: speed === s ? "rgba(6, 182, 212, 0.35)" : "transparent",
                color: speed === s ? "#38bdf8" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Big E-STOP Button */}
        <button
          onClick={() => onControlFleet("TRIGGER_ESTOP")}
          className={`btn ${eStopActive ? "btn-danger" : "btn-secondary"}`}
          style={{
            fontSize: "0.8rem",
            padding: "8px 10px",
            borderColor: "#ef4444",
            color: eStopActive ? "#ffffff" : "#f87171",
            fontWeight: 800
          }}
        >
          <AlertOctagon size={15} />
          <span>E-STOP</span>
        </button>

      </div>

      {/* Scenario Injection Trigger Buttons */}
      <div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
          INJECT REAL-TIME CYBER-PHYSICAL CHAOS:
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          
          {/* Scenario 1: Storm Incoming */}
          <button
            onClick={() => onTriggerScenario("STORM_INCOMING")}
            className={`btn btn-secondary ${activeScenario === "STORM_INCOMING" ? "active" : ""}`}
            style={{ fontSize: "0.75rem", padding: "8px 10px", justifyContent: "flex-start", gap: "6px" }}
          >
            <CloudLightning size={15} color="#38bdf8" />
            <span>⛈️ SQUALL NOWCAST</span>
          </button>

          {/* Scenario 2: Obstacle E-STOP */}
          <button
            onClick={() => onTriggerScenario("OBSTACLE_DETECTED")}
            className={`btn btn-secondary ${activeScenario === "OBSTACLE_DETECTED" ? "active" : ""}`}
            style={{ fontSize: "0.75rem", padding: "8px 10px", justifyContent: "flex-start", gap: "6px" }}
          >
            <Users size={15} color="#ef4444" />
            <span>🛑 WORKER IN ROW</span>
          </button>

          {/* Scenario 3: CBOT Price Spike */}
          <button
            onClick={() => onTriggerScenario("MARKET_SPIKE")}
            className={`btn btn-secondary ${activeScenario === "MARKET_SPIKE" ? "active" : ""}`}
            style={{ fontSize: "0.75rem", padding: "8px 10px", justifyContent: "flex-start", gap: "6px" }}
          >
            <TrendingUp size={15} color="#fbbf24" />
            <span>📈 PRICE SPIKE +18%</span>
          </button>

          {/* Scenario 4: Fungal Blight */}
          <button
            onClick={() => onTriggerScenario("FUNGAL_BLIGHT")}
            className={`btn btn-secondary ${activeScenario === "FUNGAL_BLIGHT" ? "active" : ""}`}
            style={{ fontSize: "0.75rem", padding: "8px 10px", justifyContent: "flex-start", gap: "6px" }}
          >
            <Bug size={15} color="#f43f5e" />
            <span>🍄 HEAD BLIGHT SPOT</span>
          </button>

        </div>

        {/* Reset Conditions Button */}
        <button
          onClick={() => onTriggerScenario("RESET")}
          style={{
            width: "100%",
            marginTop: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px dashed var(--border-color)",
            color: "var(--text-secondary)",
            padding: "6px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <CheckCircle2 size={13} color="var(--color-emerald)" />
          <span>Reset Field to Nominal Conditions</span>
        </button>

      </div>

    </div>
  );
}
