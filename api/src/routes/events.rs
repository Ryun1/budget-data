use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::EventWithContext;

#[derive(Debug, Deserialize)]
pub struct EventsQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    #[serde(rename = "type")]
    pub event_type: Option<String>,
    pub project_id: Option<String>,
}

/// List all TOM events with full context
pub async fn list_events(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<EventsQuery>,
) -> Result<Json<Vec<EventWithContext>>, StatusCode> {
    let limit = params.limit.unwrap_or(50).min(100) as i64;
    let offset = ((params.page.unwrap_or(1).max(1) - 1) as i64) * limit;

    let events = match (&params.event_type, &params.project_id) {
        (Some(event_type), Some(project_id)) => {
            sqlx::query_as::<_, EventWithContext>(
                r#"
                SELECT *
                FROM treasury.v_recent_events
                WHERE event_type = $1 AND project_id = $2
                ORDER BY slot DESC
                LIMIT $3 OFFSET $4
                "#
            )
            .bind(event_type)
            .bind(project_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&pool)
            .await
        }
        (Some(event_type), None) => {
            sqlx::query_as::<_, EventWithContext>(
                r#"
                SELECT *
                FROM treasury.v_recent_events
                WHERE event_type = $1
                ORDER BY slot DESC
                LIMIT $2 OFFSET $3
                "#
            )
            .bind(event_type)
            .bind(limit)
            .bind(offset)
            .fetch_all(&pool)
            .await
        }
        (None, Some(project_id)) => {
            sqlx::query_as::<_, EventWithContext>(
                r#"
                SELECT *
                FROM treasury.v_recent_events
                WHERE project_id = $1
                ORDER BY slot DESC
                LIMIT $2 OFFSET $3
                "#
            )
            .bind(project_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&pool)
            .await
        }
        (None, None) => {
            sqlx::query_as::<_, EventWithContext>(
                r#"
                SELECT *
                FROM treasury.v_recent_events
                ORDER BY slot DESC
                LIMIT $1 OFFSET $2
                "#
            )
            .bind(limit)
            .bind(offset)
            .fetch_all(&pool)
            .await
        }
    };

    events.map(Json).map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })
}
