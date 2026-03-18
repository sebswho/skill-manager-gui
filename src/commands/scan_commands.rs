use crate::modules::{AgentDiscovery, SkillsScanner};
use crate::types::{Agent, ScanResult};
use tauri::command;

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
