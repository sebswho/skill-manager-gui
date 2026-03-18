# Agent Skills Manager - Product Requirements Document

## Problem Statement

当前用户在电脑上使用多个 AI Agent（如 Claude Code、Trae、iFlow、Codex 等），每个 Agent 都有自己的 Skill 管理机制。这些 Skills 原本可以跨 Agent 互通使用，但由于缺乏统一的 GUI 管理工具，用户需要手动维护：

1. **手动拷贝**: 每次安装新 Skill 都需要手动复制到各个 Agent 的 skills 目录
2. **存储冗余**: 同一个 Skill 在多个 Agent 中重复存储，浪费硬盘空间
3. **同步困难**: 通过 `ln -s` 软链接手动同步 Skills 到各个 Agent 非常繁琐且容易出错
4. **缺乏可视化**: 无法直观看到哪些 Skills 已安装、哪些 Agent 已同步、哪些需要更新

这种手动管理方式效率低下，容易出错，特别是在 Skills 数量增多或 Agent 数量增加时，维护成本呈指数级增长。

## Solution

开发一款基于 Tauri 2.0 的桌面应用程序，提供统一的 GUI 界面来管理所有 Agent 的 Skills：

1. **统一中心仓库**: 用户可配置默认 Skills 目录（如 `~/.agents/skills/`），所有 Skills 只在此存储一份
2. **自动发现 Agent**: 自动扫描常见 Agent 的安装位置，同时支持手动添加自定义 Agent
3. **双向同步机制**: 启动时扫描所有 Agent 的 Skills 目录，发现新 Skill 时提示用户同步到中心仓库，再通过软链接分发到其他 Agent
4. **强制软链接策略**: 确保所有 Agent 的 Skills 都通过软链接指向中心仓库，避免存储冗余
5. **可视化矩阵界面**: 采用双栏布局展示 Skills 列表和同步状态矩阵，直观显示每个 Skill 在各 Agent 中的同步状态
6. **配置持久化**: 自动保存用户配置，支持导入/导出功能，便于迁移设置

## User Stories

### 核心功能

1. 作为用户，我可以在首次打开应用时设置默认 Skills 目录，以便统一管理所有 Skills
2. 作为用户，我可以查看当前已安装的 Agent 列表，了解哪些 Agent 正在被管理
3. 作为用户，我可以手动添加自定义 Agent 及其 Skills 目录路径，以便支持非标准安装的 Agent
4. 作为用户，我可以查看所有已安装的 Skills 列表，了解有哪些 Skills 可用
5. 作为用户，我可以在同步状态矩阵中看到每个 Skill 在各 Agent 中的同步状态（已同步/未同步/需要更新）

### 同步功能

6. 作为用户，当应用启动扫描发现新 Skill 时，我会收到提示，可以选择将其同步到中心仓库
7. 作为用户，我可以点击"同步"按钮将选中的 Skill 通过软链接分发到指定的 Agents
8. 作为用户，我可以进行批量操作，一次性选择多个 Skills 同步到多个 Agents
9. 作为用户，我可以使用"一键同步全部"功能，将所有待同步的 Skills 自动同步到所有选中的 Agents
10. 作为用户，我可以使用"智能批量"功能，自动完成所有检测到的待处理同步操作

### 冲突处理

11. 作为用户，当检测到同名 Skill 内容不同时，我可以手动选择保留哪个版本
12. 作为用户，当我从某个 Agent 删除 Skill 时，应用会询问我是否要从中心仓库和其他 Agent 同步删除
13. 作为用户，我可以选择"仅本地删除"，只影响当前 Agent 而不影响中心仓库和其他 Agent

### 配置管理

14. 作为用户，应用会自动记住我的默认 Skills 路径、Agent 列表和窗口状态，下次打开时无需重新配置
15. 作为用户，我可以导出当前配置到 JSON 文件，以便备份或迁移
16. 作为用户，我可以从 JSON 文件导入配置，快速恢复之前的设置

### 界面交互

17. 作为用户，我可以在左侧 Skills 列表中搜索和筛选 Skills，快速找到目标
18. 作为用户，我可以通过右侧同步状态矩阵直观地看到每个 Skill 与每个 Agent 的关联关系
19. 作为用户，我可以调整窗口大小和列宽，优化界面布局以适应我的工作习惯

### 监控与提示

20. 作为用户，应用启动时会自动扫描所有 Agent 的 Skills 目录，检测需要同步的变更
21. 作为用户，我可以手动点击"刷新"按钮重新扫描，检查最新的变更状态
22. 作为用户，我可以看到每个 Skill 的详细信息，包括名称、描述、大小、修改时间等

## Implementation Decisions

### 技术栈

- **框架**: Tauri 2.0（Rust 后端 + Web 前端）
- **包管理**: Bun（优先选项）
- **前端**: React + TypeScript
- **UI 组件库**: shadcn/ui
- **状态管理**: Zustand
- **文件监控**: Rust 端使用 `notify` crate 实现目录监控
- **软链接操作**: Rust 端使用标准库 `std::os::unix::fs::symlink`（macOS/Linux）和 Windows API（Windows）

