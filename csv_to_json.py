#!/usr/bin/env python3
"""
Convert CSV to JSON for code-level storage (no database needed)
"""

from pathlib import Path
import json

CSV_FILE = Path(__file__).parent / 'u187878636_gps.csv'

def parse_csv_to_json():
    """Parse CSV and convert to JSON files"""
    devices = []
    gps_data = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    devices_section = False
    gps_section = False
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('"id","user_id","device_name"'):
            devices_section = True
            gps_section = False
            continue
        elif line.startswith('"id","device_id","user_id","latitude"'):
            devices_section = False
            gps_section = True
            continue
        
        if not line or line.startswith('"id"'):
            continue
        
        # Parse CSV values
        values = [v.strip('"') for v in line.split(',')]
        
        if devices_section and len(values) >= 6:
            try:
                devices.append({
                    "id": int(values[0]),
                    "user_id": int(values[1]),
                    "device_name": values[2],
                    "device_id": values[3],
                    "created_at": values[4],
                    "is_active": bool(int(values[5]))
                })
            except (ValueError, IndexError):
                pass
        
        elif gps_section and len(values) >= 7:
            try:
                gps_data.append({
                    "id": int(values[0]),
                    "device_id": values[1],
                    "user_id": int(values[2]),
                    "latitude": float(values[3]),
                    "longitude": float(values[4]),
                    "satellites": int(values[5]),
                    "recorded_at": values[6]
                })
            except (ValueError, IndexError):
                pass
    
    # Save as JSON
    devices_json = Path(__file__).parent / 'php server' / 'data' / 'devices.json'
    gps_json = Path(__file__).parent / 'php server' / 'data' / 'gps_data.json'
    
    # Create data directory if needed
    devices_json.parent.mkdir(parents=True, exist_ok=True)
    
    with open(devices_json, 'w') as f:
        json.dump(devices, f, indent=2)
    
    with open(gps_json, 'w') as f:
        json.dump(gps_data, f, indent=2)
    
    print(f"✅ Saved {len(devices)} device(s) to: {devices_json}")
    print(f"✅ Saved {len(gps_data)} GPS point(s) to: {gps_json}")
    print(f"\n📊 Data Summary:")
    print(f"   Devices: {len(devices)}")
    print(f"   GPS Points: {len(gps_data)}")

if __name__ == "__main__":
    parse_csv_to_json()
