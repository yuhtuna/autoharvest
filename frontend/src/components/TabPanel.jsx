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
  Eye,
  Compass,
  Truck,
  ShieldCheck,
  Radio,
  Bot,
  User,
  MapPin,
  FileText,
  FileSpreadsheet,
  FileCode,
  Scan,
  Download,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Navigation
} from "lucide-react";
import { 
  deployUnit, 
  createHarvestZone, 
  deleteUnit, 
  deleteHarvestZone,
  optimizeHarvestPath,
  manualReroutePath
} from "../services/api";

const UNIT_OPTIONS = [
  { type: "RECON_DRONE", name: "Recon Drone Alpha", icon: <Radio size={14} />, defaultName: "DJI Agras T40 Drone", color: "#38bdf8" },
  { type: "COMBINE_HARVESTER", name: "Heavy Combine", icon: <Truck size={14} />, defaultName: "John Deere X9 1100", color: "#fbbf24" },
  { type: "UTILITY_TRACTOR", name: "Utility Tractor", icon: <Truck size={14} />, defaultName: "Fendt 1000 Vario", color: "#f59e0b" },
  { type: "ROBOTIC_PICKER", name: "Delta Robotic Picker", icon: <Bot size={14} />, defaultName: "Picker Rover #2", color: "#c084fc" },
  { type: "GRAIN_CHASER_CART", name: "Grain Chaser Cart", icon: <Truck size={14} />, defaultName: "Grain Cart #1", color: "#a7f3d0" },
  { type: "HUMAN_FIELD_CREW", name: "Hand Pick Crew", icon: <User size={14} />, defaultName: "Select Pick Crew #4", color: "#34d399" },
  { type: "HUMAN_AGRONOMIST", name: "Agronomist Lead", icon: <Activity size={14} />, defaultName: "Dr. Evans (Agronomy)", color: "#ec4899" },
];

