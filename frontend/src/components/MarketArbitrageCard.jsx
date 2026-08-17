import React from "react";
import { DollarSign, TrendingUp, Building2, Fuel, Award } from "lucide-react";

export function MarketArbitrageCard({ missionPlan, cropType }) {
  const arbitrage = missionPlan?.economic_arbitrage || {
    spot_price_per_bushel: "$6.42",
    projected_revenue: "$27,285.00",
    fuel_cost_savings: "$480.00",
    gross_revenue: "$27,330.00",
    drying_cost_total: "$145.00",
    recommended_silo: "SILO_VALLEY_TERMINAL",
  };

  const bushels = missionPlan?.yield_prediction_bushels ?? 4250;

  return (
    <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DollarSign size={18} color="var(--color-emerald)" />
          <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>
            COMMODITY ARBITRAGE
          </h3>
        </div>
        <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
          <TrendingUp size={11} /> CBOT REAL-TIME
        </span>
      </div>

      {/* Main Revenue Card */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)", 
          border: "1px solid rgba(16, 185, 129, 0.3)", 
          borderRadius: "10px", 
          padding: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            NET ARBITRAGE PROJECTED REVENUE
          </div>
          <div className="mono" style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>
            {arbitrage.projected_revenue}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>SPOT PRICE</div>
          <div className="mono" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fbbf24" }}>
            {arbitrage.spot_price_per_bushel}/bu
          </div>
        </div>
      </div>

      {/* Breakdown Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem" }}>
        
        <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>ESTIMATED HARVEST YIELD</div>
          <div className="mono" style={{ fontWeight: 700, color: "#f3f4f6", marginTop: "2px" }}>
            {bushels.toLocaleString()} bu
          </div>
        </div>

        <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>AUTONOMOUS FUEL SAVINGS</div>
          <div className="mono" style={{ fontWeight: 700, color: "#38bdf8", marginTop: "2px" }}>
            +{arbitrage.fuel_cost_savings} (32%)
          </div>
        </div>

      </div>

      {/* Silo Destination */}
      <div style={{ background: "rgba(10, 15, 25, 0.6)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={14} color="var(--color-amber)" />
          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>DISPATCH TERMINAL:</span>
        </div>
        <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f3f4f6" }}>
          {arbitrage.recommended_silo}
        </span>
      </div>

    </div>
  );
}
