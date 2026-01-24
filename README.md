# Cardano Treasury Fund Tracking System

A system to track funds flowing through Cardano treasury smart contracts using YACI Store for indexing, PostgreSQL for storage, a Rust-based API backend, and a frontend (to be implemented).

## Project Structure

```
budget-data/
├── indexer/              # YACI Store indexer setup
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── application.properties  # Editable configuration
│   ├── download-jar.sh
│   └── README.md
├── api/                  # Rust API backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── routes/       # API route handlers
│   │   ├── models/       # Data models
│   │   └── db/           # Database utilities
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml    # Local development orchestration
└── BUILD_STATUS.md       # Build and testing status

```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- YACI Store JAR file (already downloaded: `indexer/yaci-store.jar`)

### Start Everything

```bash
# Start all services with one command
./dev.sh start
```

This will:
1. ✅ Start PostgreSQL database
2. ✅ Start YACI Store indexer  
3. ✅ Start Rust API backend

### Verify It's Working

```bash
# Check service status
./dev.sh status

# Test API health
curl http://localhost:8080/health
# Returns: OK

# Get statistics
curl http://localhost:8080/api/stats
# Returns: {"total_transactions":0,"total_funds":"0.000000","active_vendor_contracts":0}
```

### API Endpoints

All endpoints available at `http://localhost:8080`:

- `GET /health` - Health check
- `GET /api/transactions` - List all transactions
- `GET /api/balance` - Get treasury balance
- `GET /api/stats` - Get statistics
- `GET /api/fund` - List Fund transactions
- `GET /api/disburse` - List Disburse transactions
- `GET /api/withdraw` - List Withdraw transactions
- `GET /api/utxos` - List UTXOs
- `GET /api/vendor-contracts` - List vendor contracts
- `GET /api/fund-flows` - List fund flows

See [DEMO.md](DEMO.md) and [WORKING_DEMONSTRATION.md](WORKING_DEMONSTRATION.md) for detailed usage.

### Development Script

The `dev.sh` script provides convenient commands for local development:

```bash
./dev.sh start      # Start all services
./dev.sh stop       # Stop all services
./dev.sh logs       # Show logs (optionally: ./dev.sh logs indexer)
./dev.sh status     # Check service status
./dev.sh build      # Build Docker images
./dev.sh clean      # Remove all containers and volumes
./dev.sh help       # Show help
```

## Configuration

### Treasury Reserve Contract

- **Payment Address**: `addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj`
- **Stake Address**: `stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr`
- **Script Hash**: `8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469`

### Sync Start Point

- **Slot**: 160964954
- **Block**: 12125945

## API Endpoints

- `GET /health` - Health check
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:tx_hash` - Get transaction details
- `GET /api/utxos` - List UTXOs
- `GET /api/balance` - Get treasury balance
- `GET /api/vendor-contracts` - List vendor contracts
- `GET /api/fund-flows` - List fund flows
- `GET /api/stats` - Get statistics
- `GET /api/fund` - List Fund transactions
- `GET /api/disburse` - List Disburse transactions
- `GET /api/withdraw` - List Withdraw transactions

## Development

See individual component READMEs:
- [Indexer Setup](indexer/README.md)
- [API Setup](api/README.md)

## Status

See [BUILD_STATUS.md](BUILD_STATUS.md) for current build and testing status.

## License

[To be determined]
