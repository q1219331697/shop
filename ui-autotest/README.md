# AI UI自动化测试管理平台

> 一个支持**案例管理**、**流程化编排**、**AI辅助生成**的UI自动化测试管理平台，采用前后端分离架构，轻量易部署。

## ✨ 功能特性

### 📋 案例管理
- 案例的创建、编辑、删除、查询（完整CRUD）
- 支持按模块、优先级、状态筛选
- 步骤编排器：支持导航、点击、输入、断言、等待、滚动等操作类型
- 批量删除、标签管理
- 状态流转：草稿 → 启用 → 禁用

### 🔄 流程化编排
- 将多个测试案例按顺序编排成测试流程
- 步骤类型：执行案例、操作步骤、断言验证
- 支持关联已有案例、设置等待时间、条件表达式
- 步骤上下排序调整
- 一键执行整个流程

### ▶️ 执行管理
- 支持单案例执行和流程执行
- 异步执行，不阻塞界面
- 步骤级结果追踪：每个步骤的通过/失败状态、耗时、错误信息
- 执行详情弹窗查看

### 🤖 AI辅助生成
- 用自然语言描述测试需求，AI自动生成测试案例或流程
- 内置示例提示，快速上手
- 生成结果可一键保存为案例/流程

### 📊 仪表盘
- 统计概览：案例数、流程数、执行次数、通过率
- 模块分布、优先级分布可视化
- 快捷操作入口

---

## 🏗️ 技术架构

| 层级 | 技术栈 |
|------|--------|
| 前端 | Vue 3 + Element Plus + Vue Router + Axios |
| 后端 | Flask + Flask-CORS |
| 数据库 | SQLite（零配置，自动创建） |
| 构建 | Vite 5 |

---

## 📁 项目结构

```
ui-autotest/
├── backend/                    # 后端服务
│   ├── app.py                  # Flask主应用（API接口）
│   ├── models.py               # 数据库模型与初始化
│   ├── requirements.txt        # Python依赖
│   └── data/                   # SQLite数据库（自动生成）
├── frontend/                   # 前端项目
│   ├── dist/                   # 构建产物
│   ├── src/
│   │   ├── App.vue             # 主布局（侧边栏+顶栏）
│   │   ├── main.js             # 入口文件
│   │   ├── api/index.js        # API请求层
│   │   ├── router/index.js     # 路由配置
│   │   └── views/
│   │       ├── Dashboard.vue       # 仪表盘
│   │       ├── CaseList.vue        # 案例列表
│   │       ├── CaseEdit.vue        # 案例编辑（步骤编排）
│   │       ├── FlowList.vue        # 流程列表
│   │       ├── FlowEdit.vue        # 流程编辑（步骤排序）
│   │       ├── ExecutionList.vue   # 执行记录
│   │       └── AIGenerate.vue      # AI生成
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+

### 1. 安装后端依赖

```bash
cd ui-autotest/backend
pip install -r requirements.txt
```

### 2. 安装前端依赖 & 构建

```bash
cd ui-autotest/frontend
npm install
npm run build
```

### 3. 启动服务

```bash
cd ui-autotest/backend
python app.py
```

启动后访问 **http://localhost:5321**

### 开发模式（前后端分离热更新）

终端1 - 启动后端：
```bash
cd ui-autotest/backend
python app.py
```

终端2 - 启动前端开发服务器：
```bash
cd ui-autotest/frontend
npm run dev
```

前端开发服务器访问 **http://localhost:5320**，API请求自动代理到后端5321端口。

---

## 📡 API接口

### 案例管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cases` | 获取案例列表（支持分页、筛选） |
| POST | `/api/cases` | 创建案例 |
| GET | `/api/cases/:id` | 获取案例详情 |
| PUT | `/api/cases/:id` | 更新案例 |
| DELETE | `/api/cases/:id` | 删除案例 |
| POST | `/api/cases/batch-delete` | 批量删除 |

### 流程管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/flows` | 获取流程列表 |
| POST | `/api/flows` | 创建流程 |
| GET | `/api/flows/:id` | 获取流程详情（含步骤） |
| PUT | `/api/flows/:id` | 更新流程 |
| DELETE | `/api/flows/:id` | 删除流程 |

### 执行管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/executions` | 获取执行记录列表 |
| POST | `/api/executions` | 创建执行任务 |
| GET | `/api/executions/:id` | 获取执行详情 |

### AI生成

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/generate` | AI生成案例/流程 |

### 统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取仪表盘统计数据 |

---

## 🗄️ 数据库表结构

| 表名 | 说明 |
|------|------|
| `test_cases` | 测试案例 |
| `test_flows` | 测试流程 |
| `flow_steps` | 流程步骤（关联流程和案例） |
| `executions` | 执行记录 |
| `execution_steps` | 执行步骤结果 |
| `ai_generations` | AI生成记录 |

---

## 🎯 核心设计

### 案例步骤数据结构

```json
{
  "action": "fill",
  "target": "#username",
  "value": "admin"
}
```

支持的操作类型：`navigate`、`click`、`fill`、`assert`、`wait`、`scroll`

### 流程步骤数据结构

```json
{
  "step_name": "用户登录",
  "step_type": "case",
  "case_id": "xxx-xxx",
  "wait_seconds": 1,
  "condition_expr": ""
}
```

步骤类型：`case`（执行案例）、`action`（操作步骤）、`assert`（断言验证）

---

## 📝 使用流程

1. **创建测试案例** — 在「测试案例」页面新建，编排操作步骤
2. **编排测试流程** — 在「测试流程」页面将多个案例串联成流程
3. **执行测试** — 点击执行按钮，查看执行结果
4. **AI辅助** — 不确定怎么写？用自然语言描述，AI帮你生成

---

## License

Apache License 2.0
