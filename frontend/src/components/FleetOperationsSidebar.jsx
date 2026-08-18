import React, { useState } from "react";
import { 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  Play, 
  Check, 
  X, 
  RotateCcw, 
  CloudRain, 
  ShieldAlert, 
  Radio, 
  Battery, 
  Fuel, 
  Gauge, 
  Edit3, 
  Crosshair,
  Layers,
  ChevronRight,
  Compass,
  AlertTriangle
} from "lucide-react";

export function FleetOperationsSidebar({
  telemetry,
  zones = [],
  deployedUnits = [],
  activeScenario,
  isDrawingZone,
  drawingPoints = [],
  onStartDrawing,
  onCancelDrawing,
  onUndoPoint,
  onSaveZone,
  onDeleteZone,
  onActivateZone,
  onDeployUnit,
  onRemoveUnit,
}) {
  const [activeTab, setActiveTab] = useState("FLEET"); // 'FLEET' | 'ZONES' | 'SAFETY'
  const [zoneNameInput, setZoneNameInput] = useState("North Ridge Sector");
  const [zoneCropInput, setZoneCropInput] = useState("WHEAT_HARD_RED");
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);

  const isOrchard = telemetry?.is_orchard || false;
  const isEstop = telemetry?.e_stop_active || false;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const tank = telemetry?.grain_tank_pct ?? 14.5;
  const fruits = telemetry?.fruits_picked_count ?? 84;

  const handleSave = () => {
    if (drawingPoints.length < 3) return;
    onSaveZone({
      name: zoneNameInput,
      polygon: drawingPoints,
      cropType: zoneCropInput,
    });
    setZoneNameInput(`Sector ${String.fromCharCode(65 + zones.length + 1)}`);
  };

  return (
    <aside className="fleet-ops-sidebar">
      
      {/* 1. Header Segmented Tabs */}
      <div className="sidebar-tab-row">
        <button
          onClick={() => setActiveTab("FLEET")}
          className={`sidebar-tab-btn ${activeTab === "FLEET" ? "sidebar-tab-btn-active" : ""}`}
        >
          <Radio size={13} />
          <span>Fleet Roster ({deployedUnits.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab("ZONES")}
          className={`sidebar-tab-btn ${activeTab === "ZONES" ? "sidebar-tab-btn-active" : ""}`}
        >
          <Layers size={13} />
          <span>Zones ({zones.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab("SAFETY")}
          className={`sidebar-tab-btn ${activeTab === "SAFETY" ? "sidebar-tab-btn-active" : ""}`}
        >
          <ShieldAlert size={13} />
          <span>Safety</span>
        </button>
      </div>

      {/* 2. Content Area */}
      <div className="sidebar-content-area">
        
        {/* =========================================================================
           TAB 1: ACTIVE FLEET ROSTER
           ========================================================================= */}
        {activeTab === "FLEET" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-label">ACTIVE AUTONOMOUS ASSETS</span>
              <button
                onClick={() => setShowAddUnitModal(!showAddUnitModal)}
                className="btn-pill-primary"
              >
                <Plus size={11} /> Deploy Unit
              </button>
            </div>

            {/* Deploy Unit Quick Dropdown Modal */}
            {showAddUnitModal && (
              <div className="quick-deploy-card">
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
                  SELECT ASSET TYPE TO DEPLOY:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button
                    onClick={() => {
                      onDeployUnit({ unitType: "DRONE_SCOUT", label: "DJI Agras T50 UAV", assignedTask: "THERMAL_NDVI_MAPPING" });
                      setShowAddUnitModal(false);
                    }}
                    className="unit-select-btn"
                  >
                    🛸 Recon UAV Scout Drone
                  </button>

                  <button
                    onClick={() => {
                      onDeployUnit({ unitType: "GRAIN_CART", label: "Brent 1596 Chaser Cart", assignedTask: "UNLOAD_ON_THE_GO" });
                      setShowAddUnitModal(false);
                    }}
                    className="unit-select-btn"
                  >
                    🚛 Autonomous Chaser Grain Cart
                  </button>

                  <button
                    onClick={() => {
                      onDeployUnit({ unitType: "HUMAN_CREW", label: "Agronomy Field Crew 1", assignedTask: "GROUND_SAMPLING" });
                      setShowAddUnitModal(false);
                    }}
                    className="unit-select-btn"
                  >
                    👷‍♂️ Human Agronomist Field Crew
                  </button>

                  <button
                    onClick={() => {
                      onDeployUnit({ unitType: "COMBINE", label: "Claas Lexion 8900", assignedTask: "PARALLEL_SWATH_CUT" });
                      setShowAddUnitModal(false);
                    }}
                    className="unit-select-btn"
                  >
                    🚜 Secondary Swath Harvester
                  </button>
                </div>
              </div>
            )}

            {/* Units Roster List */}
            <div className="units-list">
              {deployedUnits.map((unit) => {
                const isCombine = unit.type === "COMBINE";
                const isDrone = unit.type === "DRONE_SCOUT";
                const isCart = unit.type === "GRAIN_CART";
                const isCrew = unit.type === "HUMAN_CREW";

                return (
                  <div key={unit.id} className="unit-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="unit-icon">
                          {isDrone ? "🛸" : (isCart ? "🚛" : (isCrew ? "👷‍♂️" : (isOrchard ? "🍎" : "🚜")))}
                        </span>
                        <div>
                          <div className="unit-label">{unit.label || unit.id}</div>
                          <div className="unit-role">{unit.role || "AUTONOMOUS_OPERATION"}</div>
                        </div>
                      </div>

                      {unit.id !== "COMBINE_01" && (
                        <button
                          onClick={() => onRemoveUnit(unit.id)}
                          className="btn-icon-danger"
                          title="Decommission Unit"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Unit Status Pill & Stats */}
                    <div className="unit-stats-strip">
                      <span className={`status-pill ${unit.status?.includes("UNLOAD") ? "status-unloading" : (unit.status?.includes("RECON") ? "status-recon" : "status-active")}`}>
                        ● {unit.status || "ACTIVE"}
                      </span>

                      <div className="mono" style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                        {isCombine && `${speed} km/h • ${isOrchard ? fruits : tank}%`}
                        {isDrone && `ALT: 45m • ${Math.round(unit.battery_pct || 94)}% Batt`}
                        {isCart && `${Math.round(unit.cart_capacity_pct || 0)}% Loaded`}
                        {isCrew && `15m Safety Halo Active`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 2: HARVEST ZONES & PARCELS MANAGER
           ========================================================================= */}
        {activeTab === "ZONES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-label">FIELD SECTORS & PARCELS</span>
              {!isDrawingZone ? (
                <button
                  onClick={onStartDrawing}
                  className="btn-pill-primary"
                >
                  <Edit3 size={11} /> 📐 Draw Zone
                </button>
              ) : (
                <button
                  onClick={onCancelDrawing}
                  className="btn-pill-danger"
                >
                  <X size={11} /> Cancel
                </button>
              )}
            </div>

            {/* Active Drawing Tool Form */}
            {isDrawingZone && (
              <div className="zone-drawing-form-card">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontWeight: 700, fontSize: "0.72rem" }}>
                  <Edit3 size={13} />
                  <span>Interactive Zone Creator</span>
                </div>

                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: "4px 0" }}>
                  Click on the radar map to outline vertices. (<strong>{drawingPoints.length} points placed</strong>).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <div>
                    <label className="input-label">Zone / Sector Name:</label>
                    <input
                      type="text"
                      value={zoneNameInput}
                      onChange={(e) => setZoneNameInput(e.target.value)}
                      className="text-input-field"
                      placeholder="e.g. North Basin Sector A"
                    />
                  </div>

                  <div>
                    <label className="input-label">Crop Parcel Type:</label>
                    <select
                      value={zoneCropInput}
                      onChange={(e) => setZoneCropInput(e.target.value)}
                      className="text-input-field"
                    >
                      <option value="WHEAT_HARD_RED">🌾 Hard Red Winter Wheat</option>
                      <option value="CORN_YELLOW_DENT">🌽 Yellow Dent Corn (#2)</option>
                      <option value="APPLES_HONEYCRISP">🍎 Honeycrisp Apples</option>
                      <option value="GRAPES_PINOT_NOIR">🍇 Pinot Noir Wine Grapes</option>
                      <option value="SOYBEANS_ORGANIC">🌱 Organic Soybeans</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <button
                      onClick={onUndoPoint}
                      disabled={drawingPoints.length === 0}
                      className="btn-secondary-sm"
                    >
                      <RotateCcw size={11} /> Undo Point
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={drawingPoints.length < 3}
                      className="btn-primary-sm"
                      style={{ flex: 1 }}
                    >
                      <Check size={12} /> Save & Plan Swaths
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Defined Zones */}
            <div className="zones-list">
              {zones.map((z, idx) => (
                <div key={z.id} className="zone-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="zone-color-dot" style={{ backgroundColor: z.color || "#10b981" }} />
                        <span className="zone-title">{z.name}</span>
                      </div>
                      <div className="zone-meta">
                        <span>{z.area_ha} hectares</span>
                        <span>•</span>
                        <span>{z.crop_type?.replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button
                        onClick={() => onActivateZone(z.id)}
                        className="btn-action-primary"
                        title="Cut Swaths for this Zone"
                      >
                        <Play size={11} fill="currentColor" /> Cut Swaths
                      </button>

                      {zones.length > 1 && (
                        <button
                          onClick={() => onDeleteZone(z.id)}
                          className="btn-icon-danger"
                          title="Delete Zone"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.68rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Ripeness: <strong style={{ color: "#34d399" }}>{z.ripeness_brix || 14.8}°Bx</strong></span>
                    <span className="mono" style={{ color: "#38bdf8" }}>{z.status || "PLANNED"}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* =========================================================================
           TAB 3: ACTIVE SAFETY & WEATHER
           ========================================================================= */}
        {activeTab === "SAFETY" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="section-label">ISO 25119 SAFETY & HAZARDS</span>

            <div className={`safety-banner ${isEstop ? "safety-danger" : "safety-nominal"}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color={isEstop ? "#f87171" : "#34d399"} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isEstop ? "#f87171" : "#34d399" }}>
                    {isEstop ? "🛑 EMERGENCY STOP ACTIVE" : "✓ GEOFENCE NOMINAL"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                    {isEstop ? "Worker proximity interlock tripped (<15m)" : "Hardware response SLA <15ms"}
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-stat-card">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>
                <CloudRain size={15} />
                <span>Microclimate Nowcast</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {activeScenario === "STORM_INCOMING" ? (
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                    ⚠️ Severe squall front ETA 4.5h. Pre-storm swath acceleration engaged.
                  </span>
                ) : (
                  <span>Optimal 36h harvest window. Soil trafficability index 9.2/10.</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
