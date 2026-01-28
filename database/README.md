# Database Schema

This directory contains database migrations for the treasury fund tracking system.

## Schema Overview

The system uses two schemas:
1. **YACI Store schema** (`yaci_store`) - Created automatically by YACI Store for blockchain data
2. **Treasury schema** (default/public) - Custom tables for treasury-specific tracking

## Custom Tables

### treasury_transactions
Stores enhanced transaction data with parsed metadata from treasury contract transactions.

### treasury_utxos
Tracks UTXO state for treasury addresses, linking to YACI Store's address_utxo table.

### vendor_contracts
Stores information about vendor contract instances discovered from transactions.

### fund_flows
Tracks fund movements between contracts with source, destination, and amount information.

## Running Migrations

### Using SQLx (recommended for Rust API)

```bash
cd api
sqlx migrate run
```

### Using psql directly

```bash
docker-compose exec postgres psql -U postgres -d treasury_data -f /path/to/migrations/V1__create_treasury_tables.sql
```

Or copy the file and run:

```bash
docker-compose exec -T postgres psql -U postgres -d treasury_data < database/migrations/V1__create_treasury_tables.sql
```

## YACI Store Tables

YACI Store creates its own tables in the `yaci_store` schema. Key tables include:
- `block` - Block information
- `transaction` - Transaction data
- `address_utxo` - UTXO data by address
- `tx_metadata` - Transaction metadata
- `tx_input` - Transaction inputs

These tables are automatically created and maintained by YACI Store.

## Database Views

The API uses the following views for efficient data retrieval:

### treasury.v_vendor_contracts_summary

Aggregates vendor contract data including:
- Contract address and stake credential
- Total balance (sum of UTXOs)
- UTXO count
- Latest activity slot

This view joins `yaci_store.address_utxo` with contract metadata to provide a summary of all vendor contracts tracked by the system.
