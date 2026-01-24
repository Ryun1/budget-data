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
    date_from: Option<String>,
    date_to: Option<String>,
}

pub async fn list_transactions(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<TransactionQuery>,
) -> Result<Json<Vec<Transaction>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = ((page - 1) * limit) as i64;

    // Build query dynamically based on filters
    let mut query = String::from(
        "SELECT tx_hash, slot, block_number, 
         EXTRACT(EPOCH FROM block_time)::bigint as block_time,
         action_type, amount_lovelace::text as amount, metadata
         FROM treasury_transactions"
    );
    
    let mut conditions = Vec::new();
    let mut bind_index = 1;
    
    if let Some(_) = &params.action_type {
        conditions.push(format!("action_type = ${}", bind_index));
        bind_index += 1;
    }
    
    if let Some(_) = &params.date_from {
        conditions.push(format!("block_time >= ${}::timestamp", bind_index));
        bind_index += 1;
    }
    
    if let Some(_) = &params.date_to {
        conditions.push(format!("block_time <= ${}::timestamp", bind_index));
        bind_index += 1;
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(&format!(" ORDER BY slot DESC LIMIT ${} OFFSET ${}", bind_index, bind_index + 1));

    // Execute query with parameters
    let mut query_builder = sqlx::query_as::<_, Transaction>(&query);
    
    if let Some(action_type) = &params.action_type {
        query_builder = query_builder.bind(action_type);
    }
    if let Some(date_from) = &params.date_from {
        query_builder = query_builder.bind(date_from);
    }
    if let Some(date_to) = &params.date_to {
        query_builder = query_builder.bind(date_to);
    }
    query_builder = query_builder.bind(limit as i64).bind(offset);

    let transactions = query_builder
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Database query error: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(transactions))
}

pub async fn get_transaction(
    Extension(pool): Extension<PgPool>,
    Path(tx_hash): Path<String>,
) -> Result<Json<Transaction>, StatusCode> {
    let transaction = sqlx::query_as::<_, Transaction>(
        "SELECT tx_hash, slot, block_number,
         EXTRACT(EPOCH FROM block_time)::bigint as block_time,
         action_type, amount_lovelace::text as amount, metadata
         FROM treasury_transactions
         WHERE tx_hash = $1"
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
