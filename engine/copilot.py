"""
AgriCopilot Multi-Agent Natural Language Assistant Engine

Supports two backends:
1. AWS Bedrock (Claude / Nova) — real LLM reasoning when credentials are configured
2. Template fallback — deterministic keyword-matched responses (no AWS needed)
"""
from typing import Dict, Any, List, Optional
import re
import json
import os

# Lazy-loaded Bedrock client
_bedrock_client = None
_bedrock_available = None  # None = not checked yet, True/False after check


def _check_bedrock():
    """Try to initialize Bedrock runtime client. Returns (client, True) or (None, False)."""
    global _bedrock_client, _bedrock_available
    if _bedrock_available is not None:
        return _bedrock_client, _bedrock_available

    try:
        from dotenv import load_dotenv
        load_dotenv()
        import boto3
        session = boto3.Session()
        creds = session.get_credentials()
        if not creds:
            _bedrock_available = False
            print("[AgriCopilot] No AWS credentials found. Using intelligent Agronomy rule fallback.")
            return None, False

        region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
        client = session.client("bedrock-runtime", region_name=region)
        _bedrock_client = client
        _bedrock_available = True
        print(f"[AgriCopilot] AWS Bedrock client initialized (region: {region})")
        return _bedrock_client, True
    except Exception as e:
        _bedrock_available = False
        print(f"[AgriCopilot] Bedrock unavailable ({type(e).__name__}: {e}), using template fallback")
        return None, False


# Model preference order (includes cross-region inference profiles)
BEDROCK_MODELS = [
    "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
    "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "us.anthropic.claude-3-haiku-20240307-v1:0",
    "anthropic.claude-3-haiku-20240307-v1:0",
    "amazon.nova-pro-v1:0",
    "amazon.nova-lite-v1:0",
]



