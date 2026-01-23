package com.intersect.budget.listener;

import com.bloxbean.cardano.yaci.store.utxo.events.AddressUtxoEvent;
import com.intersect.budget.service.TreasuryIndexingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listener for AddressUtxoEvent to track UTXO changes for treasury and vendor contracts.
 * This complements the metadata event listener by tracking UTXO movements.
 */
@Component
@Slf4j
public class AddressUtxoListener {
    private final TreasuryIndexingService indexingService;

    @Autowired
    public AddressUtxoListener(TreasuryIndexingService indexingService) {
        this.indexingService = indexingService;
    }

    @EventListener
    @Async
    public void handleAddressUtxoEvent(AddressUtxoEvent addressUtxoEvent) {
        try {
            String address = addressUtxoEvent.getAddress();
            
            // Check if this address is being tracked (treasury or vendor contract)
            if (indexingService.isTrackedAddress(address)) {
                log.debug("UTXO update for tracked address: {} - TxHash: {}, Slot: {}", 
                    address, addressUtxoEvent.getTxHash(), addressUtxoEvent.getSlot());
                
                // Additional processing can be done here if needed
                // For example, tracking balance changes, etc.
            }
        } catch (Exception e) {
            log.error("Error handling address UTXO event", e);
        }
    }
}
