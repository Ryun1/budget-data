# Treasury API Backend

Rust-based REST API for querying Cardano treasury fund tracking data. Built with Axum framework and SQLx for PostgreSQL.

## Architecture

The API queries data from YACI Store's indexed blockchain data:
- **UTXOs**: Treasury contract UTXOs (filtered by stake credential)
- **Metadata**: TOM (Treasury Oversight Metadata) with label 1694
- **Blocks**: Blockchain synchronization data

## Quick Start

```bash
# Start with Docker Compose (recommended)
cd ..
./dev.sh start

# API available at http://localhost:8080
```

## API Reference

Base URL: `http://localhost:8080`

### Health Check

#### `GET /health`

Returns the health status of the API.

**Response:**
```
OK
```

---

### Statistics

#### `GET /api/stats`

Get aggregated statistics about treasury operations.

**Response:**
```json
{
  "tom_events": 21,
  "total_balance": "264568247.000000",
  "total_balance_lovelace": 264568247000000,
  "treasury_addresses": 1,
  "latest_block": 12296746
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tom_events` | integer | Number of TOM events |
| `total_balance` | string | Total treasury balance in ADA |
| `total_balance_lovelace` | integer | Total treasury balance in lovelace |
| `treasury_addresses` | integer | Number of unique treasury addresses |
| `latest_block` | integer | Latest synced block number |

---

### Balance

#### `GET /api/balance`

Get current treasury balance from UTXOs.

**Response:**
```json
{
  "balance": "264568247.000000",
  "lovelace": 264568247000000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `balance` | string | Balance in ADA (6 decimal places) |
| `lovelace` | integer | Balance in lovelace |

---

### Transactions (TOM Metadata)

#### `GET /api/transactions`

List TOM transactions (transactions with label 1694 metadata).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 50 | Results per page (max: 100) |
| `action_type` | string | - | Filter by event type: `fund`, `disburse`, `withdraw`, `complete`, `initialize`, etc. |

**Example:**
```bash
curl "http://localhost:8080/api/transactions?page=1&limit=10&action_type=fund"
```

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "slot": 160964954,
    "block_number": 12125945,
    "block_time": 1704067200,
    "action_type": "fund",
    "metadata": {
      "@context": [...],
      "body": {
        "event": "fund",
        "milestones": {...}
      },
      "instance": "9e65e4ed...",
      "txAuthor": "e0b68e22..."
    }
  }
]
```

#### `GET /api/transactions/:tx_hash`

