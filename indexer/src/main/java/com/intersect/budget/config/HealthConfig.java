package com.intersect.budget.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class HealthConfig {

    @Bean
    public HealthIndicator databaseHealthIndicator(DataSource dataSource) {
        return () -> {
            try (Connection connection = dataSource.getConnection()) {
                if (connection.isValid(1)) {
                    return Health.up()
                            .withDetail("database", "Available")
                            .build();
                } else {
                    return Health.down()
                            .withDetail("database", "Unavailable")
                            .build();
                }
            } catch (Exception e) {
                return Health.down()
                        .withDetail("database", "Error: " + e.getMessage())
                        .build();
            }
        };
    }
}
