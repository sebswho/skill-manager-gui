# Agent Skills Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri 2.0 desktop app that provides a unified GUI for managing AI Agent Skills across multiple agents (Claude Code, Trae, iFlow, etc.) with symlink-based synchronization to avoid storage redundancy.

**Architecture:** Center-Hub architecture where all Skills are stored in a central directory (`~/.agents/skills/`) and Agent-specific directories use symlinks to reference them. The app provides a visual matrix interface showing Skills × Agents sync status.

**Tech Stack:** Tauri 2.0, Bun, React + TypeScript, shadcn/ui, Zustand, Rust (notify crate for file watching)

---

## File Structure

```
agent-skills-manager/
├── src/                           # Rust backend
│   ├── main.rs                    # Entry point, Tauri command registration
│   ├── lib.rs                     # Module exports
│   ├── commands/                  # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── config_commands.rs     # Config-related commands
│   │   ├── file_commands.rs       # File operation commands
│   │   ├── scan_commands.rs       # Scanning commands
│   │   └── sync_commands.rs       # Sync commands
│   └── modules/                   # Core business logic
│       ├── mod.rs
│       ├── config_manager.rs      # ConfigManager implementation
│       ├── agent_discovery.rs     # AgentDiscovery implementation
│       ├── skills_scanner.rs      # SkillsScanner implementation
│       ├── sync_engine.rs         # SyncEngine implementation
│       └── file_operations.rs     # FileOperations implementation
├── src-ui/                        # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Root component
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── skills/
│   │   │   │   ├── SkillList.tsx
│   │   │   │   ├── SkillItem.tsx
│   │   │   │   └── SkillSearch.tsx
│   │   │   ├── sync/
│   │   │   │   ├── SyncMatrix.tsx
│   │   │   │   ├── SyncCell.tsx
│   │   │   │   └── SyncActions.tsx
│   │   │   └── settings/
│   │   │       ├── SettingsPanel.tsx
│   │   │       ├── AgentConfig.tsx
│   │   │       └── PathConfig.tsx
│   │   ├── hooks/
│   │   │   ├── useConfig.ts
│   │   │   ├── useSkills.ts
│   │   │   ├── useAgents.ts
│   │   │   └── useSync.ts
│   │   ├── stores/
│   │   │   └── appStore.ts        # Zustand store
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   └── lib/
│   │       ├── tauri.ts           # Tauri API wrappers
│   │       └── utils.ts
│   ├── components.json            # shadcn/ui config
│   └── tailwind.config.js
├── tests/                         # Rust integration tests
│   ├── file_operations_tests.rs
│   ├── skills_scanner_tests.rs
│   └── sync_engine_tests.rs
└── docs/
    └── plans/
        └── 2025-03-18-agent-skills-manager.md
```

---

## Phase 1: Project Initialization

### Task 1: Initialize Tauri Project with Bun

**Files:**
- Create: `Cargo.toml`
- Create: `package.json`
- Create: `tauri.conf.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

- [ ] **Step 1: Create project structure and Cargo.toml**

```toml
[package]
name = "agent-skills-manager"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
notify = "6.1"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
sha2 = "0.10"
walkdir = "2.4"

[dev-dependencies]
tempfile = "3.8"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

- [ ] **Step 2: Create package.json with Bun**

Run: `bun init -y`

Then modify `package.json`:

```json
{
  "name": "agent-skills-manager-ui",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `bun install`

Expected: `node_modules` created, no errors

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: initialize Tauri 2.0 project with Bun"
```

---

### Task 2: Configure TypeScript and Vite

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src-ui/index.html`

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}))
```

- [ ] **Step 4: Create src-ui/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agent Skills Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: configure TypeScript and Vite"
```

---

### Task 3: Setup shadcn/ui

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src-ui/src/index.css`
- Create: `components.json`

- [ ] **Step 1: Initialize Tailwind CSS**

Run: `bunx tailwindcss init -p`

- [ ] **Step 2: Update tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

- [ ] **Step 3: Create src-ui/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Install tailwindcss-animate**

Run: `bun add -d tailwindcss-animate`

- [ ] **Step 5: Create components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 6: Create utils helper**

Create `src-ui/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: setup shadcn/ui with Tailwind CSS"
```

---

## Phase 2: Rust Backend - Core Modules

### Task 4: Define Core Types

**Files:**
- Create: `src/types.rs`

