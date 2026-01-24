use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct StatsResponse {
    total_transactions: i64,
    total_funds: String,
    active_vendor_contracts: i64,
}

pub async fn get_stats(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<StatsResponse>, StatusCode> {
    // Get total transactions count
    let total_tx_result = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury_transactions"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get total funds (sum of unspent UTXOs)
    let total_funds_result = sqlx::query_as::<_, (i64,)>(
        "SELECT CAST(COALESCE(SUM(lovelace_amount), 0) AS BIGINT) FROM treasury_utxos WHERE is_spent = false"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get active vendor contracts count
    let vendor_contracts_result = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM vendor_contracts WHERE status = 'active'"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let total_funds_lovelace = total_funds_result.0;
    let total_funds = format!("{:.6}", total_funds_lovelace as f64 / 1_000_000.0);

    Ok(Json(StatsResponse {
        total_transactions: total_tx_result.0,
        total_funds,
        active_vendor_contracts: vendor_contracts_result.0,
    }))
}
