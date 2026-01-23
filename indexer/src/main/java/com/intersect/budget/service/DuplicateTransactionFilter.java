package com.intersect.budget.service;

import com.intersect.budget.repository.TreasuryTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to filter duplicate transactions.
 * Uses both database checks and in-memory cache for performance.
 */
@Service
@Slf4j
public class DuplicateTransactionFilter {
    private final TreasuryTransactionRepository transactionRepository;
    
    // In-memory cache of recently processed transactions
    private final Set<String> recentTransactions = ConcurrentHashMap.newKeySet();

    @Autowired
    public DuplicateTransactionFilter(TreasuryTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Check if transaction has already been processed.
     */
    public boolean isDuplicate(String txHash) {
        // Check in-memory cache first (fast)
        if (recentTransactions.contains(txHash)) {
            return true;
        }

        // Check database (slower but authoritative)
        boolean exists = transactionRepository.findByTxHash(txHash).isPresent();
        
        if (exists) {
            // Add to cache
            recentTransactions.add(txHash);
        }
        
        return exists;
    }

    /**
     * Mark transaction as processed.
     */
    public void markAsProcessed(String txHash) {
        recentTransactions.add(txHash);
        
        // Limit cache size to prevent memory issues
        if (recentTransactions.size() > 10000) {
            // Clear oldest entries (simple approach - could use LRU cache)
            recentTransactions.clear();
        }
    }
}