- [ ] **Step 1: Create shared types module**

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified_at: String,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub skills_path: String,
    pub is_discovered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSkillStatus {
    pub agent_id: String,
    pub skill_name: String,
    pub status: SyncStatus,
    pub is_symlink: bool,
    pub target_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SyncStatus {
    Synced,
    Missing,
    Conflict,
    New,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub central_hub_path: String,
    pub agents: Vec<Agent>,
    pub window_width: u32,
    pub window_height: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        let home = dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        Self {
            central_hub_path: format!("{}/.agents/skills", home),
            agents: vec![],
            window_width: 1200,
            window_height: 800,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncMatrix {
    pub skills: Vec<String>,
    pub agents: Vec<String>,
    pub cells: HashMap<String, HashMap<String, SyncStatus>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conflict {
    pub skill_name: String,
    pub agent_ids: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub skills: Vec<Skill>,
    pub agent_statuses: Vec<AgentSkillStatus>,
    pub pending_changes: Vec<PendingChange>,
    pub conflicts: Vec<Conflict>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PendingChange {
    AddToHub { skill_name: String, source_agent: String },
    SyncToAgent { skill_name: String, target_agent: String },
}
```

Add to `Cargo.toml`:
```toml
[dependencies]
dirs = "5.0"
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(types): define core data structures"
```

---

### Task 5: FileOperations Module (with TDD)

**Files:**
- Create: `src/modules/file_operations.rs`
- Create: `tests/file_operations_tests.rs`

- [ ] **Step 1: Write failing test for symlink operations**

Create `tests/file_operations_tests.rs`:

```rust
use std::fs;
use tempfile::TempDir;

// Assuming file_operations module exists
// This test will fail initially

#[test]
fn test_create_and_verify_symlink() {
    let temp_dir = TempDir::new().unwrap();
    let target = temp_dir.path().join("target_dir");
    let link = temp_dir.path().join("link_dir");
    
    // Create target directory
    fs::create_dir(&target).unwrap();
    
    // Create a file in target
    fs::write(target.join("test.txt"), "hello").unwrap();
    
    // Test: create symlink
    // TODO: implement create_symlink
    // create_symlink(&target, &link).unwrap();
    
    // Test: verify it's a symlink
    // assert!(is_symlink(&link).unwrap());
    
    // Test: get target path
    // let resolved = get_symlink_target(&link).unwrap();
    // assert_eq!(resolved, target);
    
    // Temporarily fail
    panic!("Test not implemented yet");
}

#[test]
fn test_calculate_directory_hash() {
    let temp_dir = TempDir::new().unwrap();
    let test_dir = temp_dir.path().join("test_skill");
    fs::create_dir(&test_dir).unwrap();
    fs::write(test_dir.join("file1.txt"), "content1").unwrap();
    fs::write(test_dir.join("file2.txt"), "content2").unwrap();
    
    // TODO: implement calculate_directory_hash
    // let hash1 = calculate_directory_hash(&test_dir).unwrap();
    // let hash2 = calculate_directory_hash(&test_dir).unwrap();
    // assert_eq!(hash1, hash2);
    
    panic!("Test not implemented yet");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test file_operations`

Expected: FAIL - tests don't exist yet

- [ ] **Step 3: Implement FileOperations module**

Create `src/modules/file_operations.rs`:

```rust
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, thiserror::Error)]
pub enum FileError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("Path is not a valid symlink")]
    NotASymlink,
    #[error("Target path does not exist")]
    TargetNotExists,
}

pub type Result<T> = std::result::Result<T, FileError>;

/// Create a symbolic link from `link_path` pointing to `target_path`
pub fn create_symlink(target_path: &Path, link_path: &Path) -> Result<()> {
    if !target_path.exists() {
        return Err(FileError::TargetNotExists);
    }
    
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(target_path, link_path)?;
    }
    
    #[cfg(windows)]
    {
        if target_path.is_dir() {
            std::os::windows::fs::symlink_dir(target_path, link_path)?;
        } else {
            std::os::windows::fs::symlink_file(target_path, link_path)?;
        }
    }
    
    Ok(())
}

/// Remove a symbolic link (does not delete the target)
pub fn remove_symlink(link_path: &Path) -> Result<()> {
    if !is_symlink(link_path)? {
        return Err(FileError::NotASymlink);
    }
    fs::remove_file(link_path)?;
    Ok(())
}

/// Check if path is a symbolic link
pub fn is_symlink(path: &Path) -> Result<bool> {
    let metadata = fs::symlink_metadata(path)?;
    Ok(metadata.file_type().is_symlink())
}

/// Get the target of a symbolic link
pub fn get_symlink_target(link_path: &Path) -> Result<String> {
    if !is_symlink(link_path)? {
        return Err(FileError::NotASymlink);
    }
    let target = fs::read_link(link_path)?;
    Ok(target.to_string_lossy().to_string())
}

/// Copy directory recursively
pub fn copy_directory(src: &Path, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;
    
    for entry in WalkDir::new(src).min_depth(1) {
        let entry = entry?;
        let path = entry.path();
        let relative_path = path.strip_prefix(src).unwrap();
        let dest_path = dest.join(relative_path);
        
        if entry.file_type().is_dir() {
            fs::create_dir_all(&dest_path)?;
        } else {
            if let Some(parent) = dest_path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(path, dest_path)?;
        }
    }
    
    Ok(())
}

/// Delete directory recursively
pub fn delete_directory(path: &Path) -> Result<()> {
    if path.exists() {
        fs::remove_dir_all(path)?;
    }
    Ok(())
}

/// Calculate a hash of directory contents for comparison
pub fn calculate_directory_hash(path: &Path) -> Result<String> {
    let mut hasher = Sha256::new();
    
    let mut entries: Vec<_> = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .collect();
    
    // Sort for consistent hashing
    entries.sort_by(|a, b| a.path().cmp(b.path()));
    
    for entry in entries {
        let relative_path = entry.path().strip_prefix(path).unwrap();
        hasher.update(relative_path.to_string_lossy().as_bytes());
        
        let mut file = fs::File::open(entry.path())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        hasher.update(&buffer);
    }
    
    Ok(format!("{:x}", hasher.finalize()))
}

/// Check if path is inside another path (prevents escaping)
pub fn is_path_inside(child: &Path, parent: &Path) -> bool {
    match child.canonicalize() {
        Ok(child_canon) => match parent.canonicalize() {
            Ok(parent_canon) => child_canon.starts_with(&parent_canon),
            Err(_) => false,
        },
        Err(_) => false,
    }
}
```

- [ ] **Step 4: Update test file with actual tests**

Update `tests/file_operations_tests.rs`:

```rust
use agent_skills_manager::modules::file_operations::*;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_create_and_verify_symlink() {
    let temp_dir = TempDir::new().unwrap();
    let target = temp_dir.path().join("target_dir");
    let link = temp_dir.path().join("link_dir");
    
    fs::create_dir(&target).unwrap();
    fs::write(target.join("test.txt"), "hello").unwrap();
    
    create_symlink(&target, &link).unwrap();
    
    assert!(is_symlink(&link).unwrap());
    
    let resolved = get_symlink_target(&link).unwrap();
    assert!(resolved.contains("target_dir"));
}

#[test]
fn test_calculate_directory_hash() {
    let temp_dir = TempDir::new().unwrap();
    let test_dir = temp_dir.path().join("test_skill");
    fs::create_dir(&test_dir).unwrap();
    fs::write(test_dir.join("file1.txt"), "content1").unwrap();
    fs::write(test_dir.join("file2.txt"), "content2").unwrap();
    
    let hash1 = calculate_directory_hash(&test_dir).unwrap();
    let hash2 = calculate_directory_hash(&test_dir).unwrap();
    assert_eq!(hash1, hash2);
    
    // Modify file should change hash
    fs::write(test_dir.join("file1.txt"), "modified").unwrap();
    let hash3 = calculate_directory_hash(&test_dir).unwrap();
    assert_ne!(hash1, hash3);
}

#[test]
fn test_copy_and_delete_directory() {
    let temp_dir = TempDir::new().unwrap();
    let src = temp_dir.path().join("src");
    let dest = temp_dir.path().join("dest");
    
    fs::create_dir(&src).unwrap();
    fs::create_dir(src.join("subdir")).unwrap();
    fs::write(src.join("file.txt"), "content").unwrap();
    fs::write(src.join("subdir/nested.txt"), "nested").unwrap();
    
    copy_directory(&src, &dest).unwrap();
    
    assert!(dest.join("file.txt").exists());
    assert!(dest.join("subdir/nested.txt").exists());
    
    delete_directory(&dest).unwrap();
    assert!(!dest.exists());
}
```

- [ ] **Step 5: Update lib.rs to expose modules**

Create `src/lib.rs`:

```rust
pub mod modules;
pub mod types;

pub use modules::*;
pub use types::*;
```

- [ ] **Step 6: Update modules/mod.rs**

Create `src/modules/mod.rs`:

```rust
pub mod file_operations;

pub use file_operations::*;
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cargo test file_operations`

Expected: All 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(file-ops): implement file operations with symlink support and tests"
```

---

### Task 6: ConfigManager Module

**Files:**
- Create: `src/modules/config_manager.rs`
- Modify: `src/modules/mod.rs`

- [ ] **Step 1: Implement ConfigManager**

Create `src/modules/config_manager.rs`:

```rust
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
```

- [ ] **Step 2: Update modules/mod.rs**

Add to `src/modules/mod.rs`:

```rust
pub mod config_manager;

pub use config_manager::*;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(config): implement ConfigManager with CRUD operations"
```

---

### Task 7: AgentDiscovery Module

**Files:**
- Create: `src/modules/agent_discovery.rs`
- Modify: `src/modules/mod.rs`

- [ ] **Step 1: Implement AgentDiscovery**

Create `src/modules/agent_discovery.rs`:

```rust
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
```

- [ ] **Step 2: Update modules/mod.rs**

Add to `src/modules/mod.rs`:

```rust
pub mod agent_discovery;

pub use agent_discovery::*;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(agent): implement AgentDiscovery for auto-detection"
```

---

### Task 8: SkillsScanner Module

**Files:**
- Create: `src/modules/skills_scanner.rs`
- Modify: `src/modules/mod.rs`

- [ ] **Step 1: Implement SkillsScanner**

Create `src/modules/skills_scanner.rs`:

```rust
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
```

- [ ] **Step 2: Update modules/mod.rs**

Add to `src/modules/mod.rs`:

```rust
pub mod skills_scanner;

pub use skills_scanner::*;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(scanner): implement SkillsScanner for detecting sync status"
```

---

### Task 9: SyncEngine Module

**Files:**
- Create: `src/modules/sync_engine.rs`
- Modify: `src/modules/mod.rs`

- [ ] **Step 1: Implement SyncEngine**

Create `src/modules/sync_engine.rs`:

```rust
use crate::modules::file_operations::{copy_directory, create_symlink, delete_directory, remove_symlink};
use crate::types::{Agent, PendingChange, SyncResult};
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum SyncError {
    #[error("File operation error: {0}")]
    File(#[from] crate::modules::file_operations::FileError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Agent not found: {0}")]
    AgentNotFound(String),
    #[error("Skill not found: {0}")]
    SkillNotFound(String),
}

pub type Result<T> = std::result::Result<T, SyncError>;

pub struct SyncEngine;

impl SyncEngine {
    pub fn new() -> Self {
        Self
    }
    
    /// Copy skill to central hub from agent
    pub fn sync_to_hub(&self, skill_name: &str, source_agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(&source_agent.skills_path).join(skill_name);
        let dest = Path::new(hub_path).join(skill_name);
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }
        
        // Copy to hub
        if dest.exists() {
            delete_directory(&dest)?;
        }
        copy_directory(&source, &dest)?;
        
        // Remove original and create symlink
        delete_directory(&source)?;
        create_symlink(&dest, &source)?;
        
        Ok(SyncResult {
            success: true,
            message: format!("Skill '{}' synced to hub", skill_name),
        })
    }
    
    /// Create symlink from hub to agent
    pub fn sync_to_agent(&self, skill_name: &str, agent: &Agent, hub_path: &str) -> Result<SyncResult> {
        let source = Path::new(hub_path).join(skill_name);
        let link = Path::new(&agent.skills_path).join(skill_name);
        
        if !source.exists() {
            return Err(SyncError::SkillNotFound(skill_name.to_string()));
        }
        
        // Remove existing if present
        if link.exists() || link.is_symlink() {
            if link.is_symlink() {
                remove_symlink(&link)?;
            } else {
                delete_directory(&link)?;
            }
        }
        
        // Create symlink
        create_symlink(&source, &link)?;
        
        Ok(SyncResult {
            success: true,
            message: format!("Skill '{}' synced to {}", skill_name, agent.name),
        })
    }
    
    /// Batch sync skills to multiple agents
    pub fn batch_sync(
        &self,
        skills: &[String],
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<Vec<SyncResult>> {
        let mut results = Vec::new();
        
        for skill_name in skills {
            for agent in agents {
                match self.sync_to_agent(skill_name, agent, hub_path) {
                    Ok(result) => results.push(result),
                    Err(e) => results.push(SyncResult {
                        success: false,
                        message: format!("Failed to sync '{}' to {}: {}", skill_name, agent.name, e),
                    }),
                }
            }
        }
        
        Ok(results)
    }
    
    /// Execute pending changes
    pub fn execute_changes(
        &self,
        changes: &[PendingChange],
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<Vec<SyncResult>> {
        let mut results = Vec::new();
        
        for change in changes {
            match change {
                PendingChange::AddToHub { skill_name, source_agent } => {
                    if let Some(agent) = agents.iter().find(|a| a.id == *source_agent) {
                        match self.sync_to_hub(skill_name, agent, hub_path) {
                            Ok(result) => results.push(result),
                            Err(e) => results.push(SyncResult {
                                success: false,
                                message: format!("Failed to add '{}' to hub: {}", skill_name, e),
                            }),
                        }
                    }
                }
                PendingChange::SyncToAgent { skill_name, target_agent } => {
                    if let Some(agent) = agents.iter().find(|a| a.id == *target_agent) {
                        match self.sync_to_agent(skill_name, agent, hub_path) {
                            Ok(result) => results.push(result),
                            Err(e) => results.push(SyncResult {
                                success: false,
                                message: format!("Failed to sync '{}' to {}: {}", skill_name, agent.name, e),
                            }),
                        }
                    }
                }
            }
        }
        
        Ok(results)
    }
    
    /// Delete skill with scope control
    pub fn delete_skill(
        &self,
        skill_name: &str,
        scope: DeleteScope,
        agents: &[Agent],
        hub_path: &str,
    ) -> Result<SyncResult> {
        match scope {
            DeleteScope::Local { agent_id } => {
                if let Some(agent) = agents.iter().find(|a| a.id == agent_id) {
                    let path = Path::new(&agent.skills_path).join(skill_name);
                    if path.is_symlink() {
                        remove_symlink(&path)?;
                    } else if path.exists() {
                        delete_directory(&path)?;
                    }
                }
                Ok(SyncResult {
                    success: true,
                    message: format!("Skill '{}' removed from {}", skill_name, agent_id),
                })
            }
            DeleteScope::Global => {
                // Remove from all agents
                for agent in agents {
                    let path = Path::new(&agent.skills_path).join(skill_name);
                    if path.is_symlink() {
                        let _ = remove_symlink(&path);
                    } else if path.exists() {
                        let _ = delete_directory(&path);
                    }
                }
                // Remove from hub
                let hub_skill = Path::new(hub_path).join(skill_name);
                if hub_skill.exists() {
                    delete_directory(&hub_skill)?;
                }
                Ok(SyncResult {
                    success: true,
                    message: format!("Skill '{}' deleted globally", skill_name),
                })
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum DeleteScope {
    Local { agent_id: String },
    Global,
}
```

Add to `src/types.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
}
```

- [ ] **Step 2: Update modules/mod.rs**

Add to `src/modules/mod.rs`:

```rust
pub mod sync_engine;

pub use sync_engine::*;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(sync): implement SyncEngine for skill synchronization"
```

---

### Task 10: Tauri Commands Setup

**Files:**
- Create: `src/commands/mod.rs`
- Create: `src/commands/config_commands.rs`
- Create: `src/commands/file_commands.rs`
- Create: `src/commands/scan_commands.rs`
- Create: `src/commands/sync_commands.rs`
- Modify: `src/main.rs`

- [ ] **Step 1: Create commands module structure**

Create `src/commands/mod.rs`:

```rust
pub mod config_commands;
pub mod file_commands;
pub mod scan_commands;
pub mod sync_commands;
```

- [ ] **Step 2: Implement config commands**

Create `src/commands/config_commands.rs`:

```rust
use crate::modules::ConfigManager;
use crate::types::{Agent, AppConfig};
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;

pub struct AppState {
    pub config_manager: Mutex<ConfigManager>,
}

#[tauri::command]
pub fn load_config(state: State<AppState>) -> Result<AppConfig, String> {
    state.config_manager.lock().unwrap()
        .load()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<AppState>) -> Result<(), String> {
    state.config_manager.lock().unwrap()
        .save(&config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_config(path: String, state: State<AppState>) -> Result<(), String> {
    state.config_manager.lock().unwrap()
        .export(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_config(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state.config_manager.lock().unwrap()
        .import(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_agent(agent: Agent, state: State<AppState>) -> Result<AppConfig, String> {
    state.config_manager.lock().unwrap()
        .add_agent(agent)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_agent(agent_id: String, state: State<AppState>) -> Result<AppConfig, String> {
    state.config_manager.lock().unwrap()
        .remove_agent(&agent_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_central_hub_path(path: String, state: State<AppState>) -> Result<AppConfig, String> {
    state.config_manager.lock().unwrap()
        .update_central_hub_path(path)
        .map_err(|e| e.to_string())
}
```

- [ ] **Step 3: Implement scan commands**

Create `src/commands/scan_commands.rs`:

```rust
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
```

- [ ] **Step 4: Implement sync commands**

Create `src/commands/sync_commands.rs`:

```rust
use crate::modules::sync_engine::{DeleteScope, SyncEngine};
use crate::types::{Agent, PendingChange, SyncResult};
use tauri::command;

#[command]
pub fn sync_to_hub(skill_name: String, source_agent: Agent, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine.sync_to_hub(&skill_name, &source_agent, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn sync_to_agent(skill_name: String, agent: Agent, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine.sync_to_agent(&skill_name, &agent, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn batch_sync(skills: Vec<String>, agents: Vec<Agent>, hub_path: String) -> Result<Vec<SyncResult>, String> {
    let engine = SyncEngine::new();
    engine.batch_sync(&skills, &agents, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn execute_changes(changes: Vec<PendingChange>, agents: Vec<Agent>, hub_path: String) -> Result<Vec<SyncResult>, String> {
    let engine = SyncEngine::new();
    engine.execute_changes(&changes, &agents, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn delete_skill_local(skill_name: String, agent_id: String, agents: Vec<Agent>, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine.delete_skill(&skill_name, DeleteScope::Local { agent_id }, &agents, &hub_path)
        .map_err(|e| e.to_string())
}

#[command]
pub fn delete_skill_global(skill_name: String, agents: Vec<Agent>, hub_path: String) -> Result<SyncResult, String> {
    let engine = SyncEngine::new();
    engine.delete_skill(&skill_name, DeleteScope::Global, &agents, &hub_path)
        .map_err(|e| e.to_string())
}
```

- [ ] **Step 5: Create empty file_commands.rs**

Create `src/commands/file_commands.rs`:

```rust
// File operation commands if needed
// Most file operations happen internally in Rust modules
```

- [ ] **Step 6: Update main.rs**

Create `src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod modules;
mod types;

use commands::config_commands::{AppState, load_config, save_config, export_config, import_config, add_agent, remove_agent, update_central_hub_path};
use commands::scan_commands::{discover_agents, validate_agent_path, scan_all, scan_central_hub};
use commands::sync_commands::{sync_to_hub, sync_to_agent, batch_sync, execute_changes, delete_skill_local, delete_skill_global};
use modules::ConfigManager;
use std::sync::Mutex;

fn main() {
    let config_manager = ConfigManager::new().expect("Failed to initialize config manager");
    
    tauri::Builder::default()
        .manage(AppState {
            config_manager: Mutex::new(config_manager),
        })
        .invoke_handler(tauri::generate_handler![
            // Config commands
            load_config,
            save_config,
            export_config,
            import_config,
            add_agent,
            remove_agent,
            update_central_hub_path,
            // Scan commands
            discover_agents,
            validate_agent_path,
            scan_all,
            scan_central_hub,
            // Sync commands
            sync_to_hub,
            sync_to_agent,
            batch_sync,
            execute_changes,
            delete_skill_local,
            delete_skill_global,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(commands): implement all Tauri commands for frontend integration"
```

---

## Phase 3: Frontend Implementation

### Task 11: Setup TypeScript Types

**Files:**
- Create: `src-ui/src/types/index.ts`

- [ ] **Step 1: Create TypeScript type definitions**

Create `src-ui/src/types/index.ts`:

```typescript
export interface Skill {
  name: string;
  path: string;
  size: number;
  modified_at: string;
  hash: string;
}

export interface Agent {
  id: string;
  name: string;
  skills_path: string;
  is_discovered: boolean;
}

export type SyncStatus = 'synced' | 'missing' | 'conflict' | 'new';

export interface AgentSkillStatus {
  agent_id: string;
  skill_name: string;
  status: SyncStatus;
  is_symlink: boolean;
  target_path?: string;
}

export interface AppConfig {
  central_hub_path: string;
  agents: Agent[];
  window_width: number;
  window_height: number;
}

export interface SyncMatrix {
  skills: string[];
  agents: string[];
  cells: Record<string, Record<string, SyncStatus>>;
}

export interface Conflict {
  skill_name: string;
  agent_ids: string[];
  message: string;
}

export type PendingChange = 
  | { type: 'add_to_hub'; skill_name: string; source_agent: string }
  | { type: 'sync_to_agent'; skill_name: string; target_agent: string };

export interface ScanResult {
  skills: Skill[];
  agent_statuses: AgentSkillStatus[];
  pending_changes: PendingChange[];
  conflicts: Conflict[];
}

export interface SyncResult {
  success: boolean;
  message: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(types): add TypeScript type definitions"
```

---

### Task 12: Setup Zustand Store

**Files:**
- Create: `src-ui/src/stores/appStore.ts`

- [ ] **Step 1: Implement Zustand store**

Create `src-ui/src/stores/appStore.ts`:

```typescript
import { create } from 'zustand';
import type { Agent, AppConfig, Conflict, PendingChange, ScanResult, Skill, SyncStatus } from '@/types';

interface AppState {
  // Config
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
  
  // Skills
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  
  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  
  // Sync State
  syncMatrix: Record<string, Record<string, SyncStatus>>;
  setSyncMatrix: (matrix: Record<string, Record<string, SyncStatus>>) => void;
  updateSyncStatus: (skillName: string, agentId: string, status: SyncStatus) => void;
  
  // Pending & Conflicts
  pendingChanges: PendingChange[];
  setPendingChanges: (changes: PendingChange[]) => void;
  conflicts: Conflict[];
  setConflicts: (conflicts: Conflict[]) => void;
  
  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Selection
  selectedSkills: Set<string>;
  setSelectedSkills: (skills: Set<string>) => void;
  toggleSkillSelection: (skillName: string) => void;
  selectedAgents: Set<string>;
  setSelectedAgents: (agents: Set<string>) => void;
  toggleAgentSelection: (agentId: string) => void;
  
  // Actions
  resetSelection: () => void;
  clearPendingChanges: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Config
  config: null,
  setConfig: (config) => set({ config }),
  
  // Skills
  skills: [],
  setSkills: (skills) => set({ skills }),
  
  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ 
    agents: [...state.agents.filter(a => a.id !== agent.id), agent] 
  })),
  removeAgent: (agentId) => set((state) => ({ 
    agents: state.agents.filter(a => a.id !== agentId) 
  })),
  
  // Sync State
  syncMatrix: {},
  setSyncMatrix: (syncMatrix) => set({ syncMatrix }),
  updateSyncStatus: (skillName, agentId, status) => set((state) => ({
    syncMatrix: {
      ...state.syncMatrix,
      [skillName]: {
        ...state.syncMatrix[skillName],
        [agentId]: status,
      },
    },
  })),
  
  // Pending & Conflicts
  pendingChanges: [],
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  
  // Loading State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Selection
  selectedSkills: new Set(),
  setSelectedSkills: (selectedSkills) => set({ selectedSkills }),
  toggleSkillSelection: (skillName) => set((state) => {
    const newSet = new Set(state.selectedSkills);
    if (newSet.has(skillName)) {
      newSet.delete(skillName);
    } else {
      newSet.add(skillName);
    }
    return { selectedSkills: newSet };
  }),
  selectedAgents: new Set(),
  setSelectedAgents: (selectedAgents) => set({ selectedAgents }),
  toggleAgentSelection: (agentId) => set((state) => {
    const newSet = new Set(state.selectedAgents);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    return { selectedAgents: newSet };
  }),
  
  // Actions
  resetSelection: () => set({ selectedSkills: new Set(), selectedAgents: new Set() }),
  clearPendingChanges: () => set({ pendingChanges: [] }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(store): implement Zustand app store"
```

---

### Task 13: Create Tauri API Hooks

**Files:**
- Create: `src-ui/src/hooks/useConfig.ts`
- Create: `src-ui/src/hooks/useSkills.ts`
- Create: `src-ui/src/hooks/useAgents.ts`
- Create: `src-ui/src/hooks/useSync.ts`

- [ ] **Step 1: Create useConfig hook**

Create `src-ui/src/hooks/useConfig.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent, AppConfig } from '@/types';

export function useConfig() {
  const { config, setConfig, setAgents } = useAppStore();

  const loadConfig = async () => {
    try {
      const loaded = await invoke<AppConfig>('load_config');
      setConfig(loaded);
      setAgents(loaded.agents);
      return loaded;
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await invoke('save_config', { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const exportConfig = async (path: string) => {
    try {
      await invoke('export_config', { path });
    } catch (error) {
      console.error('Failed to export config:', error);
      throw error;
    }
  };

  const importConfig = async (path: string) => {
    try {
      const loaded = await invoke<AppConfig>('import_config', { path });
      setConfig(loaded);
      setAgents(loaded.agents);
      return loaded;
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  };

  const addAgent = async (agent: Agent) => {
    try {
      const updated = await invoke<AppConfig>('add_agent', { agent });
      setConfig(updated);
      setAgents(updated.agents);
      return updated;
    } catch (error) {
      console.error('Failed to add agent:', error);
      throw error;
    }
  };

  const removeAgent = async (agentId: string) => {
    try {
      const updated = await invoke<AppConfig>('remove_agent', { agentId });
      setConfig(updated);
      setAgents(updated.agents);
      return updated;
    } catch (error) {
      console.error('Failed to remove agent:', error);
      throw error;
    }
  };

  const updateCentralHubPath = async (path: string) => {
    try {
      const updated = await invoke<AppConfig>('update_central_hub_path', { path });
      setConfig(updated);
      return updated;
    } catch (error) {
      console.error('Failed to update hub path:', error);
      throw error;
    }
  };

  return {
    config,
    loadConfig,
    saveConfig,
    exportConfig,
    importConfig,
    addAgent,
    removeAgent,
    updateCentralHubPath,
  };
}
```

- [ ] **Step 2: Create useAgents hook**

Create `src-ui/src/hooks/useAgents.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent } from '@/types';

export function useAgents() {
  const { agents, setAgents, addAgent } = useAppStore();

  const discoverAgents = async () => {
    try {
      const discovered = await invoke<Agent[]>('discover_agents');
      // Merge with existing, preferring discovered status
      const existingIds = new Set(agents.map(a => a.id));
      const newAgents = discovered.filter(a => !existingIds.has(a.id));
      
      if (newAgents.length > 0) {
        const merged = [...agents, ...newAgents];
        setAgents(merged);
      }
      
      return discovered;
    } catch (error) {
      console.error('Failed to discover agents:', error);
      throw error;
    }
  };

  const validateAgentPath = async (path: string): Promise<boolean> => {
    try {
      return await invoke('validate_agent_path', { path });
    } catch (error) {
      console.error('Failed to validate path:', error);
      return false;
    }
  };

  return {
    agents,
    discoverAgents,
    validateAgentPath,
  };
}
```

- [ ] **Step 3: Create useSkills hook**

Create `src-ui/src/hooks/useSkills.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { ScanResult, Skill } from '@/types';

export function useSkills() {
  const { 
    config, 
    setSkills, 
    setAgents, 
    setSyncMatrix, 
    setPendingChanges, 
    setConflicts,
    setIsLoading,
    agents 
  } = useAppStore();

  const scanCentralHub = async () => {
    if (!config) return [];
    
    try {
      const skills = await invoke<Skill[]>('scan_central_hub', { 
        hubPath: config.central_hub_path 
      });
      setSkills(skills);
      return skills;
    } catch (error) {
      console.error('Failed to scan hub:', error);
      throw error;
    }
  };

  const scanAll = async () => {
    if (!config || agents.length === 0) return null;
    
    setIsLoading(true);
    try {
      const result = await invoke<ScanResult>('scan_all', {
        agents,
        hubPath: config.central_hub_path,
      });
      
      // Update store with scan results
      setSkills(result.skills);
      setPendingChanges(result.pending_changes);
      setConflicts(result.conflicts);
      
      // Build sync matrix
      const matrix: Record<string, Record<string, string>> = {};
      result.skills.forEach(skill => {
        matrix[skill.name] = {};
        agents.forEach(agent => {
          matrix[skill.name][agent.id] = 'missing';
        });
      });
      
      result.agent_statuses.forEach(status => {
        if (!matrix[status.skill_name]) {
          matrix[status.skill_name] = {};
        }
        matrix[status.skill_name][status.agent_id] = status.status;
      });
      
      setSyncMatrix(matrix);
      
      return result;
    } catch (error) {
      console.error('Failed to scan all:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scanCentralHub,
    scanAll,
  };
}
```

- [ ] **Step 4: Create useSync hook**

Create `src-ui/src/hooks/useSync.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/stores/appStore';
import type { Agent, PendingChange, SyncResult } from '@/types';

export function useSync() {
  const { config, agents, scanAll } = useAppStore();

  const syncToHub = async (skillName: string, sourceAgent: Agent) => {
    if (!config) throw new Error('No config');
    
    try {
      const result = await invoke<SyncResult>('sync_to_hub', {
        skillName,
        sourceAgent,
        hubPath: config.central_hub_path,
      });
      
      if (result.success) {
        await scanAll();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to sync to hub:', error);
      throw error;
    }
  };

  const syncToAgent = async (skillName: string, agent: Agent) => {
    if (!config) throw new Error('No config');
    
    try {
      const result = await invoke<SyncResult>('sync_to_agent', {
        skillName,
        agent,
        hubPath: config.central_hub_path,
      });
      
      if (result.success) {
        await scanAll();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to sync to agent:', error);
      throw error;
    }
  };

  const batchSync = async (skillNames: string[], targetAgents: Agent[]) => {
    if (!config) throw new Error('No config');
    
    try {
      const results = await invoke<SyncResult[]>('batch_sync', {
        skills: skillNames,
        agents: targetAgents,
        hubPath: config.central_hub_path,
      });
      
      await scanAll();
      return results;
    } catch (error) {
      console.error('Failed to batch sync:', error);
      throw error;
    }
  };

  const executeChanges = async (changes: PendingChange[]) => {
    if (!config) throw new Error('No config');
    
    try {
      const results = await invoke<SyncResult[]>('execute_changes', {
        changes,
        agents,
        hubPath: config.central_hub_path,
      });
      
      await scanAll();
      return results;
    } catch (error) {
      console.error('Failed to execute changes:', error);
      throw error;
    }
  };

  const deleteSkillLocal = async (skillName: string, agentId: string) => {
    if (!config) throw new Error('No config');
    
    try {
      const result = await invoke<SyncResult>('delete_skill_local', {
        skillName,
        agentId,
        agents,
        hubPath: config.central_hub_path,
      });
      
      if (result.success) {
        await scanAll();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to delete skill locally:', error);
      throw error;
    }
  };

  const deleteSkillGlobal = async (skillName: string) => {
    if (!config) throw new Error('No config');
    
    try {
      const result = await invoke<SyncResult>('delete_skill_global', {
        skillName,
        agents,
        hubPath: config.central_hub_path,
      });
      
      if (result.success) {
        await scanAll();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to delete skill globally:', error);
      throw error;
    }
  };

  return {
    syncToHub,
    syncToAgent,
    batchSync,
    executeChanges,
    deleteSkillLocal,
    deleteSkillGlobal,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(hooks): implement Tauri API integration hooks"
```

---

### Task 14: Create UI Components

**Files:**
- Create: `src-ui/src/components/layout/MainLayout.tsx`
- Create: `src-ui/src/components/skills/SkillList.tsx`
- Create: `src-ui/src/components/sync/SyncMatrix.tsx`
- Create: `src-ui/src/components/sync/SyncActions.tsx`

- [ ] **Step 1: Install shadcn/ui components**

Run:
```bash
bunx shadcn-ui@latest add button
bunx shadcn-ui@latest add checkbox
bunx shadcn-ui@latest add dialog
bunx shadcn-ui@latest add input
bunx shadcn-ui@latest add scroll-area
bunx shadcn-ui@latest add select
bunx shadcn-ui@latest add table
bunx shadcn-ui@latest add tooltip
bunx shadcn-ui@latest add badge
```

- [ ] **Step 2: Create MainLayout component**

Create `src-ui/src/components/layout/MainLayout.tsx`:

```typescript
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Create Header component**

Create `src-ui/src/components/layout/Header.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

export function Header() {
  const { scanAll } = useSkills();
  const { isLoading, pendingChanges } = useAppStore();

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Agent Skills Manager</h1>
        {pendingChanges.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({pendingChanges.length} pending)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={scanAll}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create Footer component**

Create `src-ui/src/components/layout/Footer.tsx`:

```typescript
import { useAppStore } from '@/stores/appStore';

export function Footer() {
  const { skills, agents, pendingChanges, conflicts } = useAppStore();

  return (
    <footer className="border-t px-4 py-2 text-sm text-muted-foreground bg-card">
      <div className="flex items-center gap-4">
        <span>{skills.length} Skills</span>
        <span>{agents.length} Agents</span>
        {pendingChanges.length > 0 && (
          <span className="text-yellow-600">{pendingChanges.length} Pending</span>
        )}
        {conflicts.length > 0 && (
          <span className="text-red-600">{conflicts.length} Conflicts</span>
        )}
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Create SkillList component**

Create `src-ui/src/components/skills/SkillList.tsx`:

```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/appStore';
import { Folder } from 'lucide-react';

export function SkillList() {
  const { skills, selectedSkills, toggleSkillSelection } = useAppStore();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="px-4 py-2 border-b font-medium">Skills</div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
              onClick={() => toggleSkillSelection(skill.name)}
            >
              <Checkbox
                checked={selectedSkills.has(skill.name)}
                onCheckedChange={() => toggleSkillSelection(skill.name)}
              />
              <Folder className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{skill.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSize(skill.size)}
                </div>
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No skills found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 6: Create SyncMatrix component**

Create `src-ui/src/components/sync/SyncMatrix.tsx`:

```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/stores/appStore';
import type { SyncStatus } from '@/types';
import { Check, AlertCircle, X, Package } from 'lucide-react';

const statusIcons: Record<SyncStatus, typeof Check> = {
  synced: Check,
  missing: X,
  conflict: AlertCircle,
  new: Package,
};

const statusColors: Record<SyncStatus, string> = {
  synced: 'text-green-600',
  missing: 'text-gray-400',
  conflict: 'text-yellow-600',
  new: 'text-blue-600',
};

export function SyncMatrix() {
  const { 
    skills, 
    agents, 
    syncMatrix, 
    selectedAgents, 
    toggleAgentSelection 
  } = useAppStore();

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b font-medium">Sync Status</div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2">Skill</th>
                  {agents.map((agent) => (
                    <th key={agent.id} className="text-center py-2 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={selectedAgents.has(agent.id)}
                          onCheckedChange={() => toggleAgentSelection(agent.id)}
                        />
                        <span className="text-xs truncate max-w-[80px]">
                          {agent.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.name} className="border-t">
                    <td className="py-2 px-2 text-sm">{skill.name}</td>
                    {agents.map((agent) => {
                      const status = syncMatrix[skill.name]?.[agent.id] || 'missing';
                      const Icon = statusIcons[status];
                      
                      return (
                        <td key={`${skill.name}-${agent.id}`} className="py-2 px-2 text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <Icon className={`w-4 h-4 mx-auto ${statusColors[status]}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{skill.name} @ {agent.name}: {status}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {skills.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No data. Click Refresh to scan.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 7: Create SyncActions component**

Create `src-ui/src/components/sync/SyncActions.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { useSync } from '@/hooks/useSync';
import { Sync, Trash2 } from 'lucide-react';

export function SyncActions() {
  const { 
    selectedSkills, 
    selectedAgents, 
    agents, 
    pendingChanges,
    resetSelection 
  } = useAppStore();
  
  const { batchSync, executeChanges } = useSync();

  const handleSyncSelected = async () => {
    if (selectedSkills.size === 0 || selectedAgents.size === 0) return;
    
    const skillNames = Array.from(selectedSkills);
    const targetAgents = agents.filter(a => selectedAgents.has(a.id));
    
    await batchSync(skillNames, targetAgents);
    resetSelection();
  };

  const handleSyncAllPending = async () => {
    if (pendingChanges.length === 0) return;
    await executeChanges(pendingChanges);
  };

  const selectedCount = selectedSkills.size;
  const agentCount = selectedAgents.size;

  return (
    <div className="border-t p-4 flex items-center justify-between bg-card">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0 ? (
          <span>{selectedCount} skills selected, {agentCount} agents selected</span>
        ) : (
          <span>Select skills and agents to sync</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {pendingChanges.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleSyncAllPending}
          >
            <Sync className="w-4 h-4 mr-2" />
            Sync All Pending ({pendingChanges.length})
          </Button>
        )}
        
        <Button
          disabled={selectedCount === 0 || agentCount === 0}
          onClick={handleSyncSelected}
        >
          <Sync className="w-4 h-4 mr-2" />
          Sync Selected
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(ui): implement main layout, skill list, sync matrix and actions"
```

---

### Task 15: Create Main App Component

**Files:**
- Create: `src-ui/src/App.tsx`
- Create: `src-ui/src/main.tsx`

- [ ] **Step 1: Create App component**

Create `src-ui/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SkillList } from '@/components/skills/SkillList';
import { SyncMatrix } from '@/components/sync/SyncMatrix';
import { SyncActions } from '@/components/sync/SyncActions';
import { useConfig } from '@/hooks/useConfig';
import { useAgents } from '@/hooks/useAgents';
import { useSkills } from '@/hooks/useSkills';
import { useAppStore } from '@/stores/appStore';

function App() {
  const { loadConfig } = useConfig();
  const { discoverAgents } = useAgents();
  const { scanAll } = useSkills();
  const { config } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await discoverAgents();
    };
    init();
  }, []);

  useEffect(() => {
    if (config) {
      scanAll();
    }
  }, [config?.agents.length]);

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="w-64 flex-shrink-0">
          <SkillList />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <SyncMatrix />
          </div>
          <SyncActions />
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
```

- [ ] **Step 2: Create main entry**

Create `src-ui/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(app): wire up main App component with initialization"
```

---

## Phase 4: Build and Test

### Task 16: Create Tauri Configuration

**Files:**
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/Cargo.toml`

- [ ] **Step 1: Create tauri.conf.json**

Create `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeBuildCommand": "cd src-ui && bun run build",
    "beforeDevCommand": "cd src-ui && bun run dev",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../src-ui/dist"
  },
  "bundle": {
    "active": true,
    "category": "DeveloperTool",
    "copyright": "",
    "targets": ["app", "dmg", "appimage", "deb", "msi"],
    "externalBin": [],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "longDescription": "",
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "resources": [],
    "shortDescription": "",
    "linux": {
      "deb": {
        "depends": []
      }
    }
  },
  "productName": "Agent Skills Manager",
  "version": "0.1.0",
  "identifier": "com.agent-skills-manager.app",
  "plugins": {},
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "resizable": true,
        "title": "Agent Skills Manager",
        "width": 1200,
        "center": true
      }
    ]
  }
}
```

- [ ] **Step 2: Move Rust files to src-tauri**

Run:
```bash
mkdir -p src-tauri/src
mv src/*.rs src-tauri/src/
mv src/commands src-tauri/src/
mv src/modules src-tauri/src/
mv Cargo.toml src-tauri/
rmdir src 2>/dev/null || true
```

- [ ] **Step 3: Update src-tauri/Cargo.toml paths**

Update `src-tauri/Cargo.toml`:

```toml
[package]
name = "agent-skills-manager"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
notify = "6.1"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
sha2 = "0.10"
walkdir = "2.4"
dirs = "5.0"

[dev-dependencies]
tempfile = "3.8"
```

- [ ] **Step 4: Create build.rs**

Create `src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 5: Create icons directory placeholder**

Run:
```bash
mkdir -p src-tauri/icons
# Note: Icons need to be added manually or generated via tauri icon command
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore(tauri): setup Tauri configuration and move Rust files"
```

---

### Task 17: Build and Verify

- [ ] **Step 1: Install Tauri CLI**

Run: `bun add -d @tauri-apps/cli`

- [ ] **Step 2: Build frontend**

Run: `cd src-ui && bun run build`

Expected: Build succeeds, `src-ui/dist` created

- [ ] **Step 3: Build Rust backend**

Run: `cd src-tauri && cargo build`

Expected: Build succeeds

- [ ] **Step 4: Run tests**

Run: `cd src-tauri && cargo test`

Expected: All file_operations tests PASS

- [ ] **Step 5: Run dev mode**

Run: `bun tauri:dev`

Expected: App window opens, UI loads

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore(build): verify build and dev mode works"
```

---

## Summary

This implementation plan covers:

| Phase | Tasks | Description |
|-------|-------|-------------|
| **1. Initialization** | 1-3 | Project setup with Tauri 2.0, Bun, React, TypeScript, shadcn/ui |
| **2. Rust Backend** | 4-10 | Core modules: FileOperations, ConfigManager, AgentDiscovery, SkillsScanner, SyncEngine |
| **3. Frontend** | 11-15 | TypeScript types, Zustand store, API hooks, UI components |
| **4. Build & Test** | 16-17 | Tauri configuration, build verification |

**Total Estimated Time:** 4-6 hours

**Key Commit Points:**
- After each Task completes
- Major milestones: Backend complete, Frontend complete, Build verified

---

## Next Steps

After completing this plan:

1. **Test with real data**: Use actual `.agents/skills/` directory
2. **Add Settings Panel**: UI for managing agents and hub path
3. **Add Conflict Resolution UI**: Dialog for handling conflicts
4. **Polish UI**: Add loading states, error handling, toast notifications
5. **Package**: Create distributable builds for macOS/Windows/Linux
