# Contributing

## Project Structure

```
budget-data/
├── indexer/          # Java/Spring Boot indexer
├── api/              # ZiG REST API
├── frontend/         # Next.js frontend
├── render.yaml       # Render deployment config
└── README.md         # Main documentation
```

## Development Setup

1. **Database**: Set up PostgreSQL locally
2. **Cardano Node**: Connect to a Cardano node via n2c
3. **Indexer**: Run the Spring Boot application
4. **API**: Build and run the ZiG API
5. **Frontend**: Run Next.js dev server

## Code Style

- **Java**: Follow Spring Boot conventions
- **ZiG**: Follow Zig standard library patterns
- **TypeScript**: Use TypeScript strict mode

## Testing

- Indexer: Unit tests with JUnit
- API: Manual testing via HTTP requests
- Frontend: Manual testing in browser

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit PR with description
