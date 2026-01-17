#!/bin/bash

# dev-stop.sh

echo "Stopping Habixa Development Environment..."

# Stop API
if [ -f api.pid ]; then
  API_PID=$(cat api.pid)
  echo "Stopping API (PID $API_PID)..."
  kill "$API_PID" 2>/dev/null
  rm api.pid
else
  echo "api.pid not found. API might not be running via script."
fi

# Stop Mobile
if [ -f mobile.pid ]; then
  MOBILE_PID=$(cat mobile.pid)
  echo "Stopping Mobile (PID $MOBILE_PID)..."
  kill "$MOBILE_PID" 2>/dev/null
  rm mobile.pid
else
  echo "mobile.pid not found. Mobile might not be running via script."
fi

# Cleanup
echo "Cleaning up node_modules..."

if [ -d "apps/api/node_modules" ]; then
  echo "Removing apps/api/node_modules..."
  rm -rf apps/api/node_modules
fi

if [ -d "apps/mobile/node_modules" ]; then
  echo "Removing apps/mobile/node_modules..."
  rm -rf apps/mobile/node_modules
fi

# Optional: Clean logs
rm -f api.log mobile.log

echo "Environment stopped and cleaned."
