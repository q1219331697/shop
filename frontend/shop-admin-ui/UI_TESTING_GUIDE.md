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
npm run test:e2e

# 运行特定测试文件
npx playwright test tests/e2e/specs/auth.spec.ts

# 运行特定测试用例
npx playwright test tests/e2e/specs/auth.spec.ts -g "登录成功"
```

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
npx playwright test tests/e2e/specs/login.spec.ts

# 运行特定测试用例
npx playwright test tests/e2e/specs/login.spec.ts -g "should login successfully"
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

