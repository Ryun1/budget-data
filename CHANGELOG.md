# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project structure with three-service architecture
- YACI Store indexer for Cardano treasury contracts
- ZiG REST API with PostgreSQL integration
- Next.js frontend with dashboard and detail pages
- Docker Compose setup for local development
- CI/CD workflow with GitHub Actions
- Comprehensive documentation
- Database migrations with Flyway
- Error handling and logging
- Health check endpoints
- Stats dashboard with overview cards
- Transaction and project detail pages
- Loading spinners and error states
- Setup and development scripts
- Vendor contract extraction from transaction outputs
- Query parameter parsing for pagination and filtering
- API pagination support (limit, offset)
- API filtering support (event_type, project_id)
- UTXO query service abstraction
- Transaction output extractor
- Vendor contract discovery service
- Address UTXO listener for tracking UTXO changes
- Startup configuration for tracking initialization

### Fixed
- ZiG API allocator usage and memory management
- JSON escaping for safe API responses
- SQL injection prevention
- Connection pooling issues
- Frontend error handling

### Improved
- API response formatting
- Frontend UX with better loading states
- Documentation across all components
- Database indexes for performance
- Logging configuration
