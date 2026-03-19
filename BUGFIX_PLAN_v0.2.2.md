# v0.2.2 Bug 修复计划

**报告时间**: 2026-03-19  
**严重级别**: 严重（核心功能失败）  
**版本**: v0.2.1 → v0.2.2

---

## 问题清单

### 🔴 P0 - 核心功能失败

#### 1. 删除软链接失败
**症状**: 取消选择 skill，点击同步显示"成功"，但软链接依然存在，再次同步显示"失败"

**根本原因**: 
- 后端 `delete_skill_local` 命令需要 `agents` 和 `hub_path` 参数
- 前端调用时只传递了 `skillName` 和 `agentId`
- 参数缺失导致命令执行失败

**修复方案**:
```typescript
// ActionBar.tsx 修复
await invoke('delete_skill_local', {
  skillName,
  agentId,
  agents,        // ← 添加
  hubPath: config.central_hub_path,  // ← 添加
});
```

---

### 🟡 P1 - 用户体验问题

#### 2. Settings 侧边栏无滚动条
**症状**: Settings 面板无法滚动，下方 agent 无法显示

**根本原因**: SheetContent 没有设置 overflow-y-auto

**修复方案**:
```tsx
<SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
```

---

#### 3. 首页按钮无响应
**症状**: "查看教程"和"发现技能"按钮点击无反应

**根本原因**: 按钮没有 onClick 处理函数

**修复方案**:
- "查看教程": 打开外部文档链接或显示提示
- "发现技能": 展开"发现技能"分类或打开 Vercel Skills 集成

---

#### 4. 主题切换样式问题
**症状**: 亮色模式下左侧"我的技能库"有灰色背景，文本不可见

**根本原因**: Sidebar 使用固定深色背景 `bg-slate-800/50`，不随主题变化

**修复方案**:
```tsx
// 使用主题感知的背景色
<aside className="w-64 h-full bg-card border-r border-border flex flex-col">
```

---

## 修复分支策略

```bash
# 从 main 创建修复分支
git checkout main
git pull origin main
git checkout -b hotfix/v0.2.2-critical-fixes

# 修复完成后
# 1. 提交修复
# 2. 测试验证
# 3. 合并到 main
# 4. 打标签 v0.2.2
# 5. 合并到 dev
```

---

## 测试验证清单

- [ ] 删除 skill 软链接成功
- [ ] Settings 面板可以滚动
- [ ] 首页按钮有响应
- [ ] 主题切换样式正确
- [ ] 构建成功
- [ ] 单元测试通过

---

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `ActionBar.tsx` | 修复 | 添加缺失的 agents 和 hubPath 参数 |
| `SettingsDrawer.tsx` | 修复 | 添加 overflow-y-auto |
| `SkillEmptyState.tsx` | 修复 | 添加按钮 onClick 处理 |
| `Sidebar.tsx` | 修复 | 使用主题感知背景色 |
| `appStore.ts` | 可能需要 | 确保 config 可访问 |

---

**预计修复时间**: 2-3 小时  
**风险**: 低（参数补充和 UI 调整）
