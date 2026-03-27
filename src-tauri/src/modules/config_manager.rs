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

use crate::types::{Agent, AppConfig};
use serde_json;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Config directory not found")]
    ConfigDirNotFound,
}

pub type Result<T> = std::result::Result<T, ConfigError>;

pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Result<Self> {
        let base_config_dir = dirs::config_dir().ok_or(ConfigError::ConfigDirNotFound)?;
        let config_dir = base_config_dir.join("skilltoon");
        let legacy_config_path = base_config_dir
            .join("agent-skills-manager")
            .join("config.json");
        let config_path = config_dir.join("config.json");

        fs::create_dir_all(&config_dir)?;

        // Preserve existing user settings from the legacy app name on first launch.
        if !config_path.exists() && legacy_config_path.exists() {
            fs::copy(&legacy_config_path, &config_path)?;
        }

        Ok(Self { config_path })
    }
    
    pub fn load(&self) -> Result<AppConfig> {
        if !self.config_path.exists() {
            let default_config = AppConfig::default();
            self.save(&default_config)?;
            return Ok(default_config);
        }
        
        let content = fs::read_to_string(&self.config_path)?;
        let mut config: AppConfig = serde_json::from_str(&content)?;
        let normalized = Self::normalize_config_paths(&mut config);
        if normalized {
            self.save(&config)?;
        }
        Ok(config)
    }
    
    pub fn save(&self, config: &AppConfig) -> Result<()> {
        let content = serde_json::to_string_pretty(config)?;
        fs::write(&self.config_path, content)?;
        Ok(())
    }
    
    pub fn export(&self, path: &PathBuf) -> Result<()> {
        let config = self.load()?;
        let content = serde_json::to_string_pretty(&config)?;
        fs::write(path, content)?;
        Ok(())
    }
    
    pub fn import(&self, path: &PathBuf) -> Result<AppConfig> {
        let content = fs::read_to_string(path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        self.save(&config)?;
        Ok(config)
    }
    
    pub fn add_agent(&self, agent: Agent) -> Result<AppConfig> {
        let mut config = self.load()?;
        let mut normalized_agent = agent;
        normalized_agent.skills_path = Self::expand_tilde(&normalized_agent.skills_path);
        // Remove if exists
        config.agents.retain(|a| a.id != normalized_agent.id);
        config.agents.push(normalized_agent);
        self.save(&config)?;
        Ok(config)
    }
    
    pub fn remove_agent(&self, agent_id: &str) -> Result<AppConfig> {
        let mut config = self.load()?;
        config.agents.retain(|a| a.id != agent_id);
        self.save(&config)?;
        Ok(config)
    }
    
    pub fn update_central_hub_path(&self, path: String) -> Result<AppConfig> {
        let mut config = self.load()?;
        config.central_hub_path = Self::expand_tilde(&path);
        self.save(&config)?;
        Ok(config)
    }
    
    pub fn update_theme(&self, theme: String) -> Result<AppConfig> {
        let mut config = self.load()?;
        config.theme = Some(theme);
        self.save(&config)?;
        Ok(config)
    }
    
    pub fn update_locale(&self, locale: String) -> Result<AppConfig> {
        let mut config = self.load()?;
        config.locale = Some(locale);
        self.save(&config)?;
        Ok(config)
    }

    fn expand_tilde(path: &str) -> String {
        if path == "~" {
            return dirs::home_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| path.to_string());
        }

        if let Some(rest) = path.strip_prefix("~/") {
            if let Some(home) = dirs::home_dir() {
                return home.join(rest).to_string_lossy().to_string();
            }
        }

        path.to_string()
    }

    fn normalize_config_paths(config: &mut AppConfig) -> bool {
        let mut changed = false;

        let normalized_hub = Self::expand_tilde(&config.central_hub_path);
        if normalized_hub != config.central_hub_path {
            config.central_hub_path = normalized_hub;
            changed = true;
        }

        for agent in &mut config.agents {
            let normalized = Self::expand_tilde(&agent.skills_path);
            if normalized != agent.skills_path {
                agent.skills_path = normalized;
                changed = true;
            }
        }

        changed
    }
}

#[cfg(test)]
impl ConfigManager {
    pub fn with_path(path: PathBuf) -> Self {
        Self { config_path: path }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_config_manager_new_creates_directory() {
        // Note: This test uses the default config directory
        // In CI environments or isolated test runs, this is acceptable
        let result = ConfigManager::new();
        assert!(result.is_ok());
    }

    #[test]
    fn test_load_returns_default_when_no_config() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        // Create a test-specific ConfigManager that uses temp path
        let manager = ConfigManager::with_path(config_path.clone());
        
        let config = manager.load().unwrap();
        assert!(!config.central_hub_path.is_empty());
        assert!(config.agents.is_empty());
        
        // Verify file was created
        assert!(config_path.exists());
    }

