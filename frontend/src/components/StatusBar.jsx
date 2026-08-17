import React from "react";
import { 
  Satellite, 
  CloudRain, 
  Sun, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  Radio, 
  Building2, 
  Layers 
} from "lucide-react";

export function StatusBar({
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
}) {
  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const isEstop = telemetry?.e_stop_active || false;
  const stormActive = activeScenario === "STORM_INCOMING";
  const rtkDrift = telemetry?.rtk_drift_mm ?? 14.2;

  // Price formatting
  const priceDisplay = currentFieldPreset?.crop_type === "APPLES_HONEYCRISP"
    ? "$38.50 / box (Dessert)"
    : currentFieldPreset?.crop_type === "GRAPES_CABERNET"
    ? "$2,850 / ton (Estate)"
    : currentFieldPreset?.crop_type === "WHEAT_HARD_RED"
    ? "$6.42 / bu (CBOT)"
    : "$4.85 / bu (CBOT)";

  const silo = missionPlan?.economic_arbitrage?.recommended_silo ?? "Platte Valley Terminal";

  return (
    <footer className="status-bar">
      
      {/* Left: Weather & GPS */}
      <div className="status-bar-group">
        
        {/* Connection */}
        <div className="status-pill ok">
          <Radio size={12} color="#34d399" />
          <span>CAN BUS: <span className="value">250kbps OK</span></span>
        </div>

        {/* RTK Positioning */}
        <div className="status-pill ok">
          <Satellite size={12} color="#38bdf8" />
          <span>RTK GPS: <span className="value">{rtkDrift}mm FIX</span></span>
        </div>

        {/* Weather */}
        <div className={`status-pill ${stormActive ? "danger" : "ok"}`}>
          {stormActive ? <CloudRain size={12} color="#f87171" /> : <Sun size={12} color="#fbbf24" />}
          <span>
            {stormActive ? (
              <span className="value" style={{ color: "#f87171" }}>SQUALL STORM ETA: 4.5h</span>
            ) : (
              <span>WEATHER: <span className="value">CLEAR (36h OPTIMAL)</span></span>
            )}
          </span>
        </div>

      </div>

      {/* Right: Commodity Market, Silo & Safety */}
      <div className="status-bar-group">
        
        {/* Spot Price */}
        <div className="status-pill warn">
          <TrendingUp size={12} color="#fbbf24" />
          <span>SPOT PRICE: <span className="value">{priceDisplay}</span></span>
        </div>

        {/* Silo Destination */}
        <div className="status-pill">
          <Building2 size={12} color="var(--text-secondary)" />
          <span>ROUTING: <span className="value">{silo}</span></span>
        </div>

        {/* Safety Supervisor */}
        <div className={`status-pill ${isEstop ? "danger" : "ok"}`}>
          {isEstop ? <ShieldAlert size={12} color="#ef4444" /> : <ShieldCheck size={12} color="#34d399" />}
          <span className="value" style={{ color: isEstop ? "#ef4444" : "#34d399", fontWeight: 700 }}>
            {isEstop ? "SAFETY E-STOP ENGAGED" : "SAFETY GUARD: ALL CLEAR"}
          </span>
        </div>

      </div>

    </footer>
  );
}
