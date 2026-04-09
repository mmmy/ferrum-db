use std::sync::Arc;

use sqlx::mysql::{MySqlConnectOptions, MySqlPool, MySqlPoolOptions};
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode};

use crate::commands::errors::{CommandError, CommandResult};

use super::traits::ConnectionConfig;

#[derive(Clone)]
pub enum DatabaseRuntime {
    MySql(Arc<MySqlPool>),
    Postgres(Arc<PgPool>),
    #[cfg(test)]
    TestStub,
}

impl DatabaseRuntime {
    pub async fn connect(db_type: &str, config: &ConnectionConfig) -> CommandResult<Self> {
        match db_type {
            "mysql" => connect_mysql(config).await,
            "postgresql" => connect_postgres(config).await,
            _ => Err(CommandError::unsupported_database(db_type)),
        }
    }

    pub fn db_type(&self) -> &'static str {
        match self {
            Self::MySql(_) => "mysql",
            Self::Postgres(_) => "postgresql",
            #[cfg(test)]
            Self::TestStub => "test",
        }
    }

    pub async fn get_version(&self) -> CommandResult<String> {
        match self {
            Self::MySql(pool) => {
                let row: (String,) = sqlx::query_as("SELECT VERSION()")
                    .fetch_one(pool.as_ref())
                    .await
                    .map_err(|error| CommandError::classify_driver_message(error.to_string()))?;
                Ok(row.0)
            }
            Self::Postgres(pool) => {
                let row: (String,) = sqlx::query_as("SELECT version()")
                    .fetch_one(pool.as_ref())
                    .await
                    .map_err(|error| CommandError::classify_driver_message(error.to_string()))?;
                Ok(row.0)
            }
            #[cfg(test)]
            Self::TestStub => Ok("test-version".to_string()),
        }
    }

    pub async fn close(&self) {
        match self {
            Self::MySql(pool) => pool.close().await,
            Self::Postgres(pool) => pool.close().await,
            #[cfg(test)]
            Self::TestStub => {}
        }
    }
}

async fn connect_mysql(config: &ConnectionConfig) -> CommandResult<DatabaseRuntime> {
    let mut options = MySqlConnectOptions::new()
        .host(&config.host)
        .port(config.port)
        .username(&config.username)
        .password(&config.password);

    if let Some(database) = config.database.as_deref() {
        options = options.database(database);
    }

    let pool = MySqlPoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .map_err(|error| CommandError::classify_driver_message(error.to_string()))?;

    Ok(DatabaseRuntime::MySql(Arc::new(pool)))
}

async fn connect_postgres(config: &ConnectionConfig) -> CommandResult<DatabaseRuntime> {
    let mut options = PgConnectOptions::new()
        .host(&config.host)
        .port(config.port)
        .username(&config.username)
        .password(&config.password)
        .ssl_mode(PgSslMode::Prefer);

    if let Some(database) = config.database.as_deref() {
        options = options.database(database);
    }

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .map_err(|error| CommandError::classify_driver_message(error.to_string()))?;

    Ok(DatabaseRuntime::Postgres(Arc::new(pool)))
}
