-- Add metadata tracking fields for better querying

-- Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created_at_desc ON treasury_transactions(created_at DESC);

-- Add index on event_type and created_at for filtered queries
CREATE INDEX IF NOT EXISTS idx_treasury_events_type_created ON treasury_events(event_type, created_at DESC);

-- Add index on project status for milestone queries
CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones(project_id, status);

-- Add comment columns for better documentation
COMMENT ON TABLE treasury_instance IS 'Single Treasury Reserve Contract (TRSC) instance';
COMMENT ON TABLE vendor_contracts IS 'Vendor contract addresses discovered from fund events';
COMMENT ON TABLE projects IS 'Funded projects with vendor information and milestones';
COMMENT ON TABLE milestones IS 'Project milestones with status tracking';
COMMENT ON TABLE treasury_transactions IS 'All treasury-related transactions with parsed metadata';
COMMENT ON TABLE treasury_events IS 'Detailed event log for audit trail';
