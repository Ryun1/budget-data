# Deployment Guide

## Render.com Deployment

The `render.yaml` file configures all services for deployment on Render.com.

### Services

1. **PostgreSQL Database** - Stores indexed treasury data
2. **Indexer Worker** - Background service that indexes blockchain data
3. **ZiG API** - REST API service
4. **Next.js Frontend** - Static site

### Environment Variables

#### Indexer
- `DATABASE_URL` - Auto-configured from database service
- `CARDANO_NODE_HOST` - Your Cardano node host
- `CARDANO_NODE_PORT` - Your Cardano node port (default: 1337)

#### API
- `DATABASE_URL` - Auto-configured from database service
- `PORT` - Server port (default: 8080)

#### Frontend
- `NEXT_PUBLIC_API_URL` - Auto-configured from API service

### Manual Deployment Steps

1. Create PostgreSQL database on Render
2. Deploy indexer as background worker
3. Deploy ZiG API as web service
4. Deploy Next.js frontend as static site
5. Configure environment variables
6. Start services

### Local Development

See individual README files in each directory:
- `indexer/README.md`
- `api/README.md`
- `frontend/README.md`
