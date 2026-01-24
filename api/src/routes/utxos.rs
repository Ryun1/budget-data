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
    pub output_index: i16,
    pub owner_addr: Option<String>,
    pub lovelace_amount: Option<i64>,
    pub slot: Option<i64>,
    pub block_number: Option<i64>,
}

pub async fn list_utxos(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Utxo>>, StatusCode> {
    // Query from yaci_store.address_utxo (already filtered to treasury addresses by plugin)
    let utxos = sqlx::query_as::<_, Utxo>(
        "SELECT tx_hash, output_index, owner_addr, lovelace_amount, slot, block as block_number
         FROM yaci_store.address_utxo
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
