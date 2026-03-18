#!/bin/bash
# 合并当前 feature 分支到 dev 的自动化脚本

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           合并 Feature 分支到 Dev                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

CURRENT_BRANCH=$(git branch --show-current)

# 检查是否在 feature 分支
if [[ ! $CURRENT_BRANCH == feature/* ]]; then
    echo "❌ 错误: 必须在 feature 分支上运行此脚本"
    echo "当前分支: $CURRENT_BRANCH"
    exit 1
fi

echo "📍 当前 feature 分支: $CURRENT_BRANCH"
echo ""

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "❌ 有未提交的更改，请先提交:"
    git status --short
    exit 1
fi

echo "✅ 工作区干净"
echo ""

# 检查提交信息
commits=$(git log dev..HEAD --format=%s)
if [ -z "$commits" ]; then
    echo "❌ 没有新的提交可以合并"
    exit 1
fi

echo "📋 将合并以下提交:"
echo "$commits"
echo ""

# 运行测试
echo "🧪 运行测试..."
cd src-tauri
if ! cargo test --quiet 2>/dev/null; then
    echo "❌ Rust 测试失败"
    exit 1
fi
cd ..

cd src-ui
if ! bun run build 2>/dev/null; then
    echo "❌ 前端构建失败"
    exit 1
fi
cd ..

echo "✅ 测试通过"
echo ""

# 确认合并
read -p "确认合并到 dev? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "取消合并"
    exit 0
fi

echo ""
echo "🔄 执行合并..."

# 更新 dev
git checkout dev
git pull origin dev

# 合并 feature
git merge "$CURRENT_BRANCH" --no-ff -m "feat: merge $CURRENT_BRANCH

Features:
$(echo "$commits" | sed 's/^/- /')

All tests passing."

# 推送到远程
echo ""
echo "📤 推送到远程 dev..."
git push origin dev

# 删除本地 feature 分支
echo ""
echo "🗑️ 删除本地 feature 分支..."
git branch -d "$CURRENT_BRANCH"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ 合并完成！                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "$CURRENT_BRANCH 已成功合并到 dev"
echo "CI 会自动运行测试"
