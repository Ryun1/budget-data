use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::{MilestoneResponse, ProjectDetail, ProjectEvent, ProjectSummary, ProjectUtxo};

/// Get UTXOs for a specific project
pub async fn get_project_utxos(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<ProjectUtxo>>, StatusCode> {
    let utxos = sqlx::query_as::<_, ProjectUtxo>(
        r#"
        SELECT
            u.tx_hash,
            u.output_index,
            u.lovelace_amount,
            u.slot,
            u.block_number
        FROM treasury.utxos u
        JOIN treasury.vendor_contracts vc ON vc.id = u.vendor_contract_id
        WHERE vc.project_id = $1 AND NOT u.spent
        ORDER BY u.slot DESC
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(utxos))
}

#[derive(Debug, Deserialize)]
pub struct ProjectsQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
}

// =============================================================================
// Projects API
// =============================================================================
// "Projects" is the user-facing term for what are internally called "vendor contracts"
// (PSSC - Payment Streaming Smart Contracts) in the database.
// The treasury.vendor_contracts table stores these records.
// =============================================================================

/// List all projects (vendor contracts) from the normalized treasury schema
pub async fn list_projects(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<ProjectsQuery>,
) -> Result<Json<Vec<ProjectSummary>>, StatusCode> {
    let limit = params.limit.unwrap_or(50).min(100) as i64;
    let offset = ((params.page.unwrap_or(1).max(1) - 1) as i64) * limit;

    let projects = if let Some(search) = params.search {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, ProjectSummary>(
            r#"
            SELECT *
            FROM treasury.v_vendor_contracts_summary
            WHERE project_id ILIKE $1
               OR project_name ILIKE $1
               OR description ILIKE $1
            ORDER BY fund_block_time DESC NULLS LAST
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(&search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await
    } else {
        sqlx::query_as::<_, ProjectSummary>(
            r#"
            SELECT *
            FROM treasury.v_vendor_contracts_summary
            ORDER BY fund_block_time DESC NULLS LAST
            LIMIT $1 OFFSET $2
            "#
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await
    };

    projects.map(Json).map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })
}

/// Get a specific project by its project_id
pub async fn get_project(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<ProjectDetail>, StatusCode> {
    // Fetch project from the summary view
    let project = sqlx::query_as::<_, ProjectSummary>(
        r#"
        SELECT *
        FROM treasury.v_vendor_contracts_summary
        WHERE project_id = $1
        "#
    )
    .bind(&project_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Fetch milestones
    let milestones = sqlx::query_as::<_, MilestoneResponse>(
        r#"
        SELECT
            vc.project_id,
            m.milestone_id,
            m.milestone_order,
            m.label,
            m.description,
            m.acceptance_criteria,
            m.amount_lovelace,
            m.status,
            m.complete_tx_hash,
            m.complete_time,
            m.complete_description,
            m.evidence,
            m.disburse_tx_hash,
            m.disburse_time,
            m.disburse_amount
        FROM treasury.milestones m
        JOIN treasury.vendor_contracts vc ON vc.id = m.vendor_contract_id
        WHERE vc.project_id = $1
        ORDER BY m.milestone_order
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Fetch events
    let events = sqlx::query_as::<_, ProjectEvent>(
        r#"
        SELECT
            e.tx_hash,
            e.slot,
            e.block_time,
            e.event_type,
            m.milestone_id,
            e.metadata
        FROM treasury.events e
        JOIN treasury.vendor_contracts vc ON vc.id = e.vendor_contract_id
        LEFT JOIN treasury.milestones m ON m.id = e.milestone_id
        WHERE vc.project_id = $1
        ORDER BY e.slot DESC
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Fetch UTXOs
    let utxos = sqlx::query_as::<_, ProjectUtxo>(
        r#"
        SELECT
            u.tx_hash,
            u.output_index,
            u.lovelace_amount,
            u.slot,
            u.block_number
        FROM treasury.utxos u
        JOIN treasury.vendor_contracts vc ON vc.id = u.vendor_contract_id
        WHERE vc.project_id = $1 AND NOT u.spent
        ORDER BY u.slot DESC
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(ProjectDetail {
        project,
        milestones,
        events,
        utxos,
    }))
}

/// Get milestones for a specific project
pub async fn get_project_milestones(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<MilestoneResponse>>, StatusCode> {
    let milestones = sqlx::query_as::<_, MilestoneResponse>(
        r#"
        SELECT
            vc.project_id,
            m.milestone_id,
            m.milestone_order,
            m.label,
            m.description,
            m.acceptance_criteria,
            m.amount_lovelace,
            m.status,
            m.complete_tx_hash,
            m.complete_time,
            m.complete_description,
            m.evidence,
            m.disburse_tx_hash,
            m.disburse_time,
            m.disburse_amount
        FROM treasury.milestones m
        JOIN treasury.vendor_contracts vc ON vc.id = m.vendor_contract_id
        WHERE vc.project_id = $1
        ORDER BY m.milestone_order
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(milestones))
}

/// Get events for a specific project
pub async fn get_project_events(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<ProjectEvent>>, StatusCode> {
    let events = sqlx::query_as::<_, ProjectEvent>(
        r#"
        SELECT
            e.tx_hash,
            e.slot,
            e.block_time,
            e.event_type,
            m.milestone_id,
            e.metadata
        FROM treasury.events e
        JOIN treasury.vendor_contracts vc ON vc.id = e.vendor_contract_id
        LEFT JOIN treasury.milestones m ON m.id = e.milestone_id
        WHERE vc.project_id = $1
        ORDER BY e.slot DESC
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(events))
}
