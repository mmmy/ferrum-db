use tauri::Manager;

pub mod commands;
pub mod crypto;
pub mod database;
pub mod storage;

use commands::{
    close_connection_session, create_connection, delete_connection, get_connection,
    get_session_overview, get_table_preview, list_connections, list_session_schemas,
    open_connection_session, test_connection, update_connection, AppState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new().expect("Failed to initialize storage");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            list_connections,
            get_connection,
            create_connection,
            update_connection,
            delete_connection,
            test_connection,
            open_connection_session,
            close_connection_session,
            get_session_overview,
            list_session_schemas,
            get_table_preview
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
