use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Utxo {
    pub tx_hash: String,
    pub output_index: i32,
    pub owner_addr: String,
    pub lovelace_amount: i64,
    pub slot: i64,
    pub is_spent: bool,
}

pub async fn list_utxos(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Utxo>>, StatusCode> {
    let utxos = sqlx::query_as::<_, Utxo>(
        "SELECT tx_hash, output_index, owner_addr, lovelace_amount, slot, is_spent
         FROM treasury_utxos
         WHERE is_spent = false
         ORDER BY slot DESC
         LIMIT 100"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(utxos))
}