### 架构模块

#### 1. 配置管理模块 (ConfigManager)
- **职责**: 管理应用配置，包括默认 Skills 路径、Agent 列表、窗口状态等
- **接口**: 
  - `loadConfig(): Promise<AppConfig>` - 加载配置
  - `saveConfig(config: AppConfig): Promise<void>` - 保存配置
  - `exportConfig(path: string): Promise<void>` - 导出配置
  - `importConfig(path: string): Promise<AppConfig>` - 导入配置
- **持久化**: 使用 Tauri 的 `appConfigDir` 存储配置 JSON 文件

#### 2. Agent 发现模块 (AgentDiscovery)
- **职责**: 自动发现和手动管理 Agent
- **接口**:
  - `discoverAgents(): Promise<Agent[]>` - 自动扫描常见 Agent 位置
  - `addAgent(agent: AgentConfig): Promise<void>` - 手动添加 Agent
  - `removeAgent(agentId: string): Promise<void>` - 移除 Agent
  - `validateAgentPath(path: string): Promise<boolean>` - 验证 Agent 路径有效性
- **支持的 Agent**: Claude Code、Trae、iFlow、Codex、CodeBuddy 等（可扩展）

#### 3. Skills 扫描模块 (SkillsScanner)
- **职责**: 扫描 Skills 目录，分析同步状态
- **接口**:
  - `scanCentralHub(): Promise<Skill[]>` - 扫描中心仓库
  - `scanAgent(agentId: string): Promise<AgentSkillStatus[]>` - 扫描指定 Agent
  - `scanAll(): Promise<ScanResult>` - 扫描所有 Agent 并生成完整状态报告
  - `detectChanges(): Promise<ChangeSet>` - 检测自上次扫描后的变更
- **数据结构**: Skill 包含名称、路径、大小、修改时间、哈希值等元数据

#### 4. 同步引擎模块 (SyncEngine)
- **职责**: 处理 Skills 的同步逻辑，包括冲突检测和解决
- **接口**:
  - `syncToHub(skillPath: string): Promise<SyncResult>` - 将 Skill 同步到中心仓库
  - `syncToAgent(skillName: string, agentId: string): Promise<SyncResult>` - 同步到指定 Agent
  - `batchSync(skills: string[], agents: string[]): Promise<BatchSyncResult>` - 批量同步
  - `detectConflicts(): Promise<Conflict[]>` - 检测冲突
  - `resolveConflict(conflictId: string, resolution: Resolution): Promise<void>` - 解决冲突
  - `deleteSkill(skillName: string, scope: DeleteScope): Promise<void>` - 删除 Skill

#### 5. 文件操作模块 (FileOperations)
- **职责**: 封装底层的文件系统操作，特别是软链接管理
- **接口**:
  - `createSymlink(target: string, linkPath: string): Promise<void>` - 创建软链接
  - `removeSymlink(path: string): Promise<void>` - 移除软链接
  - `isSymlink(path: string): Promise<boolean>` - 检查是否为软链接
  - `getSymlinkTarget(path: string): Promise<string>` - 获取软链接目标
  - `copyDirectory(src: string, dest: string): Promise<void>` - 复制目录
  - `deleteDirectory(path: string): Promise<void>` - 删除目录
  - `calculateHash(path: string): Promise<string>` - 计算目录哈希用于对比

#### 6. 状态管理模块 (StateManager)
- **职责**: 管理前端状态，包括 Skills 列表、Agent 列表、同步状态等
- **状态结构**:
  ```typescript
  interface AppState {
    config: AppConfig;
    agents: Agent[];
    skills: Skill[];
    syncMatrix: SyncMatrix;
    pendingChanges: ChangeSet;
    conflicts: Conflict[];
  }
  ```

### 关键算法

#### 软链接策略
1. 中心仓库中的每个 Skill 是独立目录（如 `~/.agents/skills/skill-name/`）
2. Agent 的 Skills 目录下通过软链接指向中心仓库（如 `~/.claude/skills/skill-name -> ~/.agents/skills/skill-name`）
3. 启动扫描时验证所有软链接的有效性，失效的链接标记为"需要修复"

#### 冲突检测
1. 同名 Skill 但哈希值不同 → 标记为冲突
2. 用户选择保留版本后，覆盖中心仓库或其他 Agent 的版本
3. 记录冲突解决历史

#### 扫描流程
1. 读取中心仓库中的所有 Skills
2. 遍历每个 Agent，检查其 Skills 目录
3. 对每个 Skill，验证是否为指向中心仓库的有效软链接
4. 发现独立的 Skill 副本（非软链接）→ 标记为"待同步"
5. 发现中心仓库中不存在的 Skill → 标记为"待添加到中心仓库"

### 界面设计

