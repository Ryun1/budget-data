use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::Transaction;

#[derive(Deserialize)]
pub struct TransactionQuery {
    page: Option<u32>,
    limit: Option<u32>,
    action_type: Option<String>,
}

/// List TOM transactions (transactions with label 1694 metadata)
pub async fn list_transactions(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<TransactionQuery>,
) -> Result<Json<Vec<Transaction>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = ((page - 1) * limit) as i64;

    let transactions = if let Some(action_type) = &params.action_type {
        // Filter by action type extracted from metadata body (cast text to jsonb)
        sqlx::query_as::<_, Transaction>(
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
              AND LOWER(m.body::jsonb->'body'->>'event') = LOWER($1)
            ORDER BY m.slot DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(action_type)
        .bind(limit as i64)
        .bind(offset)
        .fetch_all(&pool)
        .await
    } else {
        // Return all TOM transactions (cast text to jsonb)
        sqlx::query_as::<_, Transaction>(
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
            ORDER BY m.slot DESC
            LIMIT $1 OFFSET $2
            "#
        )
        .bind(limit as i64)
        .bind(offset)
        .fetch_all(&pool)
        .await
    };

    transactions
        .map(Json)
        .map_err(|e| {
            tracing::error!("Database query error: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

/// Get a specific TOM transaction by hash
pub async fn get_transaction(
    Extension(pool): Extension<PgPool>,
    Path(tx_hash): Path<String>,
) -> Result<Json<Transaction>, StatusCode> {
    let transaction = sqlx::query_as::<_, Transaction>(
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
        WHERE m.label = '1694' AND m.tx_hash = $1
        "#
    )
    .bind(&tx_hash)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(transaction))
}
