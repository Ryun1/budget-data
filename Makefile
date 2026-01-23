.PHONY: help build test clean dev docker-up docker-down setup

help:
	@echo "Available commands:"
	@echo "  make setup      - Set up the project (build all components)"
	@echo "  make build      - Build all components"
	@echo "  make test       - Run tests"
	@echo "  make dev        - Start development environment"
	@echo "  make docker-up  - Start Docker Compose services"
	@echo "  make docker-down - Stop Docker Compose services"
	@echo "  make clean      - Clean build artifacts"

setup:
	@echo "Setting up project..."
	@bash scripts/setup.sh

build:
	@echo "Building indexer..."
	cd indexer && mvn clean package -DskipTests
	@echo "Building API..."
	cd api && zig build
	@echo "Building frontend..."
	cd frontend && npm install && npm run build

test:
	@echo "Running indexer tests..."
	cd indexer && mvn test
	@echo "Building API (test)..."
	cd api && zig build
	@echo "Building frontend (test)..."
	cd frontend && npm run build

dev:
	@bash scripts/dev.sh

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

clean:
	cd indexer && mvn clean
	cd api && rm -rf zig-out zig-cache
	cd frontend && rm -rf .next node_modules
	rm -rf logs