#### 主界面布局
```
┌─────────────────────────────────────────────────────────────┐
│  Agent Skills Manager                    [刷新] [设置] [?]   │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│  🔍 Search Skills...         │  Sync Status Matrix          │
│                              │                              │
│  ┌────────────────────────┐  │  Skill         │ Claude │ Trae │ iFlow │
│  │ 📁 skill-a             │  │  ──────────────┼────────┼──────┼───────│
│  │ 📁 skill-b             │  │  skill-a       │   ✅   │  ✅  │  ✅   │
│  │ 📁 skill-c             │  │  skill-b       │   ✅   │  ⚠️  │  ❌   │
│  │ 📁 skill-d  (new)      │  │  skill-c       │   ❌   │  ✅  │  ✅   │
│  └────────────────────────┘  │  skill-d (new) │   📦   │  📦  │  📦   │
│                              │                              │
│  [Select All]                │  Legend: ✅Synced ⚠️Conflict ❌Missing 📦New│
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│  Status: 4 Skills, 1 pending sync, 1 conflict               │
│  [Sync Selected] [Sync All] [Resolve Conflicts]              │
└─────────────────────────────────────────────────────────────┘
```

### 文件结构

```
src/
├── backend/           # Rust 后端代码
│   ├── main.rs
│   ├── commands/      # Tauri 命令处理器
│   ├── modules/       # 核心模块实现
│   └── utils/         # 工具函数
├── frontend/          # Web 前端代码
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义 Hooks
│   ├── stores/        # 状态管理
│   ├── types/         # TypeScript 类型定义
│   └── utils/         # 前端工具函数
└── shared/            # 前后端共享类型
```

## Testing Decisions

### 测试策略

采用分层测试策略，重点关注核心业务逻辑：

1. **单元测试**: 针对独立模块的核心函数
2. **集成测试**: 测试模块间的协作
3. **E2E 测试**: 验证完整的用户工作流

### 需要测试的模块

#### 高优先级（必须测试）

1. **FileOperations 模块**
   - 软链接创建、删除、验证
   - 目录复制和删除
   - 哈希计算准确性
   - 跨平台兼容性（Windows/macOS/Linux）

2. **SkillsScanner 模块**
   - 正确识别 Skills 目录结构
   - 准确检测软链接状态
   - 变更检测的准确性

3. **SyncEngine 模块**
   - 同步逻辑的正确性
   - 冲突检测算法
   - 批量操作的正确性

#### 中优先级（建议测试）

4. **ConfigManager 模块**
   - 配置的读写一致性
   - 导入/导出功能的正确性

5. **AgentDiscovery 模块**
   - Agent 路径验证逻辑

### 测试数据

使用内存中的临时文件系统（通过 mock 或临时目录）进行测试，避免污染真实文件系统：

```rust
// Rust 测试示例
#[test]
fn test_symlink_creation() {
    let temp_dir = TempDir::new().unwrap();
    let target = temp_dir.path().join("target");
    let link = temp_dir.path().join("link");
    
    // 创建测试目录
    fs::create_dir(&target).unwrap();
    
    // 创建软链接
    create_symlink(&target, &link).unwrap();
    
    // 验证
    assert!(is_symlink(&link).unwrap());
    assert_eq!(get_symlink_target(&link).unwrap(), target);
}
```

### 测试准则

- 只测试外部行为，不测试实现细节
- 每个测试独立运行，不依赖执行顺序
- 使用临时目录，测试后清理
- 对文件系统操作使用 mock 或隔离环境

## Out of Scope

以下功能在 MVP 版本中**不包含**，但可作为后续迭代考虑：

1. **实时监控**: 启动时扫描而非后台实时监控文件变化
2. **版本控制**: 不支持 Skills 的版本历史或回滚功能
3. **远程同步**: 不支持云同步或多设备同步
4. **Skill 市场**: 不提供 Skill 的下载或更新功能
5. **权限管理**: 不处理复杂的文件权限场景
6. **标签/分组**: 不支持 Skills 标签或 Agent 分组功能
7. **差异对比**: 不提供 Skill 内容的详细差异对比界面
8. **自动解决冲突**: 冲突必须由用户手动选择解决
9. **网络功能**: 纯本地应用，不涉及网络请求
10. **插件系统**: 不支持扩展或自定义 Agent 类型

## Further Notes

### 平台兼容性

- **macOS**: 主要开发平台，完全支持
- **Linux**: 软链接机制与 macOS 相同，应兼容
- **Windows**: 需要特殊处理（Windows 的软链接需要管理员权限或开发者模式）
  - 可考虑使用目录 Junction 或备选方案
  - 在 Windows 上可能需要提示用户开启开发者模式

### 性能考虑

- Skills 数量在 100 以内时扫描应<1秒
- 使用异步 I/O 避免界面卡顿
- 大文件哈希计算应支持取消操作

### 安全考虑

- 软链接操作需要谨慎，避免循环链接
- 删除操作需要二次确认
- 不应跟随软链接到外部目录（避免意外删除用户数据）

### 扩展性考虑

- Agent 类型通过配置扩展，便于添加新的 Agent 支持
- Skills 元数据结构设计预留扩展字段
- 模块间通过接口解耦，便于替换实现

### 用户体验

- 首次启动提供引导流程（Onboarding）
- 提供操作历史记录和撤销功能
- 错误信息应清晰易懂，提供解决方案提示
