use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;

use crate::crypto::CryptoError;
use crate::database::errors::DatabaseError;
use crate::storage::ConnectionSecretError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CommandError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    pub retryable: bool,
}

pub type CommandResult<T> = Result<T, CommandError>;

impl CommandError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
            details: None,
            retryable: false,
        }
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    pub fn with_retryable(mut self, retryable: bool) -> Self {
        self.retryable = retryable;
        self
    }

    pub fn connection_not_found(connection_id: &str) -> Self {
        Self::new("connection_not_found", "Saved connection not found").with_details(format!(
            "No saved connection exists for id `{connection_id}`"
        ))
    }

    pub fn session_not_found(session_id: &str) -> Self {
        Self::new("session_not_found", "Session not found")
            .with_details(format!("No active session exists for id `{session_id}`"))
    }

    pub fn session_invalidated(session_id: &str) -> Self {
        Self::new("session_invalidated", "Session is no longer valid").with_details(format!(
            "Session `{session_id}` has been closed or invalidated"
        ))
    }

    pub fn table_not_found(schema_name: &str, table_name: &str) -> Self {
        Self::new("table_not_found", "Table not found").with_details(format!(
            "Table `{schema_name}.{table_name}` does not exist"
        ))
    }

    pub fn unsupported_database(db_type: &str) -> Self {
        Self::new("unsupported_database", "Database type is not supported")
            .with_details(format!("Unsupported database type `{db_type}`"))
    }

    pub fn credential_unavailable(details: impl Into<String>) -> Self {
        Self::new(
            "credential_unavailable",
            "Saved credentials could not be loaded",
        )
        .with_details(details)
    }

    pub fn permission_denied(details: impl Into<String>) -> Self {
        Self::new("permission_denied", "Database access was denied").with_details(details)
    }

    pub fn unknown(details: impl Into<String>) -> Self {
        Self::new(
            "unknown_error",
            "The backend could not complete the request",
        )
        .with_details(details)
    }

    pub fn classify_driver_message(message: impl Into<String>) -> Self {
        let message = message.into();
        let lowered = message.to_lowercase();

        if lowered.contains("access denied")
            || lowered.contains("authentication failed")
            || lowered.contains("password authentication failed")
            || lowered.contains("invalid password")
            || lowered.contains("password rejected")
        {
            return Self::new("authentication_failed", "Database authentication failed")
                .with_details(message);
        }

        if lowered.contains("ssl")
            || lowered.contains("tls")
            || lowered.contains("certificate")
            || lowered.contains("handshake")
        {
            return Self::new("tls_error", "TLS or certificate negotiation failed")
                .with_details(message);
        }

        if lowered.contains("timeout") || lowered.contains("timed out") {
            return Self::new("timeout", "Database connection attempt timed out")
                .with_details(message)
                .with_retryable(true);
        }

        if lowered.contains("connection refused")
            || lowered.contains("network is unreachable")
            || lowered.contains("no route to host")
            || lowered.contains("host not found")
            || lowered.contains("name or service not known")
            || lowered.contains("could not connect")
            || lowered.contains("connection reset")
        {
            return Self::new("network_unreachable", "Database host is unreachable")
                .with_details(message)
                .with_retryable(true);
        }

        if lowered.contains("permission denied") {
            return Self::permission_denied(message);
        }

        Self::unknown(message)
    }
}

impl fmt::Display for CommandError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl Error for CommandError {}

impl From<DatabaseError> for CommandError {
    fn from(value: DatabaseError) -> Self {
        match value {
            DatabaseError::ConnectionFailed(message) => Self::classify_driver_message(message),
            DatabaseError::DisconnectionFailed(message) => Self::new(
                "session_invalidated",
                "Database session disconnected unexpectedly",
            )
            .with_details(message),
            DatabaseError::QueryFailed(message) => Self::unknown(message),
            DatabaseError::InvalidConfig(message) => Self::unknown(message),
            DatabaseError::NotConnected => {
                Self::new("session_invalidated", "Database session is not connected")
            }
            DatabaseError::UnsupportedDatabase(db_type) => Self::unsupported_database(&db_type),
        }
    }
}

impl From<CryptoError> for CommandError {
    fn from(value: CryptoError) -> Self {
        Self::credential_unavailable(value.to_string())
    }
}

impl From<ConnectionSecretError> for CommandError {
    fn from(value: ConnectionSecretError) -> Self {
        match value {
            ConnectionSecretError::Storage(error) => Self::unknown(error.to_string()),
            ConnectionSecretError::Credential(error) => Self::from(error),
        }
    }
}

impl From<rusqlite::Error> for CommandError {
    fn from(value: rusqlite::Error) -> Self {
        Self::unknown(value.to_string())
    }
}
