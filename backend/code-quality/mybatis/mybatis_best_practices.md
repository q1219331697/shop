# MyBatis XML 映射文件最佳实践

本文档定义了 MyBatis XML 映射文件的编写规范和最佳实践，旨在提高代码质量和可维护性。

## 1. 文件命名规范

### 1.1 基本规则
- XML 文件名必须与对应的 Mapper 接口名保持一致
- 使用驼峰命名法（PascalCase）
- 示例：`AdminUserMapper.xml` 对应接口 `AdminUserMapper`

### 1.2 文件位置
- XML 文件应放在 `src/main/resources/mapper` 目录下
- 包路径应与 Mapper 接口的包路径对应

## 2. SQL 语句编写规范

### 2.1 使用 `<where>` 标签
- **禁止**使用 `WHERE 1=1` 的写法
- **推荐**使用 `<where>` 标签，它会自动处理 AND/OR

**不推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM t_user
    WHERE 1=1
    <if test="username != null">
        AND username = #{username}
    </if>
</select>
```

**推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM t_user
    <where>
        <if test="username != null">
            AND username = #{username}
        </if>
    </where>
</select>
```

### 2.2 使用 `<set>` 标签
- 在 UPDATE 语句中使用 `<set>` 标签，它会自动处理逗号

**不推荐示例：**
```xml
<update id="updateUser">
    UPDATE t_user
    SET username = #{username},
        <if test="password != null">
            password = #{password},
        </if>
        <if test="email != null">
            email = #{email},
        </if>
    WHERE id = #{id}
</update>
```

**推荐示例：**
```xml
<update id="updateUser">
    UPDATE t_user
    <set>
        username = #{username},
        <if test="password != null">
            password = #{password},
        </if>
        <if test="email != null">
            email = #{email},
        </if>
    </set>
    WHERE id = #{id}
</update>
```

**说明：**
- `<set>` 标签会自动处理多余的逗号，避免 SQL 语法错误
- 当所有条件都不满足时，`<set>` 标签会自动省略 SET 子句

### 2.3 使用 `<trim>` 标签
- 在需要更灵活的 SQL 片段拼接时使用 `<trim>` 标签

## 3. 参数绑定规范

### 3.1 使用 `#{param}` 而不是 `${param}`
- **推荐**使用 `#{param}` 进行参数绑定，防止 SQL 注入
- **禁止**使用 `${param}` 除非必要（如动态表名、排序字段）

**不推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM t_user WHERE username = '${username}'
</select>
```

**推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM t_user WHERE username = #{username}
</select>
```

### 3.2 参数命名规范
- 参数名应使用驼峰命名法
- 参数名应与 Java 对象的属性名保持一致

## 4. 结果映射规范

### 4.1 使用 `<resultMap>` 定义结果映射
- 对于复杂的查询结果，应使用 `<resultMap>` 定义结果映射
- 避免使用 `resultType="java.util.Map"`，应使用具体的实体类

**推荐示例：**
```xml
<resultMap id="UserResultMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="password" column="password"/>
    <result property="createTime" column="create_time"/>
</resultMap>

<select id="selectUserById" resultMap="UserResultMap">
    SELECT * FROM t_user WHERE id = #{id}
</select>
```

### 4.2 列名映射规范
- 数据库列名使用下划线命名法（snake_case）
- Java 属性名使用驼峰命名法（camelCase）
- 在 `<resultMap>` 中明确指定列名与属性名的映射关系

## 5. 注释规范

### 5.1 添加方法注释
- 每个 SQL 语句都应添加注释，说明其功能
- 注释应包含参数说明和返回值说明

**推荐示例：**
```xml
<!-- 根据用户ID查询用户信息 -->
<!-- @param id 用户ID -->
<!-- @return 用户实体 -->
<select id="selectById" resultType="User">
    SELECT * FROM t_user WHERE id = #{id}
</select>
```

