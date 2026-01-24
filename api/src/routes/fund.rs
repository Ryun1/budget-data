use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::Transaction;

#[derive(Deserialize)]
pub struct FundQuery {
    page: Option<u32>,
    limit: Option<u32>,
    #[allow(dead_code)]
    date_from: Option<String>,
    #[allow(dead_code)]
    date_to: Option<String>,
}

pub async fn list_fund_transactions(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<FundQuery>,
) -> Result<Json<Vec<Transaction>>, StatusCode> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = ((page - 1) * limit) as i64;

    // Build query with optional date filters
    let mut query = String::from(
        "SELECT tx_hash, slot, block_number,
         EXTRACT(EPOCH FROM block_time)::bigint as block_time,
         action_type, amount_lovelace::text as amount, metadata
         FROM treasury_transactions
         WHERE action_type = 'Fund'"
    );
    
    let mut bind_index = 1;
    if params.date_from.is_some() || params.date_to.is_some() {
        if let Some(_) = &params.date_from {
            query.push_str(&format!(" AND block_time >= ${}::timestamp", bind_index));
            bind_index += 1;
        }
        if let Some(_) = &params.date_to {
            query.push_str(&format!(" AND block_time <= ${}::timestamp", bind_index));
            bind_index += 1;
        }
    }
    
    query.push_str(&format!(" ORDER BY slot DESC LIMIT ${} OFFSET ${}", bind_index, bind_index + 1));

    let mut query_builder = sqlx::query_as::<_, Transaction>(&query);
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
