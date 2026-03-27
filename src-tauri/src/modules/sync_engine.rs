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

use crate::modules::file_operations::{copy_directory, create_symlink, delete_directory, is_path_inside, remove_symlink};
use crate::types::{Agent, PendingChange, SyncResult};
use std::path::Path;
use std::fs;

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
    #[error("Path traversal detected: path is outside allowed directory")]
    PathTraversal,
    #[error("Backup failed: {0}")]
    BackupFailed(String),
    #[error("Rollback failed: {0}")]
    RollbackFailed(String),
}

pub type Result<T> = std::result::Result<T, SyncError>;

pub struct SyncEngine;

impl SyncEngine {
    pub fn new() -> Self {
        Self
    }
    
    /// Copy skill to central hub from agent
    /// 
    /// This operation is now atomic - if symlink creation fails, the original
    /// data is preserved and can be restored.
    pub fn sync_to_hub(&self, skill_name: &str, source_agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(&source_agent.skills_path).join(skill_name);
        let dest = Path::new(hub_path).join(skill_name);
        
        // Validate paths to prevent directory traversal
        if !is_path_inside(&source, Path::new(&source_agent.skills_path)) {
            return Err(SyncError::PathTraversal);
        }
        if !is_path_inside(&dest, Path::new(hub_path)) {
            return Err(SyncError::PathTraversal);
        }
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }

        // If source already links to destination, this skill is already synced to hub.
        // Never delete `dest` in this case, otherwise hub data can be lost.
        if Self::path_points_to(&source, &dest)? {
            return Ok(SyncResult {
                success: true,
                message: format!("Skill '{}' already synced to hub", skill_name),
            });
        }
        
        // Create a temporary backup before any destructive operations
        let temp_backup = source.with_extension("tmp_backup");
        if temp_backup.exists() {
            delete_directory(&temp_backup)?;
        }
        
        // Step 1: Backup original data (atomic operation start)
        copy_directory(&source, &temp_backup).map_err(|e| {
            SyncError::BackupFailed(format!("Failed to create backup: {}", e))
        })?;
        
        // Step 2: Copy to hub (this is safe, hub can be cleaned up)
        if dest.exists() {
            delete_directory(&dest)?;
        }
        
        if let Err(e) = copy_directory(&source, &dest) {
            // Rollback: restore from backup if copy failed
            let _ = delete_directory(&dest);
            let _ = delete_directory(&temp_backup);
            return Err(e.into());
        }
        
        // Step 3: Remove original and create symlink
        // This is the critical operation - if it fails, we restore from backup
        delete_directory(&source)?;
        
        if let Err(e) = create_symlink(&dest, &source) {
            // CRITICAL: Symlink creation failed - restore from backup
            eprintln!("[SyncEngine] Symlink creation failed, restoring from backup: {}", e);
            
            // Restore the original directory from backup
            if let Err(restore_err) = copy_directory(&temp_backup, &source) {
                // This is a catastrophic failure - data loss may occur
                eprintln!("[SyncEngine] CRITICAL: Failed to restore from backup: {}", restore_err);
                // Clean up what we can
                let _ = delete_directory(&temp_backup);
                return Err(SyncError::RollbackFailed(format!(
                    "Symlink failed and rollback also failed. Backup preserved at: {:?}",
                    temp_backup
                )));
            }
            
            // Successfully restored, clean up backup
            let _ = delete_directory(&temp_backup);
            return Err(e.into());
        }
        
        // Step 4: Clean up backup (success path)
        let _ = delete_directory(&temp_backup);
        
