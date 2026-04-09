use async_trait::async_trait;
use sqlx::mysql::{MySqlConnectOptions, MySqlPool, MySqlPoolOptions};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::errors::{DatabaseError, Result};
use super::traits::{ConnectionConfig, DatabaseConnection};

pub struct MySQLConnection {
    config: ConnectionConfig,
    pool: Option<Arc<RwLock<MySqlPool>>>,
}

impl MySQLConnection {
    pub fn new(config: ConnectionConfig) -> Self {
        Self { config, pool: None }
    }

    fn build_connect_options(&self) -> MySqlConnectOptions {
        let mut options = MySqlConnectOptions::new()
            .host(&self.config.host)
            .port(self.config.port)
            .username(&self.config.username)
            .password(&self.config.password);

        if let Some(database) = self.config.database.as_deref() {
            options = options.database(database);
        }

        options
    }
}

#[async_trait]
impl DatabaseConnection for MySQLConnection {
    async fn connect(&mut self) -> Result<()> {
        let options = self.build_connect_options();

        let pool = MySqlPoolOptions::new()
            .max_connections(1)
            .connect_with(options)
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
            match sqlx::query("SELECT 1").fetch_one(&*pool).await {
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
            let row: (String,) = sqlx::query_as("SELECT VERSION()")
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
    fn test_build_connect_options_accepts_reserved_characters() {
        let config = ConnectionConfig {
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "p@ss:word/with?chars".to_string(),
            database: Some("test/db".to_string()),
        };

        let conn = MySQLConnection::new(config);
        let _ = conn.build_connect_options();
    }
}
