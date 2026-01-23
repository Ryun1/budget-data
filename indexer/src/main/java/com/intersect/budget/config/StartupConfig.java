package com.intersect.budget.config;

import com.intersect.budget.service.TreasuryIndexingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for application startup.
 * Ensures treasury contract address is registered for tracking.
 */
@Configuration
@Slf4j
public class StartupConfig {

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Value("${treasury.contract.script-hash}")
    private String treasuryScriptHash;

    @Bean
    public CommandLineRunner initializeTracking(TreasuryIndexingService indexingService) {
        return args -> {
            log.info("Initializing treasury contract tracking");
            log.info("Treasury Payment Address: {}", treasuryPaymentAddress);
            log.info("Treasury Script Hash: {}", treasuryScriptHash);
            
            // The treasury address is already registered in TreasuryIndexingService constructor
            // This is just for logging confirmation
            if (indexingService.isTrackedAddress(treasuryPaymentAddress)) {
                log.info("✓ Treasury contract address is registered for tracking");
            } else {
                log.warn("⚠ Treasury contract address is not registered - this should not happen");
            }
        };
    }
}
