<?php
// api.php - GPS API using JSON files (no database needed)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Data directory
$data_dir = __DIR__ . '/data';

// Helper: Load JSON file
function load_json($filename) {
    global $data_dir;
    $file = $data_dir . '/' . $filename;
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

// Helper: Save JSON file
function save_json($filename, $data) {
    global $data_dir;
    if (!is_dir($data_dir)) {
        mkdir($data_dir, 0755, true);
    }
    $file = $data_dir . '/' . $filename;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Helper: Get Bearer Token or X-API-Key
function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($headers['X-API-Key'])) return $headers['X-API-Key'];
    return isset($_GET['key']) ? $_GET['key'] : null;
}

// === POST REQUEST: DATA SUBMISSION (PICO W) ===
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $api_key = getAuthToken();
    
    if (!$api_key) {
        http_response_code(401);
        echo json_encode(['error' => 'API Key required']);
        exit();
    }

    // Load devices
    $devices = load_json('devices.json');
    $device_found = false;
    $device_id = null;
    $user_id = null;

    foreach ($devices as $device) {
        if ($device['device_id'] === $api_key && $device['is_active']) {
            $device_found = true;
            $device_id = $device['id'];
            $user_id = $device['user_id'];
            break;
        }
    }

    if (!$device_found) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid Device ID']);
        exit();
    }

    // Parse Input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['lat']) || !isset($input['lon'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing lat/lon']);
        exit();
    }

    $lat = floatval($input['lat']);
    $lon = floatval($input['lon']);
    $sats = isset($input['sats']) ? intval($input['sats']) : 0;

    // Load GPS data
    $gps_data = load_json('gps_data.json');
    
    // Find max ID
    $max_id = 0;
    foreach ($gps_data as $point) {
        if ($point['id'] > $max_id) $max_id = $point['id'];
    }

    // Add new point
    $new_point = [
        'id' => $max_id + 1,
        'device_id' => strval($device_id),
        'user_id' => $user_id,
        'latitude' => $lat,
        'longitude' => $lon,
        'satellites' => $sats,
        'recorded_at' => date('Y-m-d H:i:s')
    ];

    $gps_data[] = $new_point;
    save_json('gps_data.json', $gps_data);

    echo json_encode(['success' => true, 'id' => $new_point['id']]);
    exit();
}

// === GET REQUESTS: REACT APP DATA ===
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // 1. GET DEVICES
    if ($action === 'devices') {
        $devices = load_json('devices.json');
        $gps_data = load_json('gps_data.json');
        
        $data = [];
        foreach ($devices as $device) {
            // Find last connection
            $last_connect = date('Y-m-d H:i:s');
            foreach (array_reverse($gps_data) as $point) {
                if ($point['device_id'] == $device['id']) {
                    $last_connect = $point['recorded_at'];
                    break;
                }
            }
            
            $data[] = [
                'id' => $device['device_id'],
                'name' => $device['device_name'],
                'status' => $device['is_active'] ? 'online' : 'offline',
                'lastConnect' => $last_connect
            ];
        }
        echo json_encode(['data' => $data]);
        exit();
    }

    // 2. GET LIVE POSITIONS (Latest point for each device)
    if ($action === 'live') {
        $gps_data = load_json('gps_data.json');
        $devices = load_json('devices.json');
        
        // Create device map: device_id string => id
        $device_map = [];
        foreach ($devices as $device) {
            $device_map[$device['device_id']] = $device['id'];
        }
        
        // Get latest for each device
        $latest = [];
        foreach ($gps_data as $point) {
            $dev_id = $point['device_id'];  // This is now the device_id string like "test_gps_engine"
            if (!isset($latest[$dev_id]) || strtotime($point['recorded_at']) > strtotime($latest[$dev_id]['recorded_at'])) {
                $latest[$dev_id] = $point;
            }
        }
        
        $data = [];
        foreach ($latest as $dev_id => $point) {
            $data[] = [
                'lat' => floatval($point['latitude']),
                'lng' => floatval($point['longitude']),
                'timestamp' => $point['recorded_at'],
                'satellites' => intval($point['satellites']),
                'deviceId' => $dev_id  // Use device_id string for matching
            ];
        }
        echo json_encode(['data' => $data]);
        exit();
    }

    // 3. GET HISTORY
    if ($action === 'history') {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        $gps_data = load_json('gps_data.json');
        
        // Filter by date if provided
        $filtered = $gps_data;
        if (isset($_GET['date']) && !empty($_GET['date'])) {
            $search_date = $_GET['date'];
            $filtered = array_filter($filtered, function($point) use ($search_date) {
                return strpos($point['recorded_at'], $search_date) === 0;
            });
        }
        
        // Filter by device if provided - match against device_id string
        if (isset($_GET['device_id']) && !empty($_GET['device_id'])) {
            $search_device = $_GET['device_id'];
            $filtered = array_filter($filtered, function($point) use ($search_device) {
                return $point['device_id'] === $search_device;
            });
        }
        
        // Sort descending by recorded_at
        usort($filtered, function($a, $b) {
            return strtotime($b['recorded_at']) - strtotime($a['recorded_at']);
        });
        
        // Apply pagination
        $data = array_slice($filtered, $offset, $limit);
        
        $formatted = [];
        foreach ($data as $point) {
            $formatted[] = [
                'lat' => floatval($point['latitude']),
                'lng' => floatval($point['longitude']),
                'satellites' => intval($point['satellites']),
                'timestamp' => $point['recorded_at'],
                'deviceId' => $point['device_id']
            ];
        }
        
        echo json_encode(['data' => $formatted]);
        exit();
    }

    // 4. GET STATS
    if ($action === 'stats') {
        $devices = load_json('devices.json');
        $gps_data = load_json('gps_data.json');
        
        $total_devices = count($devices);
        $total_points = count($gps_data);
        
        // Count today's points
        $today = date('Y-m-d');
        $today_points = 0;
        foreach ($gps_data as $point) {
            if (strpos($point['recorded_at'], $today) === 0) {
                $today_points++;
            }
        }
        
        // Count online devices (updated in last 10 minutes)
        $ten_min_ago = strtotime('-10 minutes');
        $online_devices = 0;
        $checked_devices = [];
        foreach (array_reverse($gps_data) as $point) {
            $dev_id = $point['device_id'];
            if (!in_array($dev_id, $checked_devices)) {
                if (strtotime($point['recorded_at']) > $ten_min_ago) {
                    $online_devices++;
                }
                $checked_devices[] = $dev_id;
            }
        }
        
        echo json_encode(['data' => [
            'totalDevices' => $total_devices,
            'onlineDevices' => $online_devices,
            'todayPoints' => $today_points,
            'totalPoints' => $total_points
        ]]);
        exit();
    }
}

// Default response
http_response_code(404);
echo json_encode(['error' => 'Not Found']);
?>
