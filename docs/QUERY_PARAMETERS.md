# API Query Parameters

## Overview

The ZiG API supports query parameters for pagination and filtering on list endpoints.

## Supported Parameters

### Pagination

- `limit` (integer): Number of results per page
  - Default: 100
  - Minimum: 1
  - Maximum: 1000
  
- `offset` (integer): Number of results to skip
  - Default: 0
  - Minimum: 0

### Filtering

- `event_type` (string): Filter by event type
  - Values: `publish`, `initialize`, `reorganize`, `fund`, `disburse`, `complete`, `withdraw`, `pause`, `resume`, `modify`, `cancel`, `sweep`
  
- `project_id` (integer): Filter by project ID

## Examples

### Basic Pagination

```bash
# Get first 50 transactions
GET /api/transactions?limit=50&offset=0

# Get next 50 transactions
GET /api/transactions?limit=50&offset=50
```

### Filtering

```bash
# Get only fund events
GET /api/transactions?event_type=fund

# Get events for a specific project
GET /api/events?project_id=1

# Combined filtering and pagination
GET /api/transactions?event_type=withdraw&limit=20&offset=0
```

## Endpoints Supporting Query Parameters

- `GET /api/projects` - Supports `limit`, `offset`
- `GET /api/transactions` - Supports `limit`, `offset`, `event_type`, `project_id`
- `GET /api/events` - Supports `limit`, `offset`, `event_type`, `project_id`

## Response Format

Responses include the requested data with applied filters and pagination:

```json
{
  "transactions": [
    {
      "tx_hash": "...",
      "event_type": "fund",
      "slot": 160964954
    }
  ]
}
```

Note: Total count and pagination metadata are not yet included but can be added for full pagination support.
