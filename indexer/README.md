# Treasury Indexer

Spring Boot application using YACI Store to index Cardano treasury contract transactions.

## Configuration

Set the following environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `CARDANO_NODE_HOST` - Cardano node host (default: localhost)
- `CARDANO_NODE_PORT` - Cardano node port (default: 1337)

## Building

```bash
mvn clean package
```

## Running

```bash
java -jar target/treasury-indexer-1.0.0.jar
```

The indexer will start from slot 160964954 and track the treasury contract address, automatically discovering vendor contracts as projects are funded.

## Database

The indexer uses Flyway for database migrations. Tables are created automatically on startup.
