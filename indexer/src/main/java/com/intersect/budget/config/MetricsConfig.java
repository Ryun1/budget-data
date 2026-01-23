package com.intersect.budget.config;

import com.intersect.budget.service.IndexingMetrics;
import com.intersect.budget.service.SlotTracker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Configuration for indexing metrics and health indicators.
 */
@Configuration
@Slf4j
public class MetricsConfig {

    @Bean
    public HealthIndicator indexingHealthIndicator(IndexingMetrics metrics, SlotTracker slotTracker) {
        return () -> {
            long transactionsProcessed = metrics.getTransactionsProcessed();
            long errors = metrics.getErrorsEncountered();
            long currentSlot = slotTracker.getCurrentSlot();
            
            Health.Builder builder = Health.up()
                    .withDetail("transactionsProcessed", transactionsProcessed)
                    .withDetail("projectsCreated", metrics.getProjectsCreated())
                    .withDetail("milestonesCreated", metrics.getMilestonesCreated())
                    .withDetail("vendorContractsDiscovered", metrics.getVendorContractsDiscovered())
                    .withDetail("errors", errors)
                    .withDetail("currentSlot", currentSlot)
                    .withDetail("lastProcessedSlot", slotTracker.getLastProcessedSlot());
            
            // Consider unhealthy if error rate is too high
            if (transactionsProcessed > 0 && errors > transactionsProcessed * 0.1) {
                return builder.down()
                        .withDetail("reason", "High error rate detected")
                        .build();
            }
            
            return builder.build();
        };
    }

    /**
     * Log metrics periodically (every 5 minutes).
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void logMetrics(IndexingMetrics metrics, SlotTracker slotTracker) {
        log.info("Indexing Metrics - Transactions: {}, Projects: {}, Milestones: {}, Vendor Contracts: {}, Errors: {}, Current Slot: {}",
                metrics.getTransactionsProcessed(),
                metrics.getProjectsCreated(),
                metrics.getMilestonesCreated(),
                metrics.getVendorContractsDiscovered(),
                metrics.getErrorsEncountered(),
                slotTracker.getCurrentSlot());
    }
}
