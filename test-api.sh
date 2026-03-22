#!/usr/bin/env bash
# Test GPS API endpoints

API_URL="http://localhost/api.php"
# For Render: API_URL="https://gps-backend.onrender.com/api.php"

echo "Testing GPS API Endpoints..."
echo ""

echo "1. Test /api.php?action=user"
curl -s "${API_URL}?action=user" | python -m json.tool
echo ""

echo "2. Test /api.php?action=devices"
curl -s "${API_URL}?action=devices" | python -m json.tool
echo ""

echo "3. Test /api.php?action=live"
curl -s "${API_URL}?action=live" | python -m json.tool
echo ""

echo "4. Test /api.php?action=stats"
curl -s "${API_URL}?action=stats" | python -m json.tool
echo ""

echo "5. Test /api.php?action=history&limit=5"
curl -s "${API_URL}?action=history&limit=5" | python -m json.tool
echo ""

echo "✅ API tests complete!"
