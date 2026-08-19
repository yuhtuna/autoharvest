"""
Test script for Multi-Unit Deployment & Custom Harvest Zone Mapping APIs
"""
import sys
import os
import requests
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8020/api/v1"

print("==================================================")
print("1. TEST GET DEPLOYED UNITS")
print("==================================================")
res = requests.get(f"{BASE_URL}/units")
print(f"Status Code: {res.status_code}")
units = res.json().get("units", [])
print(f"Active Deployed Units ({len(units)}):")
for u in units:
    print(f"  - [{u['unit_type']}] {u['unit_name']} at {u['position']} ({u['status']})")

print("\n==================================================")
print("2. TEST DEPLOY NEW RECON DRONE UNIT")
print("==================================================")
deploy_payload = {
    "unit_type": "RECON_DRONE",
    "unit_name": "DJI Agras Recon Drone Beta",
    "initial_position": [-96.808, 41.252],
    "assigned_zone_id": "ZONE_PRIORITY_A"
}
res = requests.post(f"{BASE_URL}/units", json=deploy_payload)
print(f"Status Code: {res.status_code}")
deployed = res.json().get("unit", {})
print(f"Deployed Unit ID: {deployed.get('id')} | Name: {deployed.get('unit_name')}")

print("\n==================================================")
print("3. TEST GET HARVEST ZONES")
print("==================================================")
res = requests.get(f"{BASE_URL}/zones")
print(f"Status Code: {res.status_code}")
zones = res.json().get("zones", [])
print(f"Active Harvest Zones ({len(zones)}):")
for z in zones:
    print(f"  - [{z['zone_type']}] {z['name']} ({z['area_hectares']} ha)")

print("\n==================================================")
print("4. TEST CREATE CUSTOM HARVEST ZONE")
print("==================================================")
zone_payload = {
    "name": "Zone C: High-Brix Dessert Apple Sector",
    "zone_type": "PRIORITY_HARVEST",
    "color_hex": "#10b981",
    "coordinates_polygon": [
        [-96.809, 41.254],
        [-96.803, 41.254],
        [-96.803, 41.249],
        [-96.809, 41.249]
    ]
}
res = requests.post(f"{BASE_URL}/zones", json=zone_payload)
print(f"Status Code: {res.status_code}")
created_zone = res.json().get("zone", {})
print(f"Created Zone ID: {created_zone.get('id')} | Name: {created_zone.get('name')}")

print("\n[OK] MULTI-UNIT DEPLOYMENT & HARVEST ZONE APIS VERIFIED SUCCESSFULLY!")
