use tauri::Manager;

pub mod storage;
pub mod crypto;
pub mod database;
pub mod commands;

use commands::{AppState, list_connections, get_connection, create_connection, update_connection, delete_connection, test_connection};

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
            test_connection
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