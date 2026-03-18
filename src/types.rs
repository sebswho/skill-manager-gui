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
