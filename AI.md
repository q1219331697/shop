# SHOP 项目架构与开发规范指南（AI 专用）

> 本文件供 AI 编码助手参考。修改代码前必须无条件遵守以下硬性约定。

---

## 1. 环境与文件规范

- **终端环境**：当前为 **Windows PowerShell**。多命令用 `;` 连接；变量引用用 `$var`；换行符用 `` ` ``（反引号）。
- **文件编码**：`.bat` 必须首行加 `chcp 65001 >nul`（防中文乱码）；`.sh` 必须使用 UTF-8 编码且换行符为 LF。
- **语言语种**：所有代码注释、文档、日志输出、Commit Message 必须使用**中文**。

## 2. 构建与部署规范

- **Maven 构建**：
  - **禁止**跳过 checkstyle 检查
  - **禁止**使用 `mvn install`
  - 正确流程为先单模块 compile 依赖，再启动目标模块
  - 允许使用的命令：`mvn clean package`、`java -jar <jar-file>`
  - 应用启动流程：
    1. 使用 `mvn package -pl <module> -am -DskipTests` 打包指定模块及其依赖
    2. 使用 `java -jar <module>/target/<module>-<version>.jar` 运行应用
  - 示例：

    ```bash
    # 打包 shop-admin-api 模块及其依赖
    mvn clean package -pl shop-admin-api -am -DskipTests

    # 运行应用
    java -jar shop-admin-api/target/shop-admin-api-1.0.0.jar
    ```

- **Docker 部署**：
  - 基础设施必须配 `restart: unless-stopped`，Elasticsearch 必须限额 `mem_limit: 1g`。

## 3. 分层与代码规则

### Java 后端 (依赖: admin/app-api -> service -> dao -> common)

- **Controller 层**：管理端写在 `shop-admin-api`；C 端写在 `shop-app-api`。
- **Service 层**：核心业务逻辑**必须**在此收口，禁止在 Controller 堆砌业务。
- **DAO & MyBatis 层**：实体类与 Mapper 必须在 `shop-dao`。**禁止使用 Java 注解写 SQL**，所有 SQL 必须写在 XML 中。**禁止使用 `LIMIT offset, size` 进行深度分页**。
- **代码格式**：单文件 <2000 行，方法 <150 行，入参 <7 个，行宽 <120 字符。禁止星号导入（`import *`），注解需单独成行。
- **命名与返回**：字段用 `snake_case`，Java 用 `camelCase`，API 路径用 `kebab-case`。接口统一返回 `Result<T>`，严禁直抛 SQL 异常。

### 前端规范

- **admin-ui**：Vue 3 (Composition API) + TS + Element Plus + Tailwind CSS。
- **shop-app**：Vue 3 (Composition API) + TS + Uni-app + Vite。**严禁按平台细分文件夹**，一律使用 Uni-app 条件编译处理差异。
