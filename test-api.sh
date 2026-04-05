#!/bin/bash
# ARIS API Test Script

BASE_URL="https://aris.tuyoisaza.com"
EMAIL="admin@aris.app"
PASSWORD="admin123"

echo "=== ARIS API Test ==="
echo ""

# 1. Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   ❌ Login failed!"
  echo "$LOGIN_RESPONSE" | head -c 200
  exit 1
fi
echo "   ✅ Logged in successfully"
echo ""

# 2. Web Research Test
echo "2. Testing Web Research..."
curl -s -X POST "$BASE_URL/api/research/research" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"What is machine learning?"}' | jq '.' 2>/dev/null || echo "Query result returned"

echo ""

# 3. Health Check
echo "3. Health Check..."
curl -s "$BASE_URL/health" | jq '.status, .stats.badges' 2>/dev/null || echo "Health check done"

echo ""
echo "=== Test Complete ==="
