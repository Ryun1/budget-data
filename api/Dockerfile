FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    xz-utils \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Zig
# Download and install Zig 0.12.0 (latest stable as of 2024)
RUN wget https://ziglang.org/download/0.12.0/zig-linux-x86_64-0.12.0.tar.xz && \
    tar -xf zig-linux-x86_64-0.12.0.tar.xz && \
    mv zig-linux-x86_64-0.12.0 /opt/zig && \
    rm zig-linux-x86_64-0.12.0.tar.xz

ENV PATH="/opt/zig:${PATH}"

WORKDIR /app

# Copy source files
COPY . .

# Build the application
RUN zig build -Doptimize=ReleaseFast

# Expose port
EXPOSE 8080

# Run the application
CMD ["./zig-out/bin/treasury-api"]