class AgriCopilotAgent:
    """
    AgriCopilot provides natural language dialogue for operators and judges,
    synthesizing telemetry, agronomy, kinematics, and market futures.

    Backend: AWS Bedrock Claude (real LLM) with template fallback.
    """

    def __init__(self):
        self.version = "2.0.0-bedrock"
        self._bedrock_model_id = None  # Set on first successful call


    def ask(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes operator queries. Tries AWS Bedrock Claude first,
        falls back to deterministic templates if Bedrock is unavailable.
        """
        # Try Bedrock LLM first
        client, available = _check_bedrock()
        if available and client:
            try:
                result = self._ask_bedrock(client, query, context)
                if result:
                    return result
            except Exception as e:
                print(f"[AgriCopilot] Bedrock call failed: {e}")

        # Fallback to template responses
        return self._ask_template(query, context)

    def _ask_bedrock(self, client, query: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Call AWS Bedrock Claude/Nova with real LLM reasoning."""
        # Build context summary for the system prompt
        crop_type = context.get("crop_type", "WHEAT_HARD_RED")
        ctx_lines = []
        if context.get("speed_kmh"):
            ctx_lines.append(f"Harvester speed: {context['speed_kmh']} km/h")
        if context.get("cut_progress_pct"):
            ctx_lines.append(f"Field progress: {context['cut_progress_pct']:.1f}%")
        if context.get("yield_prediction_bushels"):
            ctx_lines.append(f"Predicted yield: {context['yield_prediction_bushels']:,.0f} bushels")
        if context.get("soil_moisture_pct"):
            ctx_lines.append(f"Soil moisture: {context['soil_moisture_pct']}%")
        if context.get("e_stop_active"):
            ctx_lines.append("WARNING: Emergency stop is currently ACTIVE")
        if context.get("active_scenario"):
            ctx_lines.append(f"Active scenario: {context['active_scenario']}")
        if context.get("mean_sugar_brix"):
            ctx_lines.append(f"CropVision scan: Mean sugar Brix = {context['mean_sugar_brix']} deg Bx")
        if context.get("ripe_pct"):
            ctx_lines.append(f"Ripeness ratio: {context['ripe_pct']}% of detected fruits are ripe")
        if context.get("scan_summary"):
            ctx_lines.append(f"Latest scan: {context['scan_summary']}")

        context_block = "\n".join(ctx_lines) if ctx_lines else "No live telemetry available."

        system_prompt = f"""You are AgriCopilot, an expert AI agronomy and precision farming assistant built on the AutoHarvest platform.
You help farmers and operators make real-time decisions about harvesting, crop health, market timing, and fleet operations.

You have access to 5 specialized domain agents:
1. CropVision Agronomy Agent - Multispectral NDVI analysis, sugar Brix ripeness grading, disease detection
2. Kinematics & Path Agent - Dubins curve path planning, fuel optimization, swath coverage
3. Soil & Climate Telemetry Agent - Weather nowcasts, soil moisture, compaction risk
4. Market & Logistics Agent - CBOT commodity futures, silo routing, revenue optimization
5. Safety Guard Agent - ISO 25119 compliance, E-STOP hardware interlocks, obstacle detection

Current live telemetry context:
{context_block}
Crop type: {crop_type}

Guidelines:
- Be concise but technically precise
- Use real agronomy terminology (NDVI, Brix, dry matter, veraison, etc.)
- Give actionable recommendations, not just information
- Format responses with markdown (bold, bullets, headers)
- Reference specific agent names when citing data sources
- If asked about prices, do real arithmetic with the yield data provided"""

        # Try each model in preference order
        for model_id in BEDROCK_MODELS:
            try:
                if "anthropic" in model_id:
                    # Claude API format
                    body = json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 1024,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": query}
                        ]
                    })
                    response = client.invoke_model(
                        modelId=model_id,
                        body=body,
                        contentType="application/json",
                        accept="application/json"
                    )
                    result = json.loads(response["body"].read())
                    answer = result["content"][0]["text"]

                elif "amazon.nova" in model_id:
                    # Nova API format
                    body = json.dumps({
                        "inferenceConfig": {"maxTokens": 1024},
                        "system": [{"text": system_prompt}],
                        "messages": [
                            {"role": "user", "content": [{"text": query}]}
                        ]
                    })
                    response = client.invoke_model(
                        modelId=model_id,
                        body=body,
                        contentType="application/json",
                        accept="application/json"
                    )
                    result = json.loads(response["body"].read())
                    answer = result["output"]["message"]["content"][0]["text"]

                else:
                    continue

                self._bedrock_model_id = model_id
                return {
                    "query": query,
                    "response": answer,
                    "agent": "AgriCopilot (AWS Bedrock)",
                    "llm_backend": "AWS_BEDROCK",
                    "model_id": model_id,
                    "status": "ANSWERED"
                }

            except client.exceptions.ValidationException:
                # Model not available in this region, try next
                continue
            except Exception as e:
                print(f"[AgriCopilot] Model {model_id} failed: {e}")
                continue

        return None  # All models failed

    def _ask_template(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic keyword-matched template responses (fallback when no LLM available)."""
        q = query.lower().strip()
        crop_type = context.get("crop_type", "WHEAT_HARD_RED")
        speed = context.get("speed_kmh", 6.8)
        is_orchard = "APPLE" in crop_type or "GRAPE" in crop_type or context.get("is_orchard", False)
        e_stop = context.get("e_stop_active", False)
        progress = context.get("cut_progress_pct", 0.0)
        yield_val = context.get("yield_prediction_bushels", 4324.4)
        moisture = context.get("soil_moisture_pct", 18.4)
        active_scenario = context.get("active_scenario", "NORMAL_HARVEST")

        # 1. Why slowing down / Speed queries
        if any(w in q for w in ["slow", "speed", "fast", "pace", "decelerate"]):
            if e_stop:
                answer = (
                    "**Vehicle is at 0.0 km/h due to Emergency Brake (E-STOP).**\n\n"
                    "* **Reason**: Thermal IR camera detected an obstacle within the 15m safety perimeter.\n"
                    "* **Action**: Clear obstacle or click **Reset** on the control dock to resume."
                )
            elif "turn" in q or "headland" in q or speed < 4.0:
                answer = (
                    f"**Kinematics Agent adjusted operating speed to {speed} km/h.**\n\n"
                    "* **Reason**: Harvester is navigating a **Dubins Headland Turn Arc** between swaths.\n"
                    "* **Action**: Cutter header is raised by +20cm to eliminate soil gouging and reduce tyre slip by 32%."
                )
            else:
                answer = (
                    f"**Harvester is cruising at optimal speed: {speed} km/h.**\n\n"
                    "* **Kinematics Target**: 6.8 km/h nominal for clean cutter bar throughput without header crop loss.\n"
                    "* **Ground clearance**: 15 cm with 2,150 Engine CAN RPM."
                )

        # 2. Storm / Weather queries
        elif any(w in q for w in ["storm", "weather", "rain", "eta", "wind"]):
            if active_scenario == "STORM_INCOMING":
                answer = (
                    "**CRITICAL SQUALL NOWCAST DETECTED (NOAA Radar):**\n\n"
                    "* **Squall Line ETA**: 4.5 hours.\n"
                    "* **Soil compaction risk**: High if rainfall exceeds 12mm.\n"
                    "* **AgriCopilot Strategy**: Swath velocity boosted to 2x speed. Grain cart rendezvous priority set to urgent."
                )
            else:
                answer = (
                    "**Soil & Climate Agent Forecast: Optimal Harvest Window**\n\n"
                    f"* **Soil Moisture**: {moisture:.1f}% (Trafficability: Excellent).\n"
                    "* **Precipitation Probability**: 15% across next 36 hours.\n"
                    "* **Recommendation**: Proceed with scheduled autonomous swaths."
                )

        # 3. Market / Profit / Price calculation
        elif any(w in q for w in ["profit", "price", "market", "revenue", "dollar", "money", "cbot", "cost"]):
            price_match = re.search(r"\$?(\d+(\.\d+)?)", q)
            if price_match and float(price_match.group(1)) > 1.0:
                custom_price = float(price_match.group(1))
                new_gross = yield_val * custom_price
                answer = (
                    f"**What-If Market Arbitrage Calculation (at ${custom_price:.2f}/bu):**\n\n"
                    f"* **Yield**: {yield_val:,.1f} bushels\n"
                    f"* **Projected Gross Revenue**: **${new_gross:,.2f}**\n"
                    f"* **Fuel Optimization Savings**: +$95.23 (32% Dubins curve efficiency)\n"
                    f"* **Moisture Drying Deduction**: -$420.00 (at 18.4% moisture)\n"
                    f"* **Net Payout**: **${(new_gross + 95.23 - 420.00):,.2f}**"
                )
            else:
                answer = (
                    "**Market Arbitrage Agent Financial Summary:**\n\n"
                    "* **Spot Commodity Price**: $6.42 / bu (CBOT Wheat Futures)\n"
                    f"* **Net Projected Revenue**: **$27,710.50**\n"
                    "* **Autonomous Fuel Saved**: +$95.23 (32% reduction)\n"
                    "* **Optimal Destination**: *Platte Valley Grain Terminal* (Silo Queue: Optimal)."
                )

        # 4. Carbon Credits / ESG queries
        elif any(w in q for w in ["carbon", "credit", "esg", "diesel", "fuel", "co2", "emission"]):
            answer = (
                "**ESG Agronomy & Carbon Offset Certification:**\n\n"
                "* **Diesel Fuel Saved**: 42.8 Liters (via Dubins turn curvature smoothing)\n"
                "* **Carbon Emissions Prevented**: **114.6 kg CO2e** sequestered/offset\n"
                "* **Carbon Credit Tokens Generated**: 1.15 Ag-Credits ($28.75 asset value)\n"
                "* **Compliance Standard**: ISO 14064-2 verified precision robotics."
            )

        # 5. Ripeness / Sugar Brix / Fruit / Scan queries
        elif any(w in q for w in ["scan", "brix", "ripe", "sugar", "fruit", "apple", "grape", "orange", "citrus", "blight", "disease", "fungal", "pathogen", "pick"]):
            if any(w in q for w in ["blight", "disease", "fungal", "pathogen"]):
                answer = (
                    "**CropVision Agronomy Pathogen Diagnostic:**\n\n"
                    "* **Identified Strain**: *Venturia Inaequalis (Apple Scab / Early Blight)*\n"
                    "* **Affected Area**: 2.4% localized canopy area (Sector B)\n"
                    "* **Recommended Action**: Prioritize harvesting ripe clusters immediately. Apply organic bio-fungicide within 48 hours to prevent spore transmission to adjacent tree rows."
                )
            elif is_orchard or any(w in q for w in ["apple", "grape", "orange", "citrus"]):
                brix_val = context.get("mean_sugar_brix", 14.8)
                ripe_val = context.get("ripe_pct", 89.5)
                answer = (
                    f"**CropVision Optical Ripeness & Harvest Directive:**\n\n"
                    f"* **Mean Sugar Brix**: **{brix_val} deg Bx** (Grade: Peak Dessert Sugar)\n"
                    f"* **Maturity Ratio**: **{ripe_val}% of detected fruits** are at optimal maturity.\n"
                    "* **Harvest Strategy**: **DISPATCH ROBOTIC PICKING CREW**.\n"
                    "* **Autonomous Routing**: Delta arms target high-Brix clusters first, leaving green developing fruits for a secondary pass in 5 days."
                )
            else:
                answer = (
                    "**CropVision Multispectral Agronomy Analysis:**\n\n"
                    "* **Mean NDVI**: 0.733 (Vegetation vigor: High)\n"
                    "* **Dry Matter Grade**: **A-PRIME (97.9% Dry Matter)**\n"
                    "* **Fungal Blight Status**: 0 hotspots detected in nominal swaths."
                )

        # 6. Swarm / Grain Cart queries
        elif any(w in q for w in ["cart", "swarm", "unload", "tractor", "chaser"]):
            answer = (
                "**Multi-Vehicle Swarm Coordination (Autonomous Chaser Bin):**\n\n"
                "* **Support Unit**: `GRAIN_CART_01` (Autonomous John Deere 8R)\n"
                "* **Trigger Threshold**: Dispatches when combine hopper reaches 65% capacity\n"
                "* **Operation**: Synchronized speed match (6.8 km/h) for **Unload On-The-Go** without stopping harvesting."
            )

        # Default Intelligent Summary
        else:
            answer = (
                f"**AutoHarvest Multi-Agent Fleet Status:**\n\n"
                f"* **Current Parcel**: {crop_type.replace('_', ' ').title()} ({progress:.1f}% complete)\n"
                f"* **Velocity & Guidance**: {speed} km/h on RTK-GPS (14mm drift)\n"
                f"* **5 Domain Agents**: All agents nominal and communicating at 15Hz.\n"
                "* *Tip: Ask me about speed, storm risk, carbon credits, or market price calculations!*"
            )

        return {
            "query": query,
            "response": answer,
            "agent": "AgriCopilot (Template Fallback)",
            "llm_backend": "TEMPLATE_FALLBACK",
            "status": "ANSWERED"
        }

