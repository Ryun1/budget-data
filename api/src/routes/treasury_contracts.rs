use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

/// Treasury address with aggregated balance
/// Note: With plugin filtering, only treasury-related addresses are stored
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TreasuryAddress {
    /// Bech32 address
    pub address: String,
    /// Stake credential (shared across treasury contracts)
    pub stake_credential: Option<String>,
    /// Total balance in lovelace
    pub balance_lovelace: i64,
    /// Number of UTXOs at this address
    pub utxo_count: i64,
    /// Most recent slot with activity
    pub latest_slot: Option<i64>,
}

/// List treasury contract addresses with aggregated balances
/// These are addresses filtered by the YACI Store plugin to only include
/// addresses with the treasury stake credential
pub async fn list_treasury_contracts(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<TreasuryAddress>>, StatusCode> {
    let addresses = sqlx::query_as::<_, TreasuryAddress>(
        r#"
        SELECT
            owner_addr as address,
            owner_stake_credential as stake_credential,
            SUM(lovelace_amount)::bigint as balance_lovelace,
            COUNT(*)::bigint as utxo_count,
            MAX(slot) as latest_slot
        FROM yaci_store.address_utxo
        GROUP BY owner_addr, owner_stake_credential
        ORDER BY balance_lovelace DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(addresses))
}
