#!/bin/bash

# =========================================
# Compensation System Startup Script
# Run both Frontend and Backend
# =========================================

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   🎯 COMPENSATION SYSTEM STARTUP                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend folder not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend folder not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js is installed: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi
echo "✅ npm is installed: $(npm --version)"
echo ""

echo "🔄 Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo "🔄 Starting Frontend Server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   ✅ STARTUP COMPLETE!                             ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "🔐 Login with:"
echo "   Username: admin"
echo "   Password: police123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait
