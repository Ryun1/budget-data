# Vendor Contract Extraction

## Overview

When a "fund" event occurs, the treasury contract sends funds to a vendor contract. The vendor contract address needs to be extracted from the transaction outputs and registered for future tracking.

## Implementation

### Process Flow

1. **Metadata Event**: When a transaction with TOM metadata (key 1694) is detected
2. **Event Type Check**: If the event type is "fund"
3. **UTXO Query**: Query UTXOs created by the transaction
4. **Address Filtering**: Filter out treasury address, identify vendor contract addresses
5. **Registration**: Register vendor contract addresses for tracking

### Components

- `TransactionOutputExtractor`: Extracts vendor contract addresses from transaction outputs
- `UtxoQueryService`: Abstraction layer over YACI Store UTXO storage
- `TreasuryContractListener`: Listens for metadata events and triggers extraction
- `TreasuryIndexingService`: Registers vendor contracts in the database

### YACI Store Integration

The implementation uses YACI Store's `UtxoStorage` to query UTXOs. The exact API methods may vary:

- Preferred: `findUtxosByTxHash(txHash)` - Direct lookup
- Fallback: Query by address and filter by transaction hash

### Database Storage

Vendor contracts are stored in the `vendor_contracts` table with:
- `payment_address`: The vendor contract payment address
- `script_hash`: Script hash if available
- `project_id`: Link to the funded project
- `discovered_from_tx_hash`: Transaction where it was discovered

## Future Enhancements

- Batch processing for multiple vendor contracts in one transaction
- Script hash validation
- Address format validation
- Retry logic for failed extractions
