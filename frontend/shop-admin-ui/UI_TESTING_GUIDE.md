# UI 测试指南

⚠️ **重要警告**：严禁执行 `npx playwright show-report` 命令，该命令会中断 AI 执行流程！

## 📋 测试环境配置

### 测试环境要求

**服务状态**：
- 前端开发服务器：已运行在 http://localhost:5173（除非明确启动）
- 后端 API 服务：需要运行（中间件、shop-admin-api、shop-app-api）
- Docker 服务：开发环境需要运行（docker compose）

### 启动服务

#### 启动后端服务（本地开发）
```bash
# 启动中间件、后端服务
docker compose up -d --build

# 重新构建后端镜像（代码修改后需要执行）
docker compose up -d --build shop-admin-api shop-app-api
```

#### 运行 UI 测试
```bash
cd frontend/shop-admin-ui

# 运行所有测试（无头模式）
npm run test

# 运行特定测试文件（specs 目录下现仅有这一个表格驱动 spec）
npx playwright test tests/e2e/specs/excel-driven.spec.ts

# 运行特定测试用例（按用例ID 过滤）
npx playwright test -g "TC-NAV-03"
```

## 📑 表格驱动测试（CSV 管理用例）

用 CSV 表格管理 UI 用例：**新增/修改用例只改两张 CSV 表，不改任何 TypeScript 代码**。`excel-driven.spec.ts` 在运行前读取 CSV 并动态生成 `test()`。

### 文件结构

```
tests/e2e/
├─ data/
│  ├─ cases.csv              ← 用例元数据（人维护）
│  └─ steps.csv              ← 步骤明细（人维护）
├─ keyword/
│  ├─ csv.ts                 ← csv-parse 读取并组装用例
│  ├─ locator.ts             ← 定位方式 → Playwright locator
│  ├─ runner.ts              ← 操作 → Playwright 动作（dispatch）
│  └─ setupRegistry.ts       ← setupApi 造数注册表（TS 造数 + 变量回灌）
├─ common/
│  ├─ apiClient.ts           ← 后端接口封装（apiUrl / auth / unwrap）
│  ├─ dataFactory.ts         ← 数据工厂（创建用户 / 角色 / 权限实体）
│  └─ e2eFixtures.ts         ← 用例前缀、expect 等测试基元
├─ fixtures/
│  └─ credentials.ts         ← 测试账号（admin / admin123）
├─ specs/
│  └─ excel-driven.spec.ts   ← 读 CSV，按"是否启用=是"动态生成 test()
└─ reporter/
   └─ csv-reporter.ts        ← 运行结束写 cases-report-YYYYMMDDHHMMSS.csv
```

### 两张表结构

`data/cases.csv`（用例级，一行一个用例）：

| 用例ID | 模块 | 标题 | 是否启用 | 备注 |
|--------|------|------|----------|------|
| TC-LOG-01 | 登录 | 正确登录 | 是 | |

`data/steps.csv`（步骤级，一行一个操作步骤，靠 `用例ID` 归属）：

| 用例ID | 序号 | 操作 | 定位方式 | 定位值 | 输入值 | 预期 | 预期类型 | 说明 |
|--------|------|------|----------|--------|--------|------|----------|------|
| TC-LOG-01 | 1 | goto | - | /login | - | - | - | 打开登录页 |
| TC-LOG-01 | 2 | fill | placeholder | 请输入用户名 | admin | - | - | 输入用户名 |
| TC-LOG-01 | 3 | click | css | .login-btn | - | - | - | 点击登录 |

### `操作` 关键字

`goto` / `fill` / `type` / `click` / `hover` / `select` / `press` / `wait` /
`expectVisible` / `expectHidden` / `expectText`（包含匹配）/ `expectValue` / `expectURL`（正则匹配）/
`expectCount`（断言匹配元素数量）/ `expectEnabled`（断言按钮启用/禁用，见下）/ `expectChecked`（断言勾选态）/
`selectRow`（按名称勾选表格行复选框）/ `selectAll` / `deselectAll` / `clickRow`（按名称点击该行内指定文本的操作链接）/
`expectCell`（按名称定位行，断言第 N 列单元格文本，见下）/ `toggleTree` / `expectTreeChecked`（权限树节点勾选态，见下）。

