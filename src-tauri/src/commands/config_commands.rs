use crate::modules::ConfigManager;
use crate::types::{Agent, AppConfig};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

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
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<AppState>) -> Result<(), String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .save(&config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_config(path: String, state: State<AppState>) -> Result<(), String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .export(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_config(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .import(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_agent(agent: Agent, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .add_agent(agent)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_agent(agent_id: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .remove_agent(&agent_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_central_hub_path(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .lock()
        .unwrap()
        .update_central_hub_path(path)
        .map_err(|e| e.to_string())
}
