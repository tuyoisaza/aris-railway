#!/bin/bash

echo "🚀 Starting ARIS Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js detected"

# Kill any existing processes on ports 3000 and 5173
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "🔧 [1/2] Starting Backend Server..."
cd server
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start Frontend  
echo "💻 [2/2] Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "🎉 Development Environment Started!"
echo "========================================="
echo "🌐 Backend:  http://localhost:3000"
echo "🖥️ Frontend: http://localhost:5173"
echo "🛑 Use Ctrl+C to stop all services"
echo "========================================="
echo ""

# Function to clean up on exit
cleanup() {
    echo "🧹 Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes to complete
wait