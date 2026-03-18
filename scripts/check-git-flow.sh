#!/bin/bash
# Git Flow 检查脚本
# 在提交前运行，确保遵循项目流程

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                Git Flow 本地检查                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"

# 检查是否在 feature 分支
if [[ $CURRENT_BRANCH == feature/* ]]; then
    echo "✅ 在 feature 分支上开发"
    
    # 检查是否意外推送到了远程
    if git branch -r | grep -q "origin/$CURRENT_BRANCH"; then
        echo "❌ 错误: feature 分支 '$CURRENT_BRANCH' 已推送到远程!"
        echo "   应该在本地开发，完成后合并到 dev"
        echo "   删除远程分支: git push origin --delete $CURRENT_BRANCH"
        exit 1
    fi
    
    # 检查提交信息格式
    echo ""
    echo "📋 检查提交信息格式..."
    commits=$(git log dev..HEAD --format=%s 2>/dev/null || git log main..HEAD --format=%s)
    
    if [ -z "$commits" ]; then
        echo "⚠️ 没有新的提交"
    else
        valid_types="feat|fix|docs|style|refactor|test|chore|ci|perf|build"
        invalid_commits=0
        
        while IFS= read -r commit; do
            if [[ ! $commit =~ ^($valid_types)(\(.+\))?!?: ]]; then
                echo "❌ 无效提交: $commit"
                invalid_commits=$((invalid_commits + 1))
            fi
        done <<< "$commits"
        
        if [ $invalid_commits -gt 0 ]; then
            echo ""
            echo "提交信息必须符合 Conventional Commits 规范:"
            echo "  格式: type(scope): description"
            echo "  有效类型: $valid_types"
            exit 1
        else
            echo "✅ 所有提交信息格式正确"
        fi
    fi
    
    # 检查是否可以合并到 dev
    echo ""
    echo "📋 检查是否可以合并到 dev..."
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        echo "❌ 有未提交的更改，请先提交"
        exit 1
    fi
    
    echo "✅ 可以合并到 dev"
    echo ""
    echo "执行以下命令合并到 dev:"
    echo "  git checkout dev"
    echo "  git pull origin dev"
    echo "  git merge $CURRENT_BRANCH --no-ff"
    echo "  git push origin dev"
    echo "  git branch -d $CURRENT_BRANCH"

elif [ "$CURRENT_BRANCH" = "dev" ]; then
    echo "✅ 在 dev 分支"
    echo ""
    echo "当前可以:"
    echo "  1. 创建新的 feature 分支: git checkout -b feature/xxx"
    echo "  2. 合并 feature 分支到 dev: git merge feature/xxx --no-ff"
    echo "  3. 推送 dev 到远程: git push origin dev"
    
    # 检查 dev 是否可以合并到 main
    echo ""
    echo "📋 检查是否可以发布到 main..."
    
    # 检查是否有未推送的提交
    if git log origin/dev..dev --oneline | grep -q .; then
        echo "⚠️ 有未推送到远程的提交"
    fi
    
    echo "✅ dev 分支准备好后，通过 GitHub PR 合并到 main"

elif [ "$CURRENT_BRANCH" = "main" ]; then
    echo "⚠️ 在 main 分支 (生产环境)"
    echo ""
    echo "❌ 禁止直接在 main 上开发!"
    echo "正确流程:"
    echo "  1. git checkout dev"
    echo "  2. git checkout -b feature/xxx"
    echo "  3. 开发..."
    echo "  4. git checkout dev && git merge feature/xxx --no-ff"
    echo "  5. 通过 GitHub PR 合并到 main"
    exit 1

else
    echo "⚠️ 在分支 '$CURRENT_BRANCH' 上"
    echo "建议使用命名规范:"
    echo "  feature/<描述>  - 新功能"
    echo "  fix/<描述>      - 修复 (或直接合并到 dev)"
    echo "  hotfix/<描述>   - 紧急修复 (可以直接到 main)"
fi

echo ""
echo "✅ Git Flow 检查完成"
