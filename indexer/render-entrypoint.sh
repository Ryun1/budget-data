#!/bin/sh
set -e

# Convert Render's postgres:// URL to JDBC format
# Render provides: postgres://user:password@host:port/database
# Spring needs: jdbc:postgresql://host:port/database

if [ -n "$SPRING_DATASOURCE_URL" ]; then
    # Extract components from Render URL
    # Remove postgres:// prefix and convert to jdbc:postgresql://
    JDBC_URL=$(echo "$SPRING_DATASOURCE_URL" | sed 's|^postgres://|jdbc:postgresql://|' | sed 's|^postgresql://|jdbc:postgresql://|')

    # Add schema parameter (POSIX compatible check)
    case "$JDBC_URL" in
        *"?"*)
            JDBC_URL="${JDBC_URL}&currentSchema=yaci_store"
            ;;
        *)
            JDBC_URL="${JDBC_URL}?currentSchema=yaci_store"
            ;;
    esac

    export SPRING_DATASOURCE_URL="$JDBC_URL"
    echo "Configured database URL"
fi

# Copy template to config
cp /app/config/application.properties.template /app/config/application.properties

# Start YACI Store
exec java $JAVA_OPTS -jar /app/yaci-store.jar --spring.config.location=file:/app/config/application.properties
