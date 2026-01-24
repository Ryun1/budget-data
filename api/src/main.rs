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
use services::run_sync_loop;

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

    // Spawn background sync task
    let sync_pool = pool.clone();
    tokio::spawn(async move {
        run_sync_loop(sync_pool).await;
    });
    tracing::info!("Background sync task started");

    // Build application routes
    let app = Router::new()
        .route("/health", get(health_check))
        // Legacy routes (still query yaci_store directly for raw TOM transactions)
        .route("/api/transactions", get(transactions::list_transactions))
        .route("/api/transactions/:tx_hash", get(transactions::get_transaction))
        .route("/api/utxos", get(utxos::list_utxos))
        .route("/api/vendor-contracts", get(vendor_contracts::list_vendor_contracts))
        .route("/api/fund-flows", get(fund_flows::list_fund_flows))
        .route("/api/fund", get(fund::list_fund_transactions))
        .route("/api/disburse", get(disburse::list_disburse_transactions))
        .route("/api/withdraw", get(withdraw::list_withdraw_transactions))
        // Updated routes (use new treasury schema)
        .route("/api/balance", get(balance::get_balance))
        .route("/api/stats", get(stats::get_stats))
        // Project routes (use new treasury schema)
        .route("/api/projects", get(projects::list_projects))
        .route("/api/projects/:project_id", get(projects::get_project))
        .route("/api/projects/:project_id/milestones", get(projects::get_project_milestones))
        .route("/api/projects/:project_id/events", get(projects::get_project_events))
        // New treasury routes
        .route("/api/treasury", get(treasury::list_treasury_contracts))
        .route("/api/treasury/:instance", get(treasury::get_treasury_contract))
        // New events route
        .route("/api/events", get(events::list_events))
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
