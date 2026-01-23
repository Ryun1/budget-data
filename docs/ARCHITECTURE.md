# Architecture Documentation

## System Overview

The Cardano Treasury Budget Data system is a three-service architecture designed to index, store, and display treasury contract transactions from the Cardano blockchain.

## Component Architecture

```
┌─────────────────┐
│  Cardano Node   │
│   (n2c:1337)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ YACI Store      │
│   Indexer       │◄─── Spring Boot (Java)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└────────┬────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌─────────────┐  ┌─────────────┐
│   ZiG API   │  │   Indexer   │
│  (Port 8080)│  │  (Worker)   │
└──────┬──────┘  └─────────────┘
       │
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │
│ (Port 3000) │
└─────────────┘
```

## Data Flow

1. **Indexing**: YACI Store reads from Cardano node and publishes events
2. **Processing**: Custom listeners filter treasury-related transactions
3. **Storage**: Parsed data is stored in PostgreSQL
4. **API**: ZiG API reads from PostgreSQL and serves REST endpoints
5. **Display**: Next.js frontend consumes API and displays data

## Database Schema

### Core Tables

- `treasury_instance` - Single TRSC instance
- `vendor_contracts` - Vendor contract addresses
- `projects` - Funded projects
- `milestones` - Project milestones
- `treasury_transactions` - Transaction records
- `treasury_events` - Event log

### Relationships

- Projects → Milestones (1:N)
- Projects → Vendor Contracts (1:N)
- Transactions → Projects (N:1, optional)
- Events → Transactions (N:1)

## API Design

### REST Endpoints

All endpoints return JSON and support CORS.

- `GET /api/treasury` - Treasury instance
- `GET /api/projects` - List projects
- `GET /api/projects/{id}` - Project details
- `GET /api/transactions` - List transactions
- `GET /api/transactions/{hash}` - Transaction details
- `GET /api/milestones` - List milestones
- `GET /api/vendor-contracts` - Vendor contracts
- `GET /api/events` - Event log
- `GET /health` - Health check

## Technology Stack

### Indexer
- **Language**: Java 17
- **Framework**: Spring Boot 3.2
- **Indexing**: YACI Store 2.0.0-beta5
- **Database**: PostgreSQL 14+
- **Migrations**: Flyway

### API
- **Language**: Zig 0.11+
- **Database**: libpq (PostgreSQL client)
- **Server**: Native HTTP server

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: CSS modules

## Deployment

### Render.com

Services are configured in `render.yaml`:
1. PostgreSQL database
2. Indexer worker (background)
3. ZiG API (web service)
4. Next.js frontend (static site)

### Docker Compose

Local development setup with all services:
- PostgreSQL container
- Indexer container
- API container
- Frontend container

## Security Considerations

- SQL injection prevention (parameterized queries)
- JSON escaping for safe output
- CORS configuration
- Environment variable management
- Health check endpoints

## Performance

- Database indexes on frequently queried columns
- Connection pooling
- Efficient JSON serialization
- Pagination support (future enhancement)

## Monitoring

- Health check endpoints
- Structured logging
- Error tracking
- Database connection monitoring
