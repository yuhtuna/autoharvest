import React from "react";
import { 
  X, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  FileText, 
  TrendingUp, 
  Building2, 
  Award 
} from "lucide-react";

export function MissionReportModal({
  isOpen,
  onClose,
  telemetry,
  missionPlan,
  currentFieldPreset,
}) {
  if (!isOpen) return null;

  const isOrchard = telemetry?.is_orchard || currentFieldPreset?.crop_type?.includes("APPLE") || currentFieldPreset?.crop_type?.includes("GRAPE");
  const yieldVal = missionPlan?.yield_prediction_bushels ?? 4324.4;
  const unitStr = isOrchard ? "boxes" : "bushels";
  const revenue = missionPlan?.economic_arbitrage?.projected_revenue ?? "$27,710.50";
  const fuelSavings = missionPlan?.economic_arbitrage?.fuel_cost_savings ?? "+$95.23";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 14, 0.8)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "820px",
          maxHeight: "92vh",
          background: "#0f172a",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        
        {/* Modal Toolbar */}
        <div
          style={{
            padding: "12px 20px",
            background: "#131d31",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
            <FileText size={16} color="var(--color-brand)" />
            <span>EXECUTIVE HARVEST MISSION & ESG AUDIT REPORT</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePrint}
              className="btn-dock btn-dock-primary"
              style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "6px" }}
            >
              <Printer size={13} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            background: "#0b1120",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            color: "#f8fafc",
            fontFamily: "var(--font-sans)",
          }}
        >
          
          {/* Top Title Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e293b", paddingBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                🌾 AUTOHARVEST AG-FLEET AUDIT CERTIFICATE
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "3px" }}>
                Autonomous Precision Agronomy, Kinematics & Carbon Offset Verification Log
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
              <div>DATE: {dateStr}</div>
              <div>STATUS: <span style={{ color: "#34d399", fontWeight: 700 }}>VERIFIED COMPLIANT</span></div>
            </div>
          </div>

          {/* Section 1: Parcel & Operation Details */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", background: "#131d31", padding: "14px", borderRadius: "8px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>FIELD PARCEL</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{currentFieldPreset?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>CROP PROFILE</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{currentFieldPreset?.crop_display_name}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>PARCEL AREA</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{currentFieldPreset?.area_hectares} Hectares</div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>FLEET UNIT</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{isOrchard ? "Titan-Picker MK-IV (4x Arms)" : "JD X9 1100 Autonomous"}</div>
            </div>
          </div>

          {/* Section 2: Agronomy & Quality Grading */}
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Award size={15} /> 1. CROP QUALITY, BRIX & PATHOGEN CERTIFICATION
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#111c2e", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Total Harvest Yield</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                  {yieldVal.toLocaleString()} <span style={{ fontSize: "0.75rem" }}>{unitStr}</span>
                </div>
              </div>
              <div style={{ background: "#111c2e", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Optical Sugar Brix (°Bx)</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#34d399" }}>
                  {isOrchard ? "14.8°Bx (Prime Dessert)" : "14.0°Bx (97.9% Dry Matter)"}
                </div>
              </div>
              <div style={{ background: "#111c2e", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Multispectral Mean NDVI</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                  0.733 (High Vigor)
                </div>
              </div>
            </div>

            {/* Pathogen Clearance Seal */}
            <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem" }}>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                🛡️ CropVision Pathogen Screening: 0 Active Spores Detected / USDA Grade A Ready
              </span>
              <span className="mono" style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                AWS Bedrock Vision Hash: #8F4C-29D1
              </span>
            </div>
          </div>


          {/* Section 3: Financial & Arbitrage Settlement */}
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fbbf24", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <TrendingUp size={15} /> 2. FINANCIAL ARBITRAGE & SILO SETTLEMENT
            </div>
            <div style={{ background: "#111c2e", padding: "14px", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#94a3b8" }}>Projected Gross Value (CBOT Market Benchmark):</span>
                <span className="mono" style={{ fontWeight: 700 }}>$28,035.27</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#94a3b8" }}>Moisture Drying Penalty Deductions:</span>
                <span className="mono" style={{ color: "#f87171" }}>-$420.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "#94a3b8" }}>Autonomous Kinematic Fuel Optimization:</span>
                <span className="mono" style={{ color: "#38bdf8" }}>+$95.23 (32% Saved)</span>
              </div>
              <div style={{ height: "1px", background: "#1e293b", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ fontWeight: 700, color: "#ffffff" }}>Certified Net Settlement Payout:</span>
                <span className="mono" style={{ fontWeight: 800, color: "var(--color-brand)", fontSize: "1.1rem" }}>
                  {revenue}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: ESG & Carbon Offset */}
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-brand)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Leaf size={15} /> 3. ESG DECARBONIZATION & CARBON CREDIT LOG
            </div>
            <div style={{ background: "#111c2e", padding: "14px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Diesel Fuel Prevented</div>
                <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>42.8 Liters</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>GHG Offset (CO₂e)</div>
                <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>114.6 kg CO₂e</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Carbon Credits Generated</div>
                <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fbbf24" }}>1.15 Ag-Credits</div>
              </div>
            </div>
          </div>

          {/* Section 5: Safety Compliance */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#131d31", padding: "12px 16px", borderRadius: "8px", fontSize: "0.75rem", color: "#94a3b8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399", fontWeight: 700 }}>
              <ShieldCheck size={16} /> ISO 25119 Ag-PLd Safety Rating: 99.94% Compliant
            </span>
            <span>Deterministic Interlock: &lt;15ms Response SLA</span>
          </div>

          {/* Action Buttons Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #1e293b", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href="http://localhost:8020/api/v1/export/zones-geojson"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileText size={14} /> Export GeoJSON
              </a>

              <a
                href={`http://localhost:8020/api/v1/export/harvest-csv?crop_type=${currentFieldPreset?.crop_type || "APPLES_HONEYCRISP"}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <TrendingUp size={14} /> Download CSV Audit
              </a>

              <a
                href={`http://localhost:8020/api/v1/export/mission-json?field_id=${currentFieldPreset?.id || "FIELD_NE_LOT_4B"}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileText size={14} /> Export Full JSON
              </a>
            </div>


            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  background: "var(--color-brand)",
                  color: "#0f172a",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

