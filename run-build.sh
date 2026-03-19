#!/bin/bash

echo "========================================"
echo "   ARIS Build Script"
echo "========================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js first."
    exit 1
fi

echo "[1/4] Node.js detected"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[2/4] Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
fi

# Build frontend
echo "[3/4] Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed"
    exit 1
fi

# Check server dependencies
if [ ! -d "server/node_modules" ]; then
    echo "[4/4] Installing server dependencies..."
    cd server
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install server dependencies"
        exit 1
    fi
    cd ..
fi

echo ""
echo "========================================"
echo "   Build Complete!"
echo "========================================"
echo ""
echo "Frontend built: dist/"
echo "Server ready: server/"
echo ""
echo "Next steps:"
echo "  1. Start backend: cd server && npm start"
echo "  2. Start frontend: npm run dev"
echo "  3. Or use existing dev scripts"
echo "========================================"