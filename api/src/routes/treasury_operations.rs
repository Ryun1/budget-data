use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

/// Treasury operation (TOM event) from metadata
/// Extracted from transaction metadata with label 1694
/// Includes all TOM events: fund, disburse, withdraw, initialize, complete, pause, resume, modify, cancel, sweep
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TreasuryOperation {
    pub tx_hash: String,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub block_time: Option<i64>,
    /// Action type from TOM metadata (fund, disburse, withdraw, etc.)
    pub action_type: Option<String>,
    /// Destination from metadata body
    pub destination: Option<String>,
    /// Full TOM metadata
    pub metadata: Option<serde_json::Value>,
}

/// List treasury operations extracted from TOM metadata
/// Shows all TOM events including fund, disburse, withdraw, initialize, complete, etc.
pub async fn list_treasury_operations(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<TreasuryOperation>>, StatusCode> {
    let operations = sqlx::query_as::<_, TreasuryOperation>(
        r#"
        SELECT
            m.tx_hash,
            m.slot,
            b.number as block_number,
            b.block_time,
            m.body::jsonb->'body'->>'event' as action_type,
            m.body::jsonb->'body'->'destination'->>'label' as destination,
            m.body::jsonb as metadata
        FROM yaci_store.transaction_metadata m
        LEFT JOIN yaci_store.block b ON m.slot = b.slot
        WHERE m.label = '1694'
        ORDER BY m.slot DESC
        LIMIT 100
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(operations))
}
