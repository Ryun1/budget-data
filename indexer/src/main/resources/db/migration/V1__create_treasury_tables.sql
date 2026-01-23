-- Treasury Instance table (single row expected)
CREATE TABLE treasury_instance (
    instance_id BIGSERIAL PRIMARY KEY,
    script_hash VARCHAR(64) NOT NULL UNIQUE,
    payment_address VARCHAR(255) NOT NULL UNIQUE,
    stake_address VARCHAR(255),
    label VARCHAR(255),
    description TEXT,
    expiration BIGINT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Contracts table
CREATE TABLE vendor_contracts (
    contract_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    payment_address VARCHAR(255) NOT NULL UNIQUE,
    script_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discovered_from_tx_hash VARCHAR(64) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

-- Projects table
CREATE TABLE projects (
    project_id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL UNIQUE,
    other_identifiers JSONB,
    label VARCHAR(255),
    description TEXT,
    vendor_label VARCHAR(255),
    vendor_details JSONB,
    contract_url TEXT,
    contract_hash VARCHAR(64),
    treasury_instance_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treasury_instance_id) REFERENCES treasury_instance(instance_id)
);

-- Milestones table
CREATE TABLE milestones (
    milestone_id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    description TEXT,
    acceptance_criteria TEXT,
    amount_lovelace BIGINT NOT NULL,
    maturity_slot BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paused_at TIMESTAMP,
    paused_reason TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    UNIQUE(project_id, identifier)
);

-- Treasury Transactions table
CREATE TABLE treasury_transactions (
    tx_id BIGSERIAL PRIMARY KEY,
    tx_hash VARCHAR(64) NOT NULL UNIQUE,
    slot BIGINT NOT NULL,
    block_height BIGINT,
    event_type VARCHAR(50),
    instance_id BIGINT,
    project_id BIGINT,
    metadata JSONB,
    metadata_anchor_url TEXT,
    metadata_anchor_hash VARCHAR(64),
    tx_author VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES treasury_instance(instance_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

-- Treasury Events table
CREATE TABLE treasury_events (
    event_id BIGSERIAL PRIMARY KEY,
    tx_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    project_id BIGINT,
    milestone_id BIGINT,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tx_id) REFERENCES treasury_transactions(tx_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL,
    FOREIGN KEY (milestone_id) REFERENCES milestones(milestone_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_treasury_transactions_tx_hash ON treasury_transactions(tx_hash);
CREATE INDEX idx_treasury_transactions_event_type ON treasury_transactions(event_type);
CREATE INDEX idx_treasury_transactions_project_id ON treasury_transactions(project_id);
CREATE INDEX idx_treasury_transactions_slot ON treasury_transactions(slot);

CREATE INDEX idx_projects_identifier ON projects(identifier);
CREATE INDEX idx_projects_treasury_instance_id ON projects(treasury_instance_id);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_maturity_slot ON milestones(maturity_slot);

CREATE INDEX idx_treasury_events_event_type ON treasury_events(event_type);
CREATE INDEX idx_treasury_events_project_id ON treasury_events(project_id);
CREATE INDEX idx_treasury_events_tx_id ON treasury_events(tx_id);

CREATE INDEX idx_vendor_contracts_payment_address ON vendor_contracts(payment_address);
CREATE INDEX idx_vendor_contracts_project_id ON vendor_contracts(project_id);
