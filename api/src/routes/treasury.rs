use axum::{
    extract::{Extension, Path},
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

use crate::models::{TreasuryContract, TreasurySummary};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TreasuryUtxo {
    pub tx_hash: String,
    pub output_index: i16,
    pub lovelace_amount: Option<i64>,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
    pub project_id: Option<String>,
}

/// List all treasury contracts with summary stats
pub async fn list_treasury_contracts(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<TreasurySummary>>, StatusCode> {
    let treasuries = sqlx::query_as::<_, TreasurySummary>(
        r#"
        SELECT *
        FROM treasury.v_treasury_summary
        ORDER BY publish_time DESC NULLS LAST
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(treasuries))
}

/// Get a specific treasury contract by instance ID
pub async fn get_treasury_contract(
    Extension(pool): Extension<PgPool>,
    Path(instance): Path<String>,
) -> Result<Json<TreasuryContract>, StatusCode> {
    let treasury = sqlx::query_as::<_, TreasuryContract>(
        r#"
        SELECT *
        FROM treasury.treasury_contracts
        WHERE contract_instance = $1
        "#
    )
    .bind(&instance)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(treasury))
}

/// Get UTXOs for a specific treasury contract instance
pub async fn get_treasury_utxos(
    Extension(pool): Extension<PgPool>,
    Path(instance): Path<String>,
) -> Result<Json<Vec<TreasuryUtxo>>, StatusCode> {
    let utxos = sqlx::query_as::<_, TreasuryUtxo>(
        r#"
        SELECT
            u.tx_hash,
            u.output_index,
            u.lovelace_amount,
            u.slot,
            u.block_number,
            vc.project_id
        FROM treasury.utxos u
        JOIN treasury.vendor_contracts vc ON vc.id = u.vendor_contract_id
        JOIN treasury.treasury_contracts tc ON tc.id = vc.treasury_id
        WHERE tc.contract_instance = $1 AND NOT u.spent
        ORDER BY u.slot DESC
        "#
    )
    .bind(&instance)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(utxos))
}
