use async_trait::async_trait;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::errors::{DatabaseError, Result};
use super::traits::{ConnectionConfig, DatabaseConnection};

pub struct PostgresConnection {
    config: ConnectionConfig,
    pool: Option<Arc<RwLock<PgPool>>>,
}

impl PostgresConnection {
    pub fn new(config: ConnectionConfig) -> Self {
        Self {
            config,
            pool: None,
        }
    }

    fn build_connection_string(&self) -> String {
        let mut url = format!(
            "postgres://{}:{}@{}:{}",
            self.config.username,
            self.config.password,
            self.config.host,
            self.config.port
        );

        if let Some(ref db) = self.config.database {
            url.push_str(&format!("/{}", db));
        }

        // Add options for better compatibility
        url.push_str("?sslmode=prefer");

        url
    }
}

#[async_trait]
impl DatabaseConnection for PostgresConnection {
    async fn connect(&mut self) -> Result<()> {
        let connection_string = self.build_connection_string();

        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&connection_string)
            .await
            .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;

        self.pool = Some(Arc::new(RwLock::new(pool)));
        Ok(())
    }

    async fn disconnect(&mut self) -> Result<()> {
        if let Some(pool) = self.pool.take() {
            let pool = pool.read().await;
            pool.close().await;
        }
        Ok(())
    }

    async fn test_connection(&self) -> Result<bool> {
        if let Some(ref pool) = self.pool {
            let pool = pool.read().await;
            match sqlx::query("SELECT 1")
                .fetch_one(&*pool)
                .await
            {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        } else {
            Ok(false)
        }
    }

    async fn get_version(&self) -> Result<String> {
        if let Some(ref pool) = self.pool {
            let pool = pool.read().await;
            let row: (String,) = sqlx::query_as("SELECT version()")
                .fetch_one(&*pool)
                .await
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

            Ok(row.0)
        } else {
            Err(DatabaseError::NotConnected)
        }
    }

    fn is_connected(&self) -> bool {
        self.pool.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_connection_string() {
        let config = ConnectionConfig {
            host: "localhost".to_string(),
            port: 5432,
            username: "postgres".to_string(),
            password: "password".to_string(),
            database: Some("testdb".to_string()),
        };

        let conn = PostgresConnection::new(config);
        let url = conn.build_connection_string();

        assert!(url.contains("postgres://"));
        assert!(url.contains("postgres:password@localhost:5432"));
        assert!(url.contains("/testdb"));
    }
}