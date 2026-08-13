# 认证流程设计说明

## 一、系统架构

```
┌──────────┐    ┌──────────┐    ┌─────────────────┐
│  前端     │───►│   Nginx  │───►│  Spring Boot    │
│ (Vue 3)  │    │  (代理)  │    │   (后端)        │
└──────────┘    └──────────┘    └─────────────────┘
       │              │                    │
       │              │                    ├─ AdminAuthFilter (认证)
       │              │                    ├─ RbacInterceptor (RBAC)
       │              │                    └─ Controller
       │              │
       │              └─ Redis缓存
       │                    ├─ admin:token:<uuid> → "userId:username"
       │                    ├─ menu:tree:{userId} → 菜单数据
       │                    └─ user:permissions:{userId} → 权限编码列表
       │
       └─ localStorage/cookie (Token存储)
```

## 二、核心认证流程

### 2.1 登录流程

```
用户输入用户名密码
        │
        ▼
┌──────────────────┐
│  前端请求         │
│ POST /api/public/login
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Nginx转发       │
│ 去掉 /api 前缀    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PublicController │
│  /public/login    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AdminUserService │
│  ① 查询用户        │
│  ② 校验密码(明文)  │
│  ③ 校验用户状态    │
│  ④ 记录登录日志IP  │
│  ⑤ 生成Token → Redis│
│  ⑥ 写入Cookie      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  前端保存Token    │
│  - localStorage   │
│  - Cookie         │
│  - 启动Token刷新  │
└────────┬─────────┘
         │
         ▼
      进入系统
```

### 2.2 请求认证流程

```
前端发起请求
        │
        ▼
┌──────────────────┐
│  Axios请求拦截器   │
│ 添加 Authorization │
│ Bearer <token>    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Nginx转发       │
│ 去掉 /api 前缀    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AdminAuthFilter  │
└────────┬─────────┘
         │
         ├─ 白名单路径? ──► 放行
         │
         ├─ 有 Bearer Token?
         │     ├─ Token存在? ──► 校验用户状态 ──► 延长Token TTL
         │     ├─ Token不存在/过期 ──► 业务码"000401"，HTTP 200
         │     └─ 用户被禁用 ──► 业务码"010003"，HTTP 200
         │
         ├─ 有 Basic 认证? ──► 验证成功返回Token
         │
         └─ 无认证信息 ──► 业务码"000401"，HTTP 200
         │
         ▼
┌──────────────────┐
│  RbacInterceptor  │
│ 校验权限          │
└────────┬─────────┘
         │
         ├─ 无注解 ──► 放行
         │
         ├─ 有注解 ──► 校验权限编码
         │               ├─ 有权限 ──► 放行
         │               └─ 无权限 ──► 业务码"000403"，HTTP 200
         │
         ▼
      Controller处理
```

### 2.3 Token刷新流程

```
每25分钟自动触发
        │
        ▼
┌──────────────────┐
│ 检查Token是否存在 │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
   否        是
    │         │
    ▼         ▼
 退出      ┌──────────┐
           │检查Token  │
           │是否过期   │
           └────┬─────┘
                │
           ┌────┴────┐
           │         │
         过期        未过期
           │         │
           ▼         ▼
      等待过期     ┌─────────────┐
      重新登录     │调用刷新接口  │
                 POST /token/refresh
                 └──────┬──────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ 后端验证Token │
                 │ 延长30分钟TTL │
                 └──────┬──────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ 刷新成功     │
                 │ 保持Token不变│
                 │ 继续使用     │
                 └──────────────┘
```

## 三、核心设计要点

### 3.1 HTTP状态码统一为200

**设计理念**：前后端分离架构下，401状态码会导致浏览器中断请求，前端无法捕获错误信息。

**业务码体系**：
| 业务码 | 含义 | 处理方式 |
|--------|------|----------|
| 000000 | 成功 | 正常返回数据 |
| 000401 | 未登录/Token过期 | 跳转登录页，清除登录状态 |
| 010003 | 用户被禁用 | 跳转登录页，清除登录状态 |
| 000403 | 无权限 | 只提示"无权限"，不登出 |

### 3.2 Token刷新机制（滑动窗口）

**刷新策略**：
- **触发频率**：前端每25分钟检查一次
- **续期时长**：刷新成功延长30分钟
- **失效判断**：前端检查本地过期时间
- **静默失败**：刷新失败不提示，等待过期后重新登录

**优点**：
- 减少用户中断次数
- 自动延长有效期
- 不影响正常使用

### 3.3 Redis缓存策略

**缓存类型**：
1. **Token缓存**：`admin:token:<uuid>`，TTL=30分钟
2. **菜单缓存**：`menu:tree:{userId}`，TTL=1小时
3. **权限缓存**：`user:permissions:{userId}`，TTL=1小时

**缓存更新**：
- 菜单和权限变更时清除对应缓存
- 登出时清除Token和权限缓存
- 利用TTL自动过期

### 3.4 IP获取机制

**优先级**：
1. X-Real-IP（代理获取的真实IP）
2. X-Forwarded-For（第一个IP）
3. request.getRemoteAddr()

**用途**：
- 登录日志记录
- 安全审计
- 异常访问检测

### 3.5 Basic认证增强

**使用场景**：Swagger UI

**增强点**：
- 验证成功后生成Token
- 返回Token到响应头
- 设置HttpOnly Cookie
- 前端可直接获取使用

## 四、错误处理策略

### 4.1 未登录/Token过期（code: 000401）

**后端处理**：
```java
response.setStatus(HttpServletResponse.SC_OK); // HTTP 200
response.setContentType("application/json;charset=UTF-8");
response.getWriter().write("{\"code\":\"000401\",\"message\":\"未登录或登录已过期\"}");
```

