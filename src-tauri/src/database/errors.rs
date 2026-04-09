use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Disconnection failed: {0}")]
    DisconnectionFailed(String),

    #[error("Query failed: {0}")]
    QueryFailed(String),

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error("Not connected")]
    NotConnected,

    #[error("Database type not supported: {0}")]
    UnsupportedDatabase(String),
}

pub type Result<T> = std::result::Result<T, DatabaseError>;
