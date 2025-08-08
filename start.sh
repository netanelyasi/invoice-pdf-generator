#!/bin/bash

echo "🚀 Starting Invoice PDF Generator..."
echo "📊 NODE_ENV: $NODE_ENV"
echo "🔌 PORT: $PORT"
echo "🎭 PUPPETEER_HEADLESS: $PUPPETEER_HEADLESS"

# Wait a moment for system to be ready
sleep 2

# Start the application
exec node server.js