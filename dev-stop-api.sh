#!/bin/bash

# dev-stop-api.sh

echo "Stopping Habixa API..."

# Stop API
if [ -f api.pid ]; then
  API_PID=$(cat api.pid)
  echo "Stopping API (PID $API_PID)..."
  kill "$API_PID" 2>/dev/null
  rm api.pid
else
  echo "api.pid not found. API might not be running via script."
fi

# Cleanup
if [ -d "apps/api/node_modules" ]; then
  echo "Removing apps/api/node_modules..."
  rm -rf apps/api/node_modules
fi

# Optional: Clean logs
rm -f api.log

echo "API stopped and cleaned."
