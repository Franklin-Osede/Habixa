#!/bin/bash

# dev-start.sh

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

echo "Starting Habixa Development Environment..."

# API Setup
API_DIR="apps/api"
check_and_install "$API_DIR" "API"

# Mobile Setup
MOBILE_DIR="apps/mobile"
check_and_install "$MOBILE_DIR" "Mobile"

# Start API
echo "Starting API..."
cd "$API_DIR" || exit
pnpm run start:dev > ../../api.log 2>&1 &
API_PID=$!
echo $API_PID > ../../api.pid
cd - > /dev/null || exit
echo "API started with PID $API_PID (Logs: api.log)"

# Start Mobile
echo "Starting Mobile..."
cd "$MOBILE_DIR" || exit
pnpm start > ../../mobile.log 2>&1 &
MOBILE_PID=$!
echo $MOBILE_PID > ../../mobile.pid
cd - > /dev/null || exit
echo "Mobile started with PID $MOBILE_PID (Logs: mobile.log)"

echo "Both services are running in the background."
