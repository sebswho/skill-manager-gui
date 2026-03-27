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

use crate::modules::{AgentDiscovery, SkillsScanner};
use crate::types::{Agent, ScanResult, SkillVersion};
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

#[command]
pub fn get_skill_versions(
    skill_name: String,
    agents: Vec<Agent>,
    hub_path: String,
) -> Vec<SkillVersion> {
    let scanner = SkillsScanner::new();
    scanner.get_skill_versions(&skill_name, &agents, &hub_path)
}
