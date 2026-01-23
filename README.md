# Cardano Treasury Budget Data Indexer

A three-service architecture for indexing and displaying Cardano treasury contract transactions using YACI Store, a ZiG REST API, and a Next.js frontend.

## Architecture

- **Indexer** (Java/Spring Boot): Uses YACI Store to index blockchain data from slot 160964954 and populate PostgreSQL
- **API** (ZiG): REST API service reading from PostgreSQL
- **Frontend** (Next.js): Simple UI to display treasury fund flows

## Setup

### Prerequisites

- Java 17+
- Maven
- Zig 0.11+
- Node.js 18+
- PostgreSQL 14+
- Cardano node with n2c connection (port 1337)

### Indexer Setup

```bash
cd indexer
mvn clean install
```

Configure `application.yml` with your database and Cardano node connection details.

### API Setup

```bash
cd api
zig build
```

Set `DATABASE_URL` environment variable.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to point to your API service.

## Treasury Contract

- Payment Address: `addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj`
- Script Hash: `8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469`
- Stake Address: `stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr`

## Deployment

Use the provided `render.yaml` for deployment on Render.com:

1. PostgreSQL database service
2. Indexer background worker
3. ZiG API web service
4. Next.js frontend static site

## API Endpoints

- `GET /api/treasury` - Get treasury instance details
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `GET /api/transactions` - List transactions
- `GET /api/milestones` - List milestones
- `GET /api/vendor-contracts` - List vendor contracts
- `GET /api/events` - List events

## License

MIT
