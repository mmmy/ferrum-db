use std::collections::{HashMap, HashSet};

use tauri::State;
use uuid::Uuid;

use crate::database::runtime::DatabaseRuntime;

use super::contracts::{AccessMode, CloseSessionResult, SessionOverviewResponse, SessionPayload};
use super::errors::{CommandError, CommandResult};
use super::{connection::load_saved_connection_for_runtime, AppState};

pub struct RuntimeSession {
    pub payload: SessionPayload,
    pub runtime: DatabaseRuntime,
}

#[derive(Default)]
pub struct SessionRegistry {
    sessions: HashMap<String, RuntimeSession>,
    invalidated_sessions: HashSet<String>,
}

impl SessionRegistry {
    pub fn get_by_connection(&self, connection_id: &str) -> Option<&RuntimeSession> {
        self.sessions
            .values()
            .find(|session| session.payload.connection_id == connection_id)
    }

    pub fn insert(&mut self, session: RuntimeSession) {
        self.invalidated_sessions.remove(&session.payload.id);
        self.sessions.insert(session.payload.id.clone(), session);
    }

    pub fn get_cloned(&self, session_id: &str) -> CommandResult<SessionPayload> {
        if self.invalidated_sessions.contains(session_id) {
            return Err(CommandError::session_invalidated(session_id));
        }

        self.sessions
            .get(session_id)
            .map(|session| session.payload.clone())
            .ok_or_else(|| CommandError::session_not_found(session_id))
    }

    pub fn get_runtime(
        &self,
        session_id: &str,
    ) -> CommandResult<(SessionPayload, DatabaseRuntime)> {
        if self.invalidated_sessions.contains(session_id) {
            return Err(CommandError::session_invalidated(session_id));
        }

        self.sessions
            .get(session_id)
            .map(|session| (session.payload.clone(), session.runtime.clone()))
            .ok_or_else(|| CommandError::session_not_found(session_id))
    }

    pub fn close(&mut self, session_id: &str) -> CommandResult<RuntimeSession> {
        if self.invalidated_sessions.contains(session_id) {
            return Err(CommandError::session_invalidated(session_id));
        }

        let removed = self.sessions.remove(session_id);
        if removed.is_some() {
            self.invalidated_sessions.insert(session_id.to_string());
        }
        removed.ok_or_else(|| CommandError::session_not_found(session_id))
    }

    pub fn invalidate_by_connection(&mut self, connection_id: &str) -> Option<RuntimeSession> {
        let session_id = self.sessions.iter().find_map(|(session_id, session)| {
            (session.payload.connection_id == connection_id).then(|| session_id.clone())
        })?;

        let removed = self.sessions.remove(&session_id);
        if removed.is_some() {
            self.invalidated_sessions.insert(session_id);
        }
        removed
    }
}

#[tauri::command]
pub async fn open_connection_session(
    connection_id: String,
    state: State<'_, AppState>,
) -> CommandResult<SessionOverviewResponse> {
    {
        let sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        if let Some(existing) = sessions.get_by_connection(&connection_id) {
            return Ok(SessionOverviewResponse {
                session: existing.payload.clone(),
            });
        }
    }

    let saved_connection = load_saved_connection_for_runtime(&connection_id, &state).await?;
    let runtime =
        DatabaseRuntime::connect(&saved_connection.db_type, &saved_connection.runtime_config)
            .await?;

    let session = SessionPayload {
        id: Uuid::new_v4().to_string(),
        connection_id: saved_connection.id.clone(),
        connection_name: saved_connection.name.clone(),
        db_type: saved_connection.db_type.clone(),
        database: saved_connection.database.clone(),
        environment: saved_connection.environment.clone(),
        access_mode: derive_access_mode(saved_connection.environment.as_deref()),
    };

    {
        let mut sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        sessions.insert(RuntimeSession {
            payload: session.clone(),
            runtime,
        });
    }

    Ok(SessionOverviewResponse { session })
}

#[tauri::command]
pub async fn close_connection_session(
    session_id: String,
    state: State<'_, AppState>,
) -> CommandResult<CloseSessionResult> {
    let session = {
        let mut sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        sessions.close(&session_id)?
    };

    session.runtime.close().await;

    Ok(CloseSessionResult { closed: true })
}

#[tauri::command]
pub async fn get_session_overview(
    session_id: String,
    state: State<'_, AppState>,
) -> CommandResult<SessionOverviewResponse> {
    let sessions = state
        .sessions
        .lock()
        .map_err(|error| CommandError::unknown(error.to_string()))?;
    let session = sessions.get_cloned(&session_id)?;

    Ok(SessionOverviewResponse { session })
}

pub fn derive_access_mode(environment: Option<&str>) -> AccessMode {
    match environment {
        Some("production") => AccessMode::ReadOnly,
        _ => AccessMode::Standard,
    }
}

#[cfg(test)]
mod tests {
    use super::{derive_access_mode, RuntimeSession, SessionRegistry};
    use crate::commands::contracts::{AccessMode, SessionPayload};
    use crate::database::runtime::DatabaseRuntime;

    #[test]
    fn production_defaults_to_read_only() {
        assert_eq!(derive_access_mode(Some("production")), AccessMode::ReadOnly);
        assert_eq!(derive_access_mode(Some("staging")), AccessMode::Standard);
        assert_eq!(derive_access_mode(None), AccessMode::Standard);
    }

    #[test]
    fn invalidated_sessions_are_distinguished_from_unknown_ids() {
        let payload = SessionPayload {
            id: "session-1".to_string(),
            connection_id: "connection-1".to_string(),
            connection_name: "Primary".to_string(),
            db_type: "mysql".to_string(),
            database: Some("app".to_string()),
            environment: Some("production".to_string()),
            access_mode: AccessMode::ReadOnly,
        };

        let mut registry = SessionRegistry::default();
        registry.insert(RuntimeSession {
            payload: payload.clone(),
            runtime: DatabaseRuntime::TestStub,
        });

        let closed = registry.close(&payload.id);
        assert!(closed.is_ok());

        let invalidated = registry
            .get_cloned(&payload.id)
            .expect_err("session should be invalidated");
        assert_eq!(invalidated.code, "session_invalidated");

        let unknown = registry
            .get_cloned("missing-session")
            .expect_err("missing session should be unknown");
        assert_eq!(unknown.code, "session_not_found");
    }
}
