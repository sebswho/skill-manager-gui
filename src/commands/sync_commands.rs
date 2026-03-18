use crate::modules::sync_engine::{DeleteScope, SyncEngine};
use crate::types::{Agent, PendingChange, SyncResult};
use tauri::command;

#[command]
pub fn sync_to_hub(
    skill_name: String,
    source_agent: Agent,
    hub_path: String,
) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .sync_to_hub(&skill_name, &source_agent, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn sync_to_agent(skill_name: String, agent: Agent, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine
        .sync_to_agent(&skill_name, &agent, &hub_path)
        .map_err(|e| e.to_string())
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
        .map_err(|e| e.to_string())
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
        .map_err(|e| e.to_string())
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
        .map_err(|e| e.to_string())
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
        .map_err(|e| e.to_string())
}
