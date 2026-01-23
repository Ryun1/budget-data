FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    zig \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source files
COPY . .

# Build the application
RUN zig build -Doptimize=ReleaseFast

# Expose port
EXPOSE 8080

# Run the application
CMD ["./zig-out/bin/treasury-api"]
