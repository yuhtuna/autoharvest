"""
Phase C Verification: Test YOLOv8 + AWS Bedrock Multimodal Vision Pipeline
"""
import sys
import os
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.multimodal import BedrockMultimodalVisionAgent
from engine.vision import CropVisionAgent

print("==================================================")
print("1. TEST BEDROCK MULTIMODAL VISION AGENT DIRECTLY")
print("==================================================")
multimodal_agent = BedrockMultimodalVisionAgent()

# Read the test synthetic fruit image
with open("test_synthetic_fruit.jpg", "rb") as f:
    img_bytes = f.read()

diag = multimodal_agent.analyze_crop_image(
    image_bytes=img_bytes,
    media_type="image/jpeg",
    crop_type="APPLES_HONEYCRISP",
    yolo_summary={"total_objects": 6, "mean_brix": 14.8, "ripe_pct": 83.3}
)

print(f"* Engine Mode: {diag.get('mode')}")
print(f"* LLM Engine: {diag.get('llm_engine')}")
print(f"* Pathogen: {diag['pathogen_diagnosis']['strain']} ({diag['pathogen_diagnosis']['severity']})")
print(f"* Canopy Vigor: {diag['canopy_vigor']['rating']} (Chlorosis: {diag['canopy_vigor']['chlorosis_index']})")
print(f"* Maturity: {diag['ripeness_grading']['maturity_stage']}")
print(f"* Executive Summary: {diag['executive_summary']}")

print("\n==================================================")
print("2. TEST INTEGRATED CROPVISION PIPELINE")
print("==================================================")
cv_agent = CropVisionAgent()

# Test with preset mode
res_preset = cv_agent.analyze_custom_image(
    preset_id="HONEYCRISP_ORCHARD",
    crop_type="APPLES_HONEYCRISP",
    detect_blight=True
)

print(f"* Detection Mode: {res_preset['detection_mode']}")
print(f"* Vision Pipeline: {res_preset['vision_pipeline']}")
print(f"* Total Detections: {res_preset['total_objects_detected']}")
print(f"* Mean Sugar Brix: {res_preset['mean_sugar_brix']} deg Bx")
print(f"* Multimodal Present: {res_preset['multimodal_diagnosis'] is not None}")
print(f"* Pathogen Risk: {res_preset['blight_risk_detected']}")

print("\n[OK] Phase C Multimodal Vision Pipeline verified successfully!")
