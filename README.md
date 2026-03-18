# Agent Skills Manager

> A unified GUI for managing AI Agent Skills across multiple agents — built with Tauri 2.0.

[中文文档](./README-zh.md)

---

## The Problem

If you use multiple AI agents (Claude Code, CodeBuddy, Trae, iFlow, Codex, etc.), you've probably run into this: each agent has its own `skills/` directory, and keeping them in sync is a manual nightmare. Copy here, symlink there, forget to update one — it adds up fast.

**Agent Skills Manager** fixes this with a central hub approach: store each Skill once, share it everywhere via symlinks.

## Features

- **Central Hub** — One canonical location (`~/.agents/skills/` by default) stores all your Skills
- **Auto-Discovery** — Automatically detects installed agents (Claude Code, CodeBuddy, Trae, iFlow, Codex)
- **Visual Sync Matrix** — A Skills × Agents grid shows sync status at a glance: synced, missing, conflict, or new
- **One-Click Sync** — Push any Skill to any Agent with a single click; bulk sync everything at once
- **Conflict Detection** — Detects when the same Skill name has different content across agents; lets you pick the winner
- **Symlink-First** — Agent skill directories reference the hub via symlinks, eliminating duplicate storage
- **Persistent Config** — Your agent list, hub path, and window state survive restarts; import/export as JSON

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | [Tauri 2.0](https://tauri.app/) |
| Backend | Rust |
| Frontend | React 18 + TypeScript |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Package Manager | Bun |

## Prerequisites

- [Rust](https://rustup.rs/) (stable, 1.70+)
- [Bun](https://bun.sh/) (1.0+)
- macOS, Linux, or Windows (with Developer Mode enabled for symlinks)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/skill-manager-gui.git
cd skill-manager-gui

# Install frontend dependencies
bun install

# Start in development mode (Tauri + Vite hot-reload)
bun run tauri:dev
```

### Build for Production

```bash
bun run tauri:build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
skill-manager-gui/
├── src-tauri/                  # Rust backend
│   └── src/
│       ├── main.rs             # Tauri entry point & command registration
│       ├── lib.rs              # Module exports
│       ├── types.rs            # Shared data structures
│       ├── commands/           # Tauri command handlers (IPC bridge)
│       │   ├── config_commands.rs
│       │   ├── scan_commands.rs
│       │   ├── sync_commands.rs
│       │   └── file_commands.rs
│       └── modules/            # Core business logic
│           ├── config_manager.rs
│           ├── agent_discovery.rs
│           ├── skills_scanner.rs
│           ├── sync_engine.rs
│           └── file_operations.rs
├── src-ui/                     # React frontend
│   └── src/
│       ├── App.tsx
│       ├── components/         # UI components
│       ├── stores/             # Zustand state
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript types
│       └── lib/                # Utilities & Tauri API wrappers
├── tests/                      # Rust integration tests
└── docs/                       # Design docs & implementation plans
```

## How It Works

### The Hub Model

```
~/.agents/skills/          ← Central Hub (real files live here)
├── skill-a/
├── skill-b/
└── skill-c/

~/.claude/skills/          ← Agent directory (symlinks only)
├── skill-a  →  ~/.agents/skills/skill-a
└── skill-b  →  ~/.agents/skills/skill-b

~/.codebuddy/skills/
├── skill-a  →  ~/.agents/skills/skill-a
└── skill-c  →  ~/.agents/skills/skill-c
```

On startup the app scans all known agent directories, validates every entry:

| State | Meaning |
|-------|---------|
| ✅ Synced | Valid symlink pointing to hub |
| ❌ Missing | Skill exists in hub but not in this agent |
| ⚠️ Conflict | Same name, different content (hash mismatch) |
| 📦 New | Real directory found in agent, not yet in hub |

### Supported Agents (Auto-Discovered)

| Agent | Default Path |
|-------|-------------|
| Claude Code | `~/.claude/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` |
| Trae | `~/.trae/skills/` |
| iFlow | `~/.iflow/skills/` |
| Codex | `~/.codex/skills/` |

Custom agents can be added manually via the Settings panel.

## Running Tests

```bash
# Rust unit & integration tests
cargo test

# Run a specific test module
cargo test file_operations
cargo test sync_engine
```

## Platform Notes

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | ✅ Primary | Full support |
| Linux | ✅ Supported | Same symlink semantics as macOS |
| Windows | ⚠️ Partial | Requires Developer Mode or admin rights for symlinks |

## Roadmap

The current release is an MVP focused on core sync functionality. Planned future work:

- [ ] Real-time file watching (background monitoring)
- [ ] Skill version history & rollback
- [ ] Remote/cloud sync
- [ ] Skill marketplace integration
- [ ] Diff viewer for conflict resolution
- [ ] Tags and grouping for Skills

## License

[MIT](./LICENSE)
