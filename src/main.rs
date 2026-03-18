#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod modules;
mod types;

use commands::config_commands::{
    add_agent, export_config, import_config, load_config, remove_agent, save_config,
    update_central_hub_path, AppState,
};
use commands::scan_commands::{
    discover_agents, scan_all, scan_central_hub, validate_agent_path,
};
use commands::sync_commands::{
    batch_sync, delete_skill_global, delete_skill_local, execute_changes, sync_to_agent,
    sync_to_hub,
};
use modules::ConfigManager;
use std::sync::Mutex;

fn main() {
    let config_manager = ConfigManager::new().expect("Failed to initialize config manager");

    tauri::Builder::default()
        .manage(AppState {
            config_manager: Mutex::new(config_manager),
        })
        .invoke_handler(tauri::generate_handler![
            // Config commands
            load_config,
            save_config,
            export_config,
            import_config,
            add_agent,
            remove_agent,
            update_central_hub_path,
            // Scan commands
            discover_agents,
            validate_agent_path,
            scan_all,
            scan_central_hub,
            // Sync commands
            sync_to_hub,
            sync_to_agent,
            batch_sync,
            execute_changes,
            delete_skill_local,
            delete_skill_global,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
