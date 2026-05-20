
# GitHub Actions 工作流文档

## 工作流概览

本项目配置了 4 个 GitHub Actions 工作流，覆盖 CI/CD 全流程：

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   CI 工作流   │  PR 检查工作流 │  CD 部署工作流 │  Release 工作流 │
│   ci.yml     │ pr-check.yml │   cd.yml     │  release.yml   │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ push → main  │ PR → main    │ tag → v*     │ 手动触发        │
│ push → develop│ PR → develop │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## 1. CI 工作流 (`ci.yml`)

**触发条件**：Push 到 `main` / `develop` 分支，或 PR 到这两个分支

**执行内容**：

| Job | 说明 | 步骤 |
|-----|------|------|
| `backend` | 后端编译与测试 | JDK 17 → Maven 缓存 → 编译验证 → 运行测试 → 上传报告 |
| `frontend` | 前端构建检查 | Node 20 → npm ci → 类型检查 → 构建 → 上传产物 |

**并发控制**：同一分支的多次推送会自动取消前一次运行

---

## 2. PR 检查工作流 (`pr-check.yml`)

**触发条件**：PR 到 `main` / `develop` 分支

**执行内容**：

| Job | 说明 |
|-----|------|
| `backend-check` | 后端编译 + Checkstyle 代码风格检查 |
| `frontend-check` | 前端类型检查 + ESLint 代码规范检查 |
| `pr-lint` | PR 标题格式检查（Conventional Commits） |

**PR 标题格式要求**：

```
<type>(<scope>): <描述>
```

示例：
- `feat(admin-ui): 新增商品列表页面`
- `fix(admin): 修复登录Token过期问题`
- `docs(api): 更新接口文档`

---

## 3. CD 部署工作流 (`cd.yml`)

**触发条件**：推送 `v*` 格式的 tag（如 `v1.0.0`）

**执行内容**：

| Job | 说明 |
|-----|------|
| `build-and-push` | 构建 Docker 镜像并推送到 Docker Hub |
| `deploy` | SSH 连接服务器，拉取最新镜像并重启服务 |

**部署流程**：
```
推送 tag → 构建 Docker 镜像 → 推送到 Docker Hub → SSH 部署 → 健康检查
```

**发布命令**：
```bash
# 创建并推送 tag 触发部署
git tag v1.0.0
git push origin v1.0.0
```

---

## 4. Release 工作流 (`release.yml`)

**触发条件**：手动触发（workflow_dispatch）

**执行内容**：

| Job | 说明 |
|-----|------|
| `prepare` | 验证版本号格式 |
| `build-backend` | 构建后端 JAR 包 |
| `build-frontend` | 构建前端 dist |
| `docker-build` | 构建并推送 Docker 镜像 |
| `create-release` | 自动生成 Changelog 并创建 GitHub Release |

**手动发布步骤**：
1. 进入 GitHub → Actions → Release
2. 点击 "Run workflow"
3. 输入版本号（如 `1.0.0`）
4. 选择是否为预发布版本
5. 点击 "Run workflow"

**自动生成的 Changelog** 会按类型分类：
- ✨ 新功能 (feat)
- 🐛 Bug 修复 (fix)
- 📝 文档更新 (docs)
- 🔧 其他变更

---

## 5. 必需的 Secrets 配置

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中配置：

| Secret | 说明 | 必需 |
|--------|------|------|
| `DOCKER_USERNAME` | Docker Hub 用户名 | ✅ |
| `DOCKER_PASSWORD` | Docker Hub 密码/Token | ✅ |
| `DEPLOY_HOST` | 部署服务器 IP/域名 | ✅ (CD) |
| `DEPLOY_USER` | 部署服务器 SSH 用户名 | ✅ (CD) |
| `DEPLOY_SSH_KEY` | 部署服务器 SSH 私钥 | ✅ (CD) |
| `DEPLOY_PATH` | 服务器上项目路径 | ✅ (CD) |
| `MYSQL_USERNAME` | MySQL 用户名 | ✅ (CD) |
| `MYSQL_PASSWORD` | MySQL 密码 | ✅ (CD) |
| `REDIS_PASSWORD` | Redis 密码 | ✅ (CD) |

### 生成 SSH 密钥

```bash
# 生成部署专用密钥
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key

# 将公钥添加到服务器
ssh-copy-id -i deploy_key.pub user@server

# 将私钥内容复制到 DEPLOY_SSH_KEY
cat deploy_key
```

---

## 6. 分支保护规则

通过 `.github/settings.yml` 自动配置：

### main 分支
- ✅ 需要 PR 审查（1人批准）
- ✅ 需要 CI 通过
- ✅ 管理员也受规则约束
- ✅ 过时的审查自动失效

### develop 分支
- ✅ 需要 PR 审查（1人批准）
- ✅ 需要 CI 通过
- ❌ 管理员不受约束

---

## 7. Dependabot 自动依赖更新

| 生态系统 | 目录 | 更新频率 |
|---------|------|---------|
| Maven | `/backend` | 每周一 |
| npm | `/frontend/admin-ui` | 每周一 |
| Docker | `/` | 每月 |
| GitHub Actions | `/` | 每月 |

Dependabot 会自动创建 PR 更新依赖，每个生态系统最多 5 个并发 PR。

---

## 8. Issue / PR 模板

### Issue 模板
- **Bug 报告**：描述、复现步骤、期望行为、环境信息
- **功能请求**：问题描述、期望方案、目标模块、优先级

### PR 模板
- 变更类型（feat/fix/refactor/docs 等）
- 变更说明
- 关联 Issue
- 受影响模块
- 测试说明
- 检查清单

---

## 9. 标签体系

| 分类 | 标签 | 颜色 |
|------|------|------|
| 类型 | 新功能 / Bug修复 / 重构 / 文档 / 性能优化 | 绿/红/紫/蓝/浅蓝 |
| 模块 | admin / api / admin-ui / mini-app / docker | 黄/橙/浅蓝/浅绿/浅粉 |
| 优先级 | 紧急 / 高 / 中 / 低 | 红/橙/黄/绿 |

---

## 10. 完整工作流示例

### 日常开发流程
```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/product-list

# 2. 开发并提交
git commit -m "feat(admin-ui): 新增商品列表页面"

# 3. 推送并创建 PR
git push origin feature/product-list
# → GitHub 自动触发 PR 检查工作流

# 4. PR 审查通过后合并到 develop
# → GitHub 自动触发 CI 工作流
```

### 版本发布流程
```bash
# 方式1: 推送 tag 自动部署
git tag v1.0.0
git push origin v1.0.0
# → 触发 CD 工作流（构建镜像 + 部署）

# 方式2: 手动触发 Release
# GitHub → Actions → Release → Run workflow
# → 构建 + Docker镜像 + 创建GitHub Release
```

### 紧急修复流程
```bash
# 1. 从 main 创建热修复分支
git checkout main
git checkout -b hotfix/v1.0.1-login-crash

# 2. 修复并提交
git commit -m "fix(admin): 修复登录崩溃问题"

# 3. 创建 PR 合并到 main
# → PR 检查通过后合并

# 4. 打 tag 部署
git tag v1.0.1
git push origin v1.0.1
# → 触发 CD 工作流自动部署

# 5. 同步到 develop
git checkout develop
git merge hotfix/v1.0.1-login-crash
```
