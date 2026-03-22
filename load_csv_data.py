#!/usr/bin/env python3
"""
GPS CSV Data Loader
Loads device and GPS tracking data from CSV file into MySQL database
Supports local and Render cloud database connections
"""

import csv
import mysql.connector
from datetime import datetime
from pathlib import Path
import os

# Database Configuration - Check environment variables first (for Render)
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'u187878636_gps'),
    'password': os.getenv('MYSQL_PASSWORD', 'Abdulkalam@01'),
    'database': os.getenv('MYSQL_DATABASE', 'u187878636_gps'),
    'port': int(os.getenv('MYSQL_PORT', 3306))
}

CSV_FILE = Path(__file__).parent / 'u187878636_gps.csv'

def parse_csv():
    """Parse CSV file and return devices and gps_data"""
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
                    'device_id': values[3],
                    'device_name': values[2],
                    'user_id': int(values[1]),
                    'is_active': int(values[5])
                })
            except (ValueError, IndexError):
                pass
        
        elif gps_section and len(values) >= 7:
            try:
                gps_data.append({
                    'device_id': values[2],
                    'user_id': int(values[2]),
                    'latitude': float(values[3]),
                    'longitude': float(values[4]),
                    'satellites': int(values[5]),
                    'recorded_at': values[6]
                })
            except (ValueError, IndexError):
                pass
    
    return devices, gps_data

def load_data():
    """Load CSV data into database"""
    
    if not CSV_FILE.exists():
        print(f"❌ CSV file not found: {CSV_FILE}")
        return
    
    print(f"📂 Reading CSV from: {CSV_FILE}")
    print(f"🔗 Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    # Parse CSV
    devices, gps_data = parse_csv()
    print(f"✅ Parsed {len(devices)} device(s) and {len(gps_data)} GPS point(s)")
    
    try:
        # Connect to database
        # Use SSL for Render cloud (if available)
        conn_params = DB_CONFIG.copy()
        if DB_CONFIG['host'] != 'localhost':
            conn_params['ssl_disabled'] = False
            conn_params['auth_plugin'] = 'mysql_native_password'
        
        conn = mysql.connector.connect(**conn_params)
        cursor = conn.cursor()
        print("✅ Connected to database")
        
        # Load Devices
        if devices:
            print(f"\n📱 Loading {len(devices)} device(s)...")
            for device in devices:
                # Check if device exists
                check_sql = "SELECT id FROM devices WHERE device_id = %s"
                cursor.execute(check_sql, (device['device_id'],))
                existing = cursor.fetchone()
                
                if existing:
                    print(f"  ⚠️  Device '{device['device_name']}' (ID: {device['device_id']}) already exists, skipping")
                else:
                    insert_sql = """
                    INSERT INTO devices (user_id, device_name, device_id, is_active)
                    VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(insert_sql, (
                        device['user_id'],
                        device['device_name'],
                        device['device_id'],
                        device['is_active']
                    ))
                    print(f"  ✅ Inserted device: {device['device_name']} (ID: {device['device_id']})")
        
        conn.commit()
        
        # Get device ID mapping
        cursor.execute("SELECT id, device_id FROM devices")
        device_map = {row[1]: row[0] for row in cursor.fetchall()}
        
        # Load GPS Data
        if gps_data:
            print(f"\n📍 Loading {len(gps_data)} GPS point(s)...")
            
            inserted_count = 0
            skipped_count = 0
            
            for point in gps_data:
                device_id_int = device_map.get(point['device_id'])
                
                if not device_id_int:
                    print(f"  ⚠️  Device ID '{point['device_id']}' not found, skipping point")
                    skipped_count += 1
                    continue
                
                # Check if point already exists (prevent duplicates)
                check_sql = """
                SELECT id FROM gps_data 
                WHERE device_id = %s AND latitude = %s AND longitude = %s AND recorded_at = %s
                """
                cursor.execute(check_sql, (
                    device_id_int,
                    point['latitude'],
                    point['longitude'],
                    point['recorded_at']
                ))
                
                if cursor.fetchone():
                    skipped_count += 1
                    continue
                
                # Insert GPS point
                insert_sql = """
                INSERT INTO gps_data (device_id, user_id, latitude, longitude, satellites, recorded_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_sql, (
                    device_id_int,
                    point['user_id'],
                    point['latitude'],
                    point['longitude'],
                    point['satellites'],
                    point['recorded_at']
                ))
                inserted_count += 1
            
            conn.commit()
            print(f"  ✅ Inserted {inserted_count} GPS point(s)")
            if skipped_count > 0:
                print(f"  ⚠️  Skipped {skipped_count} duplicate/invalid point(s)")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM devices")
        total_devices = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM gps_data")
        total_points = cursor.fetchone()[0]
        
        print(f"\n📊 Database Summary:")
        print(f"  Total Devices: {total_devices}")
        print(f"  Total GPS Points: {total_points}")
        
        cursor.close()
        conn.close()
        print(f"\n✅ Data loading completed successfully!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return False
    except Exception as err:
        print(f"❌ Error: {err}")
        return False
    
    return True

if __name__ == "__main__":
    load_data()