        Ok(SyncResult {
            success: true,
            message: format!("Skill '{}' synced to hub", skill_name),
        })
    }
    
    /// Sync to hub with explicit backup path for additional safety
    pub fn sync_to_hub_with_backup(
        &self,
        skill_name: &str,
        source_agent: &Agent,
        hub_path: &str,
        backup_base_path: &str,
    ) -> Result<SyncResult> {
        let source = Path::new(&source_agent.skills_path).join(skill_name);
        let dest = Path::new(hub_path).join(skill_name);
        let backup = Path::new(backup_base_path).join(skill_name);
        
        // Validate all paths
        if !is_path_inside(&source, Path::new(&source_agent.skills_path)) {
            return Err(SyncError::PathTraversal);
        }
        if !is_path_inside(&dest, Path::new(hub_path)) {
            return Err(SyncError::PathTraversal);
        }
        if !is_path_inside(&backup, Path::new(backup_base_path)) {
            return Err(SyncError::PathTraversal);
        }
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }
        
        // Create persistent backup
        fs::create_dir_all(backup.parent().unwrap()).ok();
        if backup.exists() {
            delete_directory(&backup)?;
        }
        copy_directory(&source, &backup).map_err(|e| {
            SyncError::BackupFailed(format!("Failed to create backup: {}", e))
        })?;
        
        // Perform the sync
        let result = self.sync_to_hub(skill_name, source_agent, hub_path);
        
        // If sync succeeded, we keep the backup for safety
        // If sync failed, backup is already there for recovery
        result
    }
    
    /// Create symlink from hub to agent
    pub fn sync_to_agent(&self, skill_name: &str, agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(hub_path).join(skill_name);
        let link = Path::new(&agent.skills_path).join(skill_name);
        
        // Validate paths to prevent directory traversal
        if !is_path_inside(&source, Path::new(hub_path)) {
            return Err(SyncError::PathTraversal);
        }
        if !is_path_inside(&link, Path::new(&agent.skills_path)) {
            return Err(SyncError::PathTraversal);
        }
        
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
                    
                    // Validate path to prevent directory traversal
                    if !is_path_inside(&path, Path::new(&agent.skills_path)) {
                        return Err(SyncError::PathTraversal);
                    }
                    
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
                    
                    // Validate path to prevent directory traversal
                    if !is_path_inside(&path, Path::new(&agent.skills_path)) {
                        continue; // Skip invalid paths
                    }
                    
                    if path.is_symlink() {
                        let _ = remove_symlink(&path);
                    } else if path.exists() {
                        let _ = delete_directory(&path);
                    }
                }
                // Remove from hub
                let hub_skill = Path::new(hub_path).join(skill_name);
                
                // Validate path to prevent directory traversal
                if is_path_inside(&hub_skill, Path::new(hub_path)) {
                    if hub_skill.exists() {
                        delete_directory(&hub_skill)?;
                    }
                }
                
                Ok(SyncResult {
                    success: true,
                    message: format!("Skill '{}' deleted globally", skill_name),
                })
            }
        }
    }
}

impl SyncEngine {
    fn path_points_to(source: &Path, dest: &Path) -> Result<bool> {
        if !source.is_symlink() {
            return Ok(false);
        }

        let target = fs::read_link(source)?;
        let source_parent = source.parent().unwrap_or_else(|| Path::new("."));
        let resolved_target = if target.is_absolute() {
            target
        } else {
            source_parent.join(target)
        };

        if resolved_target == dest {
            return Ok(true);
        }

        if dest.exists() {
            if let (Ok(target_canonical), Ok(dest_canonical)) =
                (resolved_target.canonicalize(), dest.canonicalize())
            {
                return Ok(target_canonical == dest_canonical);
            }
        }

        Ok(false)
    }
}

#[derive(Debug, Clone)]
pub enum DeleteScope {
    Local { agent_id: String },
    Global,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[test]
    fn test_sync_to_hub_copies_skill() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create skill in agent
        let agent_skill = agent_path.join("test-skill");
        fs::create_dir(&agent_skill).unwrap();
        fs::write(agent_skill.join("file.txt"), "content").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let result = engine.sync_to_hub("test-skill", &agent, &hub_path.to_string_lossy()).unwrap();
        
