use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct StatsResponse {
    /// Number of TOM transactions (with label 1694 metadata)
    tom_transactions: i64,
    /// Total balance in treasury UTXOs (ADA)
    total_balance: String,
    /// Total balance in lovelace
    total_balance_lovelace: i64,
    /// Number of unique treasury addresses tracked
    treasury_addresses: i64,
    /// Latest synced block number
    latest_block: Option<i64>,
}

pub async fn get_stats(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<StatsResponse>, StatusCode> {
    // Get TOM transactions count (label 1694 metadata)
    let tom_tx_result = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(DISTINCT tx_hash) FROM yaci_store.transaction_metadata WHERE label = '1694'"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get total funds (sum of treasury UTXOs)
    let total_funds_result = sqlx::query_as::<_, (i64,)>(
        "SELECT CAST(COALESCE(SUM(lovelace_amount), 0) AS BIGINT) FROM yaci_store.address_utxo"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get count of unique treasury addresses
    let addresses_result = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(DISTINCT owner_addr) FROM yaci_store.address_utxo"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get latest block number
    let latest_block_result = sqlx::query_as::<_, (Option<i64>,)>(
        "SELECT MAX(number) FROM yaci_store.block"
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
        tom_transactions: tom_tx_result.0,
        total_balance: total_funds,
        total_balance_lovelace: total_funds_lovelace,
        treasury_addresses: addresses_result.0,
        latest_block: latest_block_result.0,
    }))
}
