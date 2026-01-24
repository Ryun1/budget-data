use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// TOM (Treasury Oversight Metadata) transaction
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub block_time: Option<i64>,
    /// Action type extracted from TOM metadata body
    pub action_type: Option<String>,
    /// Full TOM metadata body (JSON)
    pub metadata: Option<serde_json::Value>,
}

/// TOM metadata record from YACI Store
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TomMetadata {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub label: String,
    pub body: Option<serde_json::Value>,
}

/// Vendor contract (PSSC) project summary
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub project_id: String,
    pub project_name: Option<String>,
    pub description: Option<String>,
    pub vendor_address: Option<String>,
    pub milestone_count: i32,
    pub contract_instance: Option<String>,
    pub fund_tx_hash: String,
    pub created_slot: Option<i64>,
    pub created_time: Option<i64>,
    pub created_block: Option<i64>,
    /// Contract address (PSSC address) where funds are held
    #[sqlx(default)]
    pub contract_address: Option<String>,
}

/// Project with computed balance and milestone progress
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectWithStats {
    #[serde(flatten)]
    pub project: Project,
    pub balance_lovelace: Option<i64>,
    pub utxo_count: Option<i64>,
    pub completed_milestones: Option<i64>,
    pub disbursed_milestones: Option<i64>,
}

/// Milestone with status tracking
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Milestone {
    pub project_id: String,
    pub milestone_id: String,
    pub milestone_label: Option<String>,
    pub acceptance_criteria: Option<String>,
    pub milestone_order: i32,
    pub status: String,  // pending, completed, disbursed
    pub complete_tx_hash: Option<String>,
    pub complete_time: Option<i64>,
    pub disburse_tx_hash: Option<String>,
    pub disburse_time: Option<i64>,
}

/// Project event (fund, complete, disburse, etc.)
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectEvent {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_time: Option<i64>,
    pub event_type: Option<String>,
    pub milestone_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// UTXO at a project's vendor address
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectUtxo {
    pub tx_hash: String,
    pub output_index: i16,
    pub lovelace_amount: i64,
    pub slot: i64,
    pub block_number: Option<i64>,
}

/// Full project detail response
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDetail {
    pub project: Project,
    pub balance_lovelace: i64,
    pub utxo_count: i64,
    pub milestones: Vec<Milestone>,
    pub events: Vec<ProjectEvent>,
    pub utxos: Vec<ProjectUtxo>,
}
