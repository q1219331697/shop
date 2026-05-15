# 开发文档

## 开发环境搭建

### 1. 克隆项目

```bash
git clone https://github.com/your-org/shop.git
cd shop
```

### 2. 安装依赖

```bash
mvn clean install
```

### 3. 配置数据库

- 创建数据库：shop
- 执行 Liquibase 变更集（应用启动时自动执行）

### 4. 配置 Redis

- 启动 Redis 服务
- 修改 application.yml 中的 Redis 配置

### 5. 配置 Kafka

- 启动 Kafka 服务
- 修改 application.yml 中的 Kafka 配置

## 项目结构

```
shop/
├── doc/                    # 文档目录
│   ├── API.md             # API 接口文档
│   ├── DATABASE.md        # 数据库设计文档
│   ├── DEPLOY.md          # 部署文档
│   └── DEVELOP.md        # 开发文档
├── src/
│   └── main/
│       ├── java/
│       │   └── com/shop/
│       │       ├── common/        # 公共模块
│       │       ├── config/        # 配置类
│       │       ├── entity/        # 实体类
│       │       ├── enums/         # 枚举类
│       │       ├── mapper/        # Mapper 接口
│       │       ├── service/       # 服务层
│       │       ├── controller/    # 控制器
│       │       └── util/         # 工具类
│       └── resources/
│           ├── db/changelog/      # Liquibase 变更集
│           ├── mapper/            # MyBatis Mapper XML
│           └── application.yml    # 配置文件
└── pom.xml
```

## 开发规范

### 1. 命名规范

- **包名**：全小写，使用点分隔
- **类名**：大驼峰命名
- **方法名**：小驼峰命名
- **常量名**：全大写，下划线分隔
- **变量名**：小驼峰命名

### 2. 注释规范

所有类、方法和公共字段必须添加中文注释。

### 3. 代码格式

使用统一的代码格式化配置，建议使用 IDEA 的格式化功能。

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature
```

### 2. 开发功能

- 按照项目结构创建相应的类
- 编写单元测试
- 添加中文注释

### 3. 提交代码

```bash
git add .
git commit -m "feat: 添加购物车功能"
```

### 4. 推送分支

```bash
git push origin feature/your-feature
```

### 5. 创建 Pull Request

在 GitHub 上创建 PR，等待 Code Review。

## API 文档

启动应用后，访问 Knife4j 文档：

```
http://localhost:8080/doc.html
```

## 数据库变更

使用 Liquibase 管理数据库变更：

1. 在 `src/main/resources/db/changelog/` 目录下创建新的变更集文件
2. 文件命名格式：`yyyyMMdd-description.yaml`
3. 在 `db.changelog-master.yaml` 中引用新的变更集

## 测试

### 1. 单元测试

```bash
mvn test
```

### 2. 集成测试

```bash
mvn verify
```

### 3. 代码覆盖率

使用 Jacoco 生成代码覆盖率报告：

```bash
mvn jacoco:report
```

报告位置：`target/site/jacoco/index.html`

## 代码质量

使用 SonarQube 进行代码质量检查：

```bash
mvn sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-token
```

## 常见问题

### 1. Liquibase 变更失败

检查数据库连接配置，确保有足够的权限执行 DDL 语句。

### 2. Mapper 找不到

检查 Mapper 接口是否添加了 @Mapper 注解，或者使用 @MapperScan 扫描包。

### 3. 事务不生效

检查事务方法是否为 public，是否在同一个类中调用。

## 性能优化建议

1. 合理使用缓存
2. 避免N+1查询
3. 使用批量操作
4. 合理设置数据库连接池大小
5. 使用异步处理耗时操作
