package com.intersect.budget.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class LoggingConfig {
    
    @Bean
    public LoggerContext loggerContext() {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        
        // Configure root logger
        Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
        rootLogger.setLevel(Level.INFO);
        
        // Configure application logger
        Logger appLogger = context.getLogger("com.intersect.budget");
        appLogger.setLevel(Level.DEBUG);
        appLogger.setAdditive(false);
        
        return context;
    }
}
