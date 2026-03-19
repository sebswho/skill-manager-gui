// Copyright (C) 2024 sebswho
// This file is part of Agent Skills Manager.
// Agent Skills Manager is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Agent Skills Manager is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with Agent Skills Manager.  If not, see <https://www.gnu.org/licenses/>.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified_at: String,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub skills_path: String,
    pub is_discovered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSkillStatus {
    pub agent_id: String,
    pub skill_name: String,
    pub status: SyncStatus,
    pub is_symlink: bool,
    pub target_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SyncStatus {
    Synced,
    Missing,
    Conflict,
    New,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub central_hub_path: String,
    pub agents: Vec<Agent>,
    pub window_width: u32,
    pub window_height: u32,
    pub theme: Option<String>,
    pub locale: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        let home = dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        Self {
            central_hub_path: format!("{}/.agents/skills", home),
            agents: vec![],
            window_width: 1200,
            window_height: 800,
            theme: Some("light".to_string()),
            locale: Some("zh-CN".to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncMatrix {
    pub skills: Vec<String>,
    pub agents: Vec<String>,
    pub cells: HashMap<String, HashMap<String, SyncStatus>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conflict {
    pub skill_name: String,
    pub agent_ids: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub skills: Vec<Skill>,
    pub agent_statuses: Vec<AgentSkillStatus>,
    pub pending_changes: Vec<PendingChange>,
    pub conflicts: Vec<Conflict>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PendingChange {
    AddToHub { skill_name: String, source_agent: String },
    SyncToAgent { skill_name: String, target_agent: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillVersion {
    pub agent_id: String,
    pub agent_name: String,
    pub size: u64,
    pub modified_at: String,
    pub path: String,
    pub hash: String,
}
