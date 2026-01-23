-- Additional indexes for better query performance

CREATE INDEX IF NOT EXISTS idx_treasury_transactions_instance_id ON treasury_transactions(instance_id);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created_at ON treasury_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones(project_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_project_id ON vendor_contracts(project_id);
