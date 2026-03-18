use crate::modules::file_operations::{copy_directory, create_symlink, delete_directory, remove_symlink};
use crate::types::{Agent, PendingChange, SyncResult};
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum SyncError {
    #[error("File operation error: {0}")]
    File(#[from] crate::modules::file_operations::FileError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Agent not found: {0}")]
    AgentNotFound(String),
    #[error("Skill not found: {0}")]
    SkillNotFound(String),
}

pub type Result<T> = std::result::Result<T, SyncError>;

pub struct SyncEngine;

impl SyncEngine {
    pub fn new() -> Self {
        Self
    }
    
    /// Copy skill to central hub from agent
    pub fn sync_to_hub(&self, skill_name: &str, source_agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(&source_agent.skills_path).join(skill_name);
        let dest = Path::new(hub_path).join(skill_name);
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }
        
        // Copy to hub
        if dest.exists() {
            delete_directory(&dest)?;
        }
        copy_directory(&source, &dest)?;
        
        // Remove original and create symlink
        delete_directory(&source)?;
        create_symlink(&dest, &source)?;
        
        Ok(SyncResult {
            success: true,
            message: format!("Skill '{}' synced to hub", skill_name),
        })
    }
    
    /// Create symlink from hub to agent
    pub fn sync_to_agent(&self, skill_name: &str, agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(hub_path).join(skill_name);
        let link = Path::new(&agent.skills_path).join(skill_name);
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }
        
        // Remove existing if present
        if link.exists() || link.is_symlink() {
            if link.is_symlink() {
                remove_symlink(&link)?;
            } else {
                delete_directory(&link)?;
            }
        }
        
        // Create symlink
        create_symlink(&source, &link)?;
        
        Ok(SyncResult {
            success: true,
            message: format!("Skill '{}' synced to {}", skill_name, agent.name),
        })
    }
    
    /// Batch sync skills to multiple agents
    pub fn batch_sync(
        &self,
        skills: &[String],
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<Vec<SyncResult>> {
        let mut results = Vec::new();
        
        for skill_name in skills {
            for agent in agents {
                match self.sync_to_agent(skill_name, agent, hub_path) {
                    Ok(result) => results.push(result),
                    Err(e) => results.push(SyncResult {
                        success: false,
                        message: format!("Failed to sync '{}' to {}: {}", skill_name, agent.name, e),
                    }),
                }
            }
        }
        
        Ok(results)
    }
    
    /// Execute pending changes
    pub fn execute_changes(
        &self,
        changes: &[PendingChange],
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<Vec<SyncResult>> {
        let mut results = Vec::new();
        
        for change in changes {
            match change {
                PendingChange::AddToHub { skill_name, source_agent } => {
                    if let Some(agent) = agents.iter().find(|a| a.id == *source_agent) {
                        match self.sync_to_hub(skill_name, agent, hub_path) {
                            Ok(result) => results.push(result),
                            Err(e) => results.push(SyncResult {
                                success: false,
                                message: format!("Failed to add '{}' to hub: {}", skill_name, e),
                            }),
                        }
                    }
                }
                PendingChange::SyncToAgent { skill_name, target_agent } => {
                    if let Some(agent) = agents.iter().find(|a| a.id == *target_agent) {
                        match self.sync_to_agent(skill_name, agent, hub_path) {
                            Ok(result) => results.push(result),
                            Err(e) => results.push(SyncResult {
                                success: false,
                                message: format!("Failed to sync '{}' to {}: {}", skill_name, agent.name, e),
                            }),
                        }
                    }
                }
            }
        }
        
        Ok(results)
    }
    
    /// Delete skill with scope control
    pub fn delete_skill(
        &self,
        skill_name: &str,
        scope: DeleteScope,
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<SyncResult> {
        match scope {
            DeleteScope::Local { agent_id } => {
                if let Some(agent) = agents.iter().find(|a| a.id == agent_id) {
                    let path = Path::new(&agent.skills_path).join(skill_name);
                    if path.is_symlink() {
                        remove_symlink(&path)?;
                    } else if path.exists() {
                        delete_directory(&path)?;
                    }
                }
                Ok(SyncResult {
                    success: true,
                    message: format!("Skill '{}' removed from {}", skill_name, agent_id),
                })
            }
            DeleteScope::Global => {
                // Remove from all agents
                for agent in agents {
                    let path = Path::new(&agent.skills_path).join(skill_name);
                    if path.is_symlink() {
                        let _ = remove_symlink(&path);
                    } else if path.exists() {
                        let _ = delete_directory(&path);
                    }
                }
                // Remove from hub
                let hub_skill = Path::new(hub_path).join(skill_name);
                if hub_skill.exists() {
                    delete_directory(&hub_skill)?;
                }
                Ok(SyncResult {
                    success: true,
                    message: format!("Skill '{}' deleted globally", skill_name),
                })
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum DeleteScope {
    Local { agent_id: String },
    Global,
}
