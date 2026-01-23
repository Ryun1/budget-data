package com.intersect.budget.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.intersect.budget.repository")
@EnableTransactionManagement
public class DatabaseConfig {
    // Database configuration handled by Spring Boot auto-configuration
}
