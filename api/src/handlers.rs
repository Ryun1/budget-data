use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use crate::db::DbPool;
use crate::models::*;
use crate::query_params::QueryParams;

pub async fn get_treasury(State(pool): State<DbPool>) -> Result<Json<Treasury>, (StatusCode, Json<ErrorResponse>)> {
    let row = pool
        .query_one(
            "SELECT instance_id, script_hash, payment_address, stake_address, label, description 
             FROM treasury_instance LIMIT 1",
            &[],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let treasury = Treasury {
        instance_id: row.get(0),
        script_hash: row.get(1),
        payment_address: row.get(2),
        stake_address: row.get::<_, Option<String>>(3),
        label: row.get::<_, Option<String>>(4),
        description: row.get::<_, Option<String>>(5),
    };

    Ok(Json(treasury))
}

pub async fn get_projects(State(pool): State<DbPool>) -> Result<Json<ProjectList>, (StatusCode, Json<ErrorResponse>)> {
    let rows = pool
        .query(
            "SELECT project_id, identifier, label, description, vendor_label 
             FROM projects 
             ORDER BY created_at DESC 
             LIMIT 100",
            &[],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let projects: Vec<Project> = rows
        .into_iter()
        .map(|row| Project {
            project_id: row.get(0),
            identifier: row.get(1),
            label: row.get::<_, Option<String>>(2),
            description: row.get::<_, Option<String>>(3),
            vendor_label: row.get::<_, Option<String>>(4),
        })
        .collect();

    Ok(Json(ProjectList { projects }))
}

pub async fn get_project_detail(
    State(pool): State<DbPool>,
    Path(id): Path<i64>,
) -> Result<Json<Project>, (StatusCode, Json<ErrorResponse>)> {
    let row = pool
        .query_opt(
            "SELECT project_id, identifier, label, description, vendor_label 
             FROM projects 
             WHERE project_id = $1",
            &[&id],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    match row {
        Some(row) => {
            let project = Project {
                project_id: row.get(0),
                identifier: row.get(1),
                label: row.get::<_, Option<String>>(2),
                description: row.get::<_, Option<String>>(3),
                vendor_label: row.get::<_, Option<String>>(4),
            };
            Ok(Json(project))
        }
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Project not found".to_string(),
            }),
        )),
    }
}

pub async fn get_transactions(
    State(pool): State<DbPool>,
    Query(mut params): Query<QueryParams>,
) -> Result<Json<TransactionList>, (StatusCode, Json<ErrorResponse>)> {
    params.validate();

    // Build query based on filters
    let rows = if let Some(ref event_type) = params.event_type {
        if let Some(project_id) = params.project_id {
            pool.query(
                "SELECT tx_id, tx_hash, slot, block_height, event_type, project_id, tx_author, created_at 
                 FROM treasury_transactions 
                 WHERE event_type = $1 AND project_id = $2 
                 ORDER BY slot DESC LIMIT $3 OFFSET $4",
                &[&event_type.as_str(), &project_id, &params.limit, &params.offset],
            )
            .await
        } else {
            pool.query(
                "SELECT tx_id, tx_hash, slot, block_height, event_type, project_id, tx_author, created_at 
                 FROM treasury_transactions 
                 WHERE event_type = $1 
                 ORDER BY slot DESC LIMIT $2 OFFSET $3",
                &[&event_type.as_str(), &params.limit, &params.offset],
            )
            .await
        }
    } else if let Some(project_id) = params.project_id {
        pool.query(
            "SELECT tx_id, tx_hash, slot, block_height, event_type, project_id, tx_author, created_at 
             FROM treasury_transactions 
             WHERE project_id = $1 
             ORDER BY slot DESC LIMIT $2 OFFSET $3",
            &[&project_id, &params.limit, &params.offset],
        )
        .await
    } else {
        pool.query(
            "SELECT tx_id, tx_hash, slot, block_height, event_type, project_id, tx_author, created_at 
             FROM treasury_transactions 
             ORDER BY slot DESC LIMIT $1 OFFSET $2",
            &[&params.limit, &params.offset],
        )
        .await
    }
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Database error".to_string(),
            }),
        )
    })?;

    let transactions: Vec<Transaction> = rows
        .into_iter()
        .map(|row| Transaction {
            tx_hash: row.get(1),
            event_type: row.get::<_, Option<String>>(4),
            slot: row.get(2),
        })
        .collect();

    Ok(Json(TransactionList { transactions }))
}

