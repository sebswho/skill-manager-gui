# Git Flow 快速参考

## 🚀 开发新功能（3 步）

```bash
# 1. 创建功能分支
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. 开发并提交
git add .
git commit -m "feat: add awesome feature"

# 3. 合并到 dev（使用脚本）
./scripts/merge-to-dev.sh
```

## 📝 提交信息格式

```
type(scope): description

feat(ui): add dark mode
test(sync): add batch sync tests
fix(agent): resolve path validation bug
docs: update API documentation
```

## 🌿 分支规则

| 分支 | 用途 | 保护 | 操作 |
|------|------|------|------|
| `main` | 生产环境 | ✅ 保护 | 仅接受 dev 的 PR |
| `dev` | 开发集成 | ✅ 保护 | 仅接受 feature 的本地合并 |
| `feature/*` | 功能开发 | ❌ 本地 | 禁止推送到远程 |

## 🚫 禁止事项

- ❌ 直接推送 `main`
- ❌ 直接推送 `dev`  
- ❌ 推送 `feature/*` 到远程
- ❌ 在 `main` 上直接开发

## ✅ 发布流程

```bash
# 1. 确保 dev 稳定
./scripts/check-git-flow.sh

# 2. 创建 PR (GitHub 网页)
# base: main, compare: dev

# 3. 打标签发布
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 🆘 常用命令

```bash
# 检查当前状态
./scripts/check-git-flow.sh

# 合并当前 feature 到 dev
./scripts/merge-to-dev.sh

# 查看分支图
git log --oneline --graph --all --decorate
```

## 📚 完整文档

- [CONTRIBUTING.md](CONTRIBUTING.md) - 完整贡献指南
- [README.md](README.md) - 项目介绍
