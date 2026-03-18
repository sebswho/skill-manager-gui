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
}
