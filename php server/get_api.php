<?php
// gps_api.php - PICO W SUBMISSION API ONLY
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
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

// Validate device API key
function validateDeviceKey($api_key, $conn) {
    if (empty($api_key)) return null;
    
    $stmt = $conn->prepare("SELECT id, user_id, device_name FROM devices WHERE device_id = ? AND is_active = TRUE");
    $stmt->bind_param("s", $api_key);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }
    
    $device = $result->fetch_assoc();
    $stmt->close();
    return $device;
}

// Only accept POST requests (Pico W submission)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST method allowed']);
    exit();
}

// Get API key from header
$headers = getallheaders();
$api_key = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : null;

if (!$api_key) {
    http_response_code(401);
    echo json_encode(['error' => 'API key required']);
    exit();
}

$device = validateDeviceKey($api_key, $conn);
if (!$device) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid device API key']);
    exit();
}

// Process GPS data from Pico W
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['lat']) || !isset($input['lon'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Latitude and longitude required']);
    exit();
}

// Insert GPS data
$latitude = floatval($input['lat']);
$longitude = floatval($input['lon']);
$satellites = isset($input['sats']) ? intval($input['sats']) : 0;

$stmt = $conn->prepare("
    INSERT INTO gps_data (device_id, user_id, latitude, longitude, satellites) 
    VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param("iiddi",
    $device['id'],
    $device['user_id'],
    $latitude,
    $longitude,
    $satellites
);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'GPS data saved',
        'timestamp' => date('Y-m-d H:i:s'),
        'data_id' => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save GPS data: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
