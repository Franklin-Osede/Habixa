#!/bin/bash

# dev-start-api.sh

# Function to install dependencies if node_modules is missing
check_and_install() {
  SERVICE_DIR=$1
  SERVICE_NAME=$2
  
  if [ ! -d "$SERVICE_DIR/node_modules" ]; then
    echo "[$SERVICE_NAME] node_modules not found. Installing dependencies..."
    cd "$SERVICE_DIR" || exit
    pnpm install
    cd - > /dev/null || exit
  else
    echo "[$SERVICE_NAME] node_modules exists. Skipping install."
  fi
}

echo "Starting Habixa API..."

# API Setup
API_DIR="apps/api"
check_and_install "$API_DIR" "API"

# Start API on port 3008
echo "Starting API on port 3008..."
cd "$API_DIR" || exit
PORT=3008 pnpm run start:dev > ../../api.log 2>&1 &
API_PID=$!
echo $API_PID > ../../api.pid
cd - > /dev/null || exit
echo "API started with PID $API_PID (Logs: api.log)"
