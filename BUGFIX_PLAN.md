# Bug 修复方案：添加 Agent 后覆盖原有 Agents 列表

## Bug 根本原因

**自动发现的 Agents 未被持久化到配置文件**

- `discoverAgents()` 仅将 agents 存入前端内存（Zustand store）
- 用户添加新 agent 时，`addAgent` 从后端加载配置（不含自动发现的 agents）
- 结果：列表中只有新添加的 agent，自动发现的 agents "消失"

## 修复方案

### 方案 A：持久化自动发现的 Agents（推荐）

修改 `discoverAgents`，将新发现的 agents 保存到配置文件。

**优点**：
- 数据一致性，配置文件中始终有完整的 agents 列表
- 用户删除已发现的 agent 时，配置也会更新

**缺点**：
- 需要为每个新 agent 调用 `addAgent`（多次后端调用）

### 方案 B：后端新增 `syncDiscoveredAgents` 命令

新增一个批量保存发现 agents 的命令，避免多次调用。

**优点**：
- 一次后端调用保存所有发现的 agents

**缺点**：
- 需要新增后端命令

### 方案 C：前端合并策略

修改 `addAgent` 成功后，前端合并后端返回的 agents 和内存中的 agents。

**优点**：
- 改动小，仅前端修改

**缺点**：
- 配置文件中始终没有自动发现的 agents
- 重启应用后，自动发现的 agents 会重复添加（除非检查重复）

## 推荐方案：方案 A

实施简单，数据持久化，用户体验一致。

## 实施步骤

1. 修改 `useAgents.ts` 中的 `discoverAgents`
2. 引入 `useConfig` 中的 `addAgent`
3. 对新发现的每个 agent 调用 `addAgent` 保存
4. 修改 `App.tsx` 初始化逻辑，确保启动时持久化

## 代码修改

### 修改 useAgents.ts

```typescript
export function useAgents() {
  const { agents, setAgents } = useAppStore();
  const { addAgent } = useConfig(); // 新增

  const discoverAgents = async () => {
    try {
      const discovered = await invoke<Agent[]>('discover_agents');
      const existingIds = new Set(agents.map(a => a.id));
      const newAgents = discovered.filter(a => !existingIds.has(a.id));
      
      if (newAgents.length > 0) {
        // 保存每个新发现的 agent 到配置
        for (const agent of newAgents) {
          await addAgent(agent);
        }
      }
      
      return discovered;
    } catch (error) {
      console.error('Failed to discover agents:', error);
      throw error;
    }
  };
  // ...
}
```

### 修改 App.tsx

确保 `loadConfig` 在 `discoverAgents` 之前执行，避免重复添加。
