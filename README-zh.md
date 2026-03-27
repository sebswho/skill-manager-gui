# Skilltoon

> 基于 Tauri 2.0 的桌面应用，统一管理多个 AI Agent 的 Skills。

[English](./README.md)

---

## 问题背景

如果你同时使用多个 AI Agent（Claude Code、CodeBuddy、Trae、iFlow、Codex 等），你大概已经遇到过这个困境：每个 Agent 都有自己的 `skills/` 目录，手动保持它们同步是一件费力不讨好的事情——复制粘贴、手动建软链接、忘记更新某一个……随着 Skill 和 Agent 数量的增加，维护成本呈指数级上升。

**Skilltoon** 用「中心仓库 + 软链接分发」的方式彻底解决这个问题：每个 Skill 只存一份，通过软链接同步到所有 Agent。

## 功能特性

- **统一中心仓库** — 所有 Skill 集中存放在一个目录（默认 `~/.agents/skills/`），无冗余副本
- **自动发现 Agent** — 自动扫描常见 Agent 的安装位置（Claude Code、CodeBuddy、Trae、iFlow、Codex）
- **选择即展示界面** — 从侧边栏选择 Skill，查看并管理该 Skill 在各 Agent 的同步状态
- **一键同步** — 单个 Skill 推送到指定 Agent，按 Skill 管理同步状态
- **冲突检测** — 自动检测同名 Skill 内容不一致的情况，由用户手动选择保留哪个版本
- **软链接优先** — Agent 的 Skills 目录只存软链接，指向中心仓库，从根本上消除重复存储
- **配置持久化** — Agent 列表、中心仓库路径、窗口状态自动保存，支持 JSON 导入/导出

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri 2.0](https://tauri.app/) |
| 后端 | Rust |
| 前端 | React 18 + TypeScript |
| UI 组件库 | [shadcn/ui](https://ui.shadcn.com/) |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 包管理器 | Bun |

## 环境要求

- [Rust](https://rustup.rs/)（stable，1.70+）
- [Bun](https://bun.sh/)（1.0+）
- macOS、Linux 或 Windows（Windows 需要开启开发者模式以支持软链接）

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/sebswho/Skilltoon.git
cd Skilltoon

# 安装前端依赖
bun install

# 以开发模式启动（Tauri + Vite 热重载）
bun run tauri:dev
```

### 生产构建

```bash
bun run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 项目结构

```
Skilltoon/
├── src-tauri/                  # Rust 后端
│   └── src/
│       ├── main.rs             # Tauri 入口 & 命令注册
│       ├── lib.rs              # 模块导出
│       ├── types.rs            # 共享数据结构
│       ├── commands/           # Tauri 命令处理器（IPC 桥接层）
│       │   ├── config_commands.rs
│       │   ├── scan_commands.rs
│       │   ├── sync_commands.rs
│       │   └── file_commands.rs
│       └── modules/            # 核心业务逻辑
│           ├── config_manager.rs     # 配置读写
│           ├── agent_discovery.rs    # Agent 自动发现
│           ├── skills_scanner.rs     # Skills 目录扫描
│           ├── sync_engine.rs        # 同步引擎
│           └── file_operations.rs    # 文件系统操作（软链接等）
├── src-ui/                     # React 前端
│   └── src/
│       ├── App.tsx
│       ├── components/         # UI 组件
│       ├── stores/             # Zustand 状态
│       ├── hooks/              # 自定义 React Hooks
│       ├── types/              # TypeScript 类型定义
│       └── lib/                # 工具函数 & Tauri API 封装
├── tests/                      # Rust 集成测试
└── docs/                       # 设计文档 & 实现计划
```

## 工作原理

### 中心仓库模型

```
~/.agents/skills/          ← 中心仓库（真实文件存放处）
├── skill-a/
├── skill-b/
└── skill-c/

~/.claude/skills/          ← Agent 目录（只存软链接）
├── skill-a  →  ~/.agents/skills/skill-a
└── skill-b  →  ~/.agents/skills/skill-b

~/.codebuddy/skills/
├── skill-a  →  ~/.agents/skills/skill-a
└── skill-c  →  ~/.agents/skills/skill-c
```

应用启动时扫描所有已知 Agent 目录，对每一条记录进行验证：

| 状态 | 含义 |
|------|------|
| ✅ 已同步 | 软链接有效，指向中心仓库 |
| ❌ 缺失 | Skill 存在于中心仓库，但该 Agent 尚未同步 |
| ⚠️ 冲突 | 同名 Skill，但内容哈希不一致 |
| 📦 待添加 | 在 Agent 目录发现真实目录（非软链接），尚未加入中心仓库 |

### 支持自动发现的 Agent

| Agent | 默认路径 |
|-------|---------|
| Claude Code | `~/.claude/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` |
| Trae | `~/.trae/skills/` |
| iFlow | `~/.iflow/skills/` |
| Codex | `~/.codex/skills/` |

非标准安装的 Agent 可在设置面板中手动添加。

## 运行测试

```bash
# Rust 单元测试 & 集成测试
cargo test

# 运行特定测试模块
cargo test file_operations
cargo test sync_engine
```

## 平台支持

| 平台 | 状态 | 备注 |
|------|------|------|
| macOS | ✅ 主要平台 | 完全支持 |
| Linux | ✅ 支持 | 软链接行为与 macOS 相同 |
| Windows | ⚠️ 部分支持 | 需要开启开发者模式或以管理员身份运行以使用软链接 |

## 后续计划

当前版本为 MVP，专注核心同步功能。后续迭代计划：

- [ ] 实时文件监控（后台监听目录变化）
- [ ] Skill 版本历史与回滚
- [ ] 远程/云端同步
- [ ] Skill 市场集成
- [ ] 冲突内容差异对比视图
- [ ] Skill 标签与分组管理

## 许可证

[GNU Lesser General Public License v3.0 (LGPL-3.0)](./LICENSE)
