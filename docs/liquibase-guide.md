# Liquibase 数据库变更管理备忘

## 模块结构

```
shop-mapper（公共模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── v1.0.0-0000-init.sql         # 数据库字符集与排序规则
│   │   ├── v1.0.0-0001-ddl.sql         # 公共表结构（用户、分类、商品、购物车、订单、订单详情）
│   │   └── v1.0.0-0002-dml.sql         # 公共初始化数据
│   └── db.changelog-master.yaml        # includeAll changelog/

shop-api（API模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── api-v1.0.0-0001-ddl.sql     # API专属表结构（预留）
│   │   └── api-v1.0.0-0002-dml.sql     # API专属数据（预留）
│   └── （无db.changelog-master.yaml）

shop-admin（Admin模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── admin-v1.0.0-0001-ddl.sql   # Admin专属表结构（管理用户、角色、权限、关联表）
│   │   └── admin-v1.0.0-0002-dml.sql   # Admin专属数据（管理员、角色、权限、关联数据）
│   └── （无db.changelog-master.yaml）
```

### 跨模块引用原理

`shop-mapper` 是唯一拥有 `db.changelog-master.yaml` 的模块，其 `includeAll` 机制会自动加载 classpath 中所有 `changelog/` 下的 SQL 文件（包括自身和其他依赖模块的）。

```yaml
# shop-mapper 的 master yaml（唯一）
databaseChangeLog:
  - includeAll:
      path: changelog/
```

由于 `shop-api`、`shop-admin` 依赖 `shop-mapper`，它们的 `changelog/` 目录下的 SQL 文件也会被打包进 JAR，对 `shop-mapper` 的 `includeAll` 可见，从而实现跨模块自动加载。

## 执行逻辑

| 模块 | contexts | 执行范围 |
|------|----------|----------|
| shop-api | `api` | 公共变更集 + api 专属变更集 |
| shop-admin | `admin` | 公共变更集 + admin 专属变更集 |

## 命名规则

**文件名**：`{模块前缀-}版本号-序号-类型.sql`

> - 公共模块文件无需模块前缀；各业务模块文件需加模块前缀，避免跨模块 classpath 合并时文件名冲突。
> - **版本号与项目版本号保持一致**（如项目版本为 `1.0.0`，则文件名中版本号为 `v1.0.0`）。项目版本号不变时，只递增序号，不修改版本号。

类型说明：
- `init` — 数据库字符集与排序规则
- `ddl` — 表结构变更（CREATE/ALTER/DROP）
- `dml` — 数据变更（INSERT/UPDATE/DELETE）

序号规则：
- 统一使用4位序号（`0000`、`0001`、`0002`...）

示例：
- `v1.0.0-0000-init.sql`（公共）
- `v1.0.0-0001-ddl.sql`（公共）
- `v1.0.0-0002-dml.sql`（公共）
- `admin-v1.0.0-0001-ddl.sql`（Admin模块）
- `admin-v1.0.0-0002-dml.sql`（Admin模块）
- `api-v1.0.0-0001-ddl.sql`（API模块）
- `api-v1.0.0-0002-dml.sql`（API模块）


## 新增变更流程

### 公共表变更（所有模块都需要）
1. 在 `shop-mapper/src/main/resources/db/changelog/` 下新增 SQL 文件
2. 文件名按序号递增，如 `v1.0.0-003-ddl.sql`
3. changeset 不加 context 标记

### API 专属变更
1. 在 `shop-api/src/main/resources/db/changelog/` 下新增 SQL 文件
2. 文件名加 `api-` 前缀并按序号递增，如 `api-v1.0.0-0003-ddl.sql`
3. changeset 标记 `context:api`

### Admin 专属变更
1. 在 `shop-admin/src/main/resources/db/changelog/` 下新增 SQL 文件
2. 文件名加 `admin-` 前缀并按序号递增，如 `admin-v1.0.0-0003-ddl.sql`
3. changeset 标记 `context:admin`

## changeset 书写规范

```sql
-- liquibase formatted sql

-- 建库初始化（仅mapper模块）
-- changeset shop:1.0.0-alter-database-charset
ALTER DATABASE shop
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- 公共变更（无context，所有模块执行）
-- changeset shop:1.1.0-create-xxx-table
CREATE TABLE ... ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- API专属变更
-- changeset shop:1.1.0-create-yyy-table context:api
CREATE TABLE ... ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Admin专属变更
-- changeset shop:1.1.0-create-zzz-table context:admin
CREATE TABLE ... ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DML变更（多条INSERT必须加stripComments:false）
-- changeset shop:1.1.0-insert-xxx-data stripComments:false
INSERT INTO ...;
INSERT INTO ...;

-- 预留占位（添加runOnChange:true，无需SELECT 1）
-- changeset shop:1.1.0-placeholder context:api runOnChange:true
-- 暂无数据，后续按需添加
```

**注意**：
- 每个 changeset 的 id 必须全局唯一
- changeset 一旦执行过，不可修改内容，只能新增 changeset
- `-- liquibase formatted sql` 必须为文件第一行
- 建表语句必须指定 `COLLATE=utf8mb4_0900_ai_ci`（MySQL 8.0 最新排序规则）
- DML 文件中多条 INSERT 语句必须加 `stripComments:false`
- 预留占位 changeset 加 `runOnChange:true`，无需 `SELECT 1`

## 现有表清单

| 表名 | 模块 | 说明 |
|------|------|------|
| t_user | common | 用户表 |
| t_category | common | 商品分类表 |
| t_product | common | 商品表 |
| t_cart | common | 购物车表 |
| t_order | common | 订单表 |
| t_order_item | common | 订单详情表 |
| t_admin_user | admin | 后台管理用户表 |
| t_admin_role | admin | 后台角色表 |
| t_admin_permission | admin | 后台权限表 |
| t_admin_user_role | admin | 后台用户角色关联表 |
| t_admin_role_permission | admin | 后台角色权限关联表 |

## ⚠ 重要约定

**禁止在 `shop-api`、`shop-admin` 等业务模块中创建 `db.changelog-master.yaml` 文件！**

原因：这些模块依赖 `shop-mapper`，而 `shop-mapper` 已包含 `db.changelog-master.yaml`。如果在业务模块中也创建同名文件，会导致 classpath 中出现多个 `db.changelog-master.yaml`，Liquibase 启动时报错：

```
Found 2 files with the path 'classpath:db/db.changelog-master.yaml'
```

业务模块的 Liquibase 变更集通过 `shop-mapper` 的 `db.changelog-master.yaml` 中的 `includeAll` 机制自动加载，无需单独创建 master 文件。

**业务模块 SQL 文件必须加模块前缀**（如 `api-`、`admin-`），避免跨模块 classpath 合并时文件名冲突。
