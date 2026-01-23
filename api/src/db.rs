use std::env;
use std::sync::Arc;
use tokio_postgres::{Client, NoTls};

pub type DbPool = Arc<Client>;

pub async fn create_pool() -> Result<DbPool, tokio_postgres::Error> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/treasury_data".to_string());

    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;

    // Spawn connection handler
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    Ok(Arc::new(client))
}
