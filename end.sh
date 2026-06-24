#!/bin/bash
# Stop servers started by start.sh

if [ -f .server.pid ]; then
  PID=$(cat .server.pid)
  powershell -Command "Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue" 2>/dev/null
  rm -f .server.pid
  echo "Server stopped (PID: $PID)"
else
  # Fallback: kill all node processes
  powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:\$false" 2>/dev/null
  echo "Server stopped"
fi
