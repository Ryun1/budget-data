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
