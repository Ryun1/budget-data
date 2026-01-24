use axum::{
    extract::Extension,
    http::Method,
    routing::get,
    Router,
};
use sqlx::PgPool;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber;

mod routes;
mod db;
mod models;
mod services;

use routes::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Database connection with retry logic
    // Default to port 5433 to avoid conflict with local PostgreSQL on 5432
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5433/treasury_data".to_string());
    
    tracing::info!("Connecting to database: {}", database_url);
    
    // Retry connection up to 5 times with exponential backoff
    let mut pool = None;
    for attempt in 1..=5 {
        match PgPool::connect(&database_url).await {
            Ok(p) => {
                pool = Some(p);
                break;
            }
            Err(e) => {
                if attempt == 5 {
                    tracing::error!("Failed to connect to database after 5 attempts: {}", e);
                    return Err(e.into());
                }
                let delay = std::time::Duration::from_secs(2_u64.pow(attempt));
                tracing::warn!("Database connection attempt {} failed: {}. Retrying in {:?}...", attempt, e, delay);
                tokio::time::sleep(delay).await;
            }
        }
    }
    
    let pool = pool.expect("Pool should be initialized after retries");
    tracing::info!("Database connection established");

    // Run migrations (if using sqlx migrations)
    // sqlx::migrate!("./migrations").run(&pool).await?;

    // Build application routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/transactions", get(transactions::list_transactions))
        .route("/api/transactions/:tx_hash", get(transactions::get_transaction))
        .route("/api/utxos", get(utxos::list_utxos))
        .route("/api/balance", get(balance::get_balance))
        .route("/api/vendor-contracts", get(vendor_contracts::list_vendor_contracts))
        .route("/api/fund-flows", get(fund_flows::list_fund_flows))
        .route("/api/stats", get(stats::get_stats))
        .route("/api/fund", get(fund::list_fund_transactions))
        .route("/api/disburse", get(disburse::list_disburse_transactions))
        .route("/api/withdraw", get(withdraw::list_withdraw_transactions))
        .layer(Extension(pool))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST])
                .allow_headers(Any),
        );

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
