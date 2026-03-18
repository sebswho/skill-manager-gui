use crate::modules::sync_engine::{DeleteScope, SyncEngine};
use crate::types::{Agent, PendingChange, SyncResult};
use tauri::command;

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

#[command]
pub fn sync_to_hub(
    skill_name: String,
    source_agent: Agent,
    hub_path: String,
) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .sync_to_hub(&skill_name, &source_agent, &hub_path)
        .map_err(sanitize_error)
}

#[command]
pub fn sync_to_agent(skill_name: String, agent: Agent, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .sync_to_agent(&skill_name, &agent, &hub_path)
        .map_err(sanitize_error)
}

#[command]
pub fn batch_sync(
    skills: Vec<String>,
    agents: Vec<Agent>,
    hub_path: String,
) -> Result<Vec<SyncResult>, String> {
    let engine = SyncEngine::new();
    engine
        .batch_sync(&skills, &agents, &hub_path)
        .map_err(sanitize_error)
}

#[command]
pub fn execute_changes(
    changes: Vec<PendingChange>,
    agents: Vec<Agent>,
    hub_path: String,
) -> Result<Vec<SyncResult>, String> {
    let engine = SyncEngine::new();
    engine
        .execute_changes(&changes, &agents, &hub_path)
        .map_err(sanitize_error)
}

#[command]
pub fn delete_skill_local(
    skill_name: String,
    agent_id: String,
    agents: Vec<Agent>,
    hub_path: String,
) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .delete_skill(
            &skill_name,
            DeleteScope::Local { agent_id },
            &agents,
            &hub_path,
        )
        .map_err(sanitize_error)
}

#[command]
pub fn delete_skill_global(
    skill_name: String,
    agents: Vec<Agent>,
    hub_path: String,
) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .delete_skill(&skill_name, DeleteScope::Global, &agents, &hub_path)
        .map_err(sanitize_error)
}
