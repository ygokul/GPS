import network
import urequests
import utime
from machine import UART, Pin
import json

# ==================== CONFIGURATION ====================
WIFI_SSID = "Khalid_2.4ghz"
WIFI_PASS = "khalid14122002"

# Your Hostinger domain (replace with actual domain)
HOSTINGER_DOMAIN = "test.brilliantiasacademy.com"  # Change to your actual domain

# API Configuration
GPS_API_URL = f"http://{HOSTINGER_DOMAIN}/gps_api.php"  # Submission API
API_KEY = "test_gps_engine"  # Device API key from database

# GPS UART Configuration
gps_serial = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))

# ==================== WIFI CONNECTION ====================
def connect_wifi():
    """Connect to WiFi network"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        print(f"📡 Connecting to WiFi: {WIFI_SSID}")
        wlan.connect(WIFI_SSID, WIFI_PASS)
        
        # Wait for connection with timeout
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            print(".", end="")
            utime.sleep(1)
            timeout -= 1
        
        if not wlan.isconnected():
            print("\n❌ WiFi connection failed!")
            return False
    
    print(f"\n✅ WiFi Connected!")
    print(f"   IP Address: {wlan.ifconfig()[0]}")
    print(f"   Subnet Mask: {wlan.ifconfig()[1]}")
    print(f"   Gateway: {wlan.ifconfig()[2]}")
    print(f"   DNS Server: {wlan.ifconfig()[3]}")
    return True

# ==================== GPS FUNCTIONS ====================
def convert_to_decimal(raw_value, direction):
    """Convert NMEA DDMM.MMMM to Decimal Degrees (DD.DDDD)"""
    try:
        if not raw_value or '.' not in raw_value:
            return None
        
        # Find the decimal point
        dot_idx = raw_value.find('.')
        
        # Extract degrees and minutes
        degrees = float(raw_value[:dot_idx-2])
        minutes = float(raw_value[dot_idx-2:])
        
        # Calculate decimal degrees
        decimal = degrees + (minutes / 60)
        
        # Apply direction sign
        if direction in ['S', 'W']:
            decimal *= -1
        
        return round(decimal, 6)
    except Exception as e:
        print(f"⚠️ Conversion error: {e}")
        return None

def parse_gps_line(line):
    """Parse GGA sentence and extract relevant data"""
    try:
        if not line.startswith('$'):
            return None
        
        parts = line.split(',')
        
        # Check if it's a GGA sentence
        if not ('$GNGGA' in line or '$GPGGA' in line):
            return None
        
        # Check for valid fix (part[6] = fix quality, 0=no fix, 1=GPS fix, 2=DGPS fix)
        if len(parts) < 7 or parts[6] == '0' or not parts[2]:
            return {
                'status': 'no_fix',
                'satellites': parts[7] if len(parts) > 7 else '0'
            }
        
        # Convert coordinates
        lat = convert_to_decimal(parts[2], parts[3])
        lon = convert_to_decimal(parts[4], parts[5])
        
        if not lat or not lon:
            return None
        
        return {
            'status': 'fix_acquired',
            'latitude': lat,
            'longitude': lon,
            'satellites': parts[7] if len(parts) > 7 else '0',
            'hdop': parts[8] if len(parts) > 8 else None,
            'altitude': parts[9] if len(parts) > 9 else None,
            'fix_quality': parts[6]
        }
    except Exception as e:
        print(f"⚠️ Parse error: {e}")
        return None

def send_gps_data(latitude, longitude, satellites):
    """Send GPS data to the API"""
    try:
        # Prepare payload
        payload = {
            "lat": latitude,
            "lon": longitude,
            "sats": satellites
        }
        
        # Prepare headers
        headers = {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        }
        
        print(f"📤 Sending data to {GPS_API_URL}")
        print(f"   Payload: {payload}")
        print(f"   API Key: {API_KEY}")
        
        # Send POST request
        response = urequests.post(
            GPS_API_URL,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        # Process response
        status_code = response.status_code
        response_text = response.text
        
        print(f"📥 Response: HTTP {status_code}")
        
        if status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success: {data.get('message', 'Data sent')}")
                print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                print(f"   Data ID: {data.get('data_id', 'N/A')}")
            except:
                print(f"✅ Success: {response_text}")
            return True
        else:
            print(f"❌ Error: {response_text}")
            return False
        
        response.close()
        
    except Exception as e:
        print(f"⚠️ Network error: {e}")
        return False

# ==================== MAIN PROGRAM ====================
def main():
    print("\n" + "="*50)
    print("🚀 GPS TRACKER - TEST MODE")
    print("="*50)
    
    # Display configuration
    print("\n📋 CONFIGURATION:")
    print(f"   WiFi SSID: {WIFI_SSID}")
    print(f"   API URL: {GPS_API_URL}")
    print(f"   API Key: {API_KEY}")
    print(f"   Device ID: test_gps_engine")
    
    # Connect to WiFi
    print("\n🔗 NETWORK SETUP:")
    if not connect_wifi():
        print("❌ Cannot continue without WiFi connection")
        return
    
    # Main loop variables
    last_send_time = 0
    send_interval = 10  # seconds
    fix_count = 0
    send_count = 0
    
    print("\n🎯 GPS STATUS:")
    print("Waiting for GPS signal...")
    
    # Main loop
    while True:
        current_time = utime.time()
        
        # Read GPS data if available
        if gps_serial.any():
            try:
                # Read line from GPS
                raw_data = gps_serial.readline()
                gps_line = raw_data.decode('utf-8', 'ignore').strip()
                
                # Parse the GPS line
                gps_data = parse_gps_line(gps_line)
                
                if gps_data:
                    if gps_data['status'] == 'fix_acquired':
                        fix_count += 1
                        
                        # Display fix information
                        print(f"\n📍 FIX #{fix_count} ACQUIRED")
                        print(f"   Latitude: {gps_data['latitude']:.6f}")
                        print(f"   Longitude: {gps_data['longitude']:.6f}")
                        print(f"   Satellites: {gps_data['satellites']}")
                        print(f"   Altitude: {gps_data['altitude'] or 'N/A'} m")
                        print(f"   HDOP: {gps_data['hdop'] or 'N/A'}")
                        
                        # Check if it's time to send data
                        if current_time - last_send_time >= send_interval:
                            print(f"\n⏰ Sending data (every {send_interval}s)...")
                            
                            # Send data to API
                            if send_gps_data(
                                gps_data['latitude'],
                                gps_data['longitude'],
                                gps_data['satellites']
                            ):
                                send_count += 1
                                last_send_time = current_time
                                print(f"📊 Total sends: {send_count}")
                            else:
                                print("⚠️ Will retry in next interval")
                        
                        # Display next send countdown
                        time_until_next = send_interval - (current_time - last_send_time)
                        if time_until_next > 0:
                            print(f"⏳ Next send in: {time_until_next}s", end="\r")
                        
                    elif gps_data['status'] == 'no_fix':
                        print(f"🔍 Searching... Satellites: {gps_data['satellites']}", end="\r")
                
            except Exception as e:
                print(f"⚠️ GPS read error: {e}")
        
        # Small delay to prevent CPU overload
        utime.sleep(0.1)

# ==================== ENTRY POINT ====================
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Program stopped by user")
    except Exception as e:
        print(f"\n❌ Critical error: {e}")
        print("Restarting in 5 seconds...")
        utime.sleep(5)
        machine.reset()