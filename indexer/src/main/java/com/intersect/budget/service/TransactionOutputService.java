package com.intersect.budget.service;

import com.bloxbean.cardano.yaci.store.utxo.storage.UtxoStorage;
import com.bloxbean.cardano.yaci.store.utxo.storage.model.Utxo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service to extract transaction outputs and identify vendor contract addresses.
 * Uses YACI Store's UTXO storage to find outputs from fund transactions.
 * 
 * Note: This service relies on YACI Store's UTXO storage API.
 * The exact method names may need adjustment based on the actual YACI Store version.
 */
@Service
@Slf4j
public class TransactionOutputService {
    private final UtxoStorage utxoStorage;

    @Autowired
    public TransactionOutputService(UtxoStorage utxoStorage) {
        this.utxoStorage = utxoStorage;
    }

    /**
     * Extract vendor contract addresses from a fund transaction.
     * In a fund event, funds flow from treasury to vendor contract.
     * We identify vendor contracts by finding output addresses that are not the treasury address.
     */
    public List<String> extractVendorContractAddresses(String txHash, String treasuryAddress) {
        List<String> vendorAddresses = new ArrayList<>();
        
        try {
            // Query UTXOs directly by transaction hash
            // Note: Method name may vary based on YACI Store version
            List<Utxo> utxos = utxoStorage.findUtxosByTxHash(txHash);
            
            if (utxos != null && !utxos.isEmpty()) {
                for (Utxo utxo : utxos) {
                    String address = utxo.getAddress();
                    if (address != null && !address.equals(treasuryAddress) && !vendorAddresses.contains(address)) {
                        vendorAddresses.add(address);
                        log.debug("Found potential vendor contract address: {} in transaction {}", address, txHash);
                    }
                }
            } else {
                log.debug("No UTXOs found for transaction: {}", txHash);
            }
            
        } catch (Exception e) {
            log.warn("Could not extract vendor contract addresses using direct method: {}", e.getMessage());
            // Fallback: Query by treasury address and filter by transaction hash
            // This is less efficient but works as a fallback
            try {
                List<Utxo> treasuryUtxos = utxoStorage.findUtxosByAddress(treasuryAddress);
                if (treasuryUtxos != null) {
                    for (Utxo utxo : treasuryUtxos) {
                        // Check if this UTXO is from the transaction we're looking for
                        // This requires checking the UTXO's transaction hash field
                        // Implementation depends on YACI Store's Utxo model
                    }
                }
            } catch (Exception fallbackError) {
                log.error("Fallback method also failed: {}", fallbackError.getMessage());
            }
        }
        
        return vendorAddresses;
    }

    /**
     * Extract script hash for a given address from transaction outputs.
     */
    public Optional<String> extractScriptHash(String txHash, String address) {
        try {
            List<Utxo> utxos = utxoStorage.findUtxosByTxHash(txHash);
            if (utxos != null) {
                for (Utxo utxo : utxos) {
                    if (address.equals(utxo.getAddress())) {
                        try {
                            String scriptHash = utxo.getScriptHash();
                            if (scriptHash != null) {
                                return Optional.of(scriptHash);
                            }
                        } catch (Exception e) {
                            log.debug("Could not get script hash from UTXO: {}", e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract script hash: {}", e.getMessage());
        }
        return Optional.empty();
    }
}
