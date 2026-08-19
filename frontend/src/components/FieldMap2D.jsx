import React, { useRef, useEffect, useState } from "react";
import { 
  Layers, 
  Eye, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  AlertTriangle, 
  Crosshair, 
  Camera, 
  Compass,
  Plus,
  User,
  Radio,
  Bot,
  Truck,
  ShieldAlert,
  MapPin,
  Sparkles,
  Trash2,
  Sliders,
  Edit3
} from "lucide-react";
import { 
  deployUnit, 
  createHarvestZone, 
  deleteUnit, 
  deleteHarvestZone,
  manualReroutePath
} from "../services/api";

export function FieldMap2D({
  fieldPreset,
  missionPlan,
  telemetry,
  activeObstacle,
  activeScenario,
  onOpenDeployModal,
}) {

  const canvasRef = useRef(null);
  
  // Layer visibility state
  const [viewMode, setViewMode] = useState("2D_RADAR"); // '2D_RADAR' or '3D_CAB_POV'
  const [activeLayer, setActiveLayer] = useState("NDVI"); // 'NDVI' | 'MOISTURE' | 'SATELLITE'
  const [showTrajectories, setShowTrajectories] = useState(true);

  const [showHeadlands, setShowHeadlands] = useState(true);
  const [showCutTrail, setShowCutTrail] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // Manual Interactive Waypoint Drag & Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  // Deployment Toolbars state
  const [showDeployMenu, setShowDeployMenu] = useState(false);
  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const [deployMode, setDeployMode] = useState(null);
  const [zoneMode, setZoneMode] = useState(null);

  // 3D Perspective Reel Animation Frame
  const animFrameRef = useRef(0);



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // ==========================================
    // 3D FIRST-PERSON TRACTOR CAB / DRONE POV
    // ==========================================
    if (viewMode === "3D_CAB_POV") {
      animFrameRef.current = (animFrameRef.current + 1) % 360;
      const angle = (animFrameRef.current * Math.PI) / 30;
      const speed = telemetry?.speed_kmh ?? 6.8;
      const isOrchard = telemetry?.is_orchard || false;

      // Sky & Horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      skyGrad.addColorStop(0, "#08101e");
      skyGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.45);

      // Distant Horizon Line & Mountains
      ctx.fillStyle = "#0d1728";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      for (let x = 0; x <= width; x += 40) {
        ctx.lineTo(x, height * 0.45 - 8 - Math.sin(x * 0.02) * 12);
      }
      ctx.lineTo(width, height * 0.45);
      ctx.closePath();
      ctx.fill();

      // Ground Perspective Field (Soil / Crop Rows)
      const groundGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
      groundGrad.addColorStop(0, "#151b14");
      groundGrad.addColorStop(1, isOrchard ? "#1b2a1a" : "#2a2213");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      // Perspective Swath Lines rushing toward the cab
      const horizonY = height * 0.45;
      const centerX = width / 2;
      ctx.strokeStyle = isOrchard ? "rgba(56, 189, 248, 0.4)" : "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 2;

      for (let i = -6; i <= 6; i++) {
        const bottomX = centerX + i * 90;
        ctx.beginPath();
        ctx.moveTo(centerX + i * 15, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Headlight Beam
      const lightGrad = ctx.createRadialGradient(centerX, height - 20, 30, centerX, height * 0.45, width * 0.5);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      lightGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - 100, height);
      ctx.lineTo(centerX + 100, height);
      ctx.lineTo(centerX + 260, horizonY + 20);
      ctx.lineTo(centerX - 260, horizonY + 20);
      ctx.closePath();
      ctx.fill();

      // Combine Cutter Reel / Orchard Delta Gripper Mechanism (Foreground)
      if (isOrchard) {
        // Robotic Picking Arms
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 5;
        // Left arm
        ctx.beginPath();
        ctx.moveTo(centerX - 140, height);
        ctx.lineTo(centerX - 90, height - 90 + Math.sin(angle) * 15);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(centerX + 140, height);
        ctx.lineTo(centerX + 90, height - 90 + Math.cos(angle) * 15);
        ctx.stroke();

        // Suction Gripper Cups
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(centerX - 90, height - 90 + Math.sin(angle) * 15, 12, 0, Math.PI * 2);
        ctx.arc(centerX + 90, height - 90 + Math.cos(angle) * 15, 12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rotating 30ft Header Reel
        const reelY = height - 70;
        const reelWidth = width * 0.65;
        const reelX = centerX - reelWidth / 2;

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 6;
        ctx.strokeRect(reelX, reelY, reelWidth, 24);

        // Rotating Tines
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        for (let t = 0; t < 12; t++) {
          const tineX = reelX + (t / 11) * reelWidth;
          const tineY = reelY + 12 + Math.sin(angle + t * 0.6) * 22;
          ctx.beginPath();
          ctx.moveTo(tineX, reelY + 12);
          ctx.lineTo(tineX, tineY);
          ctx.stroke();
        }
      }

      // Tractor Cab Dashboard Overlay
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, height - 35, width, 35);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, height - 35, width, 35);

      // Cockpit HUD Text
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(`CAM-01 TRACTOR POV • SPEED: ${speed} km/h • HDG: ${telemetry?.heading_deg ?? 180}°`, 20, height - 14);

      return;
    }

    // ==========================================
    // 2D SATELLITE RADAR VIEW (DEFAULT)
    // ==========================================
    const polygon = fieldPreset?.coordinates_polygon || [
      [-96.812, 41.256],
      [-96.801, 41.256],
      [-96.801, 41.248],
      [-96.812, 41.248],
    ];

    const lons = polygon.map((p) => p[0]);
    const lats = polygon.map((p) => p[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const padX = 42;
    const padY = 68;
    const availW = width - padX * 2;
    const availH = height - padY * 2;

    const toCanvasX = (lon) => {
      const norm = (lon - minLon) / (maxLon - minLon);
      const centerX = width / 2;
      return centerX + (norm * availW - availW / 2) * zoom;
    };

    const toCanvasY = (lat) => {
      const norm = (lat - minLat) / (maxLat - minLat);
      const centerY = height / 2;
      return centerY + ((1 - norm) * availH - availH / 2) * zoom;
    };

    // 1. Draw Field Background Grid & Boundary
    ctx.fillStyle = "#090e17";
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const px = toCanvasX(pt[0]);
      const py = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();

    // 2. Draw Multi-Spectral Heatmap Raster Layer (NDVI / Moisture / Soil)
    const ndviMatrix = missionPlan?.vision_details?.ndvi_matrix;
    if (activeLayer !== "NONE" && ndviMatrix && ndviMatrix.length > 0) {
      const gridRows = ndviMatrix.length;
      const gridCols = ndviMatrix[0].length;
      const stepX = (maxLon - minLon) / gridCols;
      const stepY = (maxLat - minLat) / gridRows;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const val = ndviMatrix[r][c];
          const cellLon = minLon + c * stepX;
          const cellLat = maxLat - r * stepY;

          const x0 = toCanvasX(cellLon);
          const y0 = toCanvasY(cellLat);
          const x1 = toCanvasX(cellLon + stepX);
          const y1 = toCanvasY(cellLat - stepY);

          let color = "rgba(16, 185, 129, 0.35)";
          if (activeLayer === "NDVI") {
            if (val < 0.45) {
              color = `rgba(239, 68, 68, ${0.35 + (0.45 - val) * 0.45})`;
            } else if (val < 0.72) {
              color = `rgba(245, 158, 11, ${0.28 + (0.72 - val) * 0.25})`;
            } else {
              color = `rgba(16, 185, 129, ${0.28 + (val - 0.72) * 0.45})`;
            }
          } else if (activeLayer === "MOISTURE") {
            const mVal = (val * 0.6) + 0.2;
            color = `rgba(14, 165, 233, ${0.15 + mVal * 0.45})`;
          } else if (activeLayer === "SATELLITE") {
            color = `rgba(15, 23, 42, ${0.45 + val * 0.25})`;
          }

          ctx.fillStyle = color;
          ctx.fillRect(x0, y0, Math.ceil(x1 - x0) + 1, Math.ceil(y1 - y0) + 1);
        }
      }
    }



    // 3. Draw Headland Buffer Boundary
    if (showHeadlands) {
      const marginLon = (maxLon - minLon) * 0.06;
      const marginLat = (maxLat - minLat) * 0.06;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(
        toCanvasX(minLon + marginLon),
        toCanvasY(maxLat - marginLat),
        toCanvasX(maxLon - marginLon) - toCanvasX(minLon + marginLon),
        toCanvasY(minLat + marginLat) - toCanvasY(maxLat - marginLat)
      );
      ctx.setLineDash([]);
    }

    // 3.5 Draw Custom Mapped Harvest Zones (Priority, Quarantine, Staging)
    const customZones = telemetry?.harvest_zones || [];
    customZones.forEach((zone) => {
      if (!zone.coordinates_polygon || zone.coordinates_polygon.length === 0) return;
      ctx.fillStyle = zone.color_hex ? `${zone.color_hex}26` : "rgba(16, 185, 129, 0.15)";
      ctx.strokeStyle = zone.color_hex || "#10b981";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      zone.coordinates_polygon.forEach((pt, idx) => {
        const zx = toCanvasX(pt[0]);
        const zy = toCanvasY(pt[1]);
        if (idx === 0) ctx.moveTo(zx, zy);
        else ctx.lineTo(zx, zy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Zone Label Tag
      const zx0 = toCanvasX(zone.coordinates_polygon[0][0]);
      const zy0 = toCanvasY(zone.coordinates_polygon[0][1]);

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(zx0 + 4, zy0 + 4, 180, 20);
      ctx.strokeStyle = zone.color_hex || "#10b981";
      ctx.lineWidth = 1;
      ctx.strokeRect(zx0 + 4, zy0 + 4, 180, 20);

      ctx.fillStyle = zone.color_hex || "#10b981";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.fillText(`${zone.name}`, zx0 + 8, zy0 + 18);
    });



    // 4. Draw Multi-Unit Waypoint Trajectory Paths & Capacity Partitions
    const multiUnitPlans = telemetry?.multi_unit_plans || {};
    const hasMultiPlans = Object.keys(multiUnitPlans).length > 0;

    if (showTrajectories) {
      if (hasMultiPlans) {
        // Draw each unit's assigned sub-polygon and boustrophedon sweep trajectory
        Object.values(multiUnitPlans).forEach((plan) => {
          const uWps = plan.waypoints || [];
          const uColor = plan.color || "#fbbf24";

          // Sub-polygon partition boundary (subtle dashed border)
          if (plan.sub_polygon && plan.sub_polygon.length > 2 && Object.keys(multiUnitPlans).length > 1) {
            ctx.strokeStyle = `${uColor}44`;
            ctx.lineWidth = 1.0;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            plan.sub_polygon.forEach((pt, pIdx) => {
              const px = toCanvasX(pt[0]);
              const py = toCanvasY(pt[1]);
              if (pIdx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Unit Waypoint Trajectory Line
          if (uWps.length > 1) {
            ctx.strokeStyle = `${uColor}88`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            uWps.forEach((wp, idx) => {
              const wx = toCanvasX(wp.lon);
              const wy = toCanvasY(wp.lat);
              if (idx === 0) ctx.moveTo(wx, wy);
              else ctx.lineTo(wx, wy);
            });
            ctx.stroke();

            // Waypoint nodes
            uWps.forEach((wp, idx) => {
              const wx = toCanvasX(wp.lon);
              const wy = toCanvasY(wp.lat);
              ctx.fillStyle = idx === 0 ? uColor : `${uColor}55`;
              ctx.beginPath();
              ctx.arc(wx, wy, 2.0, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        });
      } else {
        // Fallback: Primary single combine waypoints
        const waypoints = missionPlan?.kinematics_details?.waypoints || [];
        const currentWpIdx = telemetry?.current_waypoint_idx || 0;

        if (waypoints.length > 1) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          waypoints.forEach((wp, idx) => {
            const wx = toCanvasX(wp.lon);
            const wy = toCanvasY(wp.lat);
            if (idx === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          });
          ctx.stroke();

          // Draw Planned Waypoint Dots
          waypoints.forEach((wp, idx) => {
            const wx = toCanvasX(wp.lon);
            const wy = toCanvasY(wp.lat);
            ctx.fillStyle = idx < currentWpIdx ? "#10b981" : "rgba(255, 255, 255, 0.35)";
            ctx.beginPath();
            ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
    }


    // 6. Draw Obstacles (if detected)
    if (activeObstacle) {
      const ox = toCanvasX(activeObstacle.lon);
      const oy = toCanvasY(activeObstacle.lat);
      const obsRadiusPx = Math.max(16, (availW / (maxLon - minLon)) * 0.00015 * zoom);

      ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
      ctx.beginPath();
      ctx.arc(ox, oy, obsRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, obsRadiusPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(185, 28, 28, 0.9)";
      ctx.fillRect(ox + obsRadiusPx + 4, oy - 12, 160, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.fillText(`🛑 ${activeObstacle.type}`, ox + obsRadiusPx + 8, oy + 2);
    }

    // 7. Draw Live Autonomous Harvester & Swarm Grain Cart
    if (telemetry?.position) {
      const hx = toCanvasX(telemetry.position[0]);
      const hy = toCanvasY(telemetry.position[1]);
      const headingDeg = telemetry.heading_deg ?? 180.0;
      const headingRad = (headingDeg * Math.PI) / 180.0;
      const isEstop = telemetry.e_stop_active;
      const isOrchard = telemetry?.is_orchard || fieldPreset?.crop_type?.includes("APPLE") || fieldPreset?.crop_type?.includes("GRAPE");
      const tankLevel = telemetry?.grain_tank_pct ?? 0;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(headingRad);

      if (isOrchard) {
        // Robotic Picking Rover
        ctx.fillStyle = isEstop ? "#b91c1c" : "#0369a1";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-14, -18, 28, 36, 6);
        ctx.fill();
        ctx.stroke();

        // 4x Delta Robotic Arms
        ctx.strokeStyle = isEstop ? "#ef4444" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-14, -6);
        ctx.lineTo(-26, -10);
        ctx.moveTo(-14, 8);
        ctx.lineTo(-26, 12);
        ctx.moveTo(14, -6);
        ctx.lineTo(26, -10);
        ctx.moveTo(14, 8);
        ctx.lineTo(26, 12);
        ctx.stroke();
      } else {
        // Broadacre Combine Harvester
        ctx.fillStyle = isEstop ? "#ef4444" : "#fbbf24";
        ctx.fillRect(-22, 14, 44, 7);

        ctx.fillStyle = isEstop ? "#b91c1c" : "#22c55e";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-12, -22, 24, 38, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-8, 2, 16, 8);

        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-9, -18, 18, 14);
      }

      ctx.restore();

      // Harvester Label HUD Chip
      const hColor = isEstop ? "#ef4444" : (isOrchard ? "#38bdf8" : "#10b981");
      const hText = `${telemetry.harvester_id} [${telemetry.speed_kmh} km/h]`;
      ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
      const hTextWidth = ctx.measureText(hText).width;
      
      ctx.fillStyle = "rgba(8, 12, 20, 0.88)";
      ctx.strokeStyle = hColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(hx + 14, hy - 18, hTextWidth + 16, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hColor;
      ctx.fillText(hText, hx + 22, hy - 5);

      // SWARM GRAIN CART (Chaser Tractor) Unload On-The-Go Rendezvous (if hopper > 60%)
      if (!isOrchard && tankLevel > 60) {
        const cartX = hx - 36;
        const cartY = hy + 8;

        // Grain cart chassis
        ctx.fillStyle = "#0284c7";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cartX - 10, cartY - 14, 20, 28, 3);
        ctx.fill();
        ctx.stroke();

        // Auger Transfer Stream Beam
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(cartX, cartY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("GRAIN_CART_01 [UNLOADING]", cartX - 40, cartY - 18);
      }
    }

    // 8. Draw All Additional Deployed Fleet Units (Recon Drones, Human Field Crews, Robotic Rovers)
    const extraUnits = telemetry?.deployed_units || [];
    extraUnits.forEach((unit) => {
      if (!unit.position || unit.unit_type === "COMBINE_HARVESTER") return;
      const ux = toCanvasX(unit.position[0]);
      const uy = toCanvasY(unit.position[1]);

      ctx.save();
      ctx.translate(ux, uy);

      if (unit.unit_type === "RECON_DRONE") {
        // Quadcopter Drone Icon with scan beam
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-5, -5, 10, 10);

      } else if (unit.unit_type === "HUMAN_FIELD_CREW") {
        // Human Field Crew Badge with pulse ring
        ctx.fillStyle = "rgba(52, 211, 153, 0.3)";
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-6, 2, 12, 8);

      } else if (unit.unit_type === "ROBOTIC_PICKER") {
        // Robotic Delta Arm Rover
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(-8, -12, 16, 24);
        ctx.strokeStyle = "#e879f9";
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -8, 24, 16);

      } else if (unit.unit_type === "UTILITY_TRACTOR") {
        // Utility Field Tractor (Amber)
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-10, -14, 20, 28);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-7, -2, 14, 6);

      } else if (unit.unit_type === "HUMAN_AGRONOMIST") {
        // Agronomist Inspector (Pink Pulse)
        ctx.fillStyle = "rgba(236, 72, 153, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-6, 2, 12, 8);

      } else if (unit.unit_type === "GRAIN_CHASER_CART") {
        // Autonomous Grain Cart
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(-9, -13, 18, 26);
      }

      ctx.restore();

      // Floating Unit Label HUD Chip
      const uColor = unit.color || "#38bdf8";
      const uText = `${unit.unit_name}`;
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      const textWidth = ctx.measureText(uText).width;
      
      ctx.fillStyle = "rgba(8, 12, 20, 0.88)";
      ctx.strokeStyle = uColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ux + 14, uy - 10, textWidth + 14, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = uColor;
      ctx.fillText(uText, ux + 21, uy + 3);
    });


  }, [fieldPreset, missionPlan, telemetry, activeObstacle, activeScenario, activeLayer, showTrajectories, showHeadlands, showCutTrail, zoom, viewMode]);


  // Handle canvas click to place deployed units or mapped zones
  const handleCanvasClick = async (e) => {
    if (!deployMode && !zoneMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const polygon = fieldPreset?.coordinates_polygon || [
      [-96.812, 41.256],
      [-96.801, 41.256],
      [-96.801, 41.248],
      [-96.812, 41.248],
    ];
    const lons = polygon.map((p) => p[0]);
    const lats = polygon.map((p) => p[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const pad = 48;
    const width = rect.width;
    const height = rect.height;
    const availW = width - pad * 2;
    const availH = height - pad * 2;
    const centerX = width / 2;
    const centerY = height / 2;

    const normX = (clickX - (centerX - (availW * zoom) / 2)) / (availW * zoom);
    const normY = (clickY - (centerY - (availH * zoom) / 2)) / (availH * zoom);

    const targetLon = minLon + normX * (maxLon - minLon);
    const targetLat = maxLat - normY * (maxLat - minLat);

    if (deployMode) {
      const names = {
        RECON_DRONE: "Recon Drone Alpha",
        HUMAN_FIELD_CREW: "Human Select Pick Team",
        ROBOTIC_PICKER: "Delta Orchard Rover",
        COMBINE_HARVESTER: "Combine Harvester Unit",
        GRAIN_CHASER_CART: "Autonomous Grain Cart",
      };
      try {
        await deployUnit(deployMode, names[deployMode] || "Deployed Unit", [targetLon, targetLat]);
      } catch (err) {
        console.error("Deploy unit error:", err);
      }
      setDeployMode(null);
    } else if (zoneMode) {
      const deltaLon = (maxLon - minLon) * 0.12;
      const deltaLat = (maxLat - minLat) * 0.12;
      const zonePolygon = [
        [targetLon - deltaLon, targetLat + deltaLat],
        [targetLon + deltaLon, targetLat + deltaLat],
        [targetLon + deltaLon, targetLat - deltaLat],
        [targetLon - deltaLon, targetLat - deltaLat],
      ];
      const zoneColors = {
        PRIORITY_HARVEST: "#10b981",
        QUARANTINE_BLIGHT: "#ef4444",
        STAGING_HEADLAND: "#fbbf24",
      };
      const zoneNames = {
        PRIORITY_HARVEST: "High-Brix Sector",
        QUARANTINE_BLIGHT: "Blight Isolation Zone",
        STAGING_HEADLAND: "Headland Staging Area",
      };
      try {
        await createHarvestZone(
          zoneNames[zoneMode] || "Mapped Sector",
          zoneMode,
          zoneColors[zoneMode] || "#10b981",
          zonePolygon
        );
      } catch (err) {
        console.error("Create zone error:", err);
      }
      setZoneMode(null);
    }
  };

  return (
    <div className="map-panel" style={{ height: "100%", flex: 1, position: "relative" }}>
      {/* Quiet Top Map Bar */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "12px",
        right: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pointerEvents: "none",
        zIndex: 10
      }}>
        {/* Field Info Tag */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 10px",
          background: "rgba(8, 12, 20, 0.85)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          pointerEvents: "auto"
        }}>
          <Crosshair size={13} color="var(--color-brand)" />
          <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-main)" }}>
            {viewMode === "3D_CAB_POV" ? "3D Operator POV" : "Field Digital Twin"}
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {fieldPreset?.area_hectares} ha
          </span>
        </div>

        {/* Minimal Controls (Zoom & POV Toggle) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", pointerEvents: "auto" }}>
          <button
            onClick={() => setViewMode(viewMode === "2D_RADAR" ? "3D_CAB_POV" : "2D_RADAR")}
            className="speed-pill"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(8, 12, 20, 0.85)", border: "1px solid var(--border-subtle)" }}
          >
            <Camera size={11} /> {viewMode === "2D_RADAR" ? "3D POV" : "2D Map"}
          </button>

          {viewMode === "2D_RADAR" && (
            <>
              {/* Interactive Path Edit / Waypoint Drag Toggle */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`speed-pill ${isEditMode ? "active" : ""}`}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  background: isEditMode ? "rgba(56, 189, 248, 0.2)" : "rgba(8, 12, 20, 0.85)", 
                  color: isEditMode ? "#38bdf8" : "inherit",
                  border: isEditMode ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid var(--border-subtle)" 
                }}
                title="Manually drag waypoint nodes to reroute harvester path"
              >
                <Edit3 size={11} /> {isEditMode ? "Done Editing" : "Manual Reroute"}
              </button>

              {/* Multi-Spectral Layer Dropdown */}
              <select
                value={activeLayer}
                onChange={(e) => setActiveLayer(e.target.value)}
                className="speed-pill"
                style={{ 
                  background: "rgba(8, 12, 20, 0.85)", 
                  border: "1px solid var(--border-subtle)", 
                  color: "var(--text-main)",
                  fontSize: "0.68rem",
                  padding: "3px 6px",
                  cursor: "pointer"
                }}
              >
                <option value="NDVI">NDVI Vigor</option>
                <option value="MOISTURE">Soil Moisture</option>
                <option value="SATELLITE">Satellite GIS</option>
              </select>

              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="speed-pill"
                title="Zoom In"
                style={{ background: "rgba(8, 12, 20, 0.85)", border: "1px solid var(--border-subtle)" }}
              >
                <ZoomIn size={11} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="speed-pill"
                title="Zoom Out"
                style={{ background: "rgba(8, 12, 20, 0.85)", border: "1px solid var(--border-subtle)" }}
              >
                <ZoomOut size={11} />
              </button>
              <button
                onClick={() => setZoom(1.0)}
                className="speed-pill"
                title="Reset View"
                style={{ background: "rgba(8, 12, 20, 0.85)", border: "1px solid var(--border-subtle)" }}
              >
                <RefreshCw size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manual Path Editing Floating Prompt */}
      {isEditMode && (
        <div 
          style={{
            position: "absolute",
            top: "48px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10, 16, 26, 0.95)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#e0f2fe",
            padding: "5px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.72rem",
            fontWeight: 600,
            zIndex: 15,
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Sliders size={13} color="#38bdf8" />
          <span>Interactive Guidance: Click and drag any waypoint node to manually reroute path</span>
          <button 
            onClick={() => setIsEditMode(false)}
            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontWeight: 700, padding: "0 4px" }}
          >
            Done
          </button>
        </div>
      )}

      {/* Interactive Canvas Container */}
      <div style={{ flex: 1, width: "100%", height: "100%", position: "relative", background: "#060911" }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={(e) => {
            if (!isEditMode) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const polygon = fieldPreset?.coordinates_polygon || [[-96.812, 41.256], [-96.801, 41.256], [-96.801, 41.248], [-96.812, 41.248]];
            const lons = polygon.map(p => p[0]);
            const lats = polygon.map(p => p[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const pad = 48;
            const width = rect.width;
            const height = rect.height;
            const availW = width - pad * 2;
            const availH = height - pad * 2;
            const centerX = width / 2;
            const centerY = height / 2;

            const toCanvasX = (lon) => centerX + ((lon - minLon) / (maxLon - minLon) - 0.5) * (availW * zoom);
            const toCanvasY = (lat) => centerY + (0.5 - (lat - minLat) / (maxLat - minLat)) * (availH * zoom);

            const multiPlans = telemetry?.multi_unit_plans || {};
            for (const [uid, plan] of Object.entries(multiPlans)) {
              const wps = plan.waypoints || [];
              for (let i = 0; i < wps.length; i++) {
                const wx = toCanvasX(wps[i].lon);
                const wy = toCanvasY(wps[i].lat);
                const dist = Math.hypot(clickX - wx, clickY - wy);
                if (dist <= 14) {
                  setDraggedNode({ unitId: uid, wpIdx: i });
                  return;
                }
              }
            }
          }}
          onMouseMove={(e) => {
            if (!draggedNode) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const curX = e.clientX - rect.left;
            const curY = e.clientY - rect.top;

            const polygon = fieldPreset?.coordinates_polygon || [[-96.812, 41.256], [-96.801, 41.256], [-96.801, 41.248], [-96.812, 41.248]];
            const lons = polygon.map(p => p[0]);
            const lats = polygon.map(p => p[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const pad = 48;
            const width = rect.width;
            const height = rect.height;
            const availW = width - pad * 2;
            const availH = height - pad * 2;
            const centerX = width / 2;
            const centerY = height / 2;

            const normX = (curX - (centerX - (availW * zoom) / 2)) / (availW * zoom);
            const normY = (curY - (centerY - (availH * zoom) / 2)) / (availH * zoom);
            const targetLon = minLon + normX * (maxLon - minLon);
            const targetLat = maxLat - normY * (maxLat - minLat);

            const multiPlans = telemetry?.multi_unit_plans || {};
            const plan = multiPlans[draggedNode.unitId];
            if (plan && plan.waypoints && plan.waypoints[draggedNode.wpIdx]) {
              plan.waypoints[draggedNode.wpIdx].lon = targetLon;
              plan.waypoints[draggedNode.wpIdx].lat = targetLat;
            }
          }}
          onMouseUp={async () => {
            if (draggedNode) {
              const multiPlans = telemetry?.multi_unit_plans || {};
              const plan = multiPlans[draggedNode.unitId];
              if (plan && plan.waypoints) {
                try {
                  await manualReroutePath({
                    fieldId: fieldPreset?.id,
                    unitId: draggedNode.unitId,
                    customWaypoints: plan.waypoints
                  });
                } catch (err) {
                  console.error("Save dragged waypoint error:", err);
                }
              }
              setDraggedNode(null);
            }
          }}
          style={{ width: "100%", height: "100%", display: "block", cursor: isEditMode ? (draggedNode ? "grabbing" : "grab") : "default" }}
        />
      </div>
    </div>
  );
}



