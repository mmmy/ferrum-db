use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::storage::ConnectionConfig as StoredConnectionConfig;

use super::errors::CommandError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ConnectionRecord {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<StoredConnectionConfig> for ConnectionRecord {
    fn from(value: StoredConnectionConfig) -> Self {
        Self {
            id: value.id,
            name: value.name,
            db_type: value.db_type,
            host: value.host,
            port: value.port,
            username: value.username,
            database: value.database,
            environment: value.environment,
            tags: value.tags,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionStatus {
    Connected,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AccessMode {
    Standard,
    ReadOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TestConnectionResult {
    pub ok: bool,
    pub status: ConnectionStatus,
    pub connection_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<CommandError>,
}

impl TestConnectionResult {
    pub fn success(connection_id: impl Into<String>, message: Option<String>) -> Self {
        Self {
            ok: true,
            status: ConnectionStatus::Connected,
            connection_id: connection_id.into(),
            message,
            error: None,
        }
    }

    pub fn failure(connection_id: impl Into<String>, error: CommandError) -> Self {
        Self {
            ok: false,
            status: ConnectionStatus::Failed,
            connection_id: connection_id.into(),
            message: None,
            error: Some(error),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeleteConnectionResult {
    pub deleted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invalidated_session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CloseSessionResult {
    pub closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SessionPayload {
    pub id: String,
    pub connection_id: String,
    pub connection_name: String,
    pub db_type: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub access_mode: AccessMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SessionOverviewResponse {
    pub session: SessionPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SchemaListingResponse {
    pub database_label: String,
    pub schemas: Vec<SchemaSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SchemaSummary {
    pub name: String,
    pub tables: Vec<TableSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TableSummary {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_count_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TablePreviewResponse {
    pub table: TableDetails,
    pub columns: Vec<TableColumn>,
    pub preview_rows: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TableDetails {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TableColumn {
    pub name: String,
    #[serde(rename = "type")]
    pub type_name: String,
    pub nullable: bool,
    pub is_primary_key: bool,
}
