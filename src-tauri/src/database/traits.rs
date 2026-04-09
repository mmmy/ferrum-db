use crate::database::errors::Result;
use async_trait::async_trait;

/// Connection configuration for database connections
#[derive(Debug, Clone)]
pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
}

/// Unified trait for database connections
#[async_trait]
pub trait DatabaseConnection: Send + Sync {
    /// Connect to the database
    async fn connect(&mut self) -> Result<()>;

    /// Disconnect from the database
    async fn disconnect(&mut self) -> Result<()>;

    /// Test the connection - returns true if connected
    async fn test_connection(&self) -> Result<bool>;

    /// Get database version
    async fn get_version(&self) -> Result<String>;

    /// Check if connected
    fn is_connected(&self) -> bool;
}
