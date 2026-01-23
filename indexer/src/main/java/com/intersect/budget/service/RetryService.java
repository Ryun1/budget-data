package com.intersect.budget.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

/**
 * Service for retrying operations that may fail transiently.
 * Useful for network operations or database queries that might temporarily fail.
 */
@Service
@Slf4j
public class RetryService {
    
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    /**
     * Execute an operation with retry logic.
     */
    public <T> T executeWithRetry(Supplier<T> operation, String operationName) {
        int attempts = 0;
        Exception lastException = null;

        while (attempts < MAX_RETRIES) {
            try {
                return operation.get();
            } catch (Exception e) {
                lastException = e;
                attempts++;
                if (attempts < MAX_RETRIES) {
                    log.warn("Operation {} failed, retrying ({}/{})", operationName, attempts, MAX_RETRIES);
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempts); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Retry interrupted", ie);
                    }
                }
            }
        }

        log.error("Operation {} failed after {} attempts", operationName, MAX_RETRIES);
        throw new RuntimeException("Operation failed after retries: " + operationName, lastException);
    }

    /**
     * Execute a void operation with retry logic.
     */
    public void executeWithRetry(Runnable operation, String operationName) {
        executeWithRetry(() -> {
            operation.run();
            return null;
        }, operationName);
    }
}
