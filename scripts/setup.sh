#!/bin/bash
set -e

echo "Setting up Cardano Treasury Budget Data project..."

# Check prerequisites
echo "Checking prerequisites..."
command -v java >/dev/null 2>&1 || { echo "Java 17+ required but not installed. Aborting." >&2; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "Maven required but not installed. Aborting." >&2; exit 1; }
command -v zig >/dev/null 2>&1 || { echo "Zig 0.11+ required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js 18+ required but not installed. Aborting." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client required but not installed. Aborting." >&2; exit 1; }

echo "✓ All prerequisites met"

# Build indexer
echo "Building indexer..."
cd indexer
mvn clean package -DskipTests
cd ..

# Build API
echo "Building API..."
cd api
zig build
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database"
echo "2. Configure environment variables (see README.md)"
echo "3. Start services:"
echo "   - Indexer: cd indexer && java -jar target/treasury-indexer-1.0.0.jar"
echo "   - API: cd api && zig build run"
echo "   - Frontend: cd frontend && npm run dev"
