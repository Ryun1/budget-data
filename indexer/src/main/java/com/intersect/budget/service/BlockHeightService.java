package com.intersect.budget.service;

import com.bloxbean.cardano.yaci.store.transaction.storage.TransactionStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service to retrieve block height for transactions.
 * Uses YACI Store's transaction storage to get block information.
 */
@Service
@Slf4j
public class BlockHeightService {
    private final TransactionStorage transactionStorage;

    @Autowired
    public BlockHeightService(TransactionStorage transactionStorage) {
        this.transactionStorage = transactionStorage;
    }

    /**
     * Get block height for a transaction.
     */
    public Optional<Long> getBlockHeight(String txHash) {
        try {
            var txOpt = transactionStorage.findByTxHash(txHash);
            if (txOpt.isPresent()) {
                // Extract block height from transaction
                // Adjust based on YACI Store's Tx model structure
                return Optional.of(txOpt.get().getBlockHeight());
            }
        } catch (Exception e) {
            log.debug("Could not get block height for transaction: {}", txHash);
        }
        return Optional.empty();
    }
}
