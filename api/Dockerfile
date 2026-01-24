# Build stage
FROM rust:1.81-slim AS builder

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifest files
COPY Cargo.toml ./

# Create a dummy src directory to cache dependencies
# Cargo.lock will be generated automatically if it doesn't exist
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/treasury-api /app/treasury-api

# Expose port
EXPOSE 8080

# Run the application
CMD ["./treasury-api"]
