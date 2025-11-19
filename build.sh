#!/bin/bash

# Build script for Vercel deployment
# Installs frontend dependencies and builds the Vite app

set -e

echo "Installing frontend dependencies..."
npm ci --prefix frontend

echo "Building frontend..."
npm run --prefix frontend build

echo "Build complete!"
