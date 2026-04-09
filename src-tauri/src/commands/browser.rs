use tauri::State;

use crate::database::browser as database_browser;

use super::contracts::{SchemaListingResponse, TablePreviewResponse};
use super::errors::{CommandError, CommandResult};
use super::AppState;

#[tauri::command]
pub async fn list_session_schemas(
    session_id: String,
    state: State<'_, AppState>,
) -> CommandResult<SchemaListingResponse> {
    let (session, runtime) = {
        let sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        sessions.get_runtime(&session_id)?
    };

    let listing = database_browser::list_schemas(&runtime).await?;

    Ok(SchemaListingResponse {
        database_label: session
            .database
            .clone()
            .unwrap_or_else(|| session.connection_name.clone()),
        schemas: listing.schemas,
    })
}

#[tauri::command]
pub async fn get_table_preview(
    session_id: String,
    schema_name: String,
    table_name: String,
    limit: Option<u32>,
    state: State<'_, AppState>,
) -> CommandResult<TablePreviewResponse> {
    let (_, runtime) = {
        let sessions = state
            .sessions
            .lock()
            .map_err(|error| CommandError::unknown(error.to_string()))?;
        sessions.get_runtime(&session_id)?
    };

    database_browser::get_table_preview(&runtime, &schema_name, &table_name, limit).await
}
