package com.intersect.budget.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import com.bloxbean.cardano.yaci.store.utxo.storage.UtxoStorage;
import com.bloxbean.cardano.yaci.store.transaction.storage.TransactionStorage;

/**
 * Configuration for YACI Store beans.
 * These beans are typically auto-configured by YACI Store starters,
 * but we provide this as a fallback if needed.
 */
@Configuration
public class YaciStoreBeanConfig {
    
    // YACI Store starters should auto-configure these beans
    // This configuration is provided as documentation and fallback
    
    // UtxoStorage and TransactionStorage are provided by:
    // - yaci-store-utxo-spring-boot-starter
    // - yaci-store-transaction-spring-boot-starter
}
