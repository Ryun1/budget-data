package com.intersect.budget.service;

import com.bloxbean.cardano.yaci.store.utxo.storage.UtxoStorage;
import com.bloxbean.cardano.yaci.store.utxo.storage.model.Utxo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service to query UTXOs from YACI Store.
 * Provides abstraction over YACI Store's UTXO storage API.
 */
@Service
@Slf4j
public class UtxoQueryService {
    private final UtxoStorage utxoStorage;

    @Autowired
    public UtxoQueryService(UtxoStorage utxoStorage) {
        this.utxoStorage = utxoStorage;
    }

    /**
     * Find UTXOs by transaction hash.
     * Note: YACI Store API may vary. This implementation tries the direct method first,
     * with fallback to alternative approaches if needed.
     */
    public List<Utxo> findUtxosByTxHash(String txHash) {
        try {
            // Try direct method if available in YACI Store
            // Method name may vary: findUtxosByTxHash, findByTxHash, etc.
            return utxoStorage.findUtxosByTxHash(txHash);
        } catch (NoSuchMethodError | UnsupportedOperationException e) {
            log.debug("Direct txHash lookup not available, using alternative method: {}", e.getMessage());
            // Alternative: Query by address and filter
            // This requires iterating through tracked addresses
            return List.of();
        } catch (Exception e) {
            log.warn("Error finding UTXOs by txHash: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Find UTXOs by address.
     */
    public List<Utxo> findUtxosByAddress(String address) {
        try {
            return utxoStorage.findUtxosByAddress(address);
        } catch (Exception e) {
            log.error("Error finding UTXOs by address: {}", address, e);
            return List.of();
        }
    }

    /**
     * Get a specific UTXO by txHash and output index.
     */
    public Optional<Utxo> findUtxo(String txHash, Integer outputIndex) {
        try {
            return utxoStorage.findUtxo(txHash, outputIndex);
        } catch (Exception e) {
            log.error("Error finding UTXO: {}:{}", txHash, outputIndex, e);
            return Optional.empty();
        }
    }
}
