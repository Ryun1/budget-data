# Treasury API Backend

Rust-based REST API for querying Cardano treasury fund tracking data.

## Development

### Prerequisites

- Rust 1.75+ (install via https://rustup.rs/)
- PostgreSQL database (use docker-compose postgres service)

### Setup

1. Install dependencies:
```bash
cargo build
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database connection details
```

3. Run the API:
```bash
cargo run
```

The API will start on `http://localhost:8080`

## Endpoints

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

## Building for Production

```bash
cargo build --release
```

## Docker

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
