use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct BalanceResponse {
    balance: String,
    lovelace: i64,
}

pub async fn get_balance(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<BalanceResponse>, StatusCode> {
    // Get balance from treasury_utxos table (unspent UTXOs)
    let result = sqlx::query_as::<_, (i64,)>(
        "SELECT CAST(COALESCE(SUM(lovelace_amount), 0) AS BIGINT) as total
         FROM treasury_utxos
         WHERE is_spent = false"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let lovelace = result.0;
    let balance = format!("{:.6}", lovelace as f64 / 1_000_000.0);

    Ok(Json(BalanceResponse {
        balance,
        lovelace,
    }))
}
