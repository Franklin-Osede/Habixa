#!/bin/bash

# cleanup-all.sh

echo "Cleaning up all node_modules..."

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

# Clean PIDs if they exist (without killing process, as this is just cleanup)
if [ -f api.pid ]; then
  rm api.pid
fi

if [ -f mobile.pid ]; then
  rm mobile.pid
fi

echo "Cleanup complete."
