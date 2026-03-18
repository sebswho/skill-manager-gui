use crate::modules::file_operations::{calculate_directory_hash, get_symlink_target, is_symlink};
use crate::types::{Agent, AgentSkillStatus, Conflict, PendingChange, ScanResult, Skill, SyncStatus};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

pub struct SkillsScanner;

impl SkillsScanner {
    pub fn new() -> Self {
        Self
    }
    
    /// Scan central hub for all skills
    pub fn scan_central_hub(&self, hub_path: &str) -> Vec<Skill> {
        let mut skills = Vec::new();
        let hub = Path::new(hub_path);
        
        if !hub.exists() {
            return skills;
        }
        
        for entry in WalkDir::new(hub).max_depth(1).min_depth(1) {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    let name = path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();
                    
                    if let Ok(metadata) = fs::metadata(path) {
                        let size = Self::calculate_dir_size(path);
                        let modified = metadata.modified()
                            .ok()
                            .and_then(|t| t.elapsed().ok())
                            .map(|d| format!("{:?} ago", d))
                            .unwrap_or_default();
                        
                        let hash = calculate_directory_hash(path).unwrap_or_default();
                        
                        skills.push(Skill {
                            name,
                            path: path.to_string_lossy().to_string(),
                            size,
                            modified_at: modified,
                            hash,
                        });
                    }
                }
            }
        }
        
        skills
    }
    
    /// Scan a single agent's skills directory
    pub fn scan_agent(&self, agent: &Agent, hub_path: &str) -> Vec<AgentSkillStatus> {
        let mut statuses = Vec::new();
        let agent_path = Path::new(&agent.skills_path);
        let hub = Path::new(hub_path);
        
        if !agent_path.exists() {
            return statuses;
        }
        
        for entry in WalkDir::new(agent_path).max_depth(1).min_depth(1) {
            if let Ok(entry) = entry {
                let path = entry.path();
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                
                let (status, is_symlink, target_path) = if is_symlink(path).unwrap_or(false) {
                    let target = get_symlink_target(path).ok();
                    let is_valid_symlink = target.as_ref()
                        .map(|t| {
                            let target_path = Path::new(t);
                            target_path.starts_with(hub) && target_path.exists()
                        })
                        .unwrap_or(false);
                    
                    if is_valid_symlink {
                        (SyncStatus::Synced, true, target)
                    } else {
                        (SyncStatus::Conflict, true, target)
                    }
                } else if path.is_dir() {
                    // Independent copy - needs sync
                    (SyncStatus::New, false, None)
                } else {
                    continue;
                };
                
                statuses.push(AgentSkillStatus {
                    agent_id: agent.id.clone(),
                    skill_name: name,
                    status,
                    is_symlink,
                    target_path,
                });
            }
        }
        
        statuses
    }
    
    /// Full scan across all agents
    pub fn scan_all(&self, agents: &[Agent], hub_path: &str) -> ScanResult {
        let hub_skills = self.scan_central_hub(hub_path);
        let hub_skill_names: std::collections::HashSet<_> = hub_skills
            .iter()
            .map(|s| s.name.clone())
            .collect();
        
        let mut all_statuses = Vec::new();
        let mut pending_changes = Vec::new();
        let mut conflicts = Vec::new();
        
        // Track skills that need to be checked for conflicts
        let mut skill_hashes: HashMap<String, Vec<(String, String)>> = HashMap::new();
        
        for agent in agents {
            let agent_statuses = self.scan_agent(agent, hub_path);
            
            for status in &agent_statuses {
                // Check if skill exists in hub
                if !hub_skill_names.contains(&status.skill_name) {
                    pending_changes.push(PendingChange::AddToHub {
                        skill_name: status.skill_name.clone(),
                        source_agent: agent.id.clone(),
                    });
                }
                
                // Track for conflict detection
                if let Ok(hash) = calculate_directory_hash(Path::new(&format!("{}/{}", agent.skills_path, status.skill_name))) {
                    skill_hashes
                        .entry(status.skill_name.clone())
                        .or_default()
                        .push((agent.id.clone(), hash));
                }
            }
            
            all_statuses.extend(agent_statuses);
        }
        
        // Detect conflicts - same skill name but different hashes
        for (skill_name, agent_hashes) in skill_hashes {
            let unique_hashes: std::collections::HashSet<_> = agent_hashes
                .iter()
                .map(|(_, h)| h.clone())
                .collect();
            
            if unique_hashes.len() > 1 {
                conflicts.push(Conflict {
                    skill_name,
                    agent_ids: agent_hashes.iter().map(|(id, _)| id.clone()).collect(),
                    message: "Different versions detected".to_string(),
                });
            }
        }
        
        ScanResult {
            skills: hub_skills,
            agent_statuses: all_statuses,
            pending_changes,
            conflicts,
        }
    }
    
    fn calculate_dir_size(path: &Path) -> u64 {
        WalkDir::new(path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .filter_map(|e| e.metadata().ok())
            .map(|m| m.len())
            .sum()
    }
}