pub async fn get_transaction_detail(
    State(pool): State<DbPool>,
    Path(hash): Path<String>,
) -> Result<Json<Transaction>, (StatusCode, Json<ErrorResponse>)> {
    let row = pool
        .query_opt(
            "SELECT tx_id, tx_hash, slot, block_height, event_type, project_id, tx_author, metadata, created_at 
             FROM treasury_transactions 
             WHERE tx_hash = $1",
            &[&hash],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    match row {
        Some(row) => {
            let transaction = Transaction {
                tx_hash: row.get(1),
                event_type: row.get::<_, Option<String>>(4),
                slot: row.get(2),
            };
            Ok(Json(transaction))
        }
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Transaction not found".to_string(),
            }),
        )),
    }
}

pub async fn get_milestones(State(pool): State<DbPool>) -> Result<Json<MilestoneList>, (StatusCode, Json<ErrorResponse>)> {
    let rows = pool
        .query(
            "SELECT milestone_id, project_id, identifier, label, status, amount_lovelace, maturity_slot 
             FROM milestones 
             ORDER BY project_id, identifier",
            &[],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let milestones: Vec<Milestone> = rows
        .into_iter()
        .map(|row| Milestone {
            milestone_id: row.get(0),
            project_id: row.get(1),
            identifier: row.get(2),
            status: row.get(4),
        })
        .collect();

    Ok(Json(MilestoneList { milestones }))
}

pub async fn get_vendor_contracts(
    State(pool): State<DbPool>,
) -> Result<Json<VendorContractList>, (StatusCode, Json<ErrorResponse>)> {
    let rows = pool
        .query(
            "SELECT contract_id, project_id, payment_address, script_hash, created_at 
             FROM vendor_contracts 
             ORDER BY created_at DESC",
            &[],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let vendor_contracts: Vec<VendorContract> = rows
        .into_iter()
        .map(|row| VendorContract {
            contract_id: row.get(0),
            project_id: row.get(1),
            payment_address: row.get(2),
            script_hash: row.get::<_, Option<String>>(3),
        })
        .collect();

    Ok(Json(VendorContractList { vendor_contracts }))
}

pub async fn get_events(
    State(pool): State<DbPool>,
    Query(mut params): Query<QueryParams>,
) -> Result<Json<EventList>, (StatusCode, Json<ErrorResponse>)> {
    params.validate();

    // Build query based on filters
    let rows = if let Some(ref event_type) = params.event_type {
        if let Some(project_id) = params.project_id {
            pool.query(
                "SELECT event_id, tx_id, event_type, project_id, created_at 
                 FROM treasury_events 
                 WHERE event_type = $1 AND project_id = $2 
                 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
                &[&event_type.as_str(), &project_id, &params.limit, &params.offset],
            )
            .await
        } else {
            pool.query(
                "SELECT event_id, tx_id, event_type, project_id, created_at 
                 FROM treasury_events 
                 WHERE event_type = $1 
                 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                &[&event_type.as_str(), &params.limit, &params.offset],
            )
            .await
        }
    } else if let Some(project_id) = params.project_id {
        pool.query(
            "SELECT event_id, tx_id, event_type, project_id, created_at 
             FROM treasury_events 
             WHERE project_id = $1 
             ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            &[&project_id, &params.limit, &params.offset],
        )
        .await
    } else {
        pool.query(
            "SELECT event_id, tx_id, event_type, project_id, created_at 
             FROM treasury_events 
             ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            &[&params.limit, &params.offset],
        )
        .await
    }
    .map_err(|e| {
        tracing::error!("Database error: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Database error".to_string(),
            }),
        )
    })?;

    let events: Vec<Event> = rows
        .into_iter()
        .map(|row| Event {
            event_id: row.get(0),
            event_type: row.get(2),
            tx_id: row.get(1),
            project_id: row.get::<_, Option<i64>>(3),
        })
        .collect();

    Ok(Json(EventList { events }))
}
