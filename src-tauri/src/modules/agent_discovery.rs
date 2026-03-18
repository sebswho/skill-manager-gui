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
        let path_buf = PathBuf::from(path);
        path_buf.exists() && path_buf.is_dir()
    }
}
