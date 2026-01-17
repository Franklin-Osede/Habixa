#!/bin/bash

# dev-stop-mobile.sh

echo "Stopping Habixa Mobile..."

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
if [ -d "apps/mobile/node_modules" ]; then
  echo "Removing apps/mobile/node_modules..."
  rm -rf apps/mobile/node_modules
fi

# Optional: Clean logs
rm -f mobile.log

echo "Mobile stopped and cleaned."
