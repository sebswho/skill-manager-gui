use crate::modules::file_operations::{calculate_directory_hash, get_symlink_target, is_path_inside, is_symlink};
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
        
        // Validate that agent path exists and is a directory
        if !agent_path.exists() || !agent_path.is_dir() {
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
                let agent_path = Path::new(&agent.skills_path);
                let skill_path = agent_path.join(&status.skill_name);
                
                // Validate path before calculating hash
                if is_path_inside(&skill_path, agent_path) && skill_path.exists() {
                    if let Ok(hash) = calculate_directory_hash(&skill_path) {
                        skill_hashes
                            .entry(status.skill_name.clone())
                            .or_default()
                            .push((agent.id.clone(), hash));
                    }
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;
    use crate::modules::file_operations::create_symlink;

    #[test]
    fn test_scan_central_hub_empty() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        fs::create_dir(&hub_path).unwrap();
        
        let scanner = SkillsScanner::new();
        let skills = scanner.scan_central_hub(&hub_path.to_string_lossy());
        
        assert!(skills.is_empty());
    }

    #[test]
    fn test_scan_central_hub_with_skills() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        fs::create_dir(&hub_path).unwrap();
        
        // Create skill directories
        let skill1 = hub_path.join("skill-a");
        let skill2 = hub_path.join("skill-b");
        fs::create_dir(&skill1).unwrap();
        fs::create_dir(&skill2).unwrap();
        
        // Add files to skills
        fs::write(skill1.join("test.txt"), "content1").unwrap();
        fs::write(skill2.join("test.txt"), "content2").unwrap();
        
        let scanner = SkillsScanner::new();
        let skills = scanner.scan_central_hub(&hub_path.to_string_lossy());
        
        assert_eq!(skills.len(), 2);
        let skill_names: Vec<_> = skills.iter().map(|s| s.name.clone()).collect();
        assert!(skill_names.contains(&"skill-a".to_string()));
        assert!(skill_names.contains(&"skill-b".to_string()));
    }

    #[test]
    fn test_scan_central_hub_nonexistent() {
        let scanner = SkillsScanner::new();
        let skills = scanner.scan_central_hub("/nonexistent/path");
        
        assert!(skills.is_empty());
    }

    #[test]
    fn test_scan_agent_empty() {
        let temp_dir = TempDir::new().unwrap();
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&agent_path).unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let scanner = SkillsScanner::new();
        let hub_path = temp_dir.path().join("hub");
        let statuses = scanner.scan_agent(&agent, &hub_path.to_string_lossy());
        
        assert!(statuses.is_empty());
    }

    #[test]
    fn test_scan_agent_with_symlink() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create a skill in hub
        let hub_skill = hub_path.join("skill-a");
        fs::create_dir(&hub_skill).unwrap();
        fs::write(hub_skill.join("file.txt"), "content").unwrap();
        
        // Create symlink from agent to hub
        let agent_skill = agent_path.join("skill-a");
        create_symlink(&hub_skill, &agent_skill).unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let scanner = SkillsScanner::new();
        let statuses = scanner.scan_agent(&agent, &hub_path.to_string_lossy());
        
        assert_eq!(statuses.len(), 1);
        assert_eq!(statuses[0].skill_name, "skill-a");
        assert!(matches!(statuses[0].status, SyncStatus::Synced));
        assert!(statuses[0].is_symlink);
    }

    #[test]
    fn test_scan_agent_with_new_skill() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent_path = temp_dir.path().join("agent/skills");
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent_path).unwrap();
        
        // Create a skill directly in agent (not in hub)
        let agent_skill = agent_path.join("new-skill");
        fs::create_dir(&agent_skill).unwrap();
        fs::write(agent_skill.join("file.txt"), "content").unwrap();
        
        let agent = Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: agent_path.to_string_lossy().to_string(),
            is_discovered: false,
        };
        
        let scanner = SkillsScanner::new();
        let statuses = scanner.scan_agent(&agent, &hub_path.to_string_lossy());
        
        assert_eq!(statuses.len(), 1);
        assert_eq!(statuses[0].skill_name, "new-skill");
        assert!(matches!(statuses[0].status, SyncStatus::New));
        assert!(!statuses[0].is_symlink);
    }

    #[test]
    fn test_scan_all_integration() {
        let temp_dir = TempDir::new().unwrap();
        let hub_path = temp_dir.path().join("hub");
        let agent1_path = temp_dir.path().join("agent1/skills");
        let agent2_path = temp_dir.path().join("agent2/skills");
        
        fs::create_dir_all(&hub_path).unwrap();
        fs::create_dir_all(&agent1_path).unwrap();
        fs::create_dir_all(&agent2_path).unwrap();
        
        // Create skill in hub
        let hub_skill = hub_path.join("shared-skill");
        fs::create_dir(&hub_skill).unwrap();
        fs::write(hub_skill.join("file.txt"), "hub content").unwrap();
        
        // Create symlink in agent1
        let agent1_skill = agent1_path.join("shared-skill");
        create_symlink(&hub_skill, &agent1_skill).unwrap();
        
        // Create different skill in agent2
        let agent2_skill = agent2_path.join("local-skill");
        fs::create_dir(&agent2_skill).unwrap();
        fs::write(agent2_skill.join("file.txt"), "local content").unwrap();
        
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
        
        let scanner = SkillsScanner::new();
        let result = scanner.scan_all(&agents, &hub_path.to_string_lossy());
        
        // Should find shared-skill from hub
        assert_eq!(result.skills.len(), 1);
        assert_eq!(result.skills[0].name, "shared-skill");
        
        // Should find agent statuses
        assert_eq!(result.agent_statuses.len(), 2);
        
        // Should detect pending change (local-skill needs to be added to hub)
        assert_eq!(result.pending_changes.len(), 1);
    }
}
