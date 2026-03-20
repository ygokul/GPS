<?php
// api.php - UNIFIED GPS API (GET & POST)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle CORS flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database config
$db_host = 'localhost';
$db_name = 'u187878636_gps';
$db_user = 'u187878636_gps';
$db_pass = 'Abdulkalam@01';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
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
    $api_key = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : null;
    // ... (Use getAuthToken() or specific header if strictly cleaner)
    // For submission, we act like the previous script
    if (!$api_key) $api_key = getAuthToken();

    if (!$api_key) {
        http_response_code(401); echo json_encode(['error' => 'API Key required']); exit();
    }

    // Validate Device
    $stmt = $conn->prepare("SELECT id, user_id FROM devices WHERE device_id = ? AND is_active = 1");
    $stmt->bind_param("s", $api_key);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        http_response_code(401); echo json_encode(['error' => 'Invalid Device ID']); exit();
    }
    $device = $res->fetch_assoc();
    $stmt->close();

    // Parse Input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['lat']) || !isset($input['lon'])) {
        http_response_code(400); echo json_encode(['error' => 'Missing lat/lon']); exit();
    }

    $lat = floatval($input['lat']);
    $lon = floatval($input['lon']);
    $sats = isset($input['sats']) ? intval($input['sats']) : 0;

    $stmt2 = $conn->prepare("INSERT INTO gps_data (device_id, user_id, latitude, longitude, satellites, recorded_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt2->bind_param("iiddi", $device['id'], $device['user_id'], $lat, $lon, $sats);
    
    if ($stmt2->execute()) {
        echo json_encode(['success' => true, 'id' => $stmt2->insert_id]);
    } else {
        http_response_code(500); echo json_encode(['error' => $stmt2->error]);
    }
    $stmt2->close();
    exit();
}

// === GET REQUESTS: REACT APP DATA ===
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // 1. GET DEVICES
    if ($action === 'devices') {
        $sql = "SELECT d.device_id as id, d.device_name as name, 
                CASE WHEN d.is_active = 1 THEN 'online' ELSE 'offline' END as status, 
                MAX(g.recorded_at) as lastConnect
                FROM devices d
                LEFT JOIN gps_data g ON d.id = g.device_id
                GROUP BY d.id";
        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            // Handle null lastConnect
            if (!$row['lastConnect']) $row['lastConnect'] = date('Y-m-d H:i:s'); 
            $data[] = $row;
        }
        echo json_encode(['data' => $data]);
        exit();
    }

    // 2. GET LIVE POSITIONS (Latest point for each device)
    if ($action === 'live') {
        // Get latest record for each device
        $sql = "SELECT g.latitude as lat, g.longitude as lng, g.recorded_at as timestamp, 
                       g.satellites, d.device_id as deviceId
                FROM gps_data g
                JOIN devices d ON g.device_id = d.id
                WHERE g.id IN (SELECT MAX(id) FROM gps_data GROUP BY device_id)";
        
        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['data' => $data]);
        exit();
    }

    // 3. GET HISTORY
    if ($action === 'history') {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        $whereClauses = ["1=1"];
        $params = [];
        $types = "";

        if (isset($_GET['date']) && !empty($_GET['date'])) {
            $whereClauses[] = "DATE(g.recorded_at) = ?";
            $params[] = $_GET['date'];
            $types .= "s";
        }

        if (isset($_GET['device_id']) && !empty($_GET['device_id'])) {
            $whereClauses[] = "d.device_id = ?";
            $params[] = $_GET['device_id'];
            $types .= "s";
        }

        $whereSql = implode(" AND ", $whereClauses);

        $sql = "SELECT g.latitude as lat, g.longitude as lng, g.satellites,
                       g.recorded_at as timestamp, d.device_id as deviceId
                FROM gps_data g
                JOIN devices d ON g.device_id = d.id
                WHERE $whereSql
                ORDER BY g.recorded_at DESC LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $res = $stmt->get_result();
        
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['data' => $data]);
        exit();
    }

    // 4. GET STATS
    if ($action === 'stats') {
        // Simple counts
        $totalDev = $conn->query("SELECT COUNT(*) as c FROM devices")->fetch_assoc()['c'];
        $onlineDev = $conn->query("SELECT COUNT(DISTINCT device_id) as c FROM gps_data WHERE recorded_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)")->fetch_assoc()['c'];
        $todayPts = $conn->query("SELECT COUNT(*) as c FROM gps_data WHERE DATE(recorded_at) = CURDATE()")->fetch_assoc()['c'];
        $totalPts = $conn->query("SELECT COUNT(*) as c FROM gps_data")->fetch_assoc()['c'];

        echo json_encode(['data' => [
            'totalDevices' => intval($totalDev),
            'onlineDevices' => intval($onlineDev),
            'todayPoints' => intval($todayPts),
            'totalPoints' => intval($totalPts)
        ]]);
        exit();
    }
}

$conn->close();
?>
