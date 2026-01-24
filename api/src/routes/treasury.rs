use axum::{
    extract::{Extension, Path},
    http::StatusCode,
    response::Json,
};
use sqlx::PgPool;

use crate::models::{TreasuryContract, TreasurySummary};

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
