# Treasury API Backend

Rust-based REST API for querying Cardano treasury fund tracking data. Built with Axum framework and SQLx for PostgreSQL.

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
  "total_transactions": 42,
  "total_funds": "1500000.000000",
  "active_vendor_contracts": 5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_transactions` | integer | Total number of treasury transactions |
| `total_funds` | string | Total unspent funds in ADA |
| `active_vendor_contracts` | integer | Number of active vendor contracts |

---

### Balance

#### `GET /api/balance`

Get current treasury balance from unspent UTXOs.

**Response:**
```json
{
  "balance": "1500000.000000",
  "lovelace": 1500000000000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `balance` | string | Balance in ADA (6 decimal places) |
| `lovelace` | integer | Balance in lovelace |

---

### Transactions

#### `GET /api/transactions`

List treasury transactions with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 50 | Results per page (max: 100) |
| `action_type` | string | - | Filter by action type: `Fund`, `Disburse`, `Withdraw`, etc. |
| `date_from` | string | - | Filter transactions from this date (ISO 8601) |
| `date_to` | string | - | Filter transactions until this date (ISO 8601) |

**Example:**
```bash
curl "http://localhost:8080/api/transactions?page=1&limit=10&action_type=Fund"
```

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "slot": 160964954,
    "block_number": 12125945,
    "block_time": 1704067200,
    "action_type": "Fund",
    "amount": "1000000000000",
    "metadata": { "purpose": "Initial funding" }
  }
]
```

#### `GET /api/transactions/:tx_hash`

Get a specific transaction by hash.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tx_hash` | string | Transaction hash (64 hex characters) |

**Example:**
```bash
curl "http://localhost:8080/api/transactions/abc123..."
```

**Response:** Same as single transaction object above.

**Errors:**
- `404 Not Found` - Transaction not found

---

### Action-Specific Transactions

These endpoints return transactions filtered by action type with the same pagination options.

#### `GET /api/fund`

List all Fund transactions (incoming treasury funds).

#### `GET /api/disburse`

List all Disburse transactions (disbursements to vendors).

#### `GET /api/withdraw`

List all Withdraw transactions (withdrawals from treasury).

**Query Parameters:** Same as `/api/transactions`

---

### UTXOs

#### `GET /api/utxos`

List unspent transaction outputs (UTXOs) held by the treasury.

**Response:**
```json
[
  {
    "tx_hash": "abc123...",
    "output_index": 0,
    "owner_addr": "addr1...",
    "lovelace_amount": 1000000000000,
    "slot": 160964954,
    "is_spent": false
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
| `is_spent` | boolean | Whether UTXO has been spent |

---

### Vendor Contracts

#### `GET /api/vendor-contracts`

List vendor contracts receiving disbursements from treasury.

**Response:**
```json
[
  {
    "id": 1,
    "contract_address": "addr1...",
    "vendor_name": "Vendor A",
    "project_name": "Project X",
    "project_code": "PX001",
    "treasury_contract_address": "addr1...",
    "current_balance_lovelace": 500000000000,
    "status": "active",
    "created_at_slot": 160964954
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier |
| `contract_address` | string | Vendor's contract address |
| `vendor_name` | string | Name of the vendor |
| `project_name` | string | Name of the project |
| `project_code` | string | Project identifier code |
| `treasury_contract_address` | string | Parent treasury contract |
| `current_balance_lovelace` | integer | Current balance in lovelace |
| `status` | string | Contract status: `active`, `paused`, `completed`, `cancelled` |
| `created_at_slot` | integer | Slot when contract was created |

---

### Fund Flows

#### `GET /api/fund-flows`

List fund flow records tracking movement between addresses.

**Response:**
```json
[
  {
    "id": 1,
    "tx_hash": "abc123...",
    "slot": 160964954,
    "block_time": "2024-01-01T00:00:00Z",
    "source_address": "addr1...",
    "destination_address": "addr1...",
    "amount_lovelace": 1000000000000,
    "flow_type": "Disburse",
    "metadata": { "milestone": 1 }
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier |
| `tx_hash` | string | Transaction hash |
| `slot` | integer | Cardano slot number |
| `block_time` | string | ISO 8601 timestamp |
| `source_address` | string | Source address |
| `destination_address` | string | Destination address |
| `amount_lovelace` | integer | Transfer amount in lovelace |
| `flow_type` | string | Type of flow: `Fund`, `Disburse`, `Withdraw`, `Sweep` |
| `metadata` | object | Additional metadata (nullable) |

---

## Error Responses

All endpoints return standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| `200 OK` | Request successful |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Database or server error |

Error responses include no body for simplicity.

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

The API reads from these custom tables (created separately from YACI Store tables):

- `treasury_transactions` - Parsed treasury transactions with action types
- `treasury_utxos` - Treasury UTXO tracking
- `vendor_contracts` - Vendor contract registry
- `fund_flows` - Fund movement tracking

See `database/migrations/` for full schema definitions.
