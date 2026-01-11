#!/bin/bash
cd /home/site/wwwroot
echo "Installing dependencies..."
npm install --production
echo "Starting server..."
node server.js
