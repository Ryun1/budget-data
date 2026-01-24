use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::models::{Milestone, Project, ProjectDetail, ProjectEvent, ProjectUtxo};

#[derive(Debug, Deserialize)]
pub struct ProjectsQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
}

/// List all vendor contracts (projects) extracted from fund transactions
pub async fn list_projects(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<ProjectsQuery>,
) -> Result<Json<Vec<Project>>, StatusCode> {
    let limit = params.limit.unwrap_or(50).min(100) as i64;
    let offset = ((params.page.unwrap_or(1).max(1) - 1) as i64) * limit;

    let projects = if let Some(search) = params.search {
        let search_pattern = format!("%{}%", search);
        sqlx::query_as::<_, Project>(
            r#"
            SELECT
                m.body::jsonb->'body'->>'identifier' as project_id,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'label') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'label') elem)
                         ELSE m.body::jsonb->'body'->>'label'
                    END, ''
                ) as project_name,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'description') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'description') elem)
                         ELSE m.body::jsonb->'body'->>'description'
                    END, ''
                ) as description,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'vendor'->'label') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'vendor'->'label') elem)
                         ELSE m.body::jsonb->'body'->'vendor'->'label'->>0
                    END, ''
                ) as vendor_address,
                COALESCE(jsonb_array_length(m.body::jsonb->'body'->'milestones'), 0)::int as milestone_count,
                m.body::jsonb->>'instance' as contract_instance,
                m.tx_hash as fund_tx_hash,
                m.slot as created_slot,
                b.block_time as created_time,
                b.number as created_block,
                NULL::text as contract_address
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'fund'
              AND (
                  m.body::jsonb->'body'->>'identifier' ILIKE $1
                  OR m.body::jsonb->'body'->>'label' ILIKE $1
              )
            ORDER BY m.slot DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(&search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await
    } else {
        sqlx::query_as::<_, Project>(
            r#"
            SELECT
                m.body::jsonb->'body'->>'identifier' as project_id,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'label') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'label') elem)
                         ELSE m.body::jsonb->'body'->>'label'
                    END, ''
                ) as project_name,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'description') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'description') elem)
                         ELSE m.body::jsonb->'body'->>'description'
                    END, ''
                ) as description,
                COALESCE(
                    CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'vendor'->'label') = 'array'
                         THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'vendor'->'label') elem)
                         ELSE m.body::jsonb->'body'->'vendor'->'label'->>0
                    END, ''
                ) as vendor_address,
                COALESCE(jsonb_array_length(m.body::jsonb->'body'->'milestones'), 0)::int as milestone_count,
                m.body::jsonb->>'instance' as contract_instance,
                m.tx_hash as fund_tx_hash,
                m.slot as created_slot,
                b.block_time as created_time,
                b.number as created_block,
                NULL::text as contract_address
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'fund'
            ORDER BY m.slot DESC
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

