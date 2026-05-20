
# Git 工作流规范

## 1. 分支策略

采用 **Git Flow** 简化版分支模型：

```
main ──────────────────────────────────────────►  (生产分支)
  └── develop ────────────────────────────────►  (开发分支)
        ├── feature/xxx ──────►  (功能分支)
        ├── fix/xxx ──────────►  (修复分支)
        └── release/x.x.x ───►  (发布分支)
hotfix/xxx ──────────────────►  (紧急修复分支)
```

### 分支说明

| 分支 | 命名规则 | 说明 | 生命周期 |
|------|---------|------|---------|
| `main` | `main` | 生产环境代码，始终保持可部署状态 | 永久 |
| `develop` | `develop` | 开发集成分支，最新开发成果 | 永久 |
| `feature/*` | `feature/模块-简述` | 新功能开发 | 开发完成后删除 |
| `fix/*` | `fix/模块-简述` | Bug 修复 | 修复完成后删除 |
| `release/*` | `release/vX.Y.Z` | 版本发布准备 | 发布完成后删除 |
| `hotfix/*` | `hotfix/vX.Y.Z-简述` | 紧急生产修复 | 修复完成后删除 |

### 分支命名示例

```bash
feature/admin-user-page      # 管理后台用户页面
feature/product-list         # 商品列表功能
fix/order-status-bug         # 订单状态Bug修复
fix/login-token-expire       # 登录Token过期修复
release/v1.0.0               # 1.0.0版本发布
hotfix/v1.0.1-login-crash    # 紧急修复登录崩溃
```

---

## 2. 版本号规范

遵循 **语义化版本 (SemVer)**：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的 Bug 修复

示例：`1.0.0` → `1.0.1` → `1.1.0` → `2.0.0`

---

## 3. Commit 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(product): 新增商品列表页面` |
| `fix` | Bug 修复 | `fix(order): 修复订单状态更新异常` |
| `docs` | 文档变更 | `docs(api): 更新接口文档` |
| `style` | 代码格式（不影响逻辑） | `style(admin-ui): 统一缩进格式` |
| `refactor` | 重构（非新功能/修复） | `refactor(mapper): 优化查询逻辑` |
| `perf` | 性能优化 | `perf(service): 优化商品查询性能` |
| `test` | 测试相关 | `test(service): 添加用户服务单元测试` |
| `chore` | 构建/工具变更 | `chore(docker): 更新Docker镜像版本` |
| `ci` | CI/CD 配置 | `ci(github): 添加自动部署工作流` |

### Scope 范围

| Scope | 说明 |
|-------|------|
| `admin` | 管理后台后端 (shop-admin) |
| `api` | 用户端API (shop-api) |
| `common` | 公共模块 (shop-common) |
| `mapper` | 数据访问层 (shop-mapper) |
| `service` | 业务逻辑层 (shop-service) |
| `admin-ui` | 管理后台前端 |
| `mini-app` | 小程序端 |
| `docker` | Docker 相关 |
| `docs` | 文档 |

### Commit 示例

```bash
# 新功能
feat(admin-ui): 新增商品列表页面，支持搜索和分页

# Bug 修复
fix(admin): 修复管理员登录Token过期未刷新问题

Closes #12

# 重构
refactor(service): 重构订单服务，抽取公共逻辑

- 将订单状态校验抽取为独立方法
- 统一异常处理逻辑

# 版本发布
chore(release): v1.0.0
```

---

## 4. 工作流程

### 4.1 日常开发

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/product-list

# 2. 开发过程中，定期提交
git add .
git commit -m "feat(admin-ui): 完成商品列表表格组件"

# 3. 定期同步 develop 的更新
git fetch origin
git rebase origin/develop

# 4. 开发完成，推送到远程
git push origin feature/product-list

# 5. 创建 Pull Request / Merge Request，合并到 develop
```

### 4.2 版本发布

```bash
# 1. 从 develop 创建发布分支
git checkout develop
git checkout -b release/v1.0.0

# 2. 在发布分支上修复Bug、更新版本号
git commit -m "fix(admin): 修复发布前发现的问题"
git commit -m "chore(release): 更新版本号至 v1.0.0"

# 3. 合并到 main 和 develop
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"

git checkout develop
git merge release/v1.0.0

# 4. 推送所有分支和标签
git push origin main develop --tags

# 5. 删除发布分支
git branch -d release/v1.0.0
```

### 4.3 紧急修复

```bash
# 1. 从 main 创建热修复分支
git checkout main
git checkout -b hotfix/v1.0.1-login-crash

# 2. 修复并提交
git commit -m "fix(admin): 修复登录页面崩溃问题"

# 3. 合并到 main 和 develop
git checkout main
git merge hotfix/v1.0.1-login-crash
git tag -a v1.0.1 -m "Hotfix v1.0.1"

git checkout develop
git merge hotfix/v1.0.1-login-crash

# 4. 推送
git push origin main develop --tags

# 5. 删除热修复分支
git branch -d hotfix/v1.0.1-login-crash
```

---

## 5. Pull Request 规范

### PR 标题格式

```
<type>(<scope>): <简短描述>
```

示例：`feat(admin-ui): 新增商品列表页面`

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档 (docs)
- [ ] 其他

## 变更说明
<!-- 简要描述本次变更的内容和原因 -->

## 关联 Issue
Closes #

## 测试说明
<!-- 如何测试本次变更 -->

## 检查清单
- [ ] 代码已自测
- [ ] 无编译警告
- [ ] 遵循项目编码规范
- [ ] 已更新相关文档
```

---

## 6. 快速初始化

如果是全新仓库，执行以下命令初始化：

```bash
# 进入项目目录
cd shop

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "chore: 项目初始化

- 后端: Spring Boot 多模块架构 (admin/api/common/mapper/service)
- 前端: Vue3 + Element Plus + TypeScript 管理后台
- 基础设施: Docker Compose 编排 (MySQL/Redis/Kafka/ES/RabbitMQ)
- 文档: API/数据库/部署/开发文档"

# 创建 develop 分支
git checkout -b develop

# 添加远程仓库
git remote add origin <仓库地址>

# 推送 main 和 develop
git push -u origin main
git push -u origin develop
```

---

## 7. .gitignore 要点

已配置的忽略规则涵盖：

- **IDE**：`.idea/`、`*.iml`、`.vscode/`
- **Java 构建**：`target/`、`*.class`、`*.jar`
- **Node.js**：`node_modules/`、`dist/`
- **Docker 运行数据**：`docker/volumes/*/data/`
- **敏感信息**：`.env`、`*.key`、`*.pem`
- **系统文件**：`.DS_Store`、`Thumbs.db`
