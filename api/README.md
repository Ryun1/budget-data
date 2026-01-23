# Treasury API (Rust)

REST API backend for Cardano Treasury Budget Data, written in Rust using Axum.

## Features

- Fast async HTTP server using Axum
- PostgreSQL database integration
- JSON API endpoints for treasury data
- CORS support
- Query parameter parsing for pagination and filtering

## Endpoints

- `GET /health` - Health check
- `GET /api/treasury` - Get treasury instance
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `GET /api/transactions` - List transactions (supports `limit`, `offset`, `event_type`, `project_id` query params)
- `GET /api/transactions/:hash` - Get transaction details
- `GET /api/milestones` - List milestones
- `GET /api/vendor-contracts` - List vendor contracts
- `GET /api/events` - List events (supports `limit`, `offset`, `event_type`, `project_id` query params)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/treasury_data`)
- `PORT` - Server port (default: 8080)

## Building

```bash
cargo build --release
```

## Running

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_data cargo run
```

## Docker

```bash
docker build -t treasury-api .
docker run -p 8080:8080 -e DATABASE_URL=... treasury-api
```
