#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); const ok = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 23; if (!ok) { console.error("Install Node.js 20.19+ or 22.12+ from https://nodejs.org/"); process.exit(1); }'

if [[ ! -d node_modules ]]; then
  echo "Installing FINN dependencies..."
  npm ci --include=dev
fi

echo "Building FINN..."
npm run build
echo
echo "FINN is starting. Open http://localhost:8000 in your browser."
echo "Keep this terminal open while using FINN. Press Ctrl+C to stop it."
npm start
