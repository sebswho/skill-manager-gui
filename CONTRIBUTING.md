# Contributing Guide

## Git 工作流程

我们使用 **Git Flow** 工作流程来管理代码。

### 分支说明

| 分支 | 用途 | 远程 |
|------|------|------|
| `main` | 生产环境代码，稳定版本 | ✅ 有 |
| `dev` | 开发集成分支，feature合并到这里 | ✅ 有 |
| `feature/*` | 功能开发分支 | ❌ 无（本地开发） |

### 开发流程

1. **从 dev 创建功能分支**（本地）
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **开发并提交**
   ```bash
   # 写代码...
   git add .
   git commit -m "feat: add new feature"
   ```

3. **合并到 dev**（通过 Pull Request）
   ```bash
   git checkout dev
   git pull origin dev
   git merge feature/your-feature-name
   git push origin dev
   ```

4. **发布时合并到 main**（通过 Pull Request）
   - 从 dev 创建 PR 到 main
   - 通过 CI 检查后合并
   - 打 tag 发布新版本

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型：**
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式调整
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例：**
```bash
git commit -m "feat(ui): add dark mode toggle"
git commit -m "fix(sync): resolve conflict detection bug"
git commit -m "docs: update API documentation"
```

### CI 检查

所有 PR 必须通过以下检查：
- ✅ 前端构建
- ✅ 前端类型检查
- ✅ Rust 代码格式化
- ✅ Rust Clippy 检查
- ✅ Rust 单元测试
- ✅ E2E 测试（可选）
- ✅ 安全审计

### 发布流程

1. 确保 dev 分支稳定且所有测试通过
2. 从 dev 创建 PR 到 main
3. 合并后打 tag：
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
4. GitHub Actions 会自动构建并创建 Release
