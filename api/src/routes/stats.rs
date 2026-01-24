use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct StatsResponse {
    /// Number of TOM events
    tom_transactions: i64,
    /// Total balance in treasury UTXOs (ADA)
    total_balance: String,
    /// Total balance in lovelace
    total_balance_lovelace: i64,
    /// Number of unique treasury addresses tracked
    treasury_addresses: i64,
    /// Latest synced block number
    latest_block: Option<i64>,
    /// Number of projects (vendor contracts)
    project_count: i64,
    /// Number of milestones across all projects
    milestone_count: i64,
}

pub async fn get_stats(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<StatsResponse>, StatusCode> {
    // Get TOM events count from treasury schema
    let tom_events = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.events"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get total balance from treasury UTXOs (unspent)
    let total_balance = sqlx::query_as::<_, (i64,)>(
        "SELECT CAST(COALESCE(SUM(lovelace_amount), 0) AS BIGINT) FROM treasury.utxos WHERE NOT spent"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get count of unique addresses
    let addresses_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(DISTINCT address) FROM treasury.utxos"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get latest synced block
    let latest_block = sqlx::query_as::<_, (Option<i64>,)>(
        "SELECT last_block FROM treasury.sync_status WHERE sync_type = 'events'"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get project count
    let project_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.vendor_contracts"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get milestone count
    let milestone_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.milestones"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let lovelace = total_balance.0;
    let balance_str = format!("{:.6}", lovelace as f64 / 1_000_000.0);

    Ok(Json(StatsResponse {
        tom_transactions: tom_events.0,
        total_balance: balance_str,
        total_balance_lovelace: lovelace,
        treasury_addresses: addresses_count.0,
        latest_block: latest_block.0,
        project_count: project_count.0,
        milestone_count: milestone_count.0,
    }))
}
