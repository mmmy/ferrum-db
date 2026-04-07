use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;
use chrono::Utc;

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

    pub fn list_connections(&self) -> Result<Vec<ConnectionConfig>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at FROM connections ORDER BY name"
        )?;

        let connections = stmt.query_map([], |row| {
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
                password: row.get(6)?,
                database: row.get(7)?,
                environment: row.get(8)?,
                tags,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(connections)
    }

    pub fn get_connection(&self, id: &str) -> Result<Option<ConnectionConfig>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at FROM connections WHERE id = ?"
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let tags_str: Option<String> = row.get(9)?;
            let tags: Vec<String> = tags_str
                .map(|s| serde_json::from_str(&s).unwrap_or_default())
                .unwrap_or_default();

            Ok(Some(ConnectionConfig {
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

    pub fn create_connection(&self, input: CreateConnectionInput) -> Result<ConnectionConfig, rusqlite::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let tags = input.tags.unwrap_or_default();
        let tags_json = serde_json::to_string(&tags).unwrap_or_default();

        // Encrypt password before storing
        let encrypted_password = crypto::encrypt_password(&input.password)
            .unwrap_or_else(|_| input.password.clone());

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

    pub fn update_connection(&self, id: &str, input: UpdateConnectionInput) -> Result<Option<ConnectionConfig>, rusqlite::Error> {
        let existing = self.get_connection(id)?;
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

            // Encrypt password if provided
            let encrypted_password = if let Some(ref new_password) = input.password {
                crypto::encrypt_password(new_password).unwrap_or_else(|_| new_password.clone())
            } else {
                existing.password.clone()
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

    /// Get connection with decrypted password (for testing connection)
    pub fn get_connection_with_password(&self, id: &str) -> Result<Option<ConnectionWithPassword>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, db_type, host, port, username, password, database, environment, tags, created_at, updated_at FROM connections WHERE id = ?"
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let tags_str: Option<String> = row.get(9)?;
            let tags: Vec<String> = tags_str
                .map(|s| serde_json::from_str(&s).unwrap_or_default())
                .unwrap_or_default();

            let encrypted_password: String = row.get(6)?;
            // Try to decrypt, fall back to original if fails
            let decrypted_password = crypto::decrypt_password(&encrypted_password)
                .unwrap_or_else(|_| encrypted_password.clone());

            Ok(Some(ConnectionWithPassword {
                id: row.get(0)?,
                name: row.get(1)?,
                db_type: row.get(2)?,
                host: row.get(3)?,
                port: row.get(4)?,
                username: row.get(5)?,
                password: decrypted_password,
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

    pub fn delete_connection(&self, id: &str) -> Result<bool, rusqlite::Error> {
        let rows_affected = self.conn.execute(
            "DELETE FROM connections WHERE id = ?",
            params![id],
        )?;
        Ok(rows_affected > 0)
    }
}