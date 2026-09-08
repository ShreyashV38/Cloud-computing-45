#!/bin/bash

# Start Nginx in background
nginx

# Start Node API Gateway
cd /app
echo "Starting Gateway API..."
node src/index.js
