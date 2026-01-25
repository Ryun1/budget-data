#!/bin/sh
set -e

# Convert Render's postgres:// URL to JDBC format
# Render provides: postgres://user:password@host:port/database
# Spring needs: jdbc:postgresql://host:port/database (with user/pass separate)

if [ -n "$SPRING_DATASOURCE_URL" ]; then
    # Parse the connection string
    # Format: postgres://user:password@host:port/database or postgresql://...

    # Remove the protocol prefix
    URL_WITHOUT_PROTOCOL=$(echo "$SPRING_DATASOURCE_URL" | sed 's|^postgres://||' | sed 's|^postgresql://||')

    # Extract user:password (everything before @)
    USER_PASS=$(echo "$URL_WITHOUT_PROTOCOL" | sed 's|@.*||')

    # Extract host:port/database (everything after @)
    HOST_PORT_DB=$(echo "$URL_WITHOUT_PROTOCOL" | sed 's|.*@||')

    # Build JDBC URL (without credentials)
    JDBC_URL="jdbc:postgresql://${HOST_PORT_DB}?currentSchema=yaci_store"

    # Extract username and password if not already set
    if [ -z "$SPRING_DATASOURCE_USERNAME" ]; then
        SPRING_DATASOURCE_USERNAME=$(echo "$USER_PASS" | sed 's|:.*||')
        export SPRING_DATASOURCE_USERNAME
    fi

    if [ -z "$SPRING_DATASOURCE_PASSWORD" ]; then
        SPRING_DATASOURCE_PASSWORD=$(echo "$USER_PASS" | sed 's|[^:]*:||')
        export SPRING_DATASOURCE_PASSWORD
    fi

    export SPRING_DATASOURCE_URL="$JDBC_URL"
    echo "Configured database: ${HOST_PORT_DB}"
fi

# Copy template to config
cp /app/config/application.properties.template /app/config/application.properties

# Start YACI Store
exec java $JAVA_OPTS -jar /app/yaci-store.jar --spring.config.location=file:/app/config/application.properties
