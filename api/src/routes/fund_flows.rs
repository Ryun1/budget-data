use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FundFlow {
    pub id: i64,
    pub tx_hash: String,
    pub slot: i64,
    pub block_time: chrono::DateTime<chrono::Utc>,
    pub source_address: String,
    pub destination_address: String,
    pub amount_lovelace: i64,
    pub flow_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

pub async fn list_fund_flows(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<FundFlow>>, StatusCode> {
    let flows = sqlx::query_as::<_, FundFlow>(
        "SELECT id, tx_hash, slot, block_time, source_address, destination_address,
         amount_lovelace, flow_type, metadata
         FROM fund_flows
         ORDER BY slot DESC
         LIMIT 100"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(flows))
}
