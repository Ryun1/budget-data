# API Documentation

## Base URL

```
http://localhost:8080/api
```

## Endpoints

### Get Treasury Instance

```http
GET /api/treasury
```

Returns the single treasury instance details.

**Response:**
```json
{
  "instance_id": 1,
  "script_hash": "8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469",
  "payment_address": "addr1xxzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6v9swzhujsjlls7dajp59u95re0qdk9vh8mumlemw89535s4ecqxj",
  "stake_address": "stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr",
  "label": "Open Source",
  "description": "Treasury instance description"
}
```

### List Projects

```http
GET /api/projects
```

Returns a list of all projects.

**Response:**
```json
{
  "projects": [
    {
      "project_id": 1,
      "identifier": "PO123",
      "label": "Project Name",
      "vendor_label": "Vendor Name"
    }
  ]
}
```

### Get Project Details

```http
GET /api/projects/{id}
```

Returns detailed information about a specific project.

**Response:**
```json
{
  "project_id": 1,
  "identifier": "PO123",
  "label": "Project Name",
  "description": "Project description",
  "vendor_label": "Vendor Name"
}
```

### List Transactions

```http
GET /api/transactions
```

Returns a list of treasury transactions (limited to 100).

**Response:**
```json
{
  "transactions": [
    {
      "tx_hash": "abc123...",
      "event_type": "fund",
      "slot": 160964954
    }
  ]
}
```

### Get Transaction Details

```http
GET /api/transactions/{hash}
```

Returns detailed information about a specific transaction.

**Response:**
```json
{
  "tx_hash": "abc123...",
  "event_type": "fund",
  "slot": 160964954,
  "block_height": 12125945,
  "project_id": 1
}
```

### List Milestones

```http
GET /api/milestones
```

Returns a list of all milestones.

**Response:**
```json
{
  "milestones": [
    {
      "milestone_id": 1,
      "project_id": 1,
      "identifier": "001",
      "status": "PENDING"
    }
  ]
}
```

### List Vendor Contracts

```http
GET /api/vendor-contracts
```

Returns a list of all vendor contract addresses being tracked.

**Response:**
```json
{
  "vendor_contracts": [
    {
      "contract_id": 1,
      "payment_address": "addr1...",
      "project_id": 1
    }
  ]
}
```

### List Events

```http
GET /api/events
```

Returns a list of treasury events (limited to 100).

**Response:**
```json
{
  "events": [
    {
      "event_id": 1,
      "event_type": "fund",
      "tx_id": 1
    }
  ]
}
```

### Health Check

```http
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "ok"
}
```

## Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "Error message"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## CORS

All endpoints support CORS with `Access-Control-Allow-Origin: *`.
