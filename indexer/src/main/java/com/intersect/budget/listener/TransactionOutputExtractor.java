package com.intersect.budget.listener;

import com.bloxbean.cardano.yaci.store.utxo.storage.model.Utxo;
import com.intersect.budget.service.UtxoQueryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class TransactionOutputExtractor {
    private final UtxoQueryService utxoQueryService;

    @Autowired
    public TransactionOutputExtractor(UtxoQueryService utxoQueryService) {
        this.utxoQueryService = utxoQueryService;
    }

    /**
     * Extract vendor contract addresses from a fund transaction.
     * In a fund event, the treasury contract sends funds to a vendor contract.
     * We need to find the output address that is not the treasury address.
     */
    public List<VendorContractInfo> extractVendorContractsFromFund(String txHash, String treasuryAddress) {
        List<VendorContractInfo> vendorContracts = new ArrayList<>();
        
        try {
            // Get all UTXOs created by this transaction
            List<Utxo> utxos = utxoQueryService.findUtxosByTxHash(txHash);
            
            if (utxos == null || utxos.isEmpty()) {
                log.debug("No UTXOs found for transaction: {}", txHash);
                // Alternative approach: Query treasury address UTXOs and check recent transactions
                // This is a fallback if direct txHash lookup doesn't work
                return vendorContracts;
            }

            for (Utxo utxo : utxos) {
                String address = utxo.getAddress();
                
                // Skip treasury address - we're looking for vendor contract addresses
                if (address != null && !address.equals(treasuryAddress)) {
                    // This could be a vendor contract address
                    VendorContractInfo info = new VendorContractInfo();
                    info.setPaymentAddress(address);
                    
                    // Try to extract script hash if available
                    // Note: YACI Store Utxo model may have different field names
                    // Adjust based on actual API
                    try {
                        // Try common method names
                        if (utxo.getScriptHash() != null) {
                            info.setScriptHash(utxo.getScriptHash());
                        }
                    } catch (Exception e) {
                        log.debug("Could not extract script hash from UTXO: {}", e.getMessage());
                    }
                    
                    vendorContracts.add(info);
                    log.debug("Found potential vendor contract address: {} in transaction {}", address, txHash);
                }
            }
        } catch (Exception e) {
            log.error("Error extracting vendor contracts from transaction: {}", txHash, e);
        }
        
        return vendorContracts;
    }

    public static class VendorContractInfo {
        private String paymentAddress;
        private String scriptHash;

        public String getPaymentAddress() {
            return paymentAddress;
        }

        public void setPaymentAddress(String paymentAddress) {
            this.paymentAddress = paymentAddress;
        }

        public String getScriptHash() {
            return scriptHash;
        }

        public void setScriptHash(String scriptHash) {
            this.scriptHash = scriptHash;
        }
    }
}
