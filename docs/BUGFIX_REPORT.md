# Bug 修复报告：添加 Agent 后数据丢失

**日期**: 2025-03-18  
**严重级别**: 高（数据丢失）  
**状态**: ✅ 已修复

---

## 问题描述

在 Settings 中添加新 Agent 后，原有的 Agents 列表（特别是自动发现的 Agents）会被覆盖或消失。

### 复现步骤

1. 启动应用，系统会自动发现已安装的 Agents（如 Claude Code、Trae 等）
2. 打开 Settings，可以看到这些自动发现的 Agents
3. 点击 "Add Agent" 添加一个新的自定义 Agent
4. 保存后，Settings 中只剩下新添加的 Agent，自动发现的 Agents 全部消失

---

## 根本原因分析

### 数据流问题

```
启动流程：
1. loadConfig()    → 从配置文件加载 Agents（可能为空）
2. discoverAgents() → 发现系统 Agents，仅存入内存（Zustand）
                    ❌ 没有保存到配置文件！

添加 Agent 流程：
1. 用户点击 "Add Agent"
2. addAgent()      → 后端 load_config() → 返回空列表（因为从未保存）
3. 后端添加新 Agent 并保存
4. 前端显示只有新 Agent，自动发现的消失了
```

### 代码问题

**useAgents.ts**:
```typescript
// 原代码 - 只更新内存，不持久化
const discoverAgents = async () => {
  const discovered = await invoke<Agent[]>('discover_agents');
  const newAgents = discovered.filter(...);
  
  if (newAgents.length > 0) {
    const merged = [...agents, ...newAgents];
    setAgents(merged);  // ❌ 只更新内存！
  }
};
```

**ConfigManager.rs**:
```rust
// add_agent 逻辑 - 加载→修改→保存
pub fn add_agent(&self, agent: Agent) -> Result<AppConfig> {
    let mut config = self.load()?;  // 加载配置（不含自动发现的）
    config.agents.retain(|a| a.id != agent.id);
    config.agents.push(agent);
    self.save(&config)?;  // 保存（覆盖原有自动发现的）
    Ok(config)
}
```

---

## 修复方案

### 修改内容

#### 1. useAgents.ts
- 引入 `useConfig` 的 `addAgent`
- 对新发现的每个 Agent 调用 `addAgent` 持久化到配置

```typescript
import { useConfig } from './useConfig';

export function useAgents() {
  const { agents } = useAppStore();
  const { addAgent } = useConfig();  // 新增

  const discoverAgents = async () => {
    const discovered = await invoke<Agent[]>('discover_agents');
    const newAgents = discovered.filter(a => !existingIds.has(a.id));
    
    if (newAgents.length > 0) {
      // ✅ 持久化每个新发现的 Agent
      for (const agent of newAgents) {
        await addAgent(agent);
      }
    }
  };
}
```

#### 2. App.tsx
- 确保初始化顺序正确
- 发现 Agents 后重新加载配置以确保状态一致

```typescript
useEffect(() => {
  const init = async () => {
    // 先加载配置
    await loadConfig();
    
    // 发现并持久化新 Agents
    await discoverAgents();
    
    // 重新加载确保状态一致
    await loadConfig();
  };
  init();
}, []);
```

---

## 修复验证

### 测试步骤

1. 启动应用，确认自动发现 Agents
2. 打开 Settings，确认 Agents 列表显示
3. 添加新的自定义 Agent
4. 验证原有 Agents 仍然存在
5. 重启应用，验证所有 Agents 都被保留

### 预期结果

- ✅ 添加新 Agent 不会覆盖原有 Agents
- ✅ 自动发现的 Agents 被正确持久化
- ✅ 重启应用后所有 Agents 都在

---

## 代码变更

| 文件 | 变更 |
|------|------|
| `src-ui/src/hooks/useAgents.ts` | 引入 `useConfig`，持久化新发现的 Agents |
| `src-ui/src/App.tsx` | 优化初始化顺序，确保状态一致 |

**提交**: `38a05b5`

---

## 后续建议

### 1. 添加单元测试
为 `discoverAgents` 添加测试，确保：
- 新发现的 Agents 被正确持久化
- 已存在的 Agents 不会被重复添加

### 2. 考虑批量保存优化
当前是每个 Agent 单独调用 `addAgent`，可以优化为批量保存。

### 3. 用户删除 Agent 的处理
如果用户删除了一个自动发现的 Agent，下次启动时不应该重新添加（需要记录用户删除操作）。

---

## 影响范围

- 所有使用 Settings 管理 Agents 的用户
- 自动发现功能
- 数据持久化

**风险**: 低（修复数据丢失问题，无破坏性变更）
