package com.intersect.budget.listener;

import com.bloxbean.cardano.yaci.store.events.EventMetadata;
import com.bloxbean.cardano.yaci.store.metadata.event.MetadataEvent;
import com.bloxbean.cardano.yaci.store.transaction.events.TransactionEvent;
import com.bloxbean.cardano.yaci.store.utxo.events.UtxoEvent;
import com.intersect.budget.listener.TransactionOutputExtractor.VendorContractInfo;
import com.intersect.budget.service.SlotTracker;
import com.intersect.budget.service.TreasuryIndexingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class TreasuryContractListener {
    private final TreasuryIndexingService indexingService;
    private final TransactionOutputExtractor outputExtractor;
    private final SlotTracker slotTracker;

    @Value("${treasury.contract.payment-address}")
    private String treasuryPaymentAddress;

    @Value("${treasury.contract.script-hash}")
    private String treasuryScriptHash;

    @Autowired
    public TreasuryContractListener(
            TreasuryIndexingService indexingService,
            TransactionOutputExtractor outputExtractor,
            SlotTracker slotTracker) {
        this.indexingService = indexingService;
        this.outputExtractor = outputExtractor;
        this.slotTracker = slotTracker;
    }

    @EventListener
    @Async
    public void handleTransactionEvent(TransactionEvent transactionEvent) {
        try {
            String txHash = transactionEvent.getTxHash();
            Long slot = transactionEvent.getSlot();
            Long blockHeight = transactionEvent.getBlockHeight();

            // Check if this transaction involves tracked addresses
            // We'll process metadata events separately, but we can check UTXOs here
            log.debug("Received transaction event: {} at slot {}", txHash, slot);
        } catch (Exception e) {
            log.error("Error handling transaction event", e);
        }
    }

    @EventListener
    @Async
    public void handleUtxoEvent(UtxoEvent utxoEvent) {
        try {
            // Check if UTXO involves treasury or vendor contract addresses
            utxoEvent.getUtxoUpdates().forEach(utxoUpdate -> {
                String address = utxoUpdate.getAddress();
                
                if (indexingService.isTrackedAddress(address)) {
                    log.debug("UTXO update for tracked address: {}", address);
                    // Extract vendor contract address from fund event outputs
                    // This would require checking the transaction outputs
                }
            });
        } catch (Exception e) {
            log.error("Error handling UTXO event", e);
        }
    }

    @EventListener
    @Async
    public void handleMetadataEvent(MetadataEvent metadataEvent) {
        try {
            String txHash = metadataEvent.getTxHash();
            Long slot = metadataEvent.getSlot();
            Map<String, Object> metadata = metadataEvent.getMetadata();

            if (metadata == null || metadata.isEmpty()) {
                return;
            }

            // Check if metadata contains key 1694 (TOM metadata)
            if (!metadata.containsKey("1694")) {
                return;
            }

            log.debug("Processing metadata event for transaction: {}", txHash);

            // Get block height if available
            Long blockHeight = null;
            try {
                // Try to get block height from transaction event if available
                // This may need adjustment based on YACI Store event structure
            } catch (Exception e) {
                log.debug("Could not extract block height: {}", e.getMessage());
            }
            
            // Process the transaction with metadata
            Long projectId = indexingService.processTransaction(txHash, slot, blockHeight, metadata);

            // If this is a fund event, extract vendor contract addresses from outputs
            try {
                Object metadataValue = metadata.get("1694");
                if (metadataValue instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> metadataMap = (Map<String, Object>) metadataValue;
                    Object body = metadataMap.get("body");
                    if (body instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> bodyMap = (Map<String, Object>) body;
                        Object event = bodyMap.get("event");
                        if ("fund".equals(event) && projectId != null) {
                            // Extract vendor contract addresses from transaction outputs
                            // This happens after the project is created, so we have the projectId
                            List<VendorContractInfo> vendorContracts = 
                                outputExtractor.extractVendorContractsFromFund(txHash, treasuryPaymentAddress);
                            
                            if (vendorContracts.isEmpty()) {
                                log.debug("No vendor contracts found in transaction outputs for: {}", txHash);
                            } else {
                                for (VendorContractInfo vendorInfo : vendorContracts) {
                                    indexingService.registerVendorContract(
                                        vendorInfo.getPaymentAddress(),
                                        vendorInfo.getScriptHash(),
                                        projectId,
                                        txHash
                                    );
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to extract vendor contract addresses from transaction: {}", txHash, e);
            }

            // Mark slot as processed
            slotTracker.markProcessed(slot);

        } catch (Exception e) {
            log.error("Error handling metadata event", e);
        }
    }

}
