use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct Treasury {
    pub instance_id: i64,
    pub script_hash: String,
    pub payment_address: String,
    pub stake_address: Option<String>,
    pub label: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Project {
    pub project_id: i64,
    pub identifier: String,
    pub label: Option<String>,
    pub description: Option<String>,
    pub vendor_label: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectList {
    pub projects: Vec<Project>,
}

#[derive(Debug, Serialize)]
pub struct Transaction {
    pub tx_hash: String,
    pub event_type: Option<String>,
    pub slot: i64,
}

#[derive(Debug, Serialize)]
pub struct TransactionList {
    pub transactions: Vec<Transaction>,
}

#[derive(Debug, Serialize)]
pub struct Milestone {
    pub milestone_id: i64,
    pub project_id: i64,
    pub identifier: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct MilestoneList {
    pub milestones: Vec<Milestone>,
}

#[derive(Debug, Serialize)]
pub struct VendorContract {
    pub contract_id: i64,
    pub project_id: i64,
    pub payment_address: String,
    pub script_hash: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VendorContractList {
    pub vendor_contracts: Vec<VendorContract>,
}

#[derive(Debug, Serialize)]
pub struct Event {
    pub event_id: i64,
    pub event_type: String,
    pub tx_id: i64,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct EventList {
    pub events: Vec<Event>,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}
