#!/bin/bash

# Build script for Vercel deployment
# Installs frontend dependencies and builds the Vite app

set -e

echo "Installing frontend dependencies..."
cd frontend
npm ci

echo "Building frontend..."
# Use the vite binary directly from node_modules
./node_modules/.bin/vite build

echo "Build complete!"
