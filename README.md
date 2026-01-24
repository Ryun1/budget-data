# Cardano Treasury Fund Tracking System

A system to track funds flowing through Cardano treasury smart contracts using YACI Store for blockchain indexing, PostgreSQL for storage, and a Rust-based API backend.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cardano Node   │────▶│   YACI Store    │────▶│   PostgreSQL    │
│   (Mainnet)     │     │   (Indexer)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Rust API      │
                                                │   (Backend)     │
                                                └─────────────────┘
```

## Project Structure

```
budget-data/
├── indexer/                 # YACI Store indexer configuration
│   ├── application.properties
│   └── README.md
├── api/                     # Rust API backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Data models
│   │   └── db/              # Database utilities
│   ├── Cargo.toml
│   └── README.md            # Full API documentation
├── database/
│   ├── init/                # Schema initialization
│   └── migrations/          # Custom table migrations
├── docker-compose.yml
└── dev.sh                   # Development helper script
```

## Quick Start

### Prerequisites

- Docker and Docker Compose

### Start All Services

```bash
./dev.sh start
```

This starts:
- **PostgreSQL** on port 5433 (host) / 5432 (container)
- **YACI Store Indexer** on port 8081 (syncs Cardano blockchain)
- **Treasury API** on port 8080

### Verify Services

```bash
# Check service status
./dev.sh status

# Test API health
curl http://localhost:8080/health
# Returns: OK

# Get treasury statistics
curl http://localhost:8080/api/stats

# Check indexer sync status
curl http://localhost:8081/api/v1/blocks/latest
```

## API Endpoints

Base URL: `http://localhost:8080`

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/stats` | Aggregated statistics |
| `GET /api/balance` | Current treasury balance |
| `GET /api/transactions` | List transactions (with pagination & filters) |
| `GET /api/transactions/:tx_hash` | Get transaction by hash |
| `GET /api/fund` | List Fund transactions |
| `GET /api/disburse` | List Disburse transactions |
| `GET /api/withdraw` | List Withdraw transactions |
| `GET /api/utxos` | List unspent UTXOs |
| `GET /api/vendor-contracts` | List vendor contracts |
| `GET /api/fund-flows` | List fund flow records |

**[Full API Documentation →](api/README.md)**

## YACI Store Indexer API

The YACI Store indexer exposes its own API on port 8081:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/blocks/latest` | Latest synced block |
| `GET /api/v1/blocks/:number` | Block by number |
| `GET /api/v1/txs/:hash` | Transaction by hash |
| `GET /api/v1/addresses/:addr/utxos` | UTXOs by address |
| `GET /actuator/health` | Indexer health status |

## Configuration

### Treasury Reserve Contract

| Property | Value |
|----------|-------|
| Payment Address | `addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj` |
| Stake Address | `stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr` |
| Script Hash | `8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469` |

### Sync Configuration

| Property | Value |
|----------|-------|
| Network | Mainnet |
| Start Slot | 160964954 |
| Start Block | 12125945 |

Edit `indexer/application.properties` to modify sync settings.

## Development Commands

```bash
./dev.sh start      # Start all services
./dev.sh stop       # Stop all services
./dev.sh status     # Check service status
./dev.sh logs       # Show all logs
./dev.sh logs api   # Show API logs only
./dev.sh logs indexer  # Show indexer logs only
./dev.sh build      # Rebuild Docker images
./dev.sh clean      # Remove containers and volumes
./dev.sh help       # Show help
```

## Database

### Schemas

- **yaci_store** - YACI Store tables (blocks, transactions, utxos, metadata)
- **public** - Custom treasury tables (treasury_transactions, vendor_contracts, fund_flows)

### Connecting to Database

```bash
# Via docker
docker exec -it treasury-postgres psql -U postgres -d treasury_data

# Via local psql (port 5433)
psql -h localhost -p 5433 -U postgres -d treasury_data
```

### Key Tables

```sql
-- YACI Store tables (yaci_store schema)
SELECT * FROM yaci_store.block ORDER BY number DESC LIMIT 5;
SELECT * FROM yaci_store.transaction ORDER BY slot DESC LIMIT 5;
SELECT * FROM yaci_store.address_utxo LIMIT 5;

-- Custom tables (public schema)
SELECT * FROM treasury_transactions ORDER BY slot DESC LIMIT 5;
SELECT * FROM vendor_contracts;
SELECT * FROM fund_flows ORDER BY slot DESC LIMIT 5;
```

## Component Documentation

- [API Documentation](api/README.md) - Full API reference
- [Indexer Setup](indexer/README.md) - YACI Store configuration
- [Database Migrations](database/migrations/) - Schema definitions

## License

[To be determined]
