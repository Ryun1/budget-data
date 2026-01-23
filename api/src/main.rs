use axum::{
    routing::get,
    Router,
};
use std::env;
use tower_http::cors::CorsLayer;

mod db;
mod handlers;
mod models;
mod query_params;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8080);

    tracing::info!("Starting Treasury API server on port {}", port);

    // Create database connection pool
    let db_pool = match db::create_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            tracing::error!("Failed to create database pool: {}", e);
            std::process::exit(1);
        }
    };

    // Build application routes
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/treasury", get(handlers::get_treasury))
        .route("/api/projects", get(handlers::get_projects))
        .route("/api/projects/:id", get(handlers::get_project_detail))
        .route("/api/transactions", get(handlers::get_transactions))
        .route("/api/transactions/:hash", get(handlers::get_transaction_detail))
        .route("/api/milestones", get(handlers::get_milestones))
        .route("/api/vendor-contracts", get(handlers::get_vendor_contracts))
        .route("/api/events", get(handlers::get_events))
        .layer(CorsLayer::permissive())
        .with_state(db_pool);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    tracing::info!("Server listening on http://0.0.0.0:{}", port);

    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    r#"{"status":"ok"}"#
}
