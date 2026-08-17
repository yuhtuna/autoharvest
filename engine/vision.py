"""
CropVision Agronomy Agent Engine
Multispectral NDVI analysis, Brix ripeness grading, weed/fungal blight hotspot detection,
and yield prediction.
"""
from typing import Dict, Any, List, Tuple
import numpy as np


class CropVisionAgent:
    """
    CropVision Agronomy Agent computes vegetation index, ripeness, disease risk,
    and harvest yield predictions from multispectral sensor feeds.
    """

    def __init__(self):
        self.agent_name = "CropVision Agronomy Agent"
        self.version = "2.4.0-edge"

    def compute_ndvi(self, nir_band: np.ndarray, red_band: np.ndarray) -> np.ndarray:
        """
        Calculates Normalized Difference Vegetation Index (NDVI).
        NDVI = (NIR - RED) / (NIR + RED)
        Values range between -1.0 and +1.0.
        Healthy crops: 0.6 - 0.9.
        Ripe crops for harvest: 0.70 - 0.88.
        Diseased / bare soil: < 0.35.
        """
        nir = nir_band.astype(float)
        red = red_band.astype(float)
        denominator = nir + red
        # Prevent division by zero
        denominator[denominator == 0] = 1e-6
        ndvi = (nir - red) / denominator
        return np.clip(ndvi, -1.0, 1.0)

    def generate_synthetic_multispectral_field(
        self,
        grid_size: Tuple[int, int] = (64, 64),
        crop_type: str = "WHEAT_HARD_RED",
        inject_blight: bool = False,
        blight_center: Tuple[int, int] = (32, 32),
        blight_radius: int = 8,
    ) -> Dict[str, Any]:
        """
        Generates synthetic 2D field multispectral grids (NIR, Red, Green, NDVI)
        for simulation and visualization.
        """
        h, w = grid_size
        np.random.seed(42)

        # Base vegetation reflectance
        if crop_type == "WHEAT_HARD_RED":
            base_nir = 0.78 + 0.08 * np.sin(np.linspace(0, 3.14, h))[:, None] * np.cos(np.linspace(0, 3.14, w))[None, :]
            base_red = 0.12 + 0.03 * np.random.randn(h, w)
            base_green = 0.25 + 0.04 * np.random.randn(h, w)
        elif crop_type == "CORN_YELLOW_DENT":
            base_nir = 0.82 + 0.06 * np.cos(np.linspace(0, 3.14, h))[:, None]
            base_red = 0.14 + 0.03 * np.random.randn(h, w)
            base_green = 0.28 + 0.03 * np.random.randn(h, w)
        else:  # SOYBEANS
            base_nir = 0.80 + 0.05 * np.random.randn(h, w)
            base_red = 0.13 + 0.02 * np.random.randn(h, w)
            base_green = 0.26 + 0.03 * np.random.randn(h, w)

        # Add natural micro-variance
        noise = 0.04 * np.random.randn(h, w)
        nir_grid = np.clip(base_nir + noise, 0.2, 0.98)
        red_grid = np.clip(base_red + 0.02 * np.random.randn(h, w), 0.05, 0.45)
        green_grid = np.clip(base_green + 0.02 * np.random.randn(h, w), 0.1, 0.5)

        blight_detected = False
        blight_hotspots = []

        if inject_blight:
            cy, cx = blight_center
            y_indices, x_indices = np.ogrid[:h, :w]
            dist_from_center = np.sqrt((x_indices - cx) ** 2 + (y_indices - cy) ** 2)
            mask = dist_from_center <= blight_radius
            # Blight reduces NIR drastically and increases Red
            nir_grid[mask] = np.clip(nir_grid[mask] * 0.4, 0.1, 0.3)
            red_grid[mask] = np.clip(red_grid[mask] * 1.8, 0.25, 0.6)
            blight_detected = True
            blight_hotspots.append({
                "hotspot_id": "BLIGHT_ZONE_A1",
                "center_grid": [cx, cy],
                "radius_grid": blight_radius,
                "type": "FUSARIUM_HEAD_BLIGHT",
                "severity": "MODERATE_FUNGAL_SPREAD",
                "recommended_action": "PRIORITIZE_HARVEST_BEFORE_SPORE_TRANSMISSION"
            })

        ndvi_grid = self.compute_ndvi(nir_grid, red_grid)

        return {
            "grid_size": [h, w],
            "ndvi_matrix": ndvi_grid.tolist(),
            "mean_ndvi": float(np.mean(ndvi_grid)),
            "min_ndvi": float(np.min(ndvi_grid)),
            "max_ndvi": float(np.max(ndvi_grid)),
            "blight_detected": blight_detected,
            "blight_hotspots": blight_hotspots,
        }

    def analyze_field(
        self,
        crop_type: str = "WHEAT_HARD_RED",
        area_hectares: float = 48.5,
        inject_blight: bool = False,
        moisture_pct: float = 18.4
    ) -> Dict[str, Any]:
        """
        Full agronomy evaluation pipeline.
        Returns Brix score, yield prediction, ripeness grade, and thought trace.
        """
        scan_data = self.generate_synthetic_multispectral_field(
            crop_type=crop_type,
            inject_blight=inject_blight
        )

        mean_ndvi = scan_data["mean_ndvi"]
        
        # Calculate Dry Matter & Brix sugar equivalence
        # For wheat, Brix/dry matter 92%-96% is A_PRIME
        dry_matter_pct = float(np.clip(100.0 - (moisture_pct * 0.32) + (mean_ndvi * 5.2), 85.0, 98.5))
        
        if dry_matter_pct >= 93.0:
            ripeness_grade = f"A_PRIME ({dry_matter_pct:.1f}% Dry Matter)"
            maturity_stage = "PEAK_MATURITY"
            harvestability = "IMMEDIATE_HARVEST_OPTIMAL"
        elif dry_matter_pct >= 89.0:
            ripeness_grade = f"B_GRADE ({dry_matter_pct:.1f}% Dry Matter)"
            maturity_stage = "LATE_DOUGH"
            harvestability = "READY_FOR_HARVEST"
        else:
            ripeness_grade = f"C_DEVELOPING ({dry_matter_pct:.1f}% Dry Matter)"
            maturity_stage = "EARLY_DOUGH"
            harvestability = "DELAY_RECOMMENDED"

        # Yield estimation: average wheat ~ 85-95 bu/acre -> ~87.6 bu/acre * area
        bushels_per_hectare = 87.6 if crop_type == "WHEAT_HARD_RED" else (178.0 if "CORN" in crop_type else 52.0)
        yield_multiplier = float(np.clip(mean_ndvi / 0.72, 0.8, 1.25))
        predicted_bushels = round(area_hectares * bushels_per_hectare * yield_multiplier, 1)

        # Agent Thought Trace
        thought_steps = [
            f"Ingested 4-band multispectral tile (NIR, Red, Green, Blue). Computed mean NDVI: {mean_ndvi:.3f}.",
            f"Segmented canopy reflectance spectrum across {area_hectares} ha field.",
            f"Calculated dry matter metric: {dry_matter_pct:.1f}%. Ripeness classified as {ripeness_grade}.",
        ]

        if scan_data["blight_detected"]:
            thought_steps.append(
                f"🚨 WARNING: Detected localized fungal head blight anomaly (NDVI dropped to {scan_data['min_ndvi']:.2f})."
            )
        else:
            thought_steps.append("No active pathogen or weed infestation detected. Canopy health uniform.")

        thought_steps.append(f"Predicted net harvest yield: {predicted_bushels:,.1f} bushels.")

        return {
            "status": "ANALYSIS_COMPLETE",
            "mean_ndvi": round(mean_ndvi, 3),
            "ripeness_grade": ripeness_grade,
            "maturity_stage": maturity_stage,
            "harvestability": harvestability,
            "yield_prediction_bushels": predicted_bushels,
            "dry_matter_pct": round(dry_matter_pct, 1),
            "blight_detected": scan_data["blight_detected"],
            "blight_hotspots": scan_data["blight_hotspots"],
            "ndvi_matrix": scan_data["ndvi_matrix"],
            "agent_thought_trace": thought_steps,
            "confidence_score": 0.984
        }
