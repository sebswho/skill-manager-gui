use crate::modules::ConfigManager;
use crate::types::{Agent, AppConfig};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Sanitize error message to prevent leaking sensitive path information
fn sanitize_error(error: impl ToString) -> String {
    let msg = error.to_string();
    
    // Replace home directory with ~ to reduce information leakage
    if let Ok(home) = std::env::var("HOME") {
        let msg = msg.replace(&home, "~");
        return msg;
    }
    
    msg
}

pub struct AppState {
    pub config_manager: Mutex<ConfigManager>,
}

#[tauri::command]
pub fn load_config(state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .load()
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<AppState>) -> Result<(), String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .save(&config)
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn export_config(path: String, state: State<AppState>) -> Result<(), String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .export(&PathBuf::from(path))
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn import_config(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .import(&PathBuf::from(path))
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn add_agent(agent: Agent, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .add_agent(agent)
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn remove_agent(agent_id: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .remove_agent(&agent_id)
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn update_central_hub_path(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .update_central_hub_path(path)
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn update_theme(theme: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .update_theme(theme)
        .map_err(sanitize_error)
}

#[tauri::command]
pub fn update_locale(locale: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .update_locale(locale)
        .map_err(sanitize_error)
}
