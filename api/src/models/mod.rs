use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// ============================================================================
// Treasury Contracts (TRSC)
// ============================================================================

/// Treasury contract from treasury.treasury_contracts
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TreasuryContract {
    pub id: i32,
    pub contract_instance: String,
    pub contract_address: Option<String>,
    pub stake_credential: Option<String>,
    pub name: Option<String>,
    pub publish_tx_hash: Option<String>,
    pub publish_time: Option<i64>,
    pub initialized_tx_hash: Option<String>,
    pub initialized_at: Option<i64>,
    pub permissions: Option<serde_json::Value>,
    pub status: Option<String>,
}

/// Treasury summary from treasury.v_treasury_summary view
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TreasurySummary {
    pub treasury_id: i32,
    pub contract_instance: String,
    pub contract_address: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>,
    pub publish_time: Option<i64>,
    pub initialized_at: Option<i64>,
    pub vendor_contract_count: Option<i64>,
    pub active_contracts: Option<i64>,
    pub treasury_balance: Option<i64>,
    pub total_events: Option<i64>,
}

// ============================================================================
// Vendor Contracts (PSSC) / Projects
// ============================================================================

/// Vendor contract (project) from treasury.vendor_contracts
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: i32,
    pub project_id: String,
    pub project_name: Option<String>,
    pub description: Option<String>,
    pub vendor_name: Option<String>,
    pub vendor_address: Option<String>,
    pub contract_address: Option<String>,
    pub fund_tx_hash: String,
    pub fund_slot: Option<i64>,
    pub fund_block_time: Option<i64>,
    pub initial_amount_lovelace: Option<i64>,
    pub status: Option<String>,
}

/// Project summary from treasury.v_vendor_contracts_summary view
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectSummary {
    pub id: i32,
    pub project_id: String,
    pub project_name: Option<String>,
    pub description: Option<String>,
    pub vendor_name: Option<String>,
    pub vendor_address: Option<String>,
    pub contract_address: Option<String>,
    pub fund_tx_hash: String,
    pub fund_slot: Option<i64>,
    pub fund_block_time: Option<i64>,
    pub initial_amount_lovelace: Option<i64>,
    pub status: Option<String>,
    pub treasury_instance: Option<String>,
    pub total_milestones: Option<i64>,
    pub completed_milestones: Option<i64>,
    pub disbursed_milestones: Option<i64>,
    pub current_balance: Option<i64>,
    pub utxo_count: Option<i64>,
}

// ============================================================================
// Milestones
// ============================================================================

/// Milestone from treasury.milestones
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Milestone {
    pub id: i32,
    pub vendor_contract_id: i32,
    pub milestone_id: String,
    pub milestone_order: i32,
    pub label: Option<String>,
    pub description: Option<String>,
    pub acceptance_criteria: Option<String>,
    pub amount_lovelace: Option<i64>,
    pub status: String,
    pub complete_tx_hash: Option<String>,
    pub complete_time: Option<i64>,
    pub complete_description: Option<String>,
    pub evidence: Option<serde_json::Value>,
    pub disburse_tx_hash: Option<String>,
    pub disburse_time: Option<i64>,
    pub disburse_amount: Option<i64>,
}

/// Milestone for API response (without internal IDs)
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MilestoneResponse {
    pub project_id: String,
    pub milestone_id: String,
    pub milestone_order: i32,
    pub label: Option<String>,
    pub description: Option<String>,
    pub acceptance_criteria: Option<String>,
    pub amount_lovelace: Option<i64>,
    pub status: String,
    pub complete_tx_hash: Option<String>,
    pub complete_time: Option<i64>,
    pub complete_description: Option<String>,
    pub evidence: Option<serde_json::Value>,
    pub disburse_tx_hash: Option<String>,
    pub disburse_time: Option<i64>,
    pub disburse_amount: Option<i64>,
}

// ============================================================================
// Events
// ============================================================================

/// TOM event from treasury.events
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: i32,
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub block_time: Option<i64>,
    pub event_type: String,
    pub treasury_id: Option<i32>,
    pub vendor_contract_id: Option<i32>,
    pub milestone_id: Option<i32>,
    pub amount_lovelace: Option<i64>,
    pub reason: Option<String>,
    pub destination: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Event from treasury.v_recent_events view with full context
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct EventWithContext {
    pub id: i32,
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub block_time: Option<i64>,
    pub event_type: String,
    pub amount_lovelace: Option<i64>,
    pub reason: Option<String>,
    pub destination: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub treasury_instance: Option<String>,
    pub project_id: Option<String>,
    pub project_name: Option<String>,
    pub milestone_label: Option<String>,
    pub milestone_order: Option<i32>,
}

/// Project event for API response
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectEvent {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_time: Option<i64>,
    pub event_type: String,
    pub milestone_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

// ============================================================================
// UTXOs
// ============================================================================

/// UTXO from treasury.utxos
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Utxo {
    pub id: i32,
    pub tx_hash: String,
    pub output_index: i16,
    pub address: Option<String>,
    pub address_type: Option<String>,
    pub vendor_contract_id: Option<i32>,
    pub lovelace_amount: Option<i64>,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub spent: bool,
    pub spent_tx_hash: Option<String>,
    pub spent_slot: Option<i64>,
}

/// Project UTXO for API response
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProjectUtxo {
    pub tx_hash: String,
    pub output_index: i16,
    pub lovelace_amount: Option<i64>,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
}

// ============================================================================
// API Response Types
// ============================================================================

/// Full project detail response
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDetail {
    pub project: ProjectSummary,
    pub milestones: Vec<MilestoneResponse>,
    pub events: Vec<ProjectEvent>,
    pub utxos: Vec<ProjectUtxo>,
}

/// Stats response
#[derive(Debug, Serialize, Deserialize)]
pub struct Stats {
    pub tom_transactions: i64,
    pub total_balance: String,
    pub total_balance_lovelace: i64,
    pub treasury_addresses: i64,
    pub latest_block: Option<i64>,
    pub project_count: i64,
    pub milestone_count: i64,
}

/// Balance response
#[derive(Debug, Serialize, Deserialize)]
pub struct Balance {
    pub balance: String,
    pub lovelace: i64,
}

// ============================================================================
// Legacy Types (kept for backward compatibility with old routes)
// ============================================================================

/// TOM transaction from yaci_store (for /api/transactions)
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub block_time: Option<i64>,
    pub action_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Treasury address for /api/treasury-contracts
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TreasuryAddress {
    pub address: String,
    pub stake_credential: Option<String>,
    pub balance_lovelace: i64,
    pub utxo_count: i64,
    pub latest_slot: Option<i64>,
}
