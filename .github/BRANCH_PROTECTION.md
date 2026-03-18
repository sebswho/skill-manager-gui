# Branch Protection Rules

## 推荐的 GitHub 分支保护设置

### main 分支
```
✅ Require a pull request before merging
   - Require approvals: 1
   - Dismiss stale PR approvals when new commits are pushed
   
✅ Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Status checks:
     - Frontend Build & Test
     - Backend Build & Test
     - Security Audit
     
✅ Require conversation resolution before merging

✅ Restrict pushes that create files larger than 5MB

❌ Do not allow bypassing the above settings
```

### dev 分支
```
✅ Require a pull request before merging
   - Require approvals: 1 (optional for small teams)
   
✅ Require status checks to pass before merging
   - Frontend Build & Test
   - Backend Build & Test
   
✅ Require branches to be up to date before merging
```

## 设置步骤

1. 打开 GitHub 仓库 → Settings → Branches
2. 点击 "Add rule" 分别添加 main 和 dev 的保护规则
3. 按照上面的配置勾选相应选项

## 工作流程图示

```
┌─────────────────────────────────────────────────────────────────┐
│                        Git Flow 工作流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   feature/login ──┐                                             │
│   feature/theme   ├───► dev ────────► main (production)         │
│   feature/api   ──┘     │               ▲                       │
│                         │               │                       │
│                    (测试 & 集成)     (Release)                  │
│                                                                 │
│   本地开发分支          远程            远程                     │
│   (无远程跟踪)                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
