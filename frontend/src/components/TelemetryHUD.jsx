import React from "react";
import { Gauge, Fuel, Disc, Compass, Zap, Activity, AlertOctagon, Sparkles, Box } from "lucide-react";

export function TelemetryHUD({ telemetry }) {
  const isOrchard = telemetry?.is_orchard || false;
  const isEstop = telemetry?.e_stop_active || false;

  // Grain Combine Metrics
  const rpm = telemetry?.engine_rpm ?? 2150;
  const torque = telemetry?.header_torque_nm ?? 680;
  const tank = telemetry?.grain_tank_pct ?? 14.5;
  const cutterHeight = telemetry?.cutter_height_cm ?? 15.0;

  // Orchard Robotic Picker Metrics
  const fruitsPicked = telemetry?.fruits_picked_count ?? 84;
  const gripperCPM = telemetry?.gripper_cycles_cpm ?? 48.0;
  const suctionKpa = telemetry?.suction_kpa ?? 85.0;
  const binPct = Math.min(100.0, (fruitsPicked / 1200.0) * 100.0);

  // Common Metrics
  const fuel = telemetry?.fuel_level_pct ?? 88.0;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const heading = telemetry?.heading_deg ?? 180.0;

  // Circular gauge percentages
  const dial1Pct = isOrchard ? Math.min(1.0, gripperCPM / 60.0) : Math.min(1.0, rpm / 2600.0);
  const dial2Pct = isOrchard ? Math.min(1.0, suctionKpa / 100.0) : Math.min(1.0, torque / 900.0);

  return (
    <div className={`glass-panel ${isEstop ? "glow-red" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      
      {/* Header */}
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
          <Activity size={18} color={isEstop ? "#ef4444" : "var(--color-emerald)"} />
          <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>
            {isOrchard ? "ROBOTIC PICKER CAN HUD" : "ROS2 / ISOBUS TELEMETRY HUD"}
          </h3>
        </div>
        <span className={`badge ${isEstop ? "badge-red" : "badge-emerald"}`} style={{ fontSize: "0.68rem" }}>
          {isEstop ? <AlertOctagon size={11} /> : <Zap size={11} />}
          {isEstop ? "E-STOP ENGAGED" : (isOrchard ? "4x DELTA ARMS OK" : "CAN BUS 250kbps OK")}
        </span>
      </div>

      {/* Gauges Matrix */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* Dual Radial Gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          
          {/* Gauge 1: Gripper CPM or Engine RPM */}
          <div 
            style={{ 
              background: "rgba(10, 15, 25, 0.7)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "10px", 
              padding: "10px", 
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>
              {isOrchard ? "GRIPPER CYCLES" : "ENGINE CAN RPM"}
            </div>
            
            <div style={{ position: "relative", width: "90px", height: "90px", margin: "6px 0" }}>
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--color-cyan)"
                  strokeWidth="8"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - dial1Pct)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.15s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f9fafb" }}>
                  {isOrchard ? Math.round(gripperCPM) : rpm}
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {isOrchard ? "CPM" : "RPM"}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
              {isOrchard ? "4x Delta Actuation" : "Limit: 2,600 RPM"}
            </div>
          </div>

          {/* Gauge 2: Vacuum Suction or Auger Torque */}
          <div 
            style={{ 
              background: "rgba(10, 15, 25, 0.7)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "10px", 
              padding: "10px", 
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>
              {isOrchard ? "VACUUM SUCTION" : "AUGER TORQUE"}
            </div>
            
            <div style={{ position: "relative", width: "90px", height: "90px", margin: "6px 0" }}>
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--color-amber)"
                  strokeWidth="8"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - dial2Pct)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.15s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span className="mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f9fafb" }}>
                  {isOrchard ? Math.round(suctionKpa) : torque}
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {isOrchard ? "kPa" : "Nm"}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
              {isOrchard ? "Soft-Touch Grip" : "Crop Load: Normal"}
            </div>
          </div>

        </div>

        {/* Collection Hopper / Bin Progress */}
        <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              {isOrchard ? "FRUIT BIN (1,200 CAPACITY)" : "GRAIN TANK HOPPER (460 bu)"}
            </span>
            <span className="mono" style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fbbf24" }}>
              {isOrchard ? `${Math.round(fruitsPicked)} FRUITS (${binPct.toFixed(1)}%)` : `${tank}%`}
            </span>
          </div>
          <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "5px", overflow: "hidden" }}>
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

        {/* Kinematics Metric Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          
          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              {isOrchard ? "ARM REACH" : "CUTTER BAR"}
            </div>
            <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8" }}>
              {isOrchard ? "120 cm (3D)" : `${cutterHeight} cm`}
            </div>
          </div>

          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ROVER SPEED</div>
            <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399" }}>
              {speed} km/h
            </div>
          </div>

          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>BATTERY / FUEL</div>
            <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fbbf24" }}>
              {fuel}%
            </div>
          </div>

          <div style={{ background: "rgba(10, 15, 25, 0.7)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>HEADING COMPASS</div>
            <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f3f4f6" }}>
              {heading}°
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
