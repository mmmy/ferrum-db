use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;
use uuid::Uuid;

use crate::crypto;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionConfig {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionWithPassword {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug)]
struct StoredConnectionRecord {
    id: String,
    name: String,
    db_type: String,
    host: String,
    port: i32,
    username: String,
    password: String,
    database: Option<String>,
    environment: Option<String>,
    tags: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateConnectionInput {
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

#[derive(Debug, Deserialize)]
pub struct UpdateConnectionInput {
    pub name: Option<String>,
    pub db_type: Option<String>,
    pub host: Option<String>,
    pub port: Option<i32>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub database: Option<String>,
    pub environment: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Error)]
pub enum ConnectionSecretError {
    #[error(transparent)]
    Storage(#[from] rusqlite::Error),
    #[error(transparent)]
    Credential(#[from] crypto::CryptoError),
}

pub struct Storage {
    conn: Connection,
}

impl Storage {
    pub fn new(db_path: PathBuf) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(db_path)?;
        let storage = Self { conn };
        storage.init_tables()?;
        Ok(storage)
    }

    fn init_tables(&self) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                db_type TEXT NOT NULL CHECK(db_type IN ('mysql', 'postgresql')),
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                database TEXT,
                environment TEXT CHECK(environment IN ('production', 'staging', 'development')),
                tags TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    fn get_stored_connection(
        &self,
        id: &str,
    ) -> Result<Option<StoredConnectionRecord>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at FROM connections WHERE id = ?"
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let tags_str: Option<String> = row.get(9)?;
            let tags: Vec<String> = tags_str
                .map(|s| serde_json::from_str(&s).unwrap_or_default())
                .unwrap_or_default();

            Ok(Some(StoredConnectionRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                db_type: row.get(2)?,
                host: row.get(3)?,
                port: row.get(4)?,
                username: row.get(5)?,
                password: row.get(6)?,
                database: row.get(7)?,
                environment: row.get(8)?,
                tags,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            }))
        } else {
            Ok(None)
        }
    }

    fn encrypt_password(password: &str) -> Result<String, rusqlite::Error> {
        crypto::encrypt_password(password)
            .map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))
    }

    pub fn list_connections(&self) -> Result<Vec<ConnectionConfig>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at FROM connections ORDER BY name"
        )?;

        let connections = stmt
            .query_map([], |row| {
                let tags_str: Option<String> = row.get(9)?;
                let tags: Vec<String> = tags_str
                    .map(|s| serde_json::from_str(&s).unwrap_or_default())
                    .unwrap_or_default();

                Ok(ConnectionConfig {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    db_type: row.get(2)?,
                    host: row.get(3)?,
                    port: row.get(4)?,
                    username: row.get(5)?,
                    password: "***".to_string(),
                    database: row.get(7)?,
                    environment: row.get(8)?,
                    tags,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(connections)
    }

    pub fn get_connection(&self, id: &str) -> Result<Option<ConnectionConfig>, rusqlite::Error> {
        Ok(self
            .get_stored_connection(id)?
            .map(|record| ConnectionConfig {
                id: record.id,
                name: record.name,
                db_type: record.db_type,
                host: record.host,
                port: record.port,
                username: record.username,
                password: "***".to_string(),
                database: record.database,
                environment: record.environment,
                tags: record.tags,
                created_at: record.created_at,
                updated_at: record.updated_at,
            }))
    }

    pub fn create_connection(
        &self,
        input: CreateConnectionInput,
    ) -> Result<ConnectionConfig, rusqlite::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let tags = input.tags.unwrap_or_default();
        let tags_json = serde_json::to_string(&tags).unwrap_or_default();
        let encrypted_password = Self::encrypt_password(&input.password)?;

        self.conn.execute(
            "INSERT INTO connections (id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                id,
                input.name,
                input.db_type,
                input.host,
                input.port,
                input.username,
                encrypted_password,
                input.database,
                input.environment,
                tags_json,
                now,
                now
            ],
        )?;

        Ok(ConnectionConfig {
            id,
            name: input.name,
            db_type: input.db_type,
            host: input.host,
            port: input.port,
            username: input.username,
            password: "***".to_string(), // Don't expose password
            database: input.database,
            environment: input.environment,
            tags,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_connection(
        &self,
        id: &str,
        input: UpdateConnectionInput,
    ) -> Result<Option<ConnectionConfig>, rusqlite::Error> {
        let existing = self.get_stored_connection(id)?;
        if let Some(existing) = existing {
            let now = Utc::now().to_rfc3339();
            let name = input.name.unwrap_or(existing.name);
            let db_type = input.db_type.unwrap_or(existing.db_type);
            let host = input.host.unwrap_or(existing.host);
            let port = input.port.unwrap_or(existing.port);
            let username = input.username.unwrap_or(existing.username);
            let database = input.database.or(existing.database);
            let environment = input.environment.or(existing.environment);
            let tags = input.tags.unwrap_or(existing.tags);
            let tags_json = serde_json::to_string(&tags).unwrap_or_default();

            let encrypted_password = if let Some(ref new_password) = input.password {
                Self::encrypt_password(new_password)?
            } else {
                existing.password
            };

            self.conn.execute(
                "UPDATE connections SET name = ?, db_type = ?, host = ?, port = ?, username = ?, password = ?, database = ?, environment = ?, tags = ?, updated_at = ? WHERE id = ?",
                params![name, db_type, host, port, username, encrypted_password, database, environment, tags_json, now, id],
            )?;

            Ok(Some(ConnectionConfig {
                id: id.to_string(),
                name,
                db_type,
                host,
                port,
                username,
                password: "***".to_string(),
                database,
                environment,
                tags,
                created_at: existing.created_at,
                updated_at: now,
            }))
        } else {
            Ok(None)
        }
    }

    /// Get connection with decrypted password for runtime operations.
    pub fn get_connection_with_password(
        &self,
        id: &str,
    ) -> Result<Option<ConnectionWithPassword>, ConnectionSecretError> {
        if let Some(record) = self.get_stored_connection(id)? {
            let decrypted_password = crypto::decrypt_password(&record.password)?;

            Ok(Some(ConnectionWithPassword {
                id: record.id,
                name: record.name,
                db_type: record.db_type,
                host: record.host,
                port: record.port,
                username: record.username,
                password: decrypted_password,
                database: record.database,
                environment: record.environment,
                tags: record.tags,
                created_at: record.created_at,
                updated_at: record.updated_at,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete_connection(&self, id: &str) -> Result<bool, rusqlite::Error> {
        let rows_affected = self
            .conn
            .execute("DELETE FROM connections WHERE id = ?", params![id])?;
        Ok(rows_affected > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn update_without_password_keeps_existing_secret() {
        let db_path = std::env::temp_dir().join(format!("ferrum-db-storage-{}.db", Uuid::new_v4()));
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

        storage
            .update_connection(
                &created.id,
                UpdateConnectionInput {
                    name: Some("Primary Updated".to_string()),
                    db_type: None,
                    host: None,
                    port: None,
                    username: None,
                    password: None,
                    database: None,
                    environment: None,
                    tags: None,
                },
            )
            .expect("update should succeed");

        let updated = storage
            .get_connection_with_password(&created.id)
            .expect("lookup should succeed")
            .expect("connection should exist");

        assert_eq!(updated.password, "secret-pass");
        assert_eq!(updated.name, "Primary Updated");

        drop(storage);
        let _ = std::fs::remove_file(db_path);
    }
}
