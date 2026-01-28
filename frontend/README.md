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

## API Endpoints

The frontend should use the v1 API endpoints:

| Frontend Page | API Endpoint |
|--------------|--------------|
| Dashboard | `GET /api/v1/statistics` |
| Projects List | `GET /api/v1/vendor-contracts` |
| Project Detail | `GET /api/v1/vendor-contracts/:project_id` |
| Project Milestones | `GET /api/v1/vendor-contracts/:project_id/milestones` |
| Project Events | `GET /api/v1/vendor-contracts/:project_id/events` |
| Events List | `GET /api/v1/events` |
| Recent Activity | `GET /api/v1/events/recent` |
| Event Detail | `GET /api/v1/events/:tx_hash` |
| Treasury | `GET /api/v1/treasury` |

API documentation: `http://localhost:8080/docs` (Swagger UI)

## Building

```bash
npm run build
npm start
```

## Pages

- `/` - Dashboard with overview statistics
- `/projects` - List all vendor contracts/projects
- `/projects/[id]` - Project details with milestones and events
- `/events` - List all treasury events
- `/treasury` - Treasury contract details
