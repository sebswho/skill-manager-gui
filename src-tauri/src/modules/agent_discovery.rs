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

use crate::types::Agent;
use std::path::PathBuf;

pub struct AgentDiscovery;

impl AgentDiscovery {
    pub fn new() -> Self {
        Self
    }
    
    /// Auto-discover common agents
    pub fn discover_agents(&self) -> Vec<Agent> {
        let mut agents = Vec::new();
        
        let home = dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        // Claude Code
        let claude_path = format!("{}/.claude/skills", home);
        if PathBuf::from(&claude_path).exists() {
            agents.push(Agent {
                id: "claude-code".to_string(),
                name: "Claude Code".to_string(),
                skills_path: claude_path,
                is_discovered: true,
            });
        }
        
        // Trae
        let trae_path = format!("{}/.trae/skills", home);
        if PathBuf::from(&trae_path).exists() {
            agents.push(Agent {
                id: "trae".to_string(),
                name: "Trae".to_string(),
                skills_path: trae_path,
                is_discovered: true,
            });
        }
        
        // iFlow
        let iflow_path = format!("{}/.iflow/skills", home);
        if PathBuf::from(&iflow_path).exists() {
            agents.push(Agent {
                id: "iflow".to_string(),
                name: "iFlow".to_string(),
                skills_path: iflow_path,
                is_discovered: true,
            });
        }
        
        // Codex
        let codex_path = format!("{}/.codex/skills", home);
        if PathBuf::from(&codex_path).exists() {
            agents.push(Agent {
                id: "codex".to_string(),
                name: "Codex".to_string(),
                skills_path: codex_path,
                is_discovered: true,
            });
        }
        
        // CodeBuddy
        let codebuddy_path = format!("{}/.codebuddy/skills", home);
        if PathBuf::from(&codebuddy_path).exists() {
            agents.push(Agent {
                id: "codebuddy".to_string(),
                name: "CodeBuddy".to_string(),
                skills_path: codebuddy_path,
                is_discovered: true,
            });
        }
        
        agents
    }
    
    /// Validate if a path is a valid agent skills directory
    pub fn validate_agent_path(&self, path: &str) -> bool {
        if path.trim().is_empty() {
            return false;
        }

        let normalized = Self::expand_tilde(path);
        let path_buf = PathBuf::from(normalized);
        path_buf.exists() && path_buf.is_dir()
    }

    fn expand_tilde(path: &str) -> String {
        if path == "~" {
            return dirs::home_dir()
                .map(|home| home.to_string_lossy().to_string())
                .unwrap_or_else(|| path.to_string());
        }

        if let Some(rest) = path.strip_prefix("~/") {
            if let Some(home) = dirs::home_dir() {
                return home.join(rest).to_string_lossy().to_string();
            }
        }

        path.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[test]
    fn test_validate_agent_path_with_valid_directory() {
        let temp_dir = TempDir::new().unwrap();
        let skills_path = temp_dir.path().join("skills");
        fs::create_dir(&skills_path).unwrap();
        
        let discovery = AgentDiscovery::new();
        assert!(discovery.validate_agent_path(&skills_path.to_string_lossy()));
    }

    #[test]
    fn test_validate_agent_path_with_invalid_directory() {
        let discovery = AgentDiscovery::new();
        assert!(!discovery.validate_agent_path("/nonexistent/path/that/does/not/exist"));
    }

    #[test]
    fn test_validate_agent_path_with_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("not_a_directory.txt");
        fs::write(&file_path, "content").unwrap();
        
        let discovery = AgentDiscovery::new();
        // Should return false because it's a file, not a directory
        assert!(!discovery.validate_agent_path(&file_path.to_string_lossy()));
    }

    #[test]
    fn test_discover_agents_finds_existing_paths() {
        // This test creates mock agent directories in temp and verifies discovery
        let temp_dir = TempDir::new().unwrap();
        let home = temp_dir.path();
        
        // Create mock agent directories
        let claude_skills = home.join(".claude/skills");
        let trae_skills = home.join(".trae/skills");
        fs::create_dir_all(&claude_skills).unwrap();
        fs::create_dir_all(&trae_skills).unwrap();
        
        // Note: discover_agents uses dirs::home_dir() which we can't easily mock
        // For unit testing, we would need to refactor to accept a home path parameter
        // For now, we test the validation logic which is more unit-testable
        
        let discovery = AgentDiscovery::new();
        assert!(discovery.validate_agent_path(&claude_skills.to_string_lossy()));
        assert!(discovery.validate_agent_path(&trae_skills.to_string_lossy()));
    }

    #[test]
    fn test_discover_agents_skips_nonexistent_paths() {
        // Similar to above, we test validation logic
        let temp_dir = TempDir::new().unwrap();
        let home = temp_dir.path();
        
        // Only create one agent directory
        let existing_skills = home.join(".existing/skills");
        fs::create_dir_all(&existing_skills).unwrap();
        
        let discovery = AgentDiscovery::new();
        assert!(discovery.validate_agent_path(&existing_skills.to_string_lossy()));
        assert!(!discovery.validate_agent_path(&home.join(".nonexistent/skills").to_string_lossy()));
    }

    #[test]
    fn test_validate_agent_path_with_empty_string() {
        let discovery = AgentDiscovery::new();
        assert!(!discovery.validate_agent_path(""));
    }

    #[test]
    fn test_validate_agent_path_with_relative_path() {
        let discovery = AgentDiscovery::new();
        // Relative paths should work if they exist
        assert!(!discovery.validate_agent_path("./relative/path"));
    }
}
