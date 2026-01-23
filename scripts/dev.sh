#!/bin/bash
set -e

echo "Starting development environment..."

# Check if docker-compose is available
if command -v docker-compose >/dev/null 2>&1; then
    echo "Starting with Docker Compose..."
    docker-compose up -d postgres
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
else
    echo "Docker Compose not available. Please start PostgreSQL manually."
fi

# Start services in background
echo "Starting indexer..."
cd indexer
mvn spring-boot:run > ../logs/indexer.log 2>&1 &
INDEXER_PID=$!
cd ..

echo "Starting API..."
cd api
zig build run > ../logs/api.log 2>&1 &
API_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Services started!"
echo "Indexer PID: $INDEXER_PID"
echo "API PID: $API_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Logs are in the logs/ directory"
echo "To stop services, run: kill $INDEXER_PID $API_PID $FRONTEND_PID"

# Save PIDs to file
mkdir -p logs
echo "$INDEXER_PID $API_PID $FRONTEND_PID" > logs/pids.txt
