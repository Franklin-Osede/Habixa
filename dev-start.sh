#!/bin/bash

# Define Ports
API_PORT=3008
WEB_PORT=4216

echo "🚀 Starting Habixa (AgentsMinds)..."
echo "Backend Port: $API_PORT"
echo "Frontend Port: $WEB_PORT"

# Kill existing processes on these ports
echo "🧹 Cleaning up ports..."
lsof -ti:$API_PORT | xargs kill -9 2>/dev/null
lsof -ti:$WEB_PORT | xargs kill -9 2>/dev/null

# Start Backend
echo "🟢 Starting Backend..."
cd apps/api
# Use pnpm and env var for port
PORT=$API_PORT pnpm run start:dev > ../../api.log 2>&1 &
API_PID=$!
echo $API_PID > ../../api.pid

# Start Frontend (Mobile/Web) with watch mode so Fast Refresh works
echo "🟢 Starting Frontend (Mobile/Web)..."
cd ../mobile
CI=false pnpm exec expo start --web --port $WEB_PORT > ../../mobile.log 2>&1 &
FRONT_PID=$!
echo $FRONT_PID > ../../mobile.pid

# Handle shutdown
cleanup() {
  echo "🛑 Shutting down..."
  kill $API_PID
  kill $FRONT_PID
  exit
}

trap cleanup SIGINT

echo "Services started! Logs: api.log, mobile.log"
# Wait for processes
wait $API_PID $FRONT_PID
