import React, { useState } from "react";
import { X, ShieldAlert, Cpu, Radio, Truck, User, Bot, Sparkles, MapPin, Activity, Compass, Flame } from "lucide-react";
import { deployUnit } from "../services/api";

const UNIT_TYPES = [
  {
    type: "RECON_DRONE",
    name: "Multispectral Recon Drone",
    icon: <Radio size={18} color="#38bdf8" />,
    desc: "Autonomous aerial NDVI & Brix scouting drone",
    color: "#38bdf8",
    defaultName: "DJI Agras T40 Drone",
  },
  {
    type: "COMBINE_HARVESTER",
    name: "Heavy Combine Harvester",
    icon: <Truck size={18} color="#fbbf24" />,
    desc: "30-ton autonomous combine with 40ft header",
    color: "#fbbf24",
    defaultName: "John Deere X9 1100",
  },
  {
    type: "UTILITY_TRACTOR",
    name: "Utility Field Tractor",
    icon: <Truck size={18} color="#f59e0b" />,
    desc: "High-torque multi-tool utility tractor",
    color: "#f59e0b",
    defaultName: "Fendt 1000 Vario",
  },
  {
    type: "ROBOTIC_PICKER",
    name: "Delta Robotic Fruit Picker",
    icon: <Bot size={18} color="#c084fc" />,
    desc: "Quad 3D stereo vision picking arm rover",
    color: "#c084fc",
    defaultName: "Orchard Picker Rover #2",
  },
  {
    type: "GRAIN_CHASER_CART",
    name: "Autonomous Grain Cart",
    icon: "🚛",
    icon: <Truck size={18} color="#a7f3d0" />,
    desc: "Chaser grain cart for unload-on-the-go",
    color: "#a7f3d0",
    defaultName: "Unload Grain Cart #1",
  },
  {
    type: "HUMAN_FIELD_CREW",
    name: "Human Hand Pick Team",
    icon: <User size={18} color="#34d399" />,
    desc: "Selective harvesting & delicate pruning crew",
    color: "#34d399",
    defaultName: "Human Select Pick Crew #4",
  },
  {
    type: "HUMAN_AGRONOMIST",
    name: "Agronomist Inspector",
    icon: <Activity size={18} color="#ec4899" />,
    desc: "Field pathology specialist & soil auditor",
    color: "#ec4899",
    defaultName: "Dr. Evans (Agronomy Lead)",
  },
];


export function DeploymentModal({ isOpen, onClose, harvestZones = [], onDeployed }) {
  const [selectedType, setSelectedType] = useState("RECON_DRONE");
  const [unitName, setUnitName] = useState("DJI Agras T40 Drone");
  const [assignedZone, setAssignedZone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentTypeInfo = UNIT_TYPES.find((u) => u.type === selectedType) || UNIT_TYPES[0];

  const handleSelectType = (typeObj) => {
    setSelectedType(typeObj.type);
    setUnitName(typeObj.defaultName);
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Pick random initial position inside active field
      const initLon = -96.811 + (Math.random() - 0.5) * 0.008;
      const initLat = 41.253 + (Math.random() - 0.5) * 0.006;
      
      const res = await deployUnit(selectedType, unitName, [initLon, initLat], assignedZone || null);
      if (onDeployed) onDeployed(res.unit);
      onClose();
    } catch (err) {
      console.error("Failed to deploy unit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div 
              style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "8px", 
                background: `${currentTypeInfo.color}22`,
                border: `1px solid ${currentTypeInfo.color}55`,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "1.2rem"
              }}
            >
              {currentTypeInfo.icon}
            </div>
            <div>
              <h2 className="modal-title">Deploy Fleet Unit</h2>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Add autonomous machines or human crews to digital twin radar
              </div>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Unit Type Grid Selection */}
        <form onSubmit={handleDeploy} className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
              SELECT EQUIPMENT / PERSONNEL CLASS
            </label>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {UNIT_TYPES.map((u) => {
                const isSelected = selectedType === u.type;
                return (
                  <div
                    key={u.type}
                    onClick={() => handleSelectType(u)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.02)",
                      border: `1px solid ${isSelected ? u.color : "rgba(255, 255, 255, 0.06)"}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{u.icon}</div>

                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isSelected ? u.color : "#f3f4f6" }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.2 }}>
                        {u.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Callsign & Zone Settings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                UNIT CALLSIGN / NAME
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "#090d16",
                  border: "1px solid var(--border-card)",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                ASSIGN TO HARVEST ZONE
              </label>
              <select
                value={assignedZone}
                onChange={(e) => setAssignedZone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "#090d16",
                  border: "1px solid var(--border-card)",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)",
                  outline: "none"
                }}
              >
                <option value="">Unassigned (Full Field Swath)</option>
                {harvestZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.area_hectares} ha)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-card)",
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                background: currentTypeInfo.color,
                border: "none",
                color: "#0f172a",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Sparkles size={14} /> {isSubmitting ? "Deploying..." : "Confirm & Deploy Unit"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
