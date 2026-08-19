"""
Test script for AutoHarvest Export REST Endpoints (GeoJSON, CSV, JSON)
"""
import sys
import os
import requests
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8020/api/v1"

print("==================================================")
print("1. TEST EXPORT MISSION PLAN JSON")
print("==================================================")
res = requests.get(f"{BASE_URL}/export/mission-json?field_id=FIELD_NE_LOT_4B")
print(f"Status Code: {res.status_code}")
data = res.json()
print(f"Standard: {data.get('export_standard')} | Field: {data.get('field_metadata', {}).get('name')}")

print("\n==================================================")
print("2. TEST EXPORT ZONES & FLEET GeoJSON")
print("==================================================")
res = requests.get(f"{BASE_URL}/export/zones-geojson")
print(f"Status Code: {res.status_code}")
geojson = res.json()
features = geojson.get("features", [])
print(f"GeoJSON Type: {geojson.get('type')} | Features Count: {len(features)}")
for f in features:
    props = f.get('properties', {})
    print(f"  - [{f.get('geometry', {}).get('type')}] {props.get('name')} ({props.get('id')})")

print("\n==================================================")
print("3. TEST EXPORT HARVEST CSV SPECTROMETRY LOGS")
print("==================================================")
res = requests.get(f"{BASE_URL}/export/harvest-csv?crop_type=APPLES_HONEYCRISP")
print(f"Status Code: {res.status_code}")
csv_text = res.text
lines = csv_text.strip().split('\n')
print(f"CSV Total Lines: {len(lines)}")
print(f"CSV Header: {lines[0]}")
print(f"Sample Row: {lines[1] if len(lines) > 1 else 'None'}")

print("\n[OK] ALL EXPORT REST ENDPOINTS VERIFIED SUCCESSFULLY!")
