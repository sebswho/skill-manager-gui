use crate::modules::{AgentDiscovery, SkillsScanner};
use crate::types::{Agent, ScanResult};
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
pub fn discover_agents() -> Vec<Agent> {
    let discovery = AgentDiscovery::new();
    discovery.discover_agents()
}

#[command]
pub fn validate_agent_path(path: String) -> bool {
    let discovery = AgentDiscovery::new();
    discovery.validate_agent_path(&path)
}

#[command]
pub fn scan_all(agents: Vec<Agent>, hub_path: String) -> Result<ScanResult, String> {
    let scanner = SkillsScanner::new();
    Ok(scanner.scan_all(&agents, &hub_path))
}

#[command]
pub fn scan_central_hub(hub_path: String) -> Vec<crate::types::Skill> {
    let scanner = SkillsScanner::new();
    scanner.scan_central_hub(&hub_path)
}
