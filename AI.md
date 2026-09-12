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
    cd backend
    mvn clean package -pl shop-admin-api -am -DskipTests

    # 运行应用
    java -jar shop-admin-api/target/shop-admin-api-1.0.0.jar
    ```

- **Docker 部署 / 验证**：
  - 基础设施必须配 `restart: unless-stopped`，Elasticsearch 必须限额 `mem_limit: 1g`。
  - **后端改动验证一律走 Docker（不要只靠本地 `mvn`）**：在仓库根目录执行
    `docker compose up -d --build shop-admin-api`（依赖的 `mysql`/`redis` 等会一并拉起），
    构建物见 `docker-compose.yml` 的 `shop-admin-api` 服务（镜像 `shop-admin-api:1.0.0`，构建上下文 `./backend`）。

## 3. 分层与代码规则

### Java 后端 (依赖: admin/app-api -> service -> dao -> common)

- **Controller 层**：管理端写在 `shop-admin-api`；C 端写在 `shop-app-api`。
- **Service 层**：核心业务逻辑**必须**在此收口，禁止在 Controller 堆砌业务。
- **DAO & MyBatis 层**：实体类与 Mapper 必须在 `shop-dao`。**禁止使用 Java 注解写 SQL**，所有 SQL 必须写在 XML 中。**禁止使用 `LIMIT offset, size` 进行深度分页**。
- **代码格式**：单文件 <2000 行，方法 <150 行，入参 <7 个，行宽 <120 字符。禁止星号导入（`import *`），注解需单独成行。
- **命名与返回**：字段用 `snake_case`，Java 用 `camelCase`，API 路径用 `kebab-case`。接口统一返回 `Result<T>`，严禁直抛 SQL 异常。

### Java 后端 Checkstyle 硬性约定

- **类级标签（全局）**：每个后端 `.java` 类的 Javadoc 必须包含 `@author shop` 与 `@since 1.0.0`，且 `@author` 前必须与上方注释空一行。由 `code-quality/checkstyle/checkstyle.xml` 的 3 条 Regexp 规则强制。
- **实体字段 Javadoc（仅 entity 包）**：`**/entity/**/*.java` 下所有实体类的**每个字段（含 private）必须有 `/** ... */` 多行 Javadoc**（与 `@Schema` 注解并存）。由 `code-quality/checkstyle/checkstyle-entity.xml` + `backend/pom.xml` 的 `entity-field-javadoc` execution 强制；`serialVersionUID` 自动豁免。单行 `/** xxx */` 被 `SingleLineJavadoc` 禁止。
- 校验命令见 `backend/pom.xml` 头部注释：`mvn -o checkstyle:check`；**禁止** `-Dcheckstyle.skip`。

### 前端规范

- **admin-ui**：Vue 3 (Composition API) + TS + Element Plus + Tailwind CSS。
- **shop-app**：Vue 3 (Composition API) + TS + Uni-app + Vite。**严禁按平台细分文件夹**，一律使用 Uni-app 条件编译处理差异。

---

## 4. 后端响应 & 错误处理硬性约定（AI 必读，否则必踩坑）

- **HTTP 状态码恒为 200**：所有接口无论成功失败，HTTP 状态码一律 200；成功/失败只由响应体 `code` 字段区分，**绝不使用 4xx/5xx 表示业务/参数错误**。
- **错误码用 `ResultCodeEnum`**：失败返回 `Result.error(ResultCodeEnum.XXX, "文案")`（或 `Result.error("000002", "文案")`）。
  - 常用码：`SUCCESS="000000"`、`PARAM_ERROR="000002"`、`UNAUTHORIZED="000401"`、`FORBIDDEN="000403"`，定义见 `backend/shop-common/.../ResultCodeEnum.java`。
  - **新增/修改错误码必须同步前端 `frontend/shop-admin-ui/src/api/resultCode.ts`**（两处码值必须一致）。
- **参数校验失败处理**：Controller 用 `@Valid` + 实体注解（`@NotBlank`/`@Size`/`@Pattern`）做服务端校验，由 `GlobalExceptionHandler` 统一捕获 `MethodArgumentNotValidException`，
  返回 `Result.error(ResultCodeEnum.PARAM_ERROR, 字段错误文案)`（HTTP 200）。**不得**返回 400/422。
- **前端 E2E 断言“后端拒绝”时**：断言 `resp.status() === 200` 且 `body.code === PARAM_ERROR`（即 `'000002'`），再可选断言 `body.message` 含关键字；**不要断言 4xx**。