**前端处理**：
```typescript
// 清除登录状态，跳转登录页
userStore.logout();
router.push('/login');
```

### 4.2 用户被禁用（code: 010003）

**后端处理**：
```java
response.setStatus(HttpServletResponse.SC_OK); // HTTP 200
response.getWriter().write("{\"code\":\"010003\",\"message\":\"用户已被禁用\"}");
```

**前端处理**：
```typescript
// 清除登录状态，跳转登录页
userStore.logout();
router.push('/login');
```

### 4.3 无权限访问（code: 000403）

**后端处理**：
```java
response.setStatus(HttpServletResponse.SC_OK); // HTTP 200
response.getWriter().write("{\"code\":\"000403\",\"message\":\"无权限访问\"}");
```

**前端处理**：
```typescript
// 只提示"无权限"，不跳转登录页，不清除登录状态
ElMessage.warning('无权限访问');
```

## 五、性能优化

### 5.1 菜单接口优化

**优化前**：每次请求都查询数据库

**优化后**：Redis缓存，TTL=1小时

**缓存代码**：
```java
public List<MenuEntity> getMenuTreeByUserId(Long userId) {
    String cacheKey = "menu:tree:" + userId;
    String cachedJson = redisTemplate.opsForValue().get(cacheKey);
    if (cachedJson != null) {
        return JSON.parseArray(cachedJson, MenuEntity.class);
    }
    List<MenuEntity> menuList = permissionMapper.selectMenusByUserId(userId);
    redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(menuList), 1, TimeUnit.HOURS);
    return menuList;
}
```

**预期效果**：
- 缓存命中：响应时间 < 100ms
- 缓存未命中：查询数据库

### 5.2 权限接口优化

**优化前**：每次请求都查询数据库

**优化后**：Redis缓存，TTL=1小时

**预期效果**：
- 缓存命中：响应时间 < 50ms
- 缓存未命中：查询数据库

## 六、安全设计

### 6.1 Token安全

**措施**：
- Token存储在Redis中，支持快速删除
- 包含用户信息，验证时检查用户状态
- 过期时间设置为30分钟
- 支持滑动窗口续期

**防重放攻击**：
- Token包含用户信息
- 每次验证都检查用户状态
- 快速失效机制

### 6.2 密码安全（开发环境）

**说明**：开发阶段使用明文密码，仅供测试使用。

**生产环境建议**：
- 使用BCrypt等算法加密
- 定期更换密码
- 限制登录尝试次数
- 启用二次验证

### 6.3 访问控制

**白名单配置**：使用精确匹配避免误放行

**RBAC权限模型**：
- 用户 → 角色 → 权限
- 基于注解的权限控制
- 动态路由加载

### 6.4 IP审计

**日志记录**：
- 登录IP
- 登录时间
- 成功/失败状态
- 失败原因

**查询方式**：
```sql
-- 查询某个IP的所有登录记录
SELECT * FROM t_admin_login_log WHERE ip = '192.168.1.100';

-- 查询失败记录
SELECT * FROM t_admin_login_log WHERE success = 0;
```

## 七、常见问题

### Q1: 为什么认证失败返回200而不是401？

**A**：前后端分离架构下，401状态码会导致浏览器中断请求，前端无法捕获错误信息。统一返回200可以让前端统一处理错误码，提供更友好的用户体验。

### Q2: Token自动续期会不会有并发问题？

**A**：不会。Token存储在Redis中，支持原子性操作。多个请求同时刷新同一个Token时，后端会检查TTL，确保Token在有效期内。

### Q3: 如何防止Token被重放？

**A**：
1. Token包含用户信息，验证时会检查用户状态
2. Token过期时间设置为30分钟
3. 滑动窗口续期机制确保Token持续有效
4. Redis存储Token，支持快速删除

### Q4: 如何处理用户被禁用的情况？

**A**：
1. 每次验证Token时检查用户状态
2. 如果用户被禁用，删除Redis中的Token
3. 返回200状态码和业务码"010003"（用户已被禁用）
4. 前端根据业务码提示用户联系管理员

### Q5: 白名单匹配为什么不使用精确匹配？

**A**：使用前缀匹配可以覆盖所有子路径，例如配置 `/api/public` 可以匹配 `/api/public/login`、`/api/public/logout` 等所有子路径。

### Q6: IPv6能存储在ip字段中吗？

**A**：可以。ip字段定义为 VARCHAR(50)，完全支持IPv6地址（最大45字符）。

## 八、总结

### 8.1 核心优势

✅ **用户体验优化**
- 统一HTTP状态码，避免401中断请求
- Token自动续期，无需频繁重新登录
- 滑动窗口续期机制，延长有效期

✅ **性能优化**
- Redis缓存菜单和权限数据
- TTL自动过期，无需手动清除
- 响应时间显著提升

✅ **安全性提升**
- Token存储在Redis，支持快速删除
- IP审计，便于安全监控
- RBAC权限模型，细粒度控制

✅ **开发体验优化**
- 明文密码支持开发环境
- Swagger UI支持Basic认证
- 清晰的错误码体系

### 8.2 技术特点

- **前后端分离**：RESTful API设计
- **无状态Token**：JWT机制
- **Redis缓存**：提升性能
- **滑动窗口续期**：延长有效期
- **业务码体系**：友好错误处理

### 8.3 生产环境建议

1. 启用HTTPS，保护传输安全
2. 使用密码加密算法（BCrypt）
3. 启用登录日志监控
4. 设置IP访问限制
5. 定期清理过期Token
6. 监控Redis缓存命中率