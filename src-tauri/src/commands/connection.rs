use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::database::runtime::DatabaseRuntime;
use crate::database::ConnectionConfig as DbConfig;
use crate::storage::{
    ConnectionWithPassword, CreateConnectionInput, Storage, UpdateConnectionInput,
};

use super::contracts::{ConnectionRecord, DeleteConnectionResult, TestConnectionResult};
use super::errors::{CommandError, CommandResult};
use super::session::SessionRegistry;

pub struct AppState {
    pub storage: Mutex<Storage>,
    pub sessions: Mutex<SessionRegistry>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let db_path = get_db_path()?;
        Self::with_db_path(db_path)
    }

    pub fn with_db_path(db_path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let storage = Storage::new(db_path)?;
        Ok(Self {
            storage: Mutex::new(storage),
            sessions: Mutex::new(SessionRegistry::default()),
        })
    }
}

fn get_db_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data = dirs::data_local_dir()
        .ok_or("Could not find app data directory")?
        .join("FerrumDB");

    std::fs::create_dir_all(&app_data)?;

    Ok(app_data.join("ferrum.db"))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionData {
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub tags: Option<Vec<String>>,
}

pub(crate) struct LoadedSavedConnection {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub runtime_config: DbConfig,
}

impl From<ConnectionData> for CreateConnectionInput {
    fn from(data: ConnectionData) -> Self {
        CreateConnectionInput {
            name: data.name,
            db_type: data.db_type,
            host: data.host,
            port: data.port,
            username: data.username,
            password: data.password,
            database: data.database,
            environment: data.environment,
            tags: data.tags,
        }
    }
}

impl From<ConnectionData> for UpdateConnectionInput {
    fn from(data: ConnectionData) -> Self {
        UpdateConnectionInput {
            name: Some(data.name),
            db_type: Some(data.db_type),
            host: Some(data.host),
            port: Some(data.port),
            username: Some(data.username),
            password: if data.password.is_empty() {
                None
            } else {
                Some(data.password)
            },
            database: data.database,
            environment: data.environment,
            tags: data.tags,
        }
    }
}

#[tauri::command]
pub async fn list_connections(state: State<'_, AppState>) -> CommandResult<Vec<ConnectionRecord>> {
    let storage = state
        .storage
        .lock()
        .map_err(|error| CommandError::unknown(error.to_string()))?;

    storage
        .list_connections()
        .map(|connections| {
            connections
                .into_iter()
                .map(ConnectionRecord::from)
                .collect()
        })
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn get_connection(
    id: String,
    state: State<'_, AppState>,
) -> CommandResult<Option<ConnectionRecord>> {
    let storage = state
        .storage
        .lock()
        .map_err(|error| CommandError::unknown(error.to_string()))?;

    storage
        .get_connection(&id)
        .map(|connection| connection.map(ConnectionRecord::from))
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn create_connection(
    data: ConnectionData,
    state: State<'_, AppState>,
) -> CommandResult<ConnectionRecord> {
    let storage = state
        .storage
        .lock()
        .map_err(|error| CommandError::unknown(error.to_string()))?;
    let input: CreateConnectionInput = data.into();

    storage
        .create_connection(input)
        .map(ConnectionRecord::from)
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn update_connection(
    id: String,
    data: ConnectionData,
    state: State<'_, AppState>,
) -> CommandResult<Option<ConnectionRecord>> {
    let storage = state
        .storage
        .lock()
        .map_err(|error| CommandError::unknown(error.to_string()))?;
    let input: UpdateConnectionInput = data.into();

    storage
        .update_connection(&id, input)
        .map(|connection| connection.map(ConnectionRecord::from))
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn delete_connection(
    id: String,
    state: State<'_, AppState>,
) -> CommandResult<DeleteConnectionResult> {
    let deleted = {
        let storage = state
            .storage
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        storage.delete_connection(&id)?
    };

    if !deleted {
        return Err(CommandError::connection_not_found(&id));
    }

    let invalidated_session = {
        let mut sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        sessions.invalidate_by_connection(&id)
    };

    let invalidated_session_id = if let Some(session) = invalidated_session {
        let session_id = session.payload.id.clone();
        session.runtime.close().await;
        Some(session_id)
    } else {
        None
    };

    Ok(DeleteConnectionResult {
        deleted: true,
        invalidated_session_id,
    })
}

#[tauri::command]
pub async fn test_connection(
    connection_id: String,
    state: State<'_, AppState>,
) -> CommandResult<TestConnectionResult> {
    let saved_connection = match load_saved_connection_for_runtime(&connection_id, &state).await {
        Ok(connection) => connection,
        Err(error) => return Ok(TestConnectionResult::failure(connection_id, error)),
    };

    match DatabaseRuntime::connect(&saved_connection.db_type, &saved_connection.runtime_config)
        .await
    {
        Ok(runtime) => {
            let version = runtime.get_version().await.ok();
            runtime.close().await;

            let message = version.map(|version| format!("Connection established ({version})"));
            Ok(TestConnectionResult::success(saved_connection.id, message))
        }
        Err(error) => Ok(TestConnectionResult::failure(saved_connection.id, error)),
    }
}

pub(crate) async fn load_saved_connection_for_runtime(
    connection_id: &str,
    state: &State<'_, AppState>,
) -> CommandResult<LoadedSavedConnection> {
    let connection = {
        let storage = state
            .storage
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;

        load_saved_connection_with_password(connection_id, &storage)?
    };

    Ok(connection)
}

fn load_saved_connection_with_password(
    connection_id: &str,
    storage: &Storage,
) -> CommandResult<LoadedSavedConnection> {
    let saved: ConnectionWithPassword = storage
        .get_connection_with_password(connection_id)?
        .ok_or_else(|| CommandError::connection_not_found(connection_id))?;

    Ok(LoadedSavedConnection {
        id: saved.id,
        name: saved.name,
        db_type: saved.db_type,
        database: saved.database.clone(),
        environment: saved.environment.clone(),
        runtime_config: DbConfig {
            host: saved.host,
            port: saved.port as u16,
            username: saved.username,
            password: saved.password,
            database: saved.database,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::load_saved_connection_with_password;
    use crate::storage::{CreateConnectionInput, Storage};
    use uuid::Uuid;

    #[test]
    fn load_saved_connection_uses_decrypted_password() {
        let db_path =
            std::env::temp_dir().join(format!("ferrum-db-commands-{}.db", Uuid::new_v4()));
        let storage = Storage::new(db_path.clone()).expect("storage should initialize");

        let created = storage
            .create_connection(CreateConnectionInput {
                name: "Primary".to_string(),
                db_type: "mysql".to_string(),
                host: "localhost".to_string(),
                port: 3306,
                username: "root".to_string(),
                password: "secret-pass".to_string(),
                database: Some("app".to_string()),
                environment: Some("development".to_string()),
                tags: Some(vec!["local".to_string()]),
            })
            .expect("connection should be created");

        let loaded = load_saved_connection_with_password(&created.id, &storage)
            .expect("runtime connection should load");

        assert_eq!(loaded.runtime_config.password, "secret-pass");

        drop(storage);
        let _ = std::fs::remove_file(db_path);
    }
}