/// Get a specific project by its identifier
pub async fn get_project(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<ProjectDetail>, StatusCode> {
    // Fetch project info with contract address from fund tx output
    let project = sqlx::query_as::<_, Project>(
        r#"
        SELECT
            m.body::jsonb->'body'->>'identifier' as project_id,
            COALESCE(
                CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'label') = 'array'
                     THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'label') elem)
                     ELSE m.body::jsonb->'body'->>'label'
                END, ''
            ) as project_name,
            COALESCE(
                CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'description') = 'array'
                     THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'description') elem)
                     ELSE m.body::jsonb->'body'->>'description'
                END, ''
            ) as description,
            COALESCE(
                CASE WHEN jsonb_typeof(m.body::jsonb->'body'->'vendor'->'label') = 'array'
                     THEN (SELECT string_agg(elem::text, '') FROM jsonb_array_elements_text(m.body::jsonb->'body'->'vendor'->'label') elem)
                     ELSE m.body::jsonb->'body'->'vendor'->'label'->>0
                END, ''
            ) as vendor_address,
            COALESCE(jsonb_array_length(m.body::jsonb->'body'->'milestones'), 0)::int as milestone_count,
            m.body::jsonb->>'instance' as contract_instance,
            m.tx_hash as fund_tx_hash,
            m.slot as created_slot,
            b.block_time as created_time,
            b.number as created_block,
            u.owner_addr as contract_address
        FROM yaci_store.transaction_metadata m
        LEFT JOIN yaci_store.block b ON m.slot = b.slot
        LEFT JOIN yaci_store.address_utxo u ON m.tx_hash = u.tx_hash AND u.owner_addr LIKE 'addr1x%'
        WHERE m.label = '1694'
          AND LOWER(m.body::jsonb->'body'->>'event') = 'fund'
          AND m.body::jsonb->'body'->>'identifier' = $1
        ORDER BY m.slot ASC
        LIMIT 1
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

    // Fetch milestones with status from complete/disburse events
    let milestones = sqlx::query_as::<_, Milestone>(
        r#"
        WITH fund_milestones AS (
            SELECT
                m.body::jsonb->'body'->>'identifier' as project_id,
                milestone.value->>'identifier' as milestone_id,
                milestone.value->>'label' as milestone_label,
                COALESCE(
                    milestone.value->>'acceptanceCriteria',
                    milestone.value->'acceptanceCriteria'->>0
                ) as acceptance_criteria,
                milestone.ordinality::int as milestone_order
            FROM yaci_store.transaction_metadata m,
                 jsonb_array_elements(m.body::jsonb->'body'->'milestones')
                 WITH ORDINALITY as milestone(value, ordinality)
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'fund'
              AND m.body::jsonb->'body'->>'identifier' = $1
        ),
        complete_events AS (
            SELECT
                m.body::jsonb->'body'->>'milestone' as milestone_id,
                m.tx_hash as complete_tx_hash,
                b.block_time as complete_time
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'complete'
              AND m.body::jsonb->'body'->>'identifier' = $1
        ),
        disburse_events AS (
            SELECT
                m.body::jsonb->'body'->>'milestone' as milestone_id,
                m.tx_hash as disburse_tx_hash,
                b.block_time as disburse_time
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'disburse'
              AND m.body::jsonb->'body'->>'identifier' = $1
        )
        SELECT
            fm.project_id,
            fm.milestone_id,
            fm.milestone_label,
            fm.acceptance_criteria,
            fm.milestone_order,
            CASE
                WHEN de.disburse_tx_hash IS NOT NULL THEN 'disbursed'
                WHEN ce.complete_tx_hash IS NOT NULL THEN 'completed'
                ELSE 'pending'
            END as status,
            ce.complete_tx_hash,
            ce.complete_time,
            de.disburse_tx_hash,
            de.disburse_time
        FROM fund_milestones fm
        LEFT JOIN complete_events ce ON fm.milestone_id = ce.milestone_id
        LEFT JOIN disburse_events de ON fm.milestone_id = de.milestone_id
        ORDER BY fm.milestone_order
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Fetch all events for this project
    let events = sqlx::query_as::<_, ProjectEvent>(
        r#"
        SELECT
            m.tx_hash,
            m.slot,
            b.block_time,
            m.body::jsonb->'body'->>'event' as event_type,
            m.body::jsonb->'body'->>'milestone' as milestone_id,
            m.body::jsonb as metadata
        FROM yaci_store.transaction_metadata m
        LEFT JOIN yaci_store.block b ON m.slot = b.slot
        WHERE m.label = '1694'
          AND m.body::jsonb->'body'->>'identifier' = $1
        ORDER BY m.slot DESC
        "#
    )
    .bind(&project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database query error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Fetch UTXOs - first at contract address (project's locked funds), then at vendor address (disbursed)
    let (utxos, balance_lovelace, utxo_count) = {
        let mut all_utxos = Vec::new();

        // Get UTXOs at contract address that came from the fund transaction
        if let Some(ref contract_addr) = project.contract_address {
            let contract_utxos = sqlx::query_as::<_, ProjectUtxo>(
                r#"
                SELECT
                    tx_hash,
                    output_index::smallint,
                    lovelace_amount,
                    slot,
                    block as block_number
                FROM yaci_store.address_utxo
                WHERE owner_addr = $1
                  AND tx_hash = $2
                ORDER BY slot DESC
                "#
            )
            .bind(contract_addr)
            .bind(&project.fund_tx_hash)
            .fetch_all(&pool)
            .await
            .map_err(|e| {
                tracing::error!("Database query error: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
            all_utxos.extend(contract_utxos);
        }

        // Also get UTXOs at vendor address (disbursed funds)
        if let Some(ref vendor_addr) = project.vendor_address {
            if !vendor_addr.is_empty() {
                let vendor_utxos = sqlx::query_as::<_, ProjectUtxo>(
                    r#"
                    SELECT
                        tx_hash,
                        output_index::smallint,
                        lovelace_amount,
                        slot,
                        block as block_number
                    FROM yaci_store.address_utxo
                    WHERE owner_addr = $1
                    ORDER BY slot DESC
                    "#
                )
                .bind(vendor_addr)
                .fetch_all(&pool)
                .await
                .map_err(|e| {
                    tracing::error!("Database query error: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                all_utxos.extend(vendor_utxos);
            }
        }

        let balance: i64 = all_utxos.iter().map(|u| u.lovelace_amount).sum();
        let count = all_utxos.len() as i64;
        (all_utxos, balance, count)
    };

    Ok(Json(ProjectDetail {
        project,
        balance_lovelace,
        utxo_count,
        milestones,
        events,
        utxos,
    }))
}

/// Get milestones for a specific project
pub async fn get_project_milestones(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<Milestone>>, StatusCode> {
    let milestones = sqlx::query_as::<_, Milestone>(
        r#"
        WITH fund_milestones AS (
            SELECT
                m.body::jsonb->'body'->>'identifier' as project_id,
                milestone.value->>'identifier' as milestone_id,
                milestone.value->>'label' as milestone_label,
                COALESCE(
                    milestone.value->>'acceptanceCriteria',
                    milestone.value->'acceptanceCriteria'->>0
                ) as acceptance_criteria,
                milestone.ordinality::int as milestone_order
            FROM yaci_store.transaction_metadata m,
                 jsonb_array_elements(m.body::jsonb->'body'->'milestones')
                 WITH ORDINALITY as milestone(value, ordinality)
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'fund'
              AND m.body::jsonb->'body'->>'identifier' = $1
        ),
        complete_events AS (
            SELECT
                m.body::jsonb->'body'->>'milestone' as milestone_id,
                m.tx_hash as complete_tx_hash,
                b.block_time as complete_time
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'complete'
              AND m.body::jsonb->'body'->>'identifier' = $1
        ),
        disburse_events AS (
            SELECT
                m.body::jsonb->'body'->>'milestone' as milestone_id,
                m.tx_hash as disburse_tx_hash,
                b.block_time as disburse_time
            FROM yaci_store.transaction_metadata m
            LEFT JOIN yaci_store.block b ON m.slot = b.slot
            WHERE m.label = '1694'
              AND LOWER(m.body::jsonb->'body'->>'event') = 'disburse'
              AND m.body::jsonb->'body'->>'identifier' = $1
        )
        SELECT
            fm.project_id,
            fm.milestone_id,
            fm.milestone_label,
            fm.acceptance_criteria,
            fm.milestone_order,
            CASE
                WHEN de.disburse_tx_hash IS NOT NULL THEN 'disbursed'
                WHEN ce.complete_tx_hash IS NOT NULL THEN 'completed'
                ELSE 'pending'
            END as status,
            ce.complete_tx_hash,
            ce.complete_time,
            de.disburse_tx_hash,
            de.disburse_time
        FROM fund_milestones fm
        LEFT JOIN complete_events ce ON fm.milestone_id = ce.milestone_id
        LEFT JOIN disburse_events de ON fm.milestone_id = de.milestone_id
        ORDER BY fm.milestone_order
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

/// Get all TOM events for a specific project
pub async fn get_project_events(
    Extension(pool): Extension<PgPool>,
    Path(project_id): Path<String>,
) -> Result<Json<Vec<ProjectEvent>>, StatusCode> {
    let events = sqlx::query_as::<_, ProjectEvent>(
        r#"
        SELECT
            m.tx_hash,
            m.slot,
            b.block_time,
            m.body::jsonb->'body'->>'event' as event_type,
            m.body::jsonb->'body'->>'milestone' as milestone_id,
            m.body::jsonb as metadata
        FROM yaci_store.transaction_metadata m
        LEFT JOIN yaci_store.block b ON m.slot = b.slot
        WHERE m.label = '1694'
          AND m.body::jsonb->'body'->>'identifier' = $1
        ORDER BY m.slot DESC
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
