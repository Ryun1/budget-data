# Metrics and Monitoring

## Indexing Metrics

The indexer tracks various metrics during operation:

- **Transactions Processed**: Total number of treasury transactions processed
- **Projects Created**: Number of projects created from fund events
- **Milestones Created**: Number of milestones created
- **Vendor Contracts Discovered**: Number of vendor contract addresses discovered
- **Errors Encountered**: Number of errors during processing
- **Current Slot**: Latest slot being processed
- **Last Processed Slot**: Most recent slot that was fully processed

## Health Checks

Spring Boot Actuator provides health check endpoints:

- `/actuator/health` - Overall health status
- Includes database connectivity
- Includes indexing metrics
- Reports unhealthy if error rate exceeds 10%

## Logging

Metrics are logged every 5 minutes with current statistics.

## Monitoring

For production deployments, consider:

- Exporting metrics to Prometheus/Grafana
- Setting up alerts for high error rates
- Monitoring slot processing lag
- Tracking vendor contract discovery rate
