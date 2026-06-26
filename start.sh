#!/bin/bash
# Stop any running server first
bash end.sh

echo "Starting Vizzy dev server..."

# Start Next.js dev server in background, store PID
npm run dev &
echo $! > .server.pid

echo "Ready at http://localhost:3000  (PID: $(cat .server.pid))"
