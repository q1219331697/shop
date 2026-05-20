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

#### 2.1 类注释

使用标准 Javadoc 格式，包含描述段落（含 `<p>` 标签）、`@author` 和 `@since` 标签：

```java
/**
 * 后台管理用户实体类
 * <p>
 * 对应数据库表 t_admin_user，用于存储后台管理系统的用户信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
```

规则：
- 描述段落第一句简短概括，`<p>` 标签内补充详细说明
- `<p>` 标签独占一行，内容换行书写，`</p>` 闭合标签独占一行
- 必须包含 `@author` 和 `@since` 标签

#### 2.2 字段注释

使用多行 Javadoc 格式，每个字段注释独占三行：

```java
/**
 * 管理用户ID，主键自增
 */
@Schema(description = "管理用户ID")
@TableId(type = IdType.AUTO)
private Long id;
```

规则：
- 禁止使用单行注释 `/** XXX */`，必须使用多行格式
- 注释内容应包含字段含义及关键约束（如"主键自增"、"唯一"、"关联 t_user.id"等）
- Javadoc 与注解之间不加空行
- 字段之间保留一个空行

#### 2.3 方法注释

使用标准 Javadoc 格式，包含描述和必要的 `@param`、`@return`、`@throws` 标签：

```java
/**
 * 根据用户名查询用户
 *
 * @param username 用户名
 * @return 用户实体
 * @throws BusinessException 用户不存在时抛出
 */
```

### 3. 代码格式

#### 3.1 Import 排列

import 按以下顺序排列，仅 `java.*` 前加一个空行分隔：

```java
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
```

规则：
- 第三方库（com.baomidou、io.swagger、lombok 等）紧排，不加分组空行
- `java.*` 标准库之前加一个空行
- 禁止使用通配符 import（`import xxx.*`）

#### 3.2 缩进与空行

- 缩进：4 空格，禁止使用 Tab
- 花括号风格：K&R（左花括号不换行，跟在行末）
- 字段之间：保留一个空行
- 方法之间：保留一个空行
- 类成员顺序：静态变量 → 实例变量 → 构造方法 → 公有方法 → 私有方法

#### 3.3 实体类模板

```java
package com.shop.xxx.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * XXX实体类
 * <p>
 * 对应数据库表 t_xxx，用于存储XXX信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "XXX实体")
@TableName("t_xxx")
public class XxxEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID，主键自增
     */
    @Schema(description = "主键ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    // ... 业务字段 ...

    /**
     * 删除标记：0-未删除，1-已删除（逻辑删除）
     */
    @Schema(description = "删除标记：0-未删除，1-已删除")
    @TableLogic
    private Integer deleted;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间，自动填充
     */
    @Schema(description = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

实体类规则：
- 必须实现 `Serializable` 接口
- 必须声明 `serialVersionUID`
- 使用 Lombok `@Data` 注解
- 使用 Swagger `@Schema` 注解为每个字段添加描述
- Javadoc 与 `@Schema` 描述内容可以重复（Javadoc 服务于 IDE 提示，@Schema 服务于 API 文档）
- 审计字段（deleted、createTime、updateTime）放在业务字段之后
- 逻辑删除字段统一使用 `Integer deleted`，配合 `@TableLogic`
- 时间字段统一使用 `LocalDateTime`，配合 `@TableField(fill = ...)` 自动填充

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
