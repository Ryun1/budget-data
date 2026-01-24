# YACI Store Indexer

This directory contains the YACI Store indexer setup for tracking Cardano treasury smart contract transactions.

## Setup

1. Download YACI Store JAR file:
   - Visit https://github.com/bloxbean/yaci-store/releases
   - Download the latest `yaci-store-all-*.jar` file
   - Place it in this directory

2. Configure `application.properties`:
   - Update database connection details if needed
   - Adjust sync start point if needed
   - Modify store enable/disable flags as needed

3. Build and run:
   ```bash
   docker build -t treasury-indexer .
   docker run -d --name indexer --network treasury-network treasury-indexer
   ```

## Configuration

The `application.properties` file is mounted as a volume in docker-compose, allowing you to edit it without rebuilding the container.

## Notes

- The JAR file is not included in git (see .gitignore)
- Make sure PostgreSQL is running before starting the indexer
- Initial sync may take time depending on the start slot
