# Treasury Frontend

Next.js frontend for displaying Cardano treasury budget data.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to point to your API service (default: http://localhost:8080).

## Building

```bash
npm run build
npm start
```

## Pages

- `/` - Dashboard with overview statistics
- `/projects` - List all vendor contracts/projects
- `/projects/[id]` - Project details with milestones and events
- `/transactions` - List treasury transactions
- `/transactions/[hash]` - Transaction details
- `/treasury-contracts` - List treasury contracts with balances
- `/events` - List all treasury events
