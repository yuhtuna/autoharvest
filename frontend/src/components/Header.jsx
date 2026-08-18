import React from "react";
import { 
  Sprout, 
  Map, 
  Cpu, 
  Scan, 
  TrendingUp, 
  Bot, 
  FileText,
  Shield,
  Zap,
  Activity
} from "lucide-react";

export function Header({
  fields = [],
  currentFieldId,
  onSelectField,
  telemetry,
  activeTab,
  onSelectTab,
}) {
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];
  const isOrchard = telemetry?.is_orchard || currentField?.crop_type?.includes("APPLE") || currentField?.crop_type?.includes("GRAPE");
  const isEstop = telemetry?.e_stop_active || false;
  const speed = telemetry?.speed_kmh ?? (isOrchard ? 3.2 : 6.8);
  const progress = telemetry?.cut_progress_pct ?? 0.0;
  const deployedCount = telemetry?.deployed_units?.length || 1;

  const navTabs = [
    { id: "map", label: "Fleet Radar", icon: Map },
    { id: "agents", label: "Agent Intelligence", icon: Cpu },
    { id: "vision", label: "CropVision AI Lab", icon: Scan },
    { id: "market", label: "Commodity Arbitrage", icon: TrendingUp },
    { id: "copilot", label: "AgriCopilot LLM", icon: Bot },
    { id: "report", label: "Mission Audit", icon: FileText },
  ];

  return (
    <header className="top-nav-revamped">
      
      {/* 1. Left: Brand & Field Selector */}
      <div className="nav-left-section">
        <div className="nav-brand-box">
          <div className="brand-icon-bubble">
            <Sprout size={18} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-name">AutoHarvest OS</span>
              <span className={`mode-badge ${isOrchard ? "mode-orchard" : "mode-combine"}`}>
                {isOrchard ? "🍎 Orchard Rover" : "🌾 Combine Swarm"}
              </span>
            </div>
            <div className="brand-subtitle">Agents for Humans • AWS Multi-Agent Precision Agronomy</div>
          </div>
        </div>

        {/* Field Dropdown Selector */}
        <select
          value={currentFieldId}
          onChange={(e) => onSelectField(e.target.value)}
          className="field-selector-dropdown"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              📍 {f.name} ({f.crop_display_name})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Center: Sleek Horizontal Nav Tabs */}
      <nav className="nav-tab-container">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`nav-tab-btn ${isActive ? "nav-tab-btn-active" : ""}`}
            >
              <Icon size={14} className={isActive ? "tab-icon-active" : "tab-icon"} />
              <span>{tab.label}</span>
              {tab.id === "vision" && (
                <span className="tab-pill-badge">YOLOv8</span>
              )}
              {tab.id === "copilot" && (
                <span className="tab-pill-badge-bedrock">AWS Bedrock</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Live Telemetry HUD Mini-Pill */}
      <div className="nav-right-section">
        <div className="telemetry-mini-pill">
          <span className="live-dot" />
          <span className="mono" style={{ color: "#f8fafc", fontWeight: 700 }}>
            {speed} km/h
          </span>
          <span className="pill-divider">•</span>
          <span className="mono" style={{ color: "#34d399" }}>
            {Math.round(progress)}% Done
          </span>
          <span className="pill-divider">•</span>
          <span style={{ color: "#38bdf8", fontWeight: 600 }}>
            {deployedCount} {deployedCount === 1 ? "Unit" : "Units"}
          </span>
          {isEstop && (
            <>
              <span className="pill-divider">•</span>
              <span style={{ color: "#f87171", fontWeight: 800 }}>🛑 E-STOP</span>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