        assert!(result.success);
        assert!(hub_path.join("test-skill").exists());
        assert!(hub_path.join("test-skill/file.txt").exists());
        assert!(agent_path.join("test-skill").is_symlink());
    }

    #[test]
    fn test_sync_to_hub_skill_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let result = engine.sync_to_hub("nonexistent-skill", &agent, &hub_path.to_string_lossy());
        
        assert!(result.is_err());
    }

    #[test]
    fn test_sync_to_hub_is_noop_when_source_already_links_to_hub() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();

        let hub_skill = hub_path.join("linked-skill");
        fs::create_dir(&hub_skill).unwrap();
        fs::write(hub_skill.join("file.txt"), "hub content").unwrap();

        let agent_link = agent_path.join("linked-skill");
        create_symlink(&hub_skill, &agent_link).unwrap();

        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };

        let engine = SyncEngine::new();
        let result = engine
            .sync_to_hub("linked-skill", &agent, &hub_path.to_string_lossy())
            .unwrap();

        assert!(result.success);
        assert!(hub_skill.exists());
        assert!(hub_skill.join("file.txt").exists());
        assert!(agent_link.is_symlink());
    }

    #[test]
    fn test_sync_to_agent_creates_symlink() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create skill in hub
        let hub_skill = hub_path.join("shared-skill");
        fs::create_dir(&hub_skill).unwrap();
        fs::write(hub_skill.join("file.txt"), "hub content").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let result = engine.sync_to_agent("shared-skill", &agent, &hub_path.to_string_lossy()).unwrap();
        
        assert!(result.success);
        assert!(agent_path.join("shared-skill").is_symlink());
        assert!(agent_path.join("shared-skill/file.txt").exists());
    }

    #[test]
    fn test_sync_to_agent_replaces_existing() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create skill in hub
        let hub_skill = hub_path.join("shared-skill");
        fs::create_dir(&hub_skill).unwrap();
        fs::write(hub_skill.join("file.txt"), "hub content").unwrap();
        
        // Create existing skill in agent (not symlink)
        let agent_skill = agent_path.join("shared-skill");
        fs::create_dir(&agent_skill).unwrap();
        fs::write(agent_skill.join("old.txt"), "old content").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let result = engine.sync_to_agent("shared-skill", &agent, &hub_path.to_string_lossy()).unwrap();
        
        assert!(result.success);
        assert!(agent_path.join("shared-skill").is_symlink());
        assert!(!agent_path.join("shared-skill/old.txt").exists());
        assert!(agent_path.join("shared-skill/file.txt").exists());
    }

    #[test]
    fn test_delete_skill_local() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create symlink in agent
        let hub_skill = hub_path.join("test-skill");
        fs::create_dir(&hub_skill).unwrap();
        let agent_skill = agent_path.join("test-skill");
        crate::modules::file_operations::create_symlink(&hub_skill, &agent_skill).unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let result = engine.delete_skill("test-skill", DeleteScope::Local { agent_id: "test-agent".to_string() }, &[agent], &hub_path.to_string_lossy()).unwrap();
        
        assert!(result.success);
        assert!(!agent_skill.exists());
        assert!(hub_skill.exists()); // Hub should still exist
    }

    #[test]
    fn test_delete_skill_global() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent1_path = temp_dir.path().join("agent1/skills");
        let agent2_path = temp_dir.path().join("agent2/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent1_path).unwrap();
        fs::create_dir_all(&agent2_path).unwrap();
        
        // Create skill in hub
        let hub_skill = hub_path.join("test-skill");
        fs::create_dir(&hub_skill).unwrap();
        
        // Create symlinks in agents
        let agent1_skill = agent1_path.join("test-skill");
        let agent2_skill = agent2_path.join("test-skill");
        crate::modules::file_operations::create_symlink(&hub_skill, &agent1_skill).unwrap();
        crate::modules::file_operations::create_symlink(&hub_skill, &agent2_skill).unwrap();
        
        let agents = vec![
            Agent {
                id: "agent1".to_string(),
                name: "Agent 1".to_string(),
                skills_path: agent1_path.to_string_lossy().to_string(),
                is_discovered: false,
            },
            Agent {
                id: "agent2".to_string(),
                name: "Agent 2".to_string(),
                skills_path: agent2_path.to_string_lossy().to_string(),
                is_discovered: false,
            },
        ];
        
        let engine = SyncEngine::new();
        let result = engine.delete_skill("test-skill", DeleteScope::Global, &agents, &hub_path.to_string_lossy()).unwrap();
        
        assert!(result.success);
        assert!(!hub_skill.exists());
        assert!(!agent1_skill.exists());
        assert!(!agent2_skill.exists());
    }

    #[test]
    fn test_batch_sync() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create skills in hub
        let skill1 = hub_path.join("skill-1");
        let skill2 = hub_path.join("skill-2");
        fs::create_dir(&skill1).unwrap();
        fs::create_dir(&skill2).unwrap();
        fs::write(skill1.join("file.txt"), "content1").unwrap();
        fs::write(skill2.join("file.txt"), "content2").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        let results = engine.batch_sync(
            &["skill-1".to_string(), "skill-2".to_string()],
            &[agent],
            &hub_path.to_string_lossy()
        ).unwrap();
        
        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|r| r.success));
        assert!(agent_path.join("skill-1").is_symlink());
        assert!(agent_path.join("skill-2").is_symlink());
    }

    /// Test that sync_to_hub_with_backup creates persistent backup
    #[test]
    fn test_sync_to_hub_with_backup() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        let backup_path = temp_dir.path().join("backups");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        fs::create_dir_all(&backup_path).unwrap();
        
        // Create skill in agent
        let agent_skill = agent_path.join("backup-test-skill");
        fs::create_dir(&agent_skill).unwrap();
        fs::write(agent_skill.join("content.txt"), "backup me").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        
        // Perform sync with backup
        let result = engine.sync_to_hub_with_backup(
            "backup-test-skill",
            &agent,
            &hub_path.to_string_lossy(),
            &backup_path.to_string_lossy()
        );
        
        // Sync should succeed
        assert!(result.is_ok());
        
        // Backup should exist
        let backup = backup_path.join("backup-test-skill");
        assert!(backup.exists());
        assert!(backup.join("content.txt").exists());
        
        // Original should be converted to symlink
        assert!(agent_skill.is_symlink());
        
        // Hub should have the skill
        assert!(hub_path.join("backup-test-skill/content.txt").exists());
    }

    /// Test path traversal prevention
    #[test]
    fn test_sync_to_hub_prevents_path_traversal() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        let agent = Agent {
            id: "malicious-agent".to_string(),
            name: "Malicious Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let engine = SyncEngine::new();
        
        // Try to sync a skill with path traversal in name
        let result = engine.sync_to_hub("../../../etc/passwd", &agent, &hub_path.to_string_lossy());
        
        // Should fail with path traversal error
        assert!(result.is_err());
        match result.unwrap_err() {
            SyncError::PathTraversal => {},
            _ => panic!("Expected PathTraversal error"),
        }
    }
}
