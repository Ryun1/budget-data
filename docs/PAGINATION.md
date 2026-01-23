# API Pagination

## Overview

API endpoints support pagination and filtering through query parameters.

## Query Parameters

### Common Parameters

- `limit`: Number of results per page (default: 100, max: 1000)
- `offset`: Number of results to skip (default: 0)

### Filter Parameters

- `event_type`: Filter by event type (e.g., "fund", "withdraw")
- `project_id`: Filter by project ID

## Examples

### Pagination

```
GET /api/transactions?limit=50&offset=0
GET /api/transactions?limit=50&offset=50
```

### Filtering

```
GET /api/transactions?event_type=fund
GET /api/events?event_type=pause&project_id=1
GET /api/transactions?limit=20&offset=0&event_type=withdraw
```

## Response Format

All paginated endpoints return JSON with the following structure:

```json
{
  "items": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

Note: Total count is not yet implemented but can be added for full pagination support.
