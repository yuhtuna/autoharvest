import React from "react";
import { Play, Pause, RotateCcw, AlertOctagon } from "lucide-react";

export function FloatingControlDock({
  isSimulationRunning,
  isPaused,
  telemetry,
  onControlFleet,
}) {
  const isEstop = telemetry?.e_stop_active || false;
  const isOrchard = telemetry?.is_orchard || false;
  const progressPct = telemetry?.cut_progress_pct ?? 0.0;
  const fruitsPicked = telemetry?.fruits_picked_count ?? 0;

  return (
    <div className="floating-dock">
      
      {/* Primary Action Button (Start / Pause / Resume) */}
      {!isSimulationRunning || isPaused ? (
        <button
          onClick={() => onControlFleet(isPaused ? "RESUME" : "START_HARVEST")}
          className="btn-dock btn-dock-primary"
        >
          <Play size={14} fill="currentColor" />
          <span>{isPaused ? "Resume Mission" : "Start Mission"}</span>
        </button>
      ) : (
        <button
          onClick={() => onControlFleet("PAUSE")}
          className="btn-dock btn-dock-secondary"
        >
          <Pause size={14} />
          <span>Pause</span>
        </button>
      )}

      {/* Reset Button */}
      <button
        onClick={() => onControlFleet("RESET")}
        className="btn-dock btn-dock-secondary"
        title="Reset Mission"
        style={{ padding: "7px 10px" }}
      >
        <RotateCcw size={13} />
      </button>

      <div className="dock-divider" />

      {/* Speed Multipliers */}
      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
        {[1, 2, 4].map((mult) => (
          <button
            key={mult}
            onClick={() => onControlFleet(isSimulationRunning ? "START_HARVEST" : "RESUME", mult)}
            className="speed-pill"
          >
            {mult}x
          </button>
        ))}
      </div>

      <div className="dock-divider" />

      {/* Mission Progress Pill */}
      <div style={{ padding: "0 6px", fontSize: "0.74rem", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        {isOrchard ? (
          <span>{Math.round(fruitsPicked)} / 1,200 HARVESTED</span>
        ) : (
          <span>{Math.round(progressPct)}% COMPLETE</span>
        )}

      </div>

      <div className="dock-divider" />

      {/* Emergency Stop Button */}
      <button
        onClick={() => onControlFleet("TRIGGER_ESTOP")}
        className="btn-dock btn-dock-danger"
      >
        <AlertOctagon size={13} />
        <span>{isEstop ? "E-STOP ENGAGED" : "E-Stop"}</span>
      </button>

    </div>
  );
}
