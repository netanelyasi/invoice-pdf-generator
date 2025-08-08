#!/bin/bash

echo "🔧 Building Docker image..."
docker build -t invoice-pdf-generator .

echo "🚀 Running production container..."
docker run -d \
  --name invoice-pdf-test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PUPPETEER_HEADLESS=true \
  -e PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage" \
  -v invoice_data:/app/data \
  -v invoice_uploads:/app/public/uploads \
  invoice-pdf-generator

echo "⏳ Waiting for container to start..."
sleep 10

echo "🧪 Testing API health..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

echo "🧪 Testing PDF generation..."
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "receipt",
    "customer": {"name": "Test User"},
    "items": [{"description": "Test", "quantity": 1, "rate": 100, "amount": 100}],
    "total": 100
  }' \
  --output test-invoice.pdf

if [ -f "test-invoice.pdf" ]; then
  echo "✅ PDF generation successful!"
  ls -la test-invoice.pdf
else
  echo "❌ PDF generation failed"
fi

echo "🧹 Cleaning up..."
docker stop invoice-pdf-test
docker rm invoice-pdf-test

echo "🎉 Production test completed!"