    #[test]
    fn test_save_and_load_roundtrip() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        let mut config = AppConfig::default();
        config.central_hub_path = "/test/path".to_string();
        config.agents.push(Agent {
            id: "test-agent".to_string(),
            name: "Test Agent".to_string(),
            skills_path: "/test/skills".to_string(),
            is_discovered: false,
        });
        
        manager.save(&config).unwrap();
        
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.central_hub_path, "/test/path");
        assert_eq!(loaded.agents.len(), 1);
        assert_eq!(loaded.agents[0].id, "test-agent");
    }

    #[test]
    fn test_add_agent() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        let agent = Agent {
            id: "new-agent".to_string(),
            name: "New Agent".to_string(),
            skills_path: "/new/skills".to_string(),
            is_discovered: false,
        };
        
        let config = manager.add_agent(agent).unwrap();
        assert_eq!(config.agents.len(), 1);
        assert_eq!(config.agents[0].id, "new-agent");
        
        // Verify it was saved
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.agents.len(), 1);
    }

    #[test]
    fn test_add_agent_replaces_existing() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        let agent1 = Agent {
            id: "agent-1".to_string(),
            name: "Agent One".to_string(),
            skills_path: "/path/one".to_string(),
            is_discovered: false,
        };
        
        let agent2 = Agent {
            id: "agent-1".to_string(),  // Same ID
            name: "Agent Updated".to_string(),
            skills_path: "/path/two".to_string(),
            is_discovered: false,
        };
        
        manager.add_agent(agent1).unwrap();
        let config = manager.add_agent(agent2).unwrap();
        
        assert_eq!(config.agents.len(), 1);
        assert_eq!(config.agents[0].name, "Agent Updated");
    }

    #[test]
    fn test_remove_agent() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        let agent = Agent {
            id: "to-remove".to_string(),
            name: "To Remove".to_string(),
            skills_path: "/remove/path".to_string(),
            is_discovered: false,
        };
        
        manager.add_agent(agent).unwrap();
        let config = manager.remove_agent("to-remove").unwrap();
        
        assert!(config.agents.is_empty());
    }

    #[test]
    fn test_update_central_hub_path() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        let config = manager.update_central_hub_path("/new/hub/path".to_string()).unwrap();
        assert_eq!(config.central_hub_path, "/new/hub/path");
        
        // Verify it was saved
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.central_hub_path, "/new/hub/path");
    }

    #[test]
    fn test_export_and_import() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        let export_path = temp_dir.path().join("exported.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        // Setup initial config
        let mut config = AppConfig::default();
        config.central_hub_path = "/export/test".to_string();
        manager.save(&config).unwrap();
        
        // Export
        manager.export(&export_path).unwrap();
        assert!(export_path.exists());
        
        // Modify original
        manager.update_central_hub_path("/modified".to_string()).unwrap();
        
        // Import
        let imported = manager.import(&export_path).unwrap();
        assert_eq!(imported.central_hub_path, "/export/test");
    }

    #[test]
    fn test_update_theme() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        // Update theme to dark
        let config = manager.update_theme("dark".to_string()).unwrap();
        assert_eq!(config.theme, Some("dark".to_string()));
        
        // Verify it was saved
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.theme, Some("dark".to_string()));
    }

    #[test]
    fn test_update_locale() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        // Update locale to English
        let config = manager.update_locale("en".to_string()).unwrap();
        assert_eq!(config.locale, Some("en".to_string()));
        
        // Verify it was saved
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.locale, Some("en".to_string()));
    }

    #[test]
    fn test_theme_and_locale_integration() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        // Set both theme and locale
        manager.update_theme("dark".to_string()).unwrap();
        manager.update_locale("en".to_string()).unwrap();
        
        // Verify both persisted together
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.theme, Some("dark".to_string()));
        assert_eq!(loaded.locale, Some("en".to_string()));
    }

    #[test]
    fn test_default_theme_and_locale() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.json");
        
        let manager = ConfigManager::with_path(config_path.clone());
        
        // Load default config
        let loaded = manager.load().unwrap();
        assert_eq!(loaded.theme, Some("light".to_string()));
        assert_eq!(loaded.locale, Some("zh-CN".to_string()));
    }
}
