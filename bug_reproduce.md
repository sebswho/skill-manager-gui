# Bug 复现报告：添加 Agent 后覆盖原有 Agents 列表

## 问题描述
用户在 Settings 中添加新 Agent 后，原有的 Agents 列表被覆盖或部分覆盖。

## 初步分析

### 可能的根本原因

#### 1. 自动发现 Agents 未被持久化 ⚠️
**问题**：`discoverAgents()` 只是将发现的 agents 存入前端状态（Zustand store），但没有调用 `addAgent` 将它们保存到配置文件。

**流程**：
1. 应用启动 → `discoverAgents()` 发现 `.claude`, `.trae` 等 agents
2. 这些 agents 被存入 Zustand store（内存中）
3. 用户打开 Settings → 看到已发现的 agents
4. 用户添加新 agent → 调用 `addAgent` → 后端加载配置
5. 配置文件中**只有手动添加的 agents**（自动发现的未保存）
6. 结果是：列表中只有新添加的 agent，自动发现的不见了

### 代码验证

**前端 `discoverAgents` 逻辑**：
```typescript
const discoverAgents = async () => {
  const discovered = await invoke<Agent[]>('discover_agents');
  // 只更新 store，不保存到配置
  setAgents([...agents, ...newAgents]);
}
```

**后端 `discover_agents` 命令**：
```rust
#[command]
pub fn discover_agents() -> Vec<Agent> {
    // 只返回发现的 agents，不修改配置
}
```

**问题**：`discover_agents` 是只读操作，不会将发现的 agents 保存到配置文件！

## 复现步骤

1. 启动应用（假设 `.claude` 和 `.trae` 存在）
2. 应用自动发现 agents → 显示在 Settings 中
3. 用户添加新的自定义 agent（如 `.custom`）
4. 调用 `addAgent` → 后端加载配置文件
5. 配置文件中**没有** `.claude` 和 `.trae`（因为从未保存）
6. 添加 `.custom` 并保存
7. Settings 中**只显示** `.custom`，自动发现的消失了

## 修复方案

### 方案 1：持久化自动发现的 Agents（推荐）
在 `discoverAgents` 中，将新发现的 agents 通过 `addAgent` 保存到配置。

### 方案 2：合并内存和配置的 Agents
`addAgent` 返回时，前端应该合并后端返回的 agents 和内存中的自动发现 agents。

### 方案 3：启动时持久化
在应用初始化时，将自动发现的 agents 批量保存到配置。
