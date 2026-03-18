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
        let config_dir = dirs::config_dir()
            .ok_or(ConfigError::ConfigDirNotFound)?
            .join("agent-skills-manager");
        
        fs::create_dir_all(&config_dir)?;
        
        Ok(Self {
            config_path: config_dir.join("config.json"),
        })
    }
    
    pub fn load(&self) -> Result<AppConfig> {
        if !self.config_path.exists() {
            let default_config = AppConfig::default();
            self.save(&default_config)?;
            return Ok(default_config);
        }
        
        let content = fs::read_to_string(&self.config_path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
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
        // Remove if exists
        config.agents.retain(|a| a.id != agent.id);
        config.agents.push(agent);
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
        config.central_hub_path = path;
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
}
