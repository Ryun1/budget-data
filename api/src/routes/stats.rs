use axum::{
    extract::Extension,
    http::StatusCode,
    response::Json,
};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct TableStats {
    /// Table name
    table_name: String,
    /// Approximate row count
    row_count: i64,
    /// Total size including indexes (bytes)
    total_size_bytes: i64,
    /// Human-readable size
    total_size: String,
}

#[derive(Serialize)]
pub struct DatabaseStats {
    /// Stats for yaci_store schema (indexer data)
    yaci_store: Vec<TableStats>,
    /// Stats for treasury schema (processed data)
    treasury: Vec<TableStats>,
    /// Total size of yaci_store schema
    yaci_store_total_size: String,
    /// Total size of treasury schema
    treasury_total_size: String,
}

#[derive(Serialize)]
pub struct StatsResponse {
    /// Number of TOM events
    tom_transactions: i64,
    /// Total balance in treasury UTXOs (ADA)
    total_balance: String,
    /// Total balance in lovelace
    total_balance_lovelace: i64,
    /// Number of unique treasury addresses tracked
    treasury_addresses: i64,
    /// Latest synced block number
    latest_block: Option<i64>,
    /// Number of projects (vendor contracts)
    project_count: i64,
    /// Number of milestones across all projects
    milestone_count: i64,
    /// Database storage statistics
    database: DatabaseStats,
}

pub async fn get_stats(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<StatsResponse>, StatusCode> {
    // Get TOM events count from treasury schema
    let tom_events = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.events"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get total balance from treasury UTXOs (unspent)
    let total_balance = sqlx::query_as::<_, (i64,)>(
        "SELECT CAST(COALESCE(SUM(lovelace_amount), 0) AS BIGINT) FROM treasury.utxos WHERE NOT spent"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get count of unique addresses
    let addresses_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(DISTINCT address) FROM treasury.utxos"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get latest synced block
    let latest_block = sqlx::query_as::<_, (Option<i64>,)>(
        "SELECT last_block FROM treasury.sync_status WHERE sync_type = 'events'"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get project count
    let project_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.vendor_contracts"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get milestone count
    let milestone_count = sqlx::query_as::<_, (i64,)>(
        "SELECT COUNT(*) FROM treasury.milestones"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let lovelace = total_balance.0;
    let balance_str = format!("{:.6}", lovelace as f64 / 1_000_000.0);

    // Get database stats for yaci_store schema
    let yaci_store_stats = get_schema_stats(&pool, "yaci_store").await?;

    // Get database stats for treasury schema
    let treasury_stats = get_schema_stats(&pool, "treasury").await?;

    // Calculate total sizes
    let yaci_total: i64 = yaci_store_stats.iter().map(|t| t.total_size_bytes).sum();
    let treasury_total: i64 = treasury_stats.iter().map(|t| t.total_size_bytes).sum();

    Ok(Json(StatsResponse {
        tom_transactions: tom_events.0,
        total_balance: balance_str,
        total_balance_lovelace: lovelace,
        treasury_addresses: addresses_count.0,
        latest_block: latest_block.0,
        project_count: project_count.0,
        milestone_count: milestone_count.0,
        database: DatabaseStats {
            yaci_store: yaci_store_stats,
            treasury: treasury_stats,
            yaci_store_total_size: format_size(yaci_total),
            treasury_total_size: format_size(treasury_total),
        },
    }))
}

/// Get table statistics for a schema
async fn get_schema_stats(pool: &PgPool, schema: &str) -> Result<Vec<TableStats>, StatusCode> {
    let query = r#"
        SELECT
            t.tablename::text as table_name,
            COALESCE(c.reltuples::bigint, 0) as row_count,
            pg_total_relation_size(quote_ident($1) || '.' || quote_ident(t.tablename))::bigint as total_size_bytes
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
            AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $1)
        WHERE t.schemaname = $1
        ORDER BY total_size_bytes DESC
    "#;

    let rows = sqlx::query_as::<_, (String, i64, i64)>(query)
        .bind(schema)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            tracing::error!("Database stats query error: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(rows
        .into_iter()
        .map(|(table_name, row_count, total_size_bytes)| TableStats {
            table_name,
            row_count,
            total_size_bytes,
            total_size: format_size(total_size_bytes),
        })
        .collect())
}

/// Format bytes into human-readable size
fn format_size(bytes: i64) -> String {
    const KB: i64 = 1024;
    const MB: i64 = KB * 1024;
    const GB: i64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}
