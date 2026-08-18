import React from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Fuel, 
  Award, 
  Clock, 
  ArrowUpRight, 
  BarChart3, 
  Truck,
  Leaf,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export function MarketPanel({ missionPlan, currentFieldPreset, telemetry }) {
  const arbitrage = missionPlan?.economic_arbitrage || {
    spot_price_per_bushel: "$6.42",
    projected_revenue: "$27,710.50",
    fuel_cost_savings: "$95.23",
    gross_revenue: "$28,150.00",
    drying_cost_total: "$145.00",
    recommended_silo: "SILO_VALLEY_TERMINAL",
  };

  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const yieldEst = missionPlan?.yield_prediction_bushels ?? 4324.4;
  const unitStr = isOrchard ? "boxes" : "bu";

  const silos = [
    {
      id: "SILO_VALLEY_TERMINAL",
      name: "Valley Grain Terminal (ADM)",
      distanceKm: 8.4,
      basisRate: "+$0.12",
      queueMins: 12,
      moistureDockage: "0.8%",
      isRecommended: true
    },
    {
      id: "SILO_PRAIRIE_ELEVATOR",
      name: "Prairie Central Elevator (Cargill)",
      distanceKm: 14.2,
      basisRate: "-$0.04",
      queueMins: 45,
      moistureDockage: "1.4%",
      isRecommended: false
    },
    {
      id: "SILO_FARMERS_COOP",
      name: "Farmers County Co-op Silo",
      distanceKm: 19.8,
      basisRate: "-$0.10",
      queueMins: 30,
      moistureDockage: "1.2%",
      isRecommended: false
    }
  ];

  return (
    <div className="market-panel-container">
      
      {/* 1. Hero Revenue Banner */}
      <div className="market-hero-card">
        <div>
          <div className="hero-sub">PREDICTIVE CBOT COMMODITY ARBITRAGE</div>
          <div className="hero-val mono">{arbitrage.projected_revenue}</div>
          <div className="hero-detail">
            Net projected return across <span style={{ color: "#f8fafc", fontWeight: 700 }}>{yieldEst.toLocaleString()} {unitStr}</span> harvest parcel
          </div>
        </div>

        <div className="hero-stat-pills">
          <div className="stat-pill-box">
            <div className="stat-pill-label">SPOT CASH BID</div>
            <div className="stat-pill-val mono">{arbitrage.spot_price_per_bushel}/{unitStr}</div>
          </div>
          <div className="stat-pill-box">
            <div className="stat-pill-label">AUTONOMOUS FUEL SAVINGS</div>
            <div className="stat-pill-val mono" style={{ color: "#38bdf8" }}>{arbitrage.fuel_cost_savings} (32%)</div>
          </div>
          <div className="stat-pill-box">
            <div className="stat-pill-label">DRYING PENALTY AVOIDED</div>
            <div className="stat-pill-val mono" style={{ color: "#34d399" }}>+$145.00</div>
          </div>
        </div>
      </div>

      {/* 2. Grid with Silo Logistics & Financial Arbitrage */}
      <div className="market-grid-2col">
        
        {/* Silo Dispatch Terminal Logistics */}
        <div className="market-sub-card">
          <div className="card-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={18} color="var(--color-amber)" />
              <span className="card-title">Commercial Silo Elevators & Basis Bids</span>
            </div>
            <span className="badge-pill">Optimal Routing</span>
          </div>

          <div className="silo-list">
            {silos.map((silo) => (
              <div 
                key={silo.id} 
                className={`silo-item ${silo.isRecommended ? "silo-recommended" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="silo-name">{silo.name}</span>
                      {silo.isRecommended && (
                        <span className="recommended-tag">⭐ RECOMMENDED ROUTE</span>
                      )}
                    </div>
                    <div className="silo-meta">
                      <span>📍 {silo.distanceKm} km haul</span>
                      <span>•</span>
                      <span>⏱️ {silo.queueMins} min truck queue</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: "0.95rem", fontWeight: 700, color: silo.basisRate.startsWith("+") ? "#34d399" : "#f87171" }}>
                      Basis {silo.basisRate}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      Dockage: {silo.moistureDockage}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Economic Breakdown & ESG Carbon Credits */}
        <div className="market-sub-card">
          <div className="card-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} color="var(--color-brand)" />
              <span className="card-title">Harvest P&L & Carbon Credits</span>
            </div>
            <span className="badge-pill" style={{ color: "#34d399" }}>ESG Certified</span>
          </div>

          <div className="pnl-breakdown">
            <div className="pnl-row">
              <span className="pnl-label">Gross Crop Revenue ({yieldEst.toLocaleString()} {unitStr} @ {arbitrage.spot_price_per_bushel})</span>
              <span className="pnl-val mono">{arbitrage.gross_revenue || "$28,150.00"}</span>
            </div>

            <div className="pnl-row">
              <span className="pnl-label">Grain Elevator Moisture Dockage (Pre-Storm Pick)</span>
              <span className="pnl-val mono" style={{ color: "#f87171" }}>-${arbitrage.drying_cost_total || "145.00"}</span>
            </div>

            <div className="pnl-row">
              <span className="pnl-label">Kinematic Dubins Fuel Cost Reduction</span>
              <span className="pnl-val mono" style={{ color: "#38bdf8" }}>+{arbitrage.fuel_cost_savings || "$95.23"}</span>
            </div>

            <div className="pnl-row">
              <span className="pnl-label">Autonomous Labor Overtime Elimination</span>
              <span className="pnl-val mono" style={{ color: "#38bdf8" }}>+$320.00</span>
            </div>

            <div className="pnl-row" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
              <span className="pnl-label" style={{ color: "#f8fafc", fontWeight: 700 }}>NET HARVEST ARBITRAGE GAIN</span>
              <span className="pnl-val mono" style={{ color: "#34d399", fontSize: "1.1rem" }}>{arbitrage.projected_revenue}</span>
            </div>
          </div>

          {/* ESG Carbon Card */}
          <div className="esg-carbon-box">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Leaf size={16} color="#34d399" />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#34d399" }}>
                VERRA VCS CARBON CREDIT OFFSET
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Reduced fuel burn avoided <strong>1.42 metric tons CO₂e</strong>. Estimated carbon token monetization: <strong>+$34.08</strong>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
