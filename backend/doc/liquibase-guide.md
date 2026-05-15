# Liquibase 数据库变更管理备忘

## 模块结构

```
shop-mapper（公共模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── v1.0.0-000-init.sql          # 数据库字符集与排序规则
│   │   ├── v1.0.0-001-ddl.sql          # 公共表结构（用户、分类、商品）
│   │   └── v1.0.0-002-dml.sql          # 公共初始化数据
│   └── db.changelog-master.yaml        # includeAll changelog/

shop-api（API模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── v1.0.0-001-ddl.sql          # API专属表结构（购物车、订单、订单详情）
│   │   └── v1.0.0-002-dml.sql          # API专属数据（预留）
│   └── db.changelog-master.yaml        # include公共 + includeAll本地changelog/

shop-admin（Admin模块）
├── src/main/resources/db/
│   ├── changelog/
│   │   ├── admin-v1.0.0-0001-ddl.sql   # Admin专属表结构（后台管理用户）
│   │   └── admin-v1.0.0-0002-dml.sql   # Admin专属数据（管理员账号）
│   └── db.changelog-master.yaml        # include公共 + includeAll本地changelog/
```

### 跨模块引用原理

各模块的 `db.changelog-master.yaml` 通过 classpath 引用其他模块的 SQL 文件：

```yaml
# shop-api / shop-admin 的 master yaml
databaseChangeLog:
  # 引入公共变更集（shop-mapper模块，通过classpath跨模块引用）
  - include:
      file: db/db.changelog-master.yaml

  # 本模块专属变更集
  - includeAll:
      path: changelog/
      relativeToChangelogFile: true
```

`include file: db/db.changelog-master.yaml` 会自动在 classpath 中查找，
由于 shop-mapper 作为依赖被打包进 JAR，其 `db/` 目录下的文件对其他模块可见，
从而实现跨模块引用公共变更集。

## 执行逻辑

| 模块 | contexts | 执行范围 |
|------|----------|----------|
| shop-api | `api` | 公共变更集 + api 专属变更集 |
| shop-admin | `admin` | 公共变更集 + admin 专属变更集 |

## 命名规则

**文件名**：`{模块前缀-}版本号-序号-类型.sql`

> 公共模块文件无需模块前缀；各业务模块文件需加模块前缀，避免跨模块 classpath 合并时文件名冲突。

类型说明：
- `init` — 数据库字符集与排序规则
- `ddl` — 表结构变更（CREATE/ALTER/DROP）
- `dml` — 数据变更（INSERT/UPDATE/DELETE）

示例：
- `v1.0.0-000-init.sql`（公共）
- `v1.0.0-001-ddl.sql`（公共）
- `admin-v1.0.0-0001-ddl.sql`（Admin模块）
- `admin-v1.0.0-0002-dml.sql`（Admin模块）
- `api-v1.0.0-0001-ddl.sql`（API模块）

## 新增变更流程

### 公共表变更（所有模块都需要）
1. 在 `shop-mapper/src/main/resources/db/changelog/` 下新增 SQL 文件
2. 文件名按序号递增，如 `v1.0.0-003-ddl.sql`
3. changeset 不加 context 标记

### API 专属变更
1. 在 `shop-api/src/main/resources/db/changelog/` 下新增 SQL 文件
2. 文件名按序号递增，如 `v1.0.0-003-ddl.sql`
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
| t_cart | api | 购物车表 |
| t_order | api | 订单表 |
| t_order_item | api | 订单详情表 |
| t_admin_user | admin | 后台管理用户表 |