export function TabPanel({
  telemetry,
  missionPlan,
  currentFieldPreset,
  activeScenario,
  onTriggerScenario,
  onOpenDroneModal,
  onOpenCopilotModal,
  onOpenReportModal,
  activeTab,
  onTabChange,
  onStartPlaceMode, // For map placement if triggered
}) {
  const [expandedAgentIdx, setExpandedAgentIdx] = useState(null);

  // Path Optimization & Manual Rerouting State
  const [manualAngle, setManualAngle] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  // Fleet Deploy Form State
  const [selectedUnitType, setSelectedUnitType] = useState("RECON_DRONE");
  const [unitCallsign, setUnitCallsign] = useState("DJI Agras T40 Drone");
  const [unitZone, setUnitZone] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  // Zone Create Form State
  const [zoneType, setZoneType] = useState("PRIORITY_HARVEST");
  const [zoneName, setZoneName] = useState("High-Brix Priority Sector");
  const [isCreatingZone, setIsCreatingZone] = useState(false);


  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const isEstop = telemetry?.e_stop_active || false;

  // Key metrics
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const rpm = telemetry?.engine_rpm ?? 2150;
  const gripperCPM = telemetry?.gripper_cycles_cpm ?? 48.0;
  const fruitsPicked = telemetry?.fruits_picked_count ?? 84;
  const tankPct = telemetry?.grain_tank_pct ?? 14.5;
  const fuelPct = telemetry?.fuel_level_pct ?? 88.0;
  const rtkDrift = telemetry?.rtk_drift_mm ?? 14.2;

  const yieldEst = missionPlan?.yield_prediction_bushels ?? 4324.4;
  const unitStr = isOrchard ? "boxes" : "bu";
  const revenue = missionPlan?.economic_arbitrage?.projected_revenue ?? "$27,710.50";

  // Handle Deploy Unit
  const handleDeployUnit = async (e) => {
    e?.preventDefault();
    setIsDeploying(true);
    try {
      const unitConfig = UNIT_OPTIONS.find(u => u.type === selectedUnitType) || UNIT_OPTIONS[0];
      const coords = telemetry?.position || [-96.8113, 41.2555];
      // Slight jitter around combine
      const jitteredPos = [coords[0] + (Math.random() - 0.5) * 0.002, coords[1] + (Math.random() - 0.5) * 0.002];

      await deployUnit({
        unit_type: selectedUnitType,
        unit_name: unitCallsign || unitConfig.defaultName,
        assigned_zone_id: unitZone || null,
        initial_lat: jitteredPos[1],
        initial_lon: jitteredPos[0],
        color: unitConfig.color
      });
      setUnitCallsign("");
    } catch (err) {
      console.error("Deploy unit error:", err);
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle Mathematical Path Optimization
  const handleOptimizePath = async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeHarvestPath(currentFieldPreset?.id, currentFieldPreset?.crop_type);
      if (res?.optimal_sweep_angle_deg !== undefined) {
        setManualAngle(res.optimal_sweep_angle_deg);
      }
    } catch (err) {
      console.error("Optimize path error:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle Manual Sweep Angle Slider Reroute
  const handleAngleChange = async (newAngle) => {
    const deg = parseFloat(newAngle);
    setManualAngle(deg);
    setIsRerouting(true);
    try {
      await manualReroutePath({
        fieldId: currentFieldPreset?.id,
        customSweepAngleDeg: deg
      });
    } catch (err) {
      console.error("Manual reroute error:", err);
    } finally {
      setIsRerouting(false);
    }
  };

  // Handle Create Zone
  const handleCreateZone = async (e) => {
    e?.preventDefault();
    setIsCreatingZone(true);
    try {
      let colorHex = "#10b981";
      if (zoneType === "QUARANTINE_BLIGHT") colorHex = "#ef4444";
      if (zoneType === "STAGING_HEADLAND") colorHex = "#fbbf24";

      const coords = telemetry?.position || [-96.8113, 41.2555];
      const p1 = [coords[0] + 0.0005, coords[1] + 0.0005];
      const p2 = [coords[0] + 0.0025, coords[1] + 0.0005];
      const p3 = [coords[0] + 0.0025, coords[1] + 0.0020];
      const p4 = [coords[0] + 0.0005, coords[1] + 0.0020];

      await createHarvestZone({
        name: zoneName || "Custom Sector",
        zone_type: zoneType,
        polygon_coords: [p1, p2, p3, p4, p1],
        color_hex: colorHex,
        target_brix_min: zoneType === "PRIORITY_HARVEST" ? 14.5 : 12.0
      });
      setZoneName("");
    } catch (err) {
      console.error("Create zone error:", err);
    } finally {
      setIsCreatingZone(false);
    }
  };


  return (
    <aside className="tabbed-sidebar">
      {/* 1. Tab Navigation Bar */}
      <nav className="tab-nav-bar">
        <button 
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => onTabChange("overview")}
        >
          <Activity size={13} />
          <span>Overview</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === "fleet" ? "active" : ""}`}
          onClick={() => onTabChange("fleet")}
        >
          <Truck size={13} />
          <span>Fleet ({telemetry?.deployed_units?.length || 0})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === "vision" ? "active" : ""}`}
          onClick={() => onTabChange("vision")}
        >
          <Eye size={13} />
          <span>Vision & AI</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === "scenarios" ? "active" : ""}`}
          onClick={() => onTabChange("scenarios")}
        >
          <Zap size={13} />
          <span>Scenarios</span>
        </button>
      </nav>

      {/* 2. Tab Content Body */}
      <div className="tab-content">
        
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <>
            {/* Key Metrics 2x2 Grid */}
            <div className="summary-stat-grid">
              <div className="summary-stat-box">
                <div className="summary-stat-label">CROP YIELD PREDICTION</div>
                <div className="summary-stat-value" style={{ color: "var(--color-brand)" }}>
                  {yieldEst.toLocaleString()} <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{unitStr}</span>
                </div>
              </div>

              <div className="summary-stat-box">
                <div className="summary-stat-label">PROJECTED SETTLEMENT</div>
                <div className="summary-stat-value" style={{ color: "var(--text-main)" }}>
                  {revenue}
                </div>
              </div>

              <div className="summary-stat-box">
                <div className="summary-stat-label">GROUND SPEED</div>
                <div className="summary-stat-value">
                  {speed} <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>km/h</span>
                </div>
              </div>

              <div className="summary-stat-box">
                <div className="summary-stat-label">{isOrchard ? "FRUITS PICKED" : "TANK LEVEL"}</div>
                <div className="summary-stat-value" style={{ color: !isOrchard && tankPct > 80 ? "var(--color-amber)" : "var(--text-main)" }}>
                  {isOrchard ? `${Math.round(fruitsPicked)} / 1,200` : `${tankPct}%`}
                </div>
              </div>
            </div>

            {/* Powertrain & Kinematics */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>{isOrchard ? "Robotic Dynamics" : "Powertrain Telemetry"}</span>
                <span style={{ fontSize: "0.68rem", color: isEstop ? "#f87171" : "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                  {isEstop ? "E-STOP" : "ONLINE"}
                </span>
              </div>

              {isOrchard ? (
                <>
                  <div className="metric-row">
                    <div className="metric-row-header">
                      <span className="metric-label">Delta Arm Actuation</span>
                      <span className="metric-value">{Math.round(gripperCPM)} CPM</span>
                    </div>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: `${Math.min(100, (gripperCPM / 60) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="metric-row">
                    <div className="metric-row-header">
                      <span className="metric-label">Battery Level</span>
                      <span className="metric-value">{fuelPct}%</span>
                    </div>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: `${fuelPct}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="metric-row">
                    <div className="metric-row-header">
                      <span className="metric-label">Engine Load</span>
                      <span className="metric-value">{rpm} RPM</span>
                    </div>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: `${Math.min(100, (rpm / 2600) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="metric-row">
                    <div className="metric-row-header">
                      <span className="metric-label">Fuel Tank</span>
                      <span className="metric-value">{fuelPct}%</span>
                    </div>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: `${fuelPct}%` }} />
                    </div>
                  </div>
                </>
              )}

              <div className="metric-row" style={{ marginTop: "4px" }}>
                <div className="metric-row-header">
                  <span className="metric-label">RTK GPS Positioning</span>
                  <span className="metric-value" style={{ color: "var(--color-brand)" }}>{rtkDrift}mm FIX</span>
                </div>
              </div>
            </div>

            {/* AWS Multi-Agent Reasoning Fleet */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Multi-Agent Fleet Intelligence</span>
                <span style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>AWS Bedrock</span>
              </div>

              {[
                { name: "CropVision Spectrometry", icon: <Eye size={13} />, status: isOrchard ? "14.8°Bx Prime" : "NDVI 0.733", key: "CropVision" },
                { name: "Kinematics Dubins Path", icon: <Truck size={13} />, status: "-32% Fuel", key: "Kinematics" },
                { name: "Soil & Climate Nowcast", icon: <CloudRain size={13} />, status: activeScenario === "STORM_INCOMING" ? "Squall ETA 4.5h" : "Nominal Window", key: "Soil" },
                { name: "CBOT Market Arbitrage", icon: <TrendingUp size={13} />, status: "$6.42 / bu", key: "Market" },
                { name: "ISO 25119 Safety Guard", icon: <ShieldCheck size={13} />, status: isEstop ? "E-STOP <15ms" : "Active <15ms", key: "Safety" },
              ].map((agent, idx) => {
                const isExpanded = expandedAgentIdx === idx;
                const agentStream = missionPlan?.agent_thought_stream?.find(
                  (a) => a.agent.toLowerCase().includes(agent.key.toLowerCase())
                );

                return (
                  <div key={idx} style={{ borderBottom: idx < 4 ? "1px solid var(--border-subtle)" : "none", padding: "6px 0" }}>
                    <div 
                      onClick={() => setExpandedAgentIdx(isExpanded ? null : idx)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: "0.76rem" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isExpanded ? "var(--text-main)" : "var(--text-secondary)" }}>
                        {agent.icon}
                        <span style={{ fontWeight: 500 }}>{agent.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.7rem", color: agent.key === "Safety" && isEstop ? "#f87171" : "var(--color-brand)", fontFamily: "var(--font-mono)" }}>
                          {agent.status}
                        </span>
                        {isExpanded ? <ChevronUp size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: "6px", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", fontSize: "0.7rem", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "4px", fontSize: "0.65rem", fontWeight: 600 }}>
                          <span>REASONING TRACE</span>
                          <span>{(agentStream?.confidence ? (agentStream.confidence * 100).toFixed(1) : "98.5")}% CONFIDENCE</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", color: "var(--text-secondary)" }}>
                          {agentStream?.thoughts ? (
                            agentStream.thoughts.map((t, tIdx) => (
                              <div key={tIdx} style={{ display: "flex", gap: "5px" }}>
                                <span style={{ color: "var(--color-brand)" }}>•</span>
                                <span>{t}</span>
                              </div>
                            ))
                          ) : (
                            <div>Evaluating constraints across spatial kinematics and yield models.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FLEET & MULTI-ROBOT PATH PLANNING */}
        {/* ========================================================= */}
        {activeTab === "fleet" && (
          <>
            {/* Multi-Agent Optimal Path Planning Metrics */}
            <div className="summary-stat-grid">
              <div className="summary-stat-box">
                <div className="summary-stat-label">FLEET MAKESPAN ETA</div>
                <div className="summary-stat-value" style={{ color: "var(--color-brand)" }}>
                  {telemetry?.fleet_makespan_minutes ?? 38.5} <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>min</span>
                </div>
              </div>

              <div className="summary-stat-box">
                <div className="summary-stat-label">EFFICIENCY GAIN</div>
                <div className="summary-stat-value" style={{ color: "var(--text-main)" }}>
                  +{telemetry?.time_savings_pct ?? 0}% <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>speedup</span>
                </div>
              </div>
            </div>

            {/* Kinematics Path Optimization & Manual Rerouting Module */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Path Guidance & Optimization</span>
                <Sliders size={13} color="var(--text-muted)" />
              </div>

              {/* Auto-Optimize CTA Button */}
              <button
                onClick={handleOptimizePath}
                disabled={isOptimizing}
                className="btn-clean btn-clean-primary"
                style={{ width: "100%", padding: "8px 12px", marginBottom: "10px", justifyContent: "center" }}
              >
                <Sparkles size={14} />
                <span>{isOptimizing ? "Solving Optimal Angle & Swaths..." : "⚡ Auto-Optimize Path (Minimal Turns)"}</span>
              </button>

              {/* Manual Sweep Heading Angle Slider */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span className="metric-label">Manual Sweep Heading</span>
                  <span className="mono" style={{ color: "var(--color-brand)", fontWeight: 700 }}>
                    {manualAngle}° {manualAngle === (telemetry?.optimal_sweep_angle_deg ?? 0) ? "(Optimal)" : "(Custom)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="175"
                  step="5"
                  value={manualAngle}
                  onChange={(e) => handleAngleChange(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--color-brand)", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-muted)" }}>
                  <span>0° (North-South)</span>
                  <span>90° (East-West)</span>
                  <span>175°</span>
                </div>
              </div>

              {/* Optimization Benchmark Summary */}
              <div style={{ padding: "6px 8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", border: "1px solid var(--border-subtle)", fontSize: "0.68rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Solver State:</span>
                  <span style={{ color: telemetry?.is_manual_override ? "var(--color-amber)" : "var(--color-brand)", fontWeight: 600 }}>
                    {telemetry?.is_manual_override ? "MANUAL OVERRIDE" : "MATHEMATICALLY OPTIMIZED"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Best Turning Axis: {telemetry?.optimal_sweep_angle_deg ?? 0}°</span>
                  <span>Dubins Headland Arcs: Active</span>
                </div>
              </div>
            </div>

            {/* Inline Unit Deploy Form */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Deploy Unit (Auto-Replans Paths)</span>
                <Plus size={13} color="var(--text-muted)" />
              </div>


              <form onSubmit={handleDeployUnit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "3px" }}>UNIT CLASS</label>
                  <select 
                    value={selectedUnitType}
                    onChange={(e) => {
                      setSelectedUnitType(e.target.value);
                      const opt = UNIT_OPTIONS.find(u => u.type === e.target.value);
                      if (opt) setUnitCallsign(opt.defaultName);
                    }}
                    className="select-clean"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.type} value={u.type}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "3px" }}>CALLSIGN / IDENTIFIER</label>
                  <input 
                    type="text"
                    value={unitCallsign}
                    onChange={(e) => setUnitCallsign(e.target.value)}
                    placeholder="e.g. Recon Drone #3"
                    className="input-clean"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isDeploying}
                  className="btn-clean btn-clean-primary" 
                  style={{ marginTop: "4px" }}
                >
                  <Plus size={13} />
                  <span>{isDeploying ? "Synthesizing Paths..." : "Deploy & Partition Field"}</span>
                </button>
              </form>
            </div>

            {/* Active Deployed Units List with Path Progress & ETA */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Active Units ({telemetry?.deployed_units?.length || 0})</span>
                <span style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>m-CPP Optimized</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {telemetry?.deployed_units && telemetry.deployed_units.length > 0 ? (
                  telemetry.deployed_units.map((unit) => (
                    <div 
                      key={unit.id}
                      style={{
                        padding: "8px",
                        background: "rgba(0, 0, 0, 0.25)",
                        borderRadius: "4px",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.74rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: unit.color || "var(--color-brand)" }} />
                          <div>
                            <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{unit.unit_name}</div>
                            <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>{unit.unit_type}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            ETA {unit.eta_minutes ?? 20}m
                          </span>
                          {unit.unit_type !== "COMBINE_HARVESTER" && (
                            <button
                              onClick={async () => {
                                try { await deleteUnit(unit.id); } catch (e) { console.error(e); }
                              }}
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              title="Remove unit"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Path Details & Progress Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                        <span>Sector: {unit.assigned_area_ha ?? 12} ha</span>
                        <span>Speed: {unit.speed_kmh ?? 6.8} km/h</span>
                        <span className="mono">{unit.path_progress_pct ?? 0}% Path Done</span>
                      </div>
                      <div className="metric-bar-bg" style={{ height: "3px" }}>
                        <div className="metric-bar-fill" style={{ width: `${unit.path_progress_pct ?? 0}%`, background: unit.color || "var(--color-brand)" }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", padding: "8px" }}>
                    No active auxiliary units deployed.
                  </div>
                )}
              </div>
            </div>


            {/* Inline Create Harvest Zone Form */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Map Harvest Zone</span>
                <MapPin size={13} color="var(--text-muted)" />
              </div>

              <form onSubmit={handleCreateZone} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "3px" }}>ZONE CLASSIFICATION</label>
                  <select 
                    value={zoneType}
                    onChange={(e) => {
                      setZoneType(e.target.value);
                      if (e.target.value === "PRIORITY_HARVEST") setZoneName("High-Brix Priority Sector");
                      if (e.target.value === "QUARANTINE_BLIGHT") setZoneName("Fungal Blight Isolation");
                      if (e.target.value === "STAGING_HEADLAND") setZoneName("Headland Logistics Staging");
                    }}
                    className="select-clean"
                  >
                    <option value="PRIORITY_HARVEST">High-Brix Priority Sector (Green)</option>
                    <option value="QUARANTINE_BLIGHT">Fungal Blight Quarantine (Red)</option>
                    <option value="STAGING_HEADLAND">Headland Staging Area (Yellow)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "3px" }}>ZONE LABEL</label>
                  <input 
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g. Sector 4B High Sugar"
                    className="input-clean"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isCreatingZone}
                  className="btn-clean" 
                  style={{ marginTop: "4px" }}
                >
                  <Plus size={13} />
                  <span>{isCreatingZone ? "Creating..." : "Add Zone to Map"}</span>
                </button>
              </form>
            </div>

            {/* Active Harvest Zones List */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Active Mapped Zones ({telemetry?.harvest_zones?.length || 0})</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {telemetry?.harvest_zones && telemetry.harvest_zones.length > 0 ? (
                  telemetry.harvest_zones.map((zone) => (
                    <div 
                      key={zone.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        background: "rgba(0, 0, 0, 0.25)",
                        borderRadius: "4px",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.74rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: zone.color_hex || "var(--color-brand)" }} />
                        <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{zone.name}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {zone.area_hectares} ha
                        </span>
                        <button
                          onClick={async () => {
                            try { await deleteHarvestZone(zone.id); } catch (e) { console.error(e); }
                          }}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                          title="Remove zone"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", padding: "8px" }}>
                    No custom harvest zones mapped.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VISION & AI TOOLS & EXPORTS */}
        {/* ========================================================= */}
        {activeTab === "vision" && (
          <>
            <div className="clean-card">
              <div className="clean-card-title">
                <span>AI Diagnostics & Intelligence</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Scan & Grade Diagnostic Lab */}
                <button 
                  onClick={onOpenDroneModal}
                  className="btn-clean btn-clean-primary"
                  style={{ justifyContent: "flex-start", padding: "10px 12px" }}
                >
                  <Scan size={15} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Computer Vision & Spectrometry Lab</div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.85, fontWeight: 400 }}>YOLOv8 fruit detection, 3D pick vectors & Brix estimation</div>
                  </div>
                </button>

                {/* AgriCopilot Chat */}
                <button 
                  onClick={onOpenCopilotModal}
                  className="btn-clean"
                  style={{ justifyContent: "flex-start", padding: "10px 12px" }}
                >
                  <Bot size={15} color="var(--color-brand)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>AgriCopilot Assistant</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>AWS Bedrock dialogue for agronomy, weather & pricing</div>
                  </div>
                </button>

                {/* Mission & ESG Report */}
                <button 
                  onClick={onOpenReportModal}
                  className="btn-clean"
                  style={{ justifyContent: "flex-start", padding: "10px 12px" }}
                >
                  <FileText size={15} color="var(--color-brand)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>Mission & ESG Audit Report</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>ISO 25119 safety certificate, carbon offset & yield breakdown</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Industrial Data Export Engine */}
            <div className="clean-card">
              <div className="clean-card-title">
                <span>Export Operations Data</span>
                <Download size={13} color="var(--text-muted)" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <a
                  href="http://localhost:8020/api/v1/export/zones-geojson"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-clean"
                  style={{ textDecoration: "none", justifyContent: "flex-start", fontSize: "0.74rem" }}
                >
                  <MapPin size={13} color="var(--color-brand)" />
                  <span>Export ISO GeoJSON (John Deere Ops / QGIS)</span>
                </a>

                <a
                  href={`http://localhost:8020/api/v1/export/harvest-csv?crop_type=${currentFieldPreset?.crop_type || "WHEAT_HARD_RED"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-clean"
                  style={{ textDecoration: "none", justifyContent: "flex-start", fontSize: "0.74rem" }}
                >
                  <FileSpreadsheet size={13} color="var(--color-brand)" />
                  <span>Download Spectrometry & Brix CSV Audit</span>
                </a>

                <a
                  href={`http://localhost:8020/api/v1/export/mission-json?field_id=${currentFieldPreset?.id || "FIELD_NE_LOT_4B"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-clean"
                  style={{ textDecoration: "none", justifyContent: "flex-start", fontSize: "0.74rem" }}
                >
                  <FileCode size={13} color="var(--color-brand)" />
                  <span>Export Full Mission Plan (JSON)</span>
                </a>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SCENARIOS */}
        {/* ========================================================= */}
        {activeTab === "scenarios" && (
          <div className="clean-card">
            <div className="clean-card-title">
              <span>Operational Scenario Simulations</span>
              <Zap size={13} color="var(--text-muted)" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={() => onTriggerScenario("STORM_INCOMING")}
                className="btn-clean"
                style={{ 
                  justifyContent: "flex-start", 
                  textAlign: "left",
                  borderColor: activeScenario === "STORM_INCOMING" ? "var(--color-brand)" : "var(--border-subtle)" 
                }}
              >
                <CloudRain size={14} color="var(--color-brand)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Squall Storm Front Nowcast</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Accelerates harvest path before rain impairs crop quality</div>
                </div>
              </button>

              <button
                onClick={() => onTriggerScenario("OBSTACLE_DETECTED")}
                className="btn-clean"
                style={{ 
                  justifyContent: "flex-start", 
                  textAlign: "left",
                  borderColor: activeScenario === "OBSTACLE_DETECTED" ? "#ef4444" : "var(--border-subtle)" 
                }}
              >
                <AlertTriangle size={14} color="#f87171" />
                <div>
                  <div style={{ fontWeight: 600, color: "#f87171" }}>Worker In-Row E-Stop</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Simulates human worker intrusion and &lt;15ms SIL-3 safety interlock</div>
                </div>
              </button>

              <button
                onClick={() => onTriggerScenario("MARKET_SPIKE")}
                className="btn-clean"
                style={{ 
                  justifyContent: "flex-start", 
                  textAlign: "left",
                  borderColor: activeScenario === "MARKET_SPIKE" ? "var(--color-brand)" : "var(--border-subtle)" 
                }}
              >
                <TrendingUp size={14} color="var(--color-brand)" />
                <div>
                  <div style={{ fontWeight: 600 }}>CBOT Futures Price Spike (+18%)</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Triggers real-time revenue recalculation and silo routing</div>
                </div>
              </button>

              <button
                onClick={() => onTriggerScenario("FUNGAL_BLIGHT")}
                className="btn-clean"
                style={{ 
                  justifyContent: "flex-start", 
                  textAlign: "left",
                  borderColor: activeScenario === "FUNGAL_BLIGHT" ? "var(--color-brand)" : "var(--border-subtle)" 
                }}
              >
                <AlertTriangle size={14} color="var(--color-brand)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Fungal Blight Outbreak</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Isolates infected sector to prevent cross-contamination</div>
                </div>
              </button>

              <button
                onClick={() => onTriggerScenario("RESET")}
                className="btn-clean"
                style={{ 
                  marginTop: "6px",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "var(--text-secondary)"
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Field & Fleet Conditions</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
