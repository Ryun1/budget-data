# Treasury API

ZiG REST API for querying treasury budget data from PostgreSQL.

## Building

Requires Zig 0.11+ and libpq (PostgreSQL client library).

```bash
zig build
```

## Running

Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/treasury_data
zig build run
```

Or set `PORT` to customize the port (default: 8080).

## API Endpoints

- `GET /api/treasury` - Get treasury instance
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `GET /api/transactions` - List transactions
- `GET /api/transactions/{hash}` - Get transaction details
- `GET /api/milestones` - List milestones
- `GET /api/vendor-contracts` - List vendor contracts
- `GET /api/events` - List events
- `GET /health` - Health check
