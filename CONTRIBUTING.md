# 贡献指南 (Contributing Guide)

感谢您对 Skilltoon 项目的关注！本指南将帮助您了解如何参与项目开发。

---

## 📋 目录

- [开发环境准备](#开发环境准备)
- [Git Flow 工作流程](#git-flow-工作流程)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)
- [Pull Request 流程](#pull-request-流程)
- [发布流程](#发布流程)
- [常见问题](#常见问题)

---

## 开发环境准备

### 必需工具

```bash
# 1. 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. 安装 Bun (推荐) 或 Node.js
curl -fsSL https://bun.sh/install | bash
# 或: npm install -g bun

# 3. 安装 Tauri CLI
cargo install tauri-cli

# 4. 克隆仓库
git clone https://github.com/sebswho/Skilltoon.git
cd Skilltoon

# 5. 安装依赖
cd src-ui && bun install && cd ..
```

### 验证安装

```bash
# 运行测试
cd src-tauri && cargo test
cd src-ui && bun run build
```

---

## Git Flow 工作流程

本项目严格遵循 **Git Flow** 工作流程。请务必遵守！

### 分支结构

```
main  (生产环境，保护分支)
  ↑
dev   (开发集成，保护分支)
  ↑
feature/*  (功能开发，本地分支，禁止远程推送)
```

### 工作流程图示

```
┌─────────────────────────────────────────────────────────────┐
│                     Git Flow 工作流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │   main      │ ◄────── 生产环境，仅接受 dev 的 PR          │
│  │  (保护)     │         需要 Review + CI 通过               │
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ git merge dev --no-ff                              │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │    dev      │ ◄────── 开发分支，仅接受 feature 的 PR      │
│  │  (保护)     │         需要 CI 通过                        │
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ git merge feature/xxx --no-ff                      │
│         ▼                                                    │
│  ┌─────────────┐     ┌─────────────┐                        │
│  │ feature/xxx │     │ feature/yyy │ ◄── 本地功能分支        │
│  │  (本地)     │     │  (本地)     │     禁止推送到远程      │
│  └─────────────┘     └─────────────┘                        │
│         │                                                    │
│         └── 基于 dev 创建                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🚫 禁止事项

| 禁止行为 | 原因 | 正确做法 |
|---------|------|----------|
| 直接推送 `main` | 保护生产环境 | 通过 PR 合并 |
| 直接推送 `dev` | 保护开发分支 | 通过 PR 合并 |
| 推送 `feature/*` 到远程 | 保持分支整洁 | 本地开发后直接合并到 dev |
| 在 `main` 上开发 | 防止不稳定代码 | 在 `dev` 或 `feature/*` 开发 |
| 删除 `main` 或 `dev` | 分支保护 | 绝不允许 |

---

## 功能开发流程

### 步骤 1: 创建功能分支（本地）

```bash
# 1. 切换到 dev 并更新
git checkout dev
git pull origin dev

# 2. 创建功能分支
# 命名规范: feature/<功能描述>
git checkout -b feature/add-user-profile

# 3. 开始开发...
```

### 步骤 2: 开发并提交

```bash
# 开发过程中多次提交
git add .
git commit -m "feat: add user profile page"

# 继续开发...
git add .
git commit -m "feat: add profile edit form"

# 修复 bug
git add .
git commit -m "fix: validate email format in profile"
```

### 步骤 3: 合并到 dev

```bash
# 1. 确保功能完成并通过测试
# Rust 测试
cd src-tauri && cargo test && cd ..

# 前端构建
cd src-ui && bun run build && cd ..

# E2E 测试
bunx playwright test

# 2. 切换回 dev
git checkout dev
git pull origin dev

# 3. 合并功能分支（使用 --no-ff 保留历史）
git merge feature/add-user-profile --no-ff -m "feat: add user profile feature

Features:
- User profile page
- Profile edit form
- Email validation

Closes #123"

# 4. 推送到远程 dev（这会触发 CI）
git push origin dev

# 5. 删除本地功能分支
git branch -d feature/add-user-profile
```

---

## 代码规范

### Rust 后端

```bash
# 格式化
cargo fmt

# 代码检查
cargo clippy -- -D warnings

# 测试
cargo test
```

### TypeScript 前端

```bash
# 类型检查
cd src-ui
npx tsc --noEmit

# 构建
bun run build
```

---

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(ui): add dark mode toggle` |
| `fix` | 修复 bug | `fix(sync): resolve conflict detection` |
| `docs` | 文档更新 | `docs: update API documentation` |
| `style` | 代码格式 | `style: format with rustfmt` |
| `refactor` | 重构 | `refactor: simplify error handling` |
| `test` | 测试 | `test: add unit tests for config manager` |
| `chore` | 构建/工具 | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow` |

### 示例

```bash
# 简单提交
git commit -m "feat(ui): add theme toggle button"

# 详细提交
git commit -m "feat(sync): add batch sync functionality

- Add batch_sync command to sync multiple skills
- Add progress tracking for batch operations
- Update UI to show batch sync status

Closes #456"
```

---

## Pull Request 流程

### 创建 PR（当 dev 准备好合并到 main 时）

1. **确保 dev 分支稳定**
   - 所有测试通过
   - CI 检查通过
   - 代码已 Review

2. **通过 GitHub 网页创建 PR**
   - Base: `main`
   - Compare: `dev`
   - 标题: `Release: version X.X.X`

3. **PR 模板**

```markdown
## Release X.X.X

### 功能更新
- [ ] 功能 A
- [ ] 功能 B

### 测试
- [ ] 所有单元测试通过
- [ ] E2E 测试通过
- [ ] 手动测试完成

### 检查清单
- [ ] 代码已 Review
- [ ] 文档已更新
- [ ] 变更日志已更新
```

4. **Review 流程**
   - 至少需要 1 个 Approve
   - 所有评论必须解决
   - CI 必须通过

5. **合并**
   - 使用 **"Create a merge commit"**
   - 不要使用 Squash（会丢失功能分支历史）

---

## 发布流程

### 版本号规范 (SemVer)

```
主版本号.次版本号.修订号
  X.   Y.    Z

Z: 修复 bug (patch)
Y: 新功能，向后兼容 (minor)
X: 重大变更，可能不兼容 (major)
```

### 发布步骤

```bash
# 1. 确保在 main 分支
git checkout main
git pull origin main

# 2. 更新版本号（在 Cargo.toml 和 package.json 中）
# 编辑文件...

# 3. 提交版本更新
git add .
git commit -m "chore: bump version to 1.0.0"
git push origin main

# 4. 打标签
git tag -a v1.0.0 -m "Release version 1.0.0

Changes:
- Add dark mode support
- Add i18n (zh-CN, en)
- New app icon design
- Add GitHub Actions CI"

# 5. 推送标签
git push origin v1.0.0
```

推送标签后会自动触发 `release.yml` 工作流，构建多平台安装包。

---

## 常见问题

### Q: 我误操作推送了 feature 分支到远程怎么办？

```bash
# 删除远程 feature 分支
git push origin --delete feature/xxx

# 继续在本地开发，完成后按正常流程合并到 dev
```

### Q: CI 失败了怎么办？

1. 查看 GitHub Actions 日志
2. 在本地修复问题
3. 重新提交到 dev
4. CI 会自动重新运行

### Q: 如何处理冲突？

```bash
# 1. 更新 dev
git checkout dev
git pull origin dev

# 2. 切换到 feature 分支并变基
git checkout feature/xxx
git rebase dev

# 3. 解决冲突，继续变基
git add .
git rebase --continue

# 4. 合并到 dev
git checkout dev
git merge feature/xxx --no-ff
```

### Q: 我可以在 Windows/Linux 上开发吗？

可以！本项目支持跨平台开发：
- Rust: 原生支持
- Tauri: 支持 Windows/macOS/Linux
- CI: 自动测试所有平台

---

## 需要帮助？

- 🐛 发现 Bug: [创建 Issue](../../issues/new?labels=bug)
- 💡 新功能建议: [创建 Issue](../../issues/new?labels=enhancement)
- 💬 讨论: [Discussions](../../discussions)

---

## 代码贡献者

感谢所有为项目做出贡献的开发者！

<!-- 贡献者列表会自动更新 -->