- `输入值` 填 `-` 表示留空（如"用户名为空"场景）。
- `定位方式` 为 `-` 时（如 `goto`），`定位值` 直接作为目标（如 `/login`）。
- `expectEnabled`：是否禁用放在**「预期类型」列**（`disabled` / 其他），目标选择器放「定位值」列；`输入值` 为数字时取第 N 个匹配。
- `expectCell`：`定位方式`=`-`，`定位值`=行匹配文本（如角色名），`输入值`=列序号（0-based，复选框列=0、角色名=2、描述=3、状态=4），`预期`=期望文本，`预期类型`=`text`（包含）/`exact`（精确）。
- `expectTreeChecked` / `toggleTree`：节点名放**「定位值」列**，`预期`=`true`/`false`。

### `定位方式` 取值

`css` / `xpath` / `name` / `placeholder` / `text` / `role` / `id`。

> 实战提示：本项目登录输入框用 `placeholder`（如 `请输入用户名`），不是 `name`；登录按钮是 `.login-btn`。

### 造数步骤（`setupApi`）与变量回灌

纯 UI 步骤表达不了"先造测试数据"。用 `setupApi` 调用注册表里的造数函数（数据工厂留在 TS，CSV 只描述"造什么 + 后续 UI 步骤"）：

```
用例ID,序号,操作,定位方式,定位值,输入值,预期,预期类型,说明
TC-PERM-02,7,setupApi,permTree,-,-,-,造权限子树
TC-PERM-05,7,setupApi,permCreate,type=1;path=/e2e/parent;component=views/test/parent/index.vue;icon=Folder,-,-,-,造父级目录
```

- `setupApi` 的**注册名在「定位方式」列**，**参数（key=value;...）在「定位值」列**（用 `;` 分隔，避免 JSON 逗号破坏 CSV）。
- 造数函数会把动态实体名写入**变量表**，后续步骤用 `${变量名}` 回灌（解析器会自动替换）：`${dirName}`、`${createdName}`、`${nodePrefix}`、`${nodeCode}` 等。

### 编写 CSV 的踩坑点（基于权限模块迁移实测）

- **`has-text` / `:text-is` 必须带引号**：Playwright 的 `:has-text(文本)` 要求引号，中文/多字符不加引号会报 `expects a single string`。**用单引号**（`has-text('系统管理')`）——单引号不与 CSV 双引号冲突；双引号会破坏 CSV 解析。
- **变量也要带引号**：`:has-text(${dirName})` 替换后变量值无引号，同样报错 → 写成 `:has-text('${dirName}')`。
- **占位符陷阱**：`CrudFormDialog` 对未显式配置占位符的输入框自动生成 `请输入${label}`（如 `请输入权限名称`），但**显式占位符优先**（如权限编码真实占位符是 `如 system:user:list`，不是 `请输入权限编码`）。填表前请核对 `schema.ts` 的 `placeholder`。
- **对话框内输入框要作用域限定**：对话框打开后，页面搜索框与表单输入框可能同占位符（如 `请输入权限名称`），`fill` 会因严格模式匹配到 2 个元素报错。用 `.el-dialog input[placeholder='...']` 限定在对话框内。
- **表单校验格式**：权限编码校验 `^[a-z][a-z0-9:]*$`（**不允许下划线**），UI 造子节点编码须用无下划线的值（注册表已提供 `${nodeCode}`）。
- 第 14 列（含逗号的预期值，如 `1,024`）需整体加双引号。

### 迁移状态（截至当前）

- **全部 UI 用例已迁到 CSV**，`tests/e2e/specs/excel-driven.spec.ts` 现统一驱动 **146 个**用例（全绿）。
- 各模块用例数：登录 4、仪表盘 2、管理员管理 50、角色管理 40、权限管理 40、登录日志 6、通用导航 4。
- 通用导航（`TC-NAV-*`）守护任务页出口的一致性：详情页底部「返 回」、新增页「取 消」、顶栏「返 回」三条出口都回到所属列表页（**直接输 URL 打开时也回列表，而不是退回浏览器上一页**），以及「任务页标题 = 面包屑末级 = 路由标题」「列表页不显示顶栏返回按钮」。
  - 定位这类按钮请用结构/类型选择器（如 `.form-footer .el-button:not(.el-button--primary)`），**不要用 `:has-text('取消')`**：Playwright 只折叠空白、不做去空格匹配，匹配不到页面上带空格的「取 消」。
