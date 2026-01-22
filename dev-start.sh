#!/bin/bash

# Define Ports
API_PORT=3008
WEB_PORT=4214

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
npm run start:dev -- --port $API_PORT &
API_PID=$!

# Start Frontend (Expo Web)
echo "🟢 Starting Frontend (Mobile/Web)..."
cd ../mobile
# Expo Web on specific port
npx expo start --web --port $WEB_PORT &
FRONT_PID=$!

# Handle shutdown
cleanup() {
  echo "🛑 Shutting down..."
  kill $API_PID
  kill $FRONT_PID
  exit
}

trap cleanup SIGINT

# Wait for processes
wait $API_PID $FRONT_PID
