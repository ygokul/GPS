import utime
from machine import UART, Pin

# ==================== CONFIGURATION ====================
gsm_serial = UART(1, baudrate=9600, tx=Pin(4), rx=Pin(5))
gps_serial = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))

APN = "internet" 
HOSTINGER_DOMAIN = "test.brilliantiasacademy.com"
# Use HTTPS if Hostinger requires it
GPS_API_URL = f"https://{HOSTINGER_DOMAIN}/gps_api.php"
API_KEY = "test_gps_engine"  # Device API key from database

# Initialize with default values
last_lat = 0.0
last_lon = 0.0
last_sats = "0"

# ==================== GSM FUNCTIONS ====================
def send_at(command, back, timeout=5000):
    gsm_serial.write(command + "\r\n")
    start_time = utime.ticks_ms()
    response = ""
    while (utime.ticks_ms() - start_time) < timeout:
        if gsm_serial.any():
            response += gsm_serial.read().decode('utf-8', 'ignore')
            if back in response:
                return response
    return None

def init_gsm():
    print("📡 Initializing GSM...")
    # Clean up any stuck sessions from a previous crash
    send_at("AT+HTTPTERM", "OK", timeout=1000)
    send_at("AT+SAPBR=0,1", "OK", timeout=1000)
    
    send_at("AT", "OK")
    
    # Check if SIM is actually registered
    # +CREG: 0,1 means registered home, 0,5 means roaming
    reg = send_at("AT+CREG?", "+CREG: 0,1")
    if not reg:
        reg = send_at("AT+CREG?", "+CREG: 0,5")
    
    if reg:
        print("📶 Network Registered")
    else:
        print("❌ Network Registration Failed")

    send_at("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK")
    send_at(f"AT+SAPBR=3,1,\"APN\",\"{APN}\"", "OK")
    
    # Open GPRS context - this often fails if power is low
    if send_at("AT+SAPBR=1,1", "OK", timeout=10000):
        print("🌐 GPRS Context Opened")
    else:
        print("❌ GPRS Failed - Check Power/Signal")
        
    send_at("AT+HTTPINIT", "OK")
    send_at("AT+HTTPSSL=1", "OK") 
    print("✅ GSM Ready")

def gsm_post_data(latitude, longitude, satellites):
    if latitude is None or longitude is None:
        return False
        
    try:
        payload = '{"lat":%s,"lon":%s,"sats":"%s"}' % (latitude, longitude, satellites)
        
        send_at("AT+HTTPPARA=\"CID\",1", "OK")
        send_at(f"AT+HTTPPARA=\"URL\",\"{GPS_API_URL}\"", "OK")
        send_at("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK")

        send_at(f"AT+HTTPPARA=\"USERDATA\",\"X-API-Key: {API_KEY}\"", "OK")

        
        # Data input
        gsm_serial.write(f"AT+HTTPDATA={len(payload)},5000\r\n")
        utime.sleep(0.5)
        gsm_serial.write(payload)
        
        # Execute POST
        res = send_at("AT+HTTPACTION=1", "+HTTPACTION:", timeout=20000)
        
        if res:
            print(f"📥 Response: {res.strip()}")
            if ",200," in res:
                print("✅ Data stored successfully!")
                return True
        return False
    except Exception as e:
        print(f"⚠️ GSM Error: {e}")
        return False

# ==================== GPS FUNCTIONS ====================
def convert_to_decimal(raw_value, direction):
    try:
        if not raw_value or '.' not in raw_value: return None
        dot_idx = raw_value.find('.')
        degrees = float(raw_value[:dot_idx-2])
        minutes = float(raw_value[dot_idx-2:])
        decimal = degrees + (minutes / 60)
        if direction in ['S', 'W']: decimal *= -1
        return round(decimal, 6)
    except: return None

# ==================== MAIN LOOP ====================
init_gsm()
# Initialize last_send_time to a very old time so it sends the first fix immediately
last_send_time = utime.time() - 120 

while True:
    if gps_serial.any():
        try:
            line = gps_serial.readline().decode('utf-8', 'ignore').strip()
            
            if '$GNGGA' in line or '$GPGGA' in line:
                parts = line.split(',')
                # Index 6 is fix quality, Index 2 is Latitude
                if len(parts) > 7 and parts[6] != '0' and parts[2] != '':
                    
                    current_lat = convert_to_decimal(parts[2], parts[3])
                    current_lon = convert_to_decimal(parts[4], parts[5])
                    
                    if current_lat and current_lon:
                        last_lat = current_lat
                        last_lon = current_lon
                        last_sats = parts[7]
                        
                        # CHANGE: Updated from 20 to 120 (2 minutes)
                        if utime.time() - last_send_time >= 120:
                            print(f"\n📍 Sending Fix (2-min interval): {last_lat}, {last_lon}")
                            success = gsm_post_data(last_lat, last_lon, last_sats)
                            
                            # Only update timer if the send attempt happened
                            last_send_time = utime.time()
                        else:
                            # Display countdown for your reference
                            remaining = 120 - (utime.time() - last_send_time)
                            print(f"✅ Fix OK. Next send in {remaining}s  ", end="\r")
                else:
                    sats = parts[7] if len(parts) > 7 else "0"
                    print(f"🔍 Searching for satellites... Sats: {sats}", end="\r")
        except Exception as e:
            pass
    utime.sleep(0.1)