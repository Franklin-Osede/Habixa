#!/bin/bash

# dev-start-mobile.sh

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

echo "Starting Habixa Mobile..."

# Mobile Setup
MOBILE_DIR="apps/mobile"
check_and_install "$MOBILE_DIR" "Mobile"

# Start Mobile (web:dev = watch mode + Fast Refresh so you see changes without reloading)
echo "Starting Mobile on port 4216 (watch mode)..."
cd "$MOBILE_DIR" || exit
pnpm run web:dev > ../../mobile.log 2>&1 &
MOBILE_PID=$!
echo $MOBILE_PID > ../../mobile.pid
cd - > /dev/null || exit
echo "Mobile started with PID $MOBILE_PID on port 4216 (Logs: mobile.log)"
