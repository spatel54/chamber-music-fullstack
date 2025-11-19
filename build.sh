#!/bin/bash

# Build script for Vercel deployment
# Installs frontend dependencies and builds the Vite app

set -e

echo "Installing frontend dependencies..."
cd frontend
npm ci

echo "Building frontend..."
# Use npx which will look in node_modules/.bin
npx vite build

echo "Build complete!"
