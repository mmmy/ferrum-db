use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::storage::{ConnectionConfig, CreateConnectionInput, Storage, UpdateConnectionInput, ConnectionWithPassword};
use crate::database::ConnectionConfig as DbConfig;

// Application state holding the storage
pub struct AppState {
    pub storage: Mutex<Storage>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let db_path = get_db_path()?;
        let storage = Storage::new(db_path)?;
        Ok(Self {
            storage: Mutex::new(storage),
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

// Re-export types for commands
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
            password: if data.password.is_empty() { None } else { Some(data.password) },
            database: data.database,
            environment: data.environment,
            tags: data.tags,
        }
    }
}

#[tauri::command]
pub async fn list_connections(state: State<'_, AppState>) -> Result<Vec<ConnectionConfig>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_connections().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_connection(id: String, state: State<'_, AppState>) -> Result<Option<ConnectionConfig>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.get_connection(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_connection(
    data: ConnectionData,
    state: State<'_, AppState>,
) -> Result<ConnectionConfig, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let input: CreateConnectionInput = data.into();
    storage.create_connection(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_connection(
    id: String,
    data: ConnectionData,
    state: State<'_, AppState>,
) -> Result<Option<ConnectionConfig>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let input: UpdateConnectionInput = data.into();
    storage.update_connection(&id, input).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_connection(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.delete_connection(&id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn test_connection(id: String, state: State<'_, AppState>) -> Result<bool, String> {
    // Get data from storage synchronously first
    let (db_type, host, port, username, password, database) = {
        let storage = state.storage.lock().map_err(|e| e.to_string())?;
        let conn_with_pwd: ConnectionWithPassword = storage.get_connection_with_password(&id)
            .map_err(|e| e.to_string())?
            .ok_or("Connection not found")?;

        (
            conn_with_pwd.db_type,
            conn_with_pwd.host,
            conn_with_pwd.port,
            conn_with_pwd.username,
            conn_with_pwd.password,
            conn_with_pwd.database,
        )
    }; // storage lock is released here

    // Now call async test function
    test_db_connection(&db_type, host, port, username, password, database).await
}

async fn test_db_connection(
    db_type: &str,
    host: String,
    port: i32,
    username: String,
    password: String,
    database: Option<String>,
) -> Result<bool, String> {
    let db_config = DbConfig {
        host,
        port: port as u16,
        username,
        password,
        database,
    };

    match db_type {
        "mysql" => test_mysql_connection(db_config).await,
        "postgresql" => test_postgres_connection(db_config).await,
        _ => Err("Unsupported database type".to_string()),
    }
}

#[allow(dead_code)]
async fn test_mysql_connection(config: DbConfig) -> Result<bool, String> {
    use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};

    let mut options = MySqlConnectOptions::new()
        .host(&config.host)
        .port(config.port)
        .username(&config.username)
        .password(&config.password);

    if let Some(database) = config.database.as_deref() {
        options = options.database(database);
    }

    match MySqlPoolOptions::new().max_connections(1).connect_with(options).await {
        Ok(pool) => {
            let result = sqlx::query("SELECT 1").fetch_one(&pool).await.is_ok();
            pool.close().await;
            Ok(result)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[allow(dead_code)]
async fn test_postgres_connection(config: DbConfig) -> Result<bool, String> {
    use sqlx::postgres::{PgConnectOptions, PgPoolOptions, PgSslMode};

    let mut options = PgConnectOptions::new()
        .host(&config.host)
        .port(config.port)
        .username(&config.username)
        .password(&config.password)
        .ssl_mode(PgSslMode::Prefer);

    if let Some(database) = config.database.as_deref() {
        options = options.database(database);
    }

    match PgPoolOptions::new().max_connections(1).connect_with(options).await {
        Ok(pool) => {
            let result = sqlx::query("SELECT 1").fetch_one(&pool).await.is_ok();
            pool.close().await;
            Ok(result)
        }
        Err(e) => Err(e.to_string()),
    }
}
