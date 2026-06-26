#!/bin/bash
# Stop servers started by start.sh

PWSH="/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"

if [ -f .server.pid ]; then
  PID=$(cat .server.pid)
  "$PWSH" -Command "Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue"
  rm -f .server.pid
  echo "Server stopped (PID: $PID)"
else
  "$PWSH" -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:\$false"
  echo "Server stopped"
fi