- 用户管理模块复用角色模块新增的全部关键字（`selectRow` / `clickRow` / `expectCell` / `expectEnabled` / `expectChecked` / `toggleTree` / `expectTreeChecked`），**未新增任何关键字**；通用导航用例同样零新增，全部复用 `userCreate` / `userGen` / `uiLogin` / `expectURL` / `expectHidden`。
- 注册表新增用户造数：`userGen`（仅生成用户名供 UI 新增回灌）、`userCreate`（单条，暴露 `userName`）、`userBatch`（批量，暴露 `user0..N` / `userPrefix`）；以及 `uiLogin`（整页刷新会丢登录态，用户管理每个用例独立 context，需各自 UI 登录后进入页面）。
- 早期手写的 `login.spec.ts` / `dashboard.spec.ts` / `permissions.spec.ts` / `roles.spec.ts` / `admin.spec.ts` / `permissions-api.spec.ts` 均已删除，`specs/` 目录下只剩 `excel-driven.spec.ts`。
- 测试标题为「用例ID + 标题」（`${c.用例ID} ${c.标题}`），避免不同模块标题重名导致的 Playwright 重复标题报错。
- `expectTreeChecked` 对权限树异步回显做了轮询重试（≤8s），避免大套件并行下对话框重开时树未渲染完就断言。

### 如何新增一个用例

例如新增"记住我登录"：

1. `cases.csv` 加一行：`TC-LOG-04,登录,记住我登录,是,`
2. `steps.csv` 加对应步骤行（`用例ID` 填 `TC-LOG-04`，`序号` 从 1 递增）
3. 运行（见下）—— **无需改任何 TS 文件**

### 运行命令

```bash
cd frontend/shop-admin-ui

# 只跑 CSV 表格驱动的用例（并生成结果报告）
npm run test:e2e:table
```

### 结果自动回写

每次运行后在 `test-results/` 生成独立报告 `cases-report-YYYYMMDDHHMMSS.csv`，**不污染源表**：

| 用例ID | 标题 | 模块 | 实际结果 | 失败原因 | 执行日期 |
|--------|------|------|----------|----------|----------|
| TC-LOG-01 | 正确登录 | - | 通过 | - | 2026-09-08 |

### 注意事项（基于 CSV 踩坑经验）

- ⚠️ **编辑编码**：用 **VS Code 或 LibreOffice（导出选 UTF-8）** 编辑；勿双击 Excel 打开——Windows Excel 另存为 CSV 默认 GBK 会乱码，且会静默丢失前导零、把长数字变科学计数法。
- ⚠️ **错误提示定位器不同**：后端返回的错误（如"密码错误"）在 `.el-message__content`；客户端表单校验（如"请输入用户名"）在 `.el-form-item__error`。
- 解析器已开 `bom: true` 兼容 UTF-8 BOM；列数不一致会直接报错，便于及时发现错位。

## 📊 测试配置

### 测试范围
- **测试目录**：`./tests/e2e/specs`
- **并行执行**：`fullyParallel: true`
- **重试机制**：CI 环境重试 2 次，本地环境不重试

### 测试工具
- **框架**：Playwright
- **浏览器**：Chromium（桌面版 Chrome）
- **超时设置**：
  - 操作超时：5000ms
  - 导航超时：30000ms
  - 等待超时：15000ms

## 🔧 测试最佳实践

1. **编写清晰的测试用例**：每个测试用例应该独立、可重复
2. **使用命名约定**：测试文件使用 `*.spec.ts` 后缀
3. **添加注释说明**：复杂测试逻辑需要添加详细注释
4. **保持测试独立性**：避免测试之间的相互依赖

## 🐛 调试技巧

### 1. 运行特定测试
```bash
# 运行特定文件
npx playwright test tests/e2e/specs/excel-driven.spec.ts

# 运行特定测试用例（标题与 tag 均含用例ID，用 ID 过滤最稳）
npx playwright test -g "TC-NAV-03"
```

### 3. 启用慢动作模式
```bash
npx playwright test --slow-mo=1000
```

### 4. 调试测试用例
```bash
# 在测试用例中添加调试代码
test('should login successfully', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // 调试时暂停执行
  await page.pause();
  
  // 验证是否成功
  await expect(page).toHaveURL('/dashboard');
});
```

