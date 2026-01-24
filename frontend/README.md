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

- `/` - Dashboard with overview
- `/projects` - List all projects
- `/projects/[id]` - Project details
- `/transactions` - List transactions
- `/milestones` - List milestones