### 5.2 添加复杂 SQL 的注释
- 对于复杂的 SQL 语句，应添加详细的注释说明其逻辑

## 6. SQL 语句格式规范

### 6.1 关键字大写
- SQL 关键字应使用大写（SELECT、FROM、WHERE 等）

**推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT id, username, password
    FROM t_user
    WHERE status = 1
</select>
```

### 6.2 缩进和换行
- SQL 语句应进行适当的缩进和换行，提高可读性
- 每个子句（SELECT、FROM、WHERE 等）应单独一行

### 6.3 避免过长的 SQL 语句
- 单行 SQL 语句长度不应超过 120 字符
- 复杂的 SQL 语句应拆分为多行

## 7. 动态 SQL 规范

### 7.1 使用 MyBatis 提供的动态 SQL 标签
- 使用 `<if>`、`<choose>`、`<when>`、`<otherwise>` 等标签构建动态 SQL
- 避免使用复杂的字符串拼接

### 7.2 条件判断规范
- 条件判断应包含 null 和空字符串的检查
- 示例：`test="username != null and username != ''"`

## 8. 性能优化规范

### 8.1 避免使用 `SELECT *`
- **推荐**明确指定需要查询的列
- **禁止**使用 `SELECT *`，除非必要

**不推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM t_user
</select>
```

**推荐示例：**
```xml
<select id="selectUsers" resultType="User">
    SELECT id, username, email, create_time
    FROM t_user
</select>
```

### 8.2 合理使用索引
- 查询条件应使用索引列
- 避免在索引列上使用函数

### 8.3 分页查询规范
- 使用 MyBatis Plus 提供的分页插件
- 避免使用 `LIMIT offset, size` 的方式分页

## 9. 事务管理规范

### 9.1 明确事务边界
- 在 Service 层使用 `@Transactional` 注解管理事务
- 避免在 Mapper 层管理事务

### 9.2 事务传播行为
- 根据业务需求选择合适的事务传播行为
- 默认使用 `REQUIRED` 传播行为

## 10. 异常处理规范

### 10.1 自定义异常
- 定义业务异常类，统一处理异常
- 在 XML 中使用 `<selectKey>` 等标签时，应考虑异常情况

### 10.2 异常日志
- 记录详细的异常日志，便于排查问题

## 11. 版本控制规范

### 11.1 提交信息
- 提交信息应清晰描述修改内容
- 示例：`feat: 添加用户查询接口`

### 11.2 代码审查
- 所有 XML 映射文件的修改都应经过代码审查
- 审查重点：SQL 语句正确性、性能、安全性

## 12. 工具和插件推荐

### 12.1 IDE 插件
- **MyBatis Plugin for IntelliJ IDEA** - 提供 XML 文件的格式化和检查功能
- **MyBatis Log Plugin** - 在控制台显示完整的 SQL 语句

### 12.2 代码生成工具
- **MyBatis Generator** - 自动生成 Mapper 接口和 XML 映射文件
- **MyBatis Plus Generator** - 提供更强大的代码生成功能

## 13. 常见问题和解决方案

### 13.1 N+1 查询问题
- 使用 `<resultMap>` 的 `<collection>` 或 `<association>` 标签解决
- 或者使用批量查询的方式

### 13.2 SQL 注入问题
- 始终使用 `#{param}` 进行参数绑定
- 避免使用 `${param}` 除非必要

### 13.3 缓存问题
- 合理使用 MyBatis 的一级缓存和二级缓存
- 注意缓存的一致性问题

## 14. 参考资源

- [MyBatis 官方文档](https://mybatis.org/mybatis-3/)
- [MyBatis Plus 官方文档](https://baomidou.com/)
- [阿里巴巴 Java 开发手册](https://github.com/alibaba/p3c)

## 15. 更新记录

| 版本 | 日期 | 作者 | 说明 |
|------|------|------|------|
| 1.0.0 | 2026-05-22 | CodeGeeX | 初始版本 |
