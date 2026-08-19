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
  Trash2
} from "lucide-react";
import { deployUnit, createHarvestZone, deleteUnit, deleteHarvestZone } from "../services/api";

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
  const [showNDVI, setShowNDVI] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showHeadlands, setShowHeadlands] = useState(true);
  const [showCutTrail, setShowCutTrail] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // Deployment Toolbars state
  const [showDeployMenu, setShowDeployMenu] = useState(false);
  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const [deployMode, setDeployMode] = useState(null); // 'RECON_DRONE', 'HUMAN_FIELD_CREW', 'COMBINE_HARVESTER', 'ROBOTIC_PICKER', 'GRAIN_CHASER_CART'
  const [zoneMode, setZoneMode] = useState(null); // 'PRIORITY_HARVEST', 'QUARANTINE_BLIGHT', 'STAGING_HEADLAND'

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

    const pad = 48;
    const availW = width - pad * 2;
    const availH = height - pad * 2;

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
    ctx.fillStyle = "#0c131d";
    ctx.beginPath();
    polygon.forEach((pt, idx) => {
      const px = toCanvasX(pt[0]);
      const py = toCanvasY(pt[1]);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();

    // 2. Draw NDVI Heatmap Raster Layer (if enabled)
    const ndviMatrix = missionPlan?.vision_details?.ndvi_matrix;
    if (showNDVI && ndviMatrix && ndviMatrix.length > 0) {
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

          let color = "rgba(16, 185, 129, 0.4)";
          if (val < 0.45) {
            color = `rgba(239, 68, 68, ${0.45 + (0.45 - val) * 0.5})`;
          } else if (val < 0.72) {
            color = `rgba(245, 158, 11, ${0.35 + (0.72 - val) * 0.3})`;
          } else {
            color = `rgba(16, 185, 129, ${0.35 + (val - 0.72) * 0.5})`;
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
      ctx.fillText(`🗺️ ${zone.name}`, zx0 + 8, zy0 + 18);
    });


    // 4. Draw Waypoint Trajectory Paths
    const waypoints = missionPlan?.kinematics_details?.waypoints || [];
    const currentWpIdx = telemetry?.current_waypoint_idx || 0;

    if (showTrajectories && waypoints.length > 1) {
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

    // 5. Draw Harvested Golden Swath Trails
    if (showCutTrail && waypoints.length > 1 && currentWpIdx > 0) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      for (let i = 0; i <= Math.min(currentWpIdx, waypoints.length - 1); i++) {
        const wx = toCanvasX(waypoints[i].lon);
        const wy = toCanvasY(waypoints[i].lat);
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
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

      // Harvester Label Tag
      ctx.fillStyle = isEstop ? "#fca5a5" : (isOrchard ? "#38bdf8" : "#a7f3d0");
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(
        `${telemetry.harvester_id} [${telemetry.speed_kmh} km/h]`,
        hx + 18,
        hy - 14
      );

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
        ctx.font = "bold 10px JetBrains Mono, monospace";
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

      // Floating Unit Label Tag
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(ux + 14, uy - 12, 175, 20);
      ctx.strokeStyle = unit.color || "#38bdf8";
      ctx.lineWidth = 1;
      ctx.strokeRect(ux + 14, uy - 12, 175, 20);

      ctx.fillStyle = unit.color || "#38bdf8";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.fillText(`${unit.unit_name}`, ux + 18, uy + 2);
    });

  }, [fieldPreset, missionPlan, telemetry, activeObstacle, activeScenario, showNDVI, showTrajectories, showHeadlands, showCutTrail, zoom, viewMode]);

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
    <div className="map-panel" style={{ height: "100%", flex: 1 }}>
      
      {/* Top Map Toolbar */}
      <div className="map-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Crosshair size={15} color="var(--color-brand)" />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            {viewMode === "3D_CAB_POV" ? "3D First-Person Tractor Cab Camera" : "Digital Twin Field Radar"}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            ({fieldPreset?.area_hectares} ha • {fieldPreset?.name})
          </span>
        </div>

        {/* View Mode & Layer Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
          
          {/* Unit Deployment Dropdown Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowDeployMenu(!showDeployMenu);
                setShowZoneMenu(false);
              }}
              className="speed-pill active"
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(56, 189, 248, 0.18)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.4)" }}
            >
              <Plus size={12} /> {deployMode ? `Click Map to Place ${deployMode}` : "Deploy Unit"}
            </button>

            {showDeployMenu && (
              <div 
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "6px",
                  background: "rgba(10, 16, 26, 0.95)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: 100,
                  width: "200px"
                }}
              >
                {[
                  { type: "RECON_DRONE", label: "🚁 Recon Drone", color: "#38bdf8" },
                  { type: "HUMAN_FIELD_CREW", label: "👨‍🌾 Human Pick Crew", color: "#34d399" },
                  { type: "ROBOTIC_PICKER", label: "🤖 Delta Orchard Rover", color: "#c084fc" },
                  { type: "COMBINE_HARVESTER", label: "🚜 Heavy Combine", color: "#fbbf24" },
                  { type: "GRAIN_CHASER_CART", label: "🚛 Grain Chaser Cart", color: "#a7f3d0" },
                ].map((u) => (
                  <button
                    key={u.type}
                    onClick={() => {
                      setDeployMode(u.type);
                      setShowDeployMenu(false);
                    }}
                    style={{
                      background: "rgba(17, 24, 39, 0.8)",
                      color: u.color,
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "6px 8px",
                      borderRadius: "5px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    {u.label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setShowDeployMenu(false);
                    if (onOpenDeployModal) onOpenDeployModal();
                  }}
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    padding: "6px 8px",
                    borderRadius: "5px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "center",
                    marginTop: "4px"
                  }}
                >
                  ⚙️ Advanced Deployment Dock...
                </button>

              </div>
            )}
          </div>

          {/* Zone Mapping Dropdown Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowZoneMenu(!showZoneMenu);
                setShowDeployMenu(false);
              }}
              className="speed-pill active"
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.18)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" }}
            >
              <MapPin size={12} /> {zoneMode ? `Click Map to Place ${zoneMode}` : "Map Zone"}
            </button>

            {showZoneMenu && (
              <div 
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "6px",
                  background: "rgba(10, 16, 26, 0.95)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: 100,
                  width: "210px"
                }}
              >
                {[
                  { type: "PRIORITY_HARVEST", label: "🟩 High-Brix Priority Sector", color: "#10b981" },
                  { type: "QUARANTINE_BLIGHT", label: "🟥 Fungal Blight Quarantine", color: "#ef4444" },
                  { type: "STAGING_HEADLAND", label: "🟨 Headland Staging Area", color: "#fbbf24" },
                ].map((z) => (
                  <button
                    key={z.type}
                    onClick={() => {
                      setZoneMode(z.type);
                      setShowZoneMenu(false);
                    }}
                    style={{
                      background: "rgba(17, 24, 39, 0.8)",
                      color: z.color,
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "6px 8px",
                      borderRadius: "5px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2D vs 3D Cab POV Switcher */}
          <button
            onClick={() => setViewMode(viewMode === "2D_RADAR" ? "3D_CAB_POV" : "2D_RADAR")}
            className="speed-pill active"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255, 255, 255, 0.08)", color: "var(--text-main)", border: "1px solid var(--border-color)" }}
          >
            <Camera size={12} /> {viewMode === "2D_RADAR" ? "3D POV" : "2D Radar"}
          </button>

          {viewMode === "2D_RADAR" && (
            <>
              <button
                onClick={() => setShowNDVI(!showNDVI)}
                className={`speed-pill ${showNDVI ? "active" : ""}`}
              >
                NDVI
              </button>
              <button
                onClick={() => setShowTrajectories(!showTrajectories)}
                className={`speed-pill ${showTrajectories ? "active" : ""}`}
              >
                Swaths
              </button>
              
              {/* Zoom Buttons */}
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="speed-pill"
                title="Zoom In"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="speed-pill"
                title="Zoom Out"
              >
                <ZoomOut size={12} />
              </button>
              <button
                onClick={() => setZoom(1.0)}
                className="speed-pill"
                title="Reset Zoom"
              >
                <RefreshCw size={12} />
              </button>
            </>
          )}

        </div>
      </div>

      {/* Placement Prompt Banner if in active deployment mode */}
      {(deployMode || zoneMode) && (
        <div 
          style={{
            position: "absolute",
            top: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(14, 116, 144, 0.95)",
            color: "#ffffff",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontWeight: 700,
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            border: "1px solid #38bdf8",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Sparkles size={14} />
          <span>Click anywhere on the map to place {deployMode ? `Unit: ${deployMode}` : `Harvest Zone: ${zoneMode}`}</span>
          <button 
            onClick={() => { setDeployMode(null); setZoneMode(null); }}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", fontWeight: 800, padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Canvas Container */}
      <div style={{ flex: 1, position: "relative", minHeight: "360px", background: "#060911" }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ width: "100%", height: "100%", display: "block", cursor: (deployMode || zoneMode) ? "crosshair" : "default" }}
        />
      </div>

    </div>
  );
}

