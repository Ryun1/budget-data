-- Treasury Fund Tracking - Normalized Schema
-- Processes TOM (Treasury Oversight Metadata) events from YACI Store

-- Create treasury schema
CREATE SCHEMA IF NOT EXISTS treasury;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Treasury Contracts (TRSC) - Root treasury reserve contracts
CREATE TABLE IF NOT EXISTS treasury.treasury_contracts (
    id SERIAL PRIMARY KEY,
    contract_instance TEXT UNIQUE NOT NULL,     -- Policy ID (on-chain instance identifier)
    contract_address TEXT,                       -- Script address (addr1x...)
    stake_credential TEXT,                       -- Shared stake credential
    name TEXT,                                   -- Human-readable name/label
    publish_tx_hash VARCHAR(64),                 -- First publish event
    publish_time BIGINT,                         -- Block time of publish
    initialized_tx_hash VARCHAR(64),             -- First initialize event
    initialized_at BIGINT,                       -- Block time of init
    permissions JSONB,                           -- Permission rules from publish metadata
    status TEXT DEFAULT 'active',                -- active/paused
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Contracts (PSSC) - Project-specific contracts linked to treasury
CREATE TABLE IF NOT EXISTS treasury.vendor_contracts (
    id SERIAL PRIMARY KEY,
    treasury_id INT REFERENCES treasury.treasury_contracts(id),
    project_id TEXT UNIQUE NOT NULL,             -- Logical identifier (e.g., "EC-0008-25")
    other_identifiers TEXT[],                    -- Related IDs from otherIdentifiers array
    project_name TEXT,                           -- Label from fund event
    description TEXT,                            -- Project description (joined if array)
    vendor_name TEXT,                            -- vendor.name from metadata
    vendor_address TEXT,                         -- Payment destination (vendor.label in metadata)
    contract_url TEXT,                           -- contract - link to agreement document
    contract_address TEXT,                       -- PSSC script address (from fund tx output)
    fund_tx_hash VARCHAR(64) NOT NULL,           -- Fund transaction
    fund_slot BIGINT,                            -- Blockchain slot
    fund_block_time BIGINT,                      -- Block timestamp
    initial_amount_lovelace BIGINT,              -- Initial funding amount (from tx output)
    status TEXT DEFAULT 'active',                -- active/paused/completed/cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones - Each vendor contract has ordered milestones
CREATE TABLE IF NOT EXISTS treasury.milestones (
    id SERIAL PRIMARY KEY,
    vendor_contract_id INT NOT NULL REFERENCES treasury.vendor_contracts(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL,                  -- Logical identifier (e.g., "m-0")
    milestone_order INT NOT NULL,                -- Position (1, 2, 3...)
    label TEXT,                                  -- Milestone name
    description TEXT,                            -- Detailed description
    acceptance_criteria TEXT,                    -- Completion criteria
    amount_lovelace BIGINT,                      -- Allocated amount (if specified)
    status TEXT DEFAULT 'pending',               -- pending/completed/disbursed
    complete_tx_hash VARCHAR(64),                -- Completion transaction
    complete_time BIGINT,                        -- Completion timestamp
    complete_description TEXT,                   -- Description from complete event
    evidence JSONB,                              -- Evidence array from complete event
    disburse_tx_hash VARCHAR(64),                -- Disbursement transaction
    disburse_time BIGINT,                        -- Disbursement timestamp
    disburse_amount BIGINT,                      -- Actual disbursed amount
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_contract_id, milestone_id)
);

-- Events - Audit log of all TOM events
CREATE TABLE IF NOT EXISTS treasury.events (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(64) UNIQUE NOT NULL,         -- Transaction hash
    slot BIGINT,                                 -- Blockchain slot
    block_number BIGINT,                         -- Block number
    block_time BIGINT,                           -- Block timestamp
    event_type TEXT NOT NULL,                    -- publish/initialize/fund/complete/disburse/etc.
    treasury_id INT REFERENCES treasury.treasury_contracts(id),
    vendor_contract_id INT REFERENCES treasury.vendor_contracts(id),
    milestone_id INT REFERENCES treasury.milestones(id),
    amount_lovelace BIGINT,                      -- Amount involved
    reason TEXT,                                 -- Justification (pause/cancel/modify)
    destination TEXT,                            -- Destination label (disburse)
    metadata JSONB,                              -- Original TOM metadata body
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UTXOs - Track UTXOs at treasury-related addresses
CREATE TABLE IF NOT EXISTS treasury.utxos (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(64) NOT NULL,                -- Transaction hash
    output_index SMALLINT NOT NULL,              -- Output index
    address TEXT NOT NULL,                       -- Owner address
    address_type TEXT,                           -- treasury/vendor_contract/vendor
    vendor_contract_id INT REFERENCES treasury.vendor_contracts(id),
    lovelace_amount BIGINT NOT NULL,             -- Amount
    slot BIGINT NOT NULL,                        -- Creation slot
    block_number BIGINT,                         -- Block number
    spent BOOLEAN DEFAULT FALSE,                 -- Is spent?
    spent_tx_hash VARCHAR(64),                   -- Spending transaction
    spent_slot BIGINT,                           -- When spent
    UNIQUE(tx_hash, output_index)
);

-- Sync Status - Track synchronization progress
CREATE TABLE IF NOT EXISTS treasury.sync_status (
    id SERIAL PRIMARY KEY,
    sync_type TEXT UNIQUE NOT NULL,              -- events/utxos
    last_slot BIGINT DEFAULT 0,                  -- Last processed slot
    last_block BIGINT,                           -- Last processed block
    last_tx_hash VARCHAR(64),                    -- Last processed tx
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial sync status records
INSERT INTO treasury.sync_status (sync_type, last_slot) VALUES ('events', 0), ('utxos', 0)
ON CONFLICT (sync_type) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Treasury contracts
CREATE INDEX IF NOT EXISTS idx_treasury_instance ON treasury.treasury_contracts(contract_instance);
CREATE INDEX IF NOT EXISTS idx_treasury_address ON treasury.treasury_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_treasury_status ON treasury.treasury_contracts(status);

-- Vendor contracts (projects)
CREATE INDEX IF NOT EXISTS idx_vendor_treasury ON treasury.vendor_contracts(treasury_id);
CREATE INDEX IF NOT EXISTS idx_vendor_project_id ON treasury.vendor_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_status ON treasury.vendor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_fund_time ON treasury.vendor_contracts(fund_block_time DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_contract_address ON treasury.vendor_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_vendor_search ON treasury.vendor_contracts
    USING gin (to_tsvector('english', COALESCE(project_name, '') || ' ' || COALESCE(description, '')));

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestone_vendor ON treasury.milestones(vendor_contract_id);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON treasury.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestone_order ON treasury.milestones(vendor_contract_id, milestone_order);

-- Events
CREATE INDEX IF NOT EXISTS idx_event_type ON treasury.events(event_type);
CREATE INDEX IF NOT EXISTS idx_event_vendor ON treasury.events(vendor_contract_id);
CREATE INDEX IF NOT EXISTS idx_event_treasury ON treasury.events(treasury_id);
CREATE INDEX IF NOT EXISTS idx_event_slot ON treasury.events(slot DESC);
CREATE INDEX IF NOT EXISTS idx_event_block_time ON treasury.events(block_time DESC);

-- UTXOs
CREATE INDEX IF NOT EXISTS idx_utxo_address ON treasury.utxos(address);
CREATE INDEX IF NOT EXISTS idx_utxo_vendor ON treasury.utxos(vendor_contract_id);
CREATE INDEX IF NOT EXISTS idx_utxo_unspent ON treasury.utxos(address) WHERE NOT spent;
CREATE INDEX IF NOT EXISTS idx_utxo_slot ON treasury.utxos(slot DESC);

-- ============================================================================
-- TRIGGER FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION treasury.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_treasury_contracts_updated_at
    BEFORE UPDATE ON treasury.treasury_contracts
    FOR EACH ROW EXECUTE FUNCTION treasury.update_updated_at();

CREATE TRIGGER trg_vendor_contracts_updated_at
    BEFORE UPDATE ON treasury.vendor_contracts
    FOR EACH ROW EXECUTE FUNCTION treasury.update_updated_at();

CREATE TRIGGER trg_milestones_updated_at
    BEFORE UPDATE ON treasury.milestones
    FOR EACH ROW EXECUTE FUNCTION treasury.update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Vendor contracts with milestone stats and balance
CREATE OR REPLACE VIEW treasury.v_vendor_contracts_summary AS
SELECT
    vc.id,
    vc.project_id,
    vc.project_name,
    vc.description,
    vc.vendor_name,
    vc.vendor_address,
    vc.contract_address,
    vc.fund_tx_hash,
    vc.fund_slot,
    vc.fund_block_time,
    vc.initial_amount_lovelace,
    vc.status,
    tc.contract_instance as treasury_instance,
    COUNT(m.id) as total_milestones,
    COUNT(m.id) FILTER (WHERE m.status IN ('completed', 'disbursed')) as completed_milestones,
    COUNT(m.id) FILTER (WHERE m.status = 'disbursed') as disbursed_milestones,
    COALESCE(SUM(u.lovelace_amount) FILTER (WHERE NOT u.spent), 0)::BIGINT as current_balance,
    COUNT(u.id) FILTER (WHERE NOT u.spent) as utxo_count
FROM treasury.vendor_contracts vc
LEFT JOIN treasury.treasury_contracts tc ON tc.id = vc.treasury_id
LEFT JOIN treasury.milestones m ON m.vendor_contract_id = vc.id
LEFT JOIN treasury.utxos u ON u.vendor_contract_id = vc.id
GROUP BY vc.id, tc.contract_instance;

-- Milestone timeline with vendor context
CREATE OR REPLACE VIEW treasury.v_milestone_timeline AS
SELECT
    m.id,
    m.milestone_id,
    m.milestone_order,
    m.label,
    m.description,
    m.acceptance_criteria,
    m.amount_lovelace,
    m.status,
    m.complete_tx_hash,
    m.complete_time,
    m.complete_description,
    m.evidence,
    m.disburse_tx_hash,
    m.disburse_time,
    m.disburse_amount,
    vc.project_id,
    vc.project_name,
    vc.vendor_address
FROM treasury.milestones m
JOIN treasury.vendor_contracts vc ON vc.id = m.vendor_contract_id
ORDER BY vc.project_id, m.milestone_order;

-- Recent events with full context
CREATE OR REPLACE VIEW treasury.v_recent_events AS
SELECT
    e.id,
    e.tx_hash,
    e.slot,
    e.block_number,
    e.block_time,
    e.event_type,
    e.amount_lovelace,
    e.reason,
    e.destination,
    e.metadata,
    e.created_at,
    tc.contract_instance as treasury_instance,
    vc.project_id,
    vc.project_name,
    m.label as milestone_label,
    m.milestone_order
FROM treasury.events e
LEFT JOIN treasury.treasury_contracts tc ON tc.id = e.treasury_id
LEFT JOIN treasury.vendor_contracts vc ON vc.id = e.vendor_contract_id
LEFT JOIN treasury.milestones m ON m.id = e.milestone_id
ORDER BY e.slot DESC;

-- Treasury summary stats
CREATE OR REPLACE VIEW treasury.v_treasury_summary AS
SELECT
    tc.id as treasury_id,
    tc.contract_instance,
    tc.contract_address,
    tc.name,
    tc.status,
    tc.publish_time,
    tc.initialized_at,
    COUNT(DISTINCT vc.id) as vendor_contract_count,
    COUNT(DISTINCT vc.id) FILTER (WHERE vc.status = 'active') as active_contracts,
    COALESCE(SUM(u.lovelace_amount) FILTER (WHERE NOT u.spent AND u.address = tc.contract_address), 0)::BIGINT as treasury_balance,
    (SELECT COUNT(*) FROM treasury.events WHERE treasury_id = tc.id) as total_events
FROM treasury.treasury_contracts tc
LEFT JOIN treasury.vendor_contracts vc ON vc.treasury_id = tc.id
LEFT JOIN treasury.utxos u ON u.address = tc.contract_address
GROUP BY tc.id;
