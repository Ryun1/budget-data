use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VendorContract {
    pub id: i64,
    pub contract_address: String,
    pub vendor_name: Option<String>,
    pub project_name: Option<String>,
    pub project_code: Option<String>,
    pub treasury_contract_address: Option<String>,
    pub current_balance_lovelace: i64,
    pub status: String,
    pub created_at_slot: Option<i64>,
}

pub async fn list_vendor_contracts(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<VendorContract>>, StatusCode> {
    let contracts = sqlx::query_as::<_, VendorContract>(
        "SELECT id, contract_address, vendor_name, project_name, project_code,
         treasury_contract_address, current_balance_lovelace, status, created_at_slot
         FROM vendor_contracts
         ORDER BY created_at_slot DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(contracts))
}
