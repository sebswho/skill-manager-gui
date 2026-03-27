// Copyright (C) 2024 sebswho
// This file is part of Skilltoon.
// Skilltoon is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Skilltoon is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with Skilltoon.  If not, see <https://www.gnu.org/licenses/>.

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
