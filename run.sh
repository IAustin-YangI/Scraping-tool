#!/usr/bin/env bash

# Exit immediately if any command returns a non-zero (error) status
set -e

echo "Running first file..."
cd backend
npx tsx src/PostParser.ts
cd ..
cd display
echo "First file completed. Running second file..."
npm run dev 

echo "All files executed successfully."