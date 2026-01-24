use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::Transaction;

#[derive(Deserialize)]
pub struct DisburseQuery {
    page: Option<u32>,
    limit: Option<u32>,
}

/// List Disburse transactions (TOM action type = 'disburse')
pub async fn list_disburse_transactions(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<DisburseQuery>,
) -> Result<Json<Vec<Transaction>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = ((page - 1) * limit) as i64;

    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT
            m.tx_hash,
            m.slot,
            b.number as block_number,
            b.block_time,
            m.body::jsonb->'body'->>'event' as action_type,
            m.body::jsonb as metadata
        FROM yaci_store.transaction_metadata m
        LEFT JOIN yaci_store.block b ON m.slot = b.slot
        WHERE m.label = '1694'
          AND LOWER(m.body::jsonb->'body'->>'event') = 'disburse'
        ORDER BY m.slot DESC
        LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit as i64)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(transactions))
}
