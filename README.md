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
│   ├── config/
│   │   └── application-plugins.yml  # Plugin filter configuration
│   ├── plugins/
│   │   └── scripts/
│   │       └── treasury-filter.mvel # UTXO & metadata filter logic
│   └── README.md
├── api/                     # Rust API backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Data models
│   │   └── db/              # Database utilities
│   ├── Cargo.toml
│   └── README.md            # Full API documentation
├── frontend/               # Next.js React dashboard
├── docs/                    # Documentation
│   └── architecture.md      # Data flow diagrams
├── database/
│   └── init/                # Schema initialization
├── scripts/                # Utility shell scripts
├── .github/                # CI/CD workflows
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
| `GET /api/stats` | Statistics (TOM tx count, balance, latest block) |
| `GET /api/balance` | Current treasury balance |
| `GET /api/transactions` | List TOM transactions (with pagination & filters) |
| `GET /api/transactions/:tx_hash` | Get TOM transaction by hash |
| `GET /api/fund` | List Fund events |
| `GET /api/disburse` | List Disburse events |
| `GET /api/withdraw` | List Withdraw events |
| `GET /api/initialize` | List Initialize events |
| `GET /api/utxos` | List treasury UTXOs |
| `GET /api/treasury-addresses` | List treasury addresses with balances |
| `GET /api/treasury-operations` | List all TOM events |
| `GET /api/projects` | List all projects |
| `GET /api/projects/:project_id` | Get project by ID |
| `GET /api/projects/:project_id/milestones` | Get project milestones |
| `GET /api/projects/:project_id/events` | Get project events |
| `GET /api/treasury` | List treasury instances |
| `GET /api/treasury/:instance` | Get treasury by instance |
| `GET /api/events` | List all events |

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

### Schema

The system uses the **yaci_store** schema with plugin-filtered data:

| Table | Description | Filtering |
|-------|-------------|-----------|
| `yaci_store.block` | Blockchain blocks | All blocks stored |
| `yaci_store.address_utxo` | Treasury UTXOs | Only treasury stake credential |
| `yaci_store.transaction_metadata` | TOM metadata | Only label 1694 |

### Connecting to Database

```bash
# Via docker
docker exec -it treasury-postgres psql -U postgres -d treasury_data

# Via local psql (port 5433)
psql -h localhost -p 5433 -U postgres -d treasury_data
```

### Key Queries

```sql
-- Latest synced block
SELECT * FROM yaci_store.block ORDER BY number DESC LIMIT 5;

-- Treasury UTXOs (filtered to treasury addresses)
SELECT owner_addr, SUM(lovelace_amount) / 1000000 as ada_balance
FROM yaci_store.address_utxo
GROUP BY owner_addr;

-- TOM metadata (label 1694 transactions)
SELECT tx_hash, slot, body::jsonb->'body'->>'event' as event
FROM yaci_store.transaction_metadata
WHERE label = '1694'
ORDER BY slot DESC LIMIT 10;
```

### Plugin Filtering

YACI Store plugins filter blockchain data to only store treasury-relevant information:

- **UTXO Filter**: Only addresses with stake credential `8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469`
- **Metadata Filter**: Only metadata with label `1694` (TOM standard) AND instance `9e65e4ed7d6fd86fc4827d2b45da6d2c601fb920e8bfd794b8ecc619`

This reduces database size by ~95% while keeping all treasury data.

## Deployment (Render)

This project includes a Render blueprint for easy cloud deployment.

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deploy

1. Fork this repository to your GitHub account

2. Connect to Render:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repo
   - Select the `render.yaml` blueprint

3. Render will create:
   - **treasury-db** - PostgreSQL database
   - **treasury-api** - Rust API (auto-deploys on push)
   - **treasury-indexer** - YACI Store indexer (manual deploy)

4. After deployment:
   - API: `https://treasury-api-xxxx.onrender.com/health`
   - Indexer: `https://treasury-indexer-xxxx.onrender.com/actuator/health`

### Resource Requirements

| Service | Plan | Memory | Notes |
|---------|------|--------|-------|
| treasury-api | Starter | 512MB | Lightweight Rust binary |
| treasury-indexer | Standard | 2GB | Needs memory for blockchain sync |
| treasury-db | Starter | 1GB | Upgrade for production |

### Environment Variables

Set automatically by Render from the database:
- `DATABASE_URL` - PostgreSQL connection string
- `SPRING_DATASOURCE_URL` - JDBC connection for indexer

## Component Documentation

- [Architecture & Data Flow](docs/architecture.md) - System architecture and data flow diagrams
- [API Documentation](api/README.md) - Full API reference
- [Indexer Setup](indexer/README.md) - YACI Store configuration
- [Database Schema](database/schema/) - Treasury schema definitions

## License

[To be determined]
