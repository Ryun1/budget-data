use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub tx_hash: String,
    pub slot: i64,
    pub block_number: i64,
    #[sqlx(rename = "block_time")]
    pub block_time: i64,
    pub action_type: Option<String>,
    pub amount: Option<String>,
    pub metadata: Option<serde_json::Value>,
}