Get a specific TOM transaction by hash.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tx_hash` | string | Transaction hash (64 hex characters) |

**Example:**
```bash
curl "http://localhost:8080/api/transactions/182f8efed8110d65708cf2d03d4946238b32bad661536e463e90427d1af1d666"
```

**Errors:**
- `404 Not Found` - Transaction not found

---

### Event-Specific Transactions

These endpoints return TOM transactions filtered by event type.

#### `GET /api/fund`

List Fund transactions (funding events).

#### `GET /api/disburse`

List Disburse transactions (disbursement events).

#### `GET /api/withdraw`

List Withdraw transactions (withdrawal events).

#### `GET /api/initialize`

List Initialize transactions (contract initialization events).

**Query Parameters:** Same as `/api/transactions` (without `action_type`)

---

### UTXOs

#### `GET /api/utxos`

List treasury UTXOs (filtered by stake credential).

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "output_index": 0,
    "owner_addr": "addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj",
    "lovelace_amount": 264568247000000,
    "slot": 160964954,
    "block_number": 12125945
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `tx_hash` | string | Transaction hash containing this UTXO |
| `output_index` | integer | Output index within the transaction |
| `owner_addr` | string | Bech32 address owning the UTXO |
| `lovelace_amount` | integer | Amount in lovelace |
| `slot` | integer | Slot when UTXO was created |
| `block_number` | integer | Block number when UTXO was created |

---

### Treasury Addresses

#### `GET /api/treasury-addresses`

List treasury addresses (aggregated by address with balances).

**Response:**
```json
[
  {
    "address": "addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj",
    "stake_credential": "8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469",
    "balance_lovelace": 264568247000000,
    "utxo_count": 34,
    "latest_slot": 163964156
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Bech32 treasury/vendor address |
| `stake_credential` | string | Stake credential hash |
| `balance_lovelace` | integer | Current balance in lovelace |
| `utxo_count` | integer | Number of UTXOs at this address |
| `latest_slot` | integer | Most recent slot with activity |

---

### Treasury Operations

#### `GET /api/treasury-operations`

List treasury operations (TOM events) extracted from metadata.
Includes all TOM events: fund, disburse, withdraw, initialize, complete, pause, resume, modify, cancel, sweep.

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "slot": 160964954,
    "block_number": 12125945,
    "block_time": 1704067200,
    "action_type": "fund",
    "destination": "Sundae Labs",
    "metadata": {...}
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `tx_hash` | string | Transaction hash |
| `slot` | integer | Cardano slot number |
| `block_number` | integer | Block number |
| `block_time` | integer | Unix timestamp |
| `action_type` | string | Event type from TOM metadata |
| `destination` | string | Destination label (if available) |
| `metadata` | object | Full TOM metadata body |

---

## TOM Metadata Event Types

The API tracks the following Treasury Oversight Metadata events (label 1694):

| Event | Description |
|-------|-------------|
| `initialize` | Initialize a vendor contract |
| `fund` | Fund a vendor contract from treasury |
| `disburse` | Disburse funds from vendor contract |
| `withdraw` | Withdraw funds |
| `complete` | Complete a milestone |
| `pause` | Pause a contract |
| `resume` | Resume a paused contract |
| `modify` | Modify contract parameters |
| `cancel` | Cancel a contract |
| `sweep` | Sweep remaining funds |

---

## Error Responses

All endpoints return standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| `200 OK` | Request successful |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Database or server error |

---

## Development

### Prerequisites

- Rust 1.75+ (install via https://rustup.rs/)
- PostgreSQL database (use docker-compose postgres service)

### Local Setup

1. Install dependencies:
```bash
cargo build
```

2. Set up environment variables:
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/treasury_data
```

3. Run the API:
```bash
cargo run
```

The API will start on `http://localhost:8080`

### Building for Production

```bash
cargo build --release
```

### Docker

Build the Docker image:
```bash
docker build -t treasury-api .
```

Run the container:
```bash
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/treasury_data \
  treasury-api
```

---

## Database Schema

The API queries the YACI Store schema (`yaci_store`):

| Table | Description |
|-------|-------------|
| `yaci_store.block` | Blockchain blocks |
| `yaci_store.address_utxo` | Treasury UTXOs (filtered by plugin) |
| `yaci_store.transaction_metadata` | TOM metadata (label 1694 only) |

### Plugin Filtering

The YACI Store indexer uses plugins to filter data:
- **UTXOs**: Only addresses with treasury stake credential
- **Metadata**: Only label 1694 (TOM standard)

This reduces database size significantly while keeping all treasury-relevant data.

---

## Projects

#### `GET /api/projects`

List all vendor contracts/projects with summary data.

**Response:**
```json
[
  {
    "project_id": "abc123...",
    "name": "Project Name",
    "status": "active",
    "total_funded": 1000000000000,
    "total_disbursed": 500000000000,
    "milestone_count": 5,
    "completed_milestones": 2
  }
]
```

#### `GET /api/projects/:project_id`

Get a single project by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | string | Project identifier |

**Response:**
```json
{
  "project_id": "abc123...",
  "name": "Project Name",
  "status": "active",
  "total_funded": 1000000000000,
  "total_disbursed": 500000000000,
  "milestones": [...],
  "events": [...]
}
```

#### `GET /api/projects/:project_id/milestones`

Get milestones for a specific project.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | string | Project identifier |

**Response:**
```json
[
  {
    "milestone_id": 1,
    "title": "Milestone 1",
    "status": "completed",
    "amount": 200000000000
  }
]
```

#### `GET /api/projects/:project_id/events`

Get events for a specific project.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | string | Project identifier |

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "event_type": "fund",
    "slot": 160964954,
    "block_time": 1704067200
  }
]
```

---

## Treasury

#### `GET /api/treasury`

List treasury contract instances.

**Response:**
```json
[
  {
    "instance": "9e65e4ed...",
    "name": "Treasury Reserve",
    "balance": 264568247000000,
    "project_count": 10
  }
]
```

#### `GET /api/treasury/:instance`

Get a specific treasury contract by instance ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `instance` | string | Treasury instance identifier |

**Response:**
```json
{
  "instance": "9e65e4ed...",
  "name": "Treasury Reserve",
  "balance": 264568247000000,
  "projects": [...]
}
```

---

## Events

#### `GET /api/events`

List all processed treasury events.

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "event_type": "fund",
    "slot": 160964954,
    "block_number": 12125945,
    "block_time": 1704067200,
    "metadata": {...}
  }
]
```
