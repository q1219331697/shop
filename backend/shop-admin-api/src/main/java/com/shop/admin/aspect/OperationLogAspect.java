package com.shop.admin.aspect;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shop.admin.entity.AdminOperationLogEntity;
import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.mapper.AdminPermissionMapper;
import com.shop.admin.security.AdminLoginLockService;
import com.shop.admin.service.AdminOperationLogService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;

/**
 * 后台操作日志切面
 * <p>
 * 环绕 admin controller 的全部方法，自动记录操作日志。是否记录由「权限（菜单）节点的 log_flag」决定：
 * 1. 优先取方法上 {@code @PreAuthorize("hasAuthority('xxx')")} 的权限编码，查该权限节点的 log_flag；
 * 2. 无权限编码时按请求 URI 与菜单 path 做最长前缀匹配，取菜单节点的 log_flag；
 * 3. 未命中任何权限/菜单节点的请求不予记录（保守策略）。
 * </p>
 * <p>
 * 防刷屏与防递归：
 * 操作日志自身接口 {@code /operationLog/**} 硬排除，避免「查日志产生日志」的递归增长；
 * E2E 测试接口 {@code /internal/test/**} 硬排除，其清理接口复用了业务权限码，记入日志会污染统计。
 * </p>
 * <p>
 * 写入失败只记录 error 日志，绝不向业务抛出。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Aspect
@Component
public class OperationLogAspect {

    /** 操作日志自身路径前缀：硬排除，避免「查日志产生日志」的递归增长 */
    private static final String SELF_PATH_PREFIX = "/operationLog";

    /** E2E 测试接口前缀：硬排除，测试清理接口复用了业务权限码，记入日志会污染统计 */
    private static final String INTERNAL_TEST_PREFIX = "/internal/test";

    /** 登录 / 登出接口：无权限节点，按内置操作类型记录 */
    private static final String LOGIN_URI = "/public/login";
    private static final String LOGOUT_URI = "/public/logout";

    /** 操作类型：1-登录，2-登出，3-新增，4-修改，5-删除，6-查询，7-其它 */
    private static final int TYPE_LOGIN = 1;
    private static final int TYPE_LOGOUT = 2;
    private static final int TYPE_CREATE = 3;
    private static final int TYPE_UPDATE = 4;
    private static final int TYPE_DELETE = 5;
    private static final int TYPE_QUERY = 6;
    private static final int TYPE_OTHER = 7;

    /** 错误消息最大保存长度 */
    private static final int MAX_MESSAGE_LENGTH = 500;

    /** 请求参数保存的最大长度，超出部分截断 */
    private static final int PARAM_MAX_LENGTH = 2000;

    /** 敏感字段脱敏掩码 */
    private static final String MASK = "******";

    /** 需要脱敏的字段名（比较时统一小写） */
    private static final List<String> SENSITIVE_FIELDS =
            Arrays.asList("password", "oldpassword", "newpassword", "confirmpassword", "token");

    /** 从 @PreAuthorize 表达式中提取权限编码 */
    private static final Pattern AUTHORITY_PATTERN =
            Pattern.compile("hasAuthority\\s*\\(\\s*['\"]([^'\"]+)['\"]\\s*\\)");

    /** 空节点元数据（ConcurrentHashMap 不允许 null 值，用哨兵表示「未命中」） */
    private static final NodeMeta NONE_META = new NodeMeta(false, null);

    private final AdminOperationLogService operationLogService;
    private final AdminPermissionMapper permissionMapper;
    private final AdminLoginLockService loginLockService;
    private final ObjectMapper objectMapper;

    /** 权限编码 → 节点元数据缓存（权限变更时清空） */
    private final Map<String, NodeMeta> codeMetaCache = new ConcurrentHashMap<>();

    /** 菜单节点元数据缓存（path 含动态段，权限变更时清空） */
    private volatile List<PathMeta> menuMetaCache;

    public OperationLogAspect(AdminOperationLogService operationLogService,
                              AdminPermissionMapper permissionMapper,
                              AdminLoginLockService loginLockService,
                              ObjectMapper objectMapper) {
        this.operationLogService = operationLogService;
        this.permissionMapper = permissionMapper;
        this.loginLockService = loginLockService;
        this.objectMapper = objectMapper;
    }

    /**
     * 环绕通知：执行目标方法并记录操作日志
     *
     * @param joinPoint 连接点
     * @return 目标方法返回值
     * @throws Throwable 目标方法抛出的异常（原样透传）
     */
    @Around("execution(* com.shop.admin.controller..*(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return joinPoint.proceed();
        }
        String uri = request.getRequestURI();
        Method method = resolveMethod(joinPoint);
        if (method == null || shouldSkip(uri, method)) {
            return joinPoint.proceed();
        }

        long start = System.currentTimeMillis();
        Object result = null;
        boolean success = true;
        String errorMessage = null;
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable t) {
            success = false;
            errorMessage = t.getMessage();
            throw t;
        } finally {
            // 业务失败同样记为失败：统一响应体的错误码非 000000 即视为失败（如登录失败返回的错误码）
            boolean ok = success;
            String message = errorMessage;
            if (result instanceof Result<?> resultBody
                    && !ResultCodeEnum.SUCCESS.getCode().equals(resultBody.getCode())) {
                ok = false;
                message = resultBody.getMessage();
            }
            writeLog(joinPoint, request, uri, method, start, result, ok, message);
        }
    }

    /**
     * 权限（菜单）变更后调用：清空权限码与菜单的元数据缓存
     */
    public void evictCache() {
        codeMetaCache.clear();
        menuMetaCache = null;
    }

    /**
     * 写入操作日志（内部吞掉所有异常）
     *
     * @param joinPoint 连接点
     * @param request HTTP请求
     * @param uri 请求URI
     * @param method 目标方法
     * @param start 开始时间戳
     * @param ok 是否成功（未抛异常且响应码为成功）
     * @param message 失败原因（异常消息或响应体错误消息）
     */
    private void writeLog(ProceedingJoinPoint joinPoint, HttpServletRequest request, String uri,
                          Method method, long start, Object result, boolean ok, String message) {
        try {
            AdminOperationLogEntity entity = new AdminOperationLogEntity();
            Object userIdAttr = request.getAttribute("adminUserId");
            entity.setUserId(userIdAttr instanceof Long ? (Long) userIdAttr : null);
            entity.setUsername(resolveUsername(joinPoint.getArgs(), request));
            entity.setOperationType(resolveOperationType(resolvePermissionCode(method), uri));
            entity.setModule(resolveModule(resolvePermissionCode(method), uri));
            entity.setOperation(resolveOperation(method));
            entity.setPermissionCode(resolvePermissionCode(method));
            entity.setRequestMethod(request.getMethod());
            entity.setRequestUri(uri);
            entity.setClassMethod(method.getDeclaringClass().getSimpleName() + "#" + method.getName());
            entity.setRequestParams(buildParams(joinPoint.getArgs()));
            entity.setResponseData(buildResponse(result));
            entity.setIp(getClientIp(request));
            entity.setDuration((int) (System.currentTimeMillis() - start));
            entity.setSuccess(ok ? 1 : 0);
            entity.setMessage(truncate(message, MAX_MESSAGE_LENGTH));
            entity.setOperationTime(LocalDateTime.now());

            // 登录失败降噪：60 秒内同一账号 + 同一 IP 只记录一条，避免暴力破解把日志表刷爆
            if (LOGIN_URI.equals(uri) && !ok
                    && loginLockService.shouldSkipFailLog(entity.getUsername(), entity.getIp())) {
                return;
            }
            operationLogService.record(entity);
        } catch (Exception e) {
            log.error("记录操作日志失败, uri: {}", uri, e);
        }
    }

    /**
     * 判断是否跳过日志记录
     *
     * @param uri 请求URI
     * @param method 目标方法
     * @return true-跳过 false-记录
     */
    private boolean shouldSkip(String uri, Method method) {
        // 操作日志自身：硬排除，避免递归增长
        if (uri.startsWith(SELF_PATH_PREFIX)) {
            return true;
        }
        // E2E 测试接口：硬排除，测试清理接口复用了业务权限码，记入日志会污染统计
        if (uri.startsWith(INTERNAL_TEST_PREFIX)) {
            return true;
        }
        String permissionCode = resolvePermissionCode(method);
        if (StringUtils.hasText(permissionCode)) {
            return !resolveCodeMeta(permissionCode).isLogFlag();
        }
        // 登录 / 登出无权限节点，按内置策略记录
        if (LOGIN_URI.equals(uri) || LOGOUT_URI.equals(uri)) {
            return false;
        }
        PathMeta menu = resolveMenuMeta(uri);
        return menu == null || !menu.isLogFlag();
    }

    /**
     * 获取当前请求
     *
     * @return HTTP请求，非 Web 环境返回 null
     */
    private HttpServletRequest currentRequest() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return null;
        }
        return attributes.getRequest();
    }

    /**
     * 解析目标方法
     *
     * @param joinPoint 连接点
     * @return 目标方法，签名非方法级时返回 null
     */
    private Method resolveMethod(ProceedingJoinPoint joinPoint) {
        if (joinPoint.getSignature() instanceof MethodSignature signature) {
            return signature.getMethod();
        }
        return null;
    }

    /**
     * 从方法上的 @PreAuthorize 提取权限编码
     *
     * @param method 目标方法
     * @return 权限编码，无则返回 null
     */
    private String resolvePermissionCode(Method method) {
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        if (preAuthorize == null) {
            return null;
        }
        Matcher matcher = AUTHORITY_PATTERN.matcher(preAuthorize.value());
        return matcher.find() ? matcher.group(1) : null;
    }

    /**
     * 查询权限编码对应的节点元数据（带缓存）
     *
     * @param permissionCode 权限编码
     * @return 节点元数据，未命中返回哨兵（logFlag=false）
     */
    private NodeMeta resolveCodeMeta(String permissionCode) {
        NodeMeta cached = codeMetaCache.get(permissionCode);
        if (cached != null) {
            return cached;
        }
        LambdaQueryWrapper<AdminPermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminPermissionEntity::getPermissionCode, permissionCode);
        List<AdminPermissionEntity> nodes = permissionMapper.selectList(wrapper);
        NodeMeta meta = NONE_META;
        if (nodes != null && !nodes.isEmpty()) {
            AdminPermissionEntity node = nodes.get(0);
            meta = new NodeMeta(isLogFlagOn(node.getLogFlag()), resolveModuleName(node));
        }
        codeMetaCache.put(permissionCode, meta);
        return meta;
    }

    /**
     * 按 URI 匹配菜单节点（带缓存，最长匹配优先）
     *
     * @param uri 请求URI
     * @return 命中的菜单元数据，未命中返回 null
     */
    private PathMeta resolveMenuMeta(String uri) {
        List<PathMeta> menus = menuMetaCache;
        if (menus == null) {
            menus = loadMenuMetas();
            menuMetaCache = menus;
        }
        PathMeta best = null;
        for (PathMeta menu : menus) {
            if (pathMatches(menu.getPath(), uri)
                    && (best == null || menu.getPath().length() > best.getPath().length())) {
                best = menu;
            }
        }
        return best;
    }

    /**
     * 加载菜单节点元数据（type=1 目录与 type=2 菜单，且 path 非空）
     *
     * @return 菜单元数据列表
     */
    private List<PathMeta> loadMenuMetas() {
        LambdaQueryWrapper<AdminPermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNotNull(AdminPermissionEntity::getPath);
        wrapper.ne(AdminPermissionEntity::getPath, "");
        wrapper.eq(AdminPermissionEntity::getStatus, 1);
        List<AdminPermissionEntity> menus = permissionMapper.selectList(wrapper);
        List<PathMeta> metas = new ArrayList<>();
        if (menus == null) {
            return metas;
        }
        for (AdminPermissionEntity menu : menus) {
            metas.add(new PathMeta(menu.getPath(), isLogFlagOn(menu.getLogFlag()), menu.getPermissionName()));
        }
        return metas;
    }

    /**
     * 判断菜单 path 是否匹配请求 URI（path 中以 : 开头的段视为动态参数，匹配任意值）
     *
     * @param menuPath 菜单路径
     * @param uri 请求URI
     * @return true-匹配 false-不匹配
     */
    private boolean pathMatches(String menuPath, String uri) {
        String[] pathSegments = menuPath.split("/");
        String[] uriSegments = uri.split("/");
        if (pathSegments.length > uriSegments.length) {
            return false;
        }
        for (int i = 0; i < pathSegments.length; i++) {
            if (pathSegments[i].startsWith(":")) {
                continue;
            }
            if (!pathSegments[i].equals(uriSegments[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断 log_flag 是否开启（null 视为开启，与数据库默认值保持一致）
     *
     * @param logFlag 数据库值
     * @return true-记录 false-不记录
     */
    private boolean isLogFlagOn(Integer logFlag) {
        return logFlag == null || logFlag == 1;
    }

    /**
     * 解析操作所属模块（优先权限节点的父菜单名，菜单节点取自身名）
     *
     * @param permissionCode 权限编码
     * @param uri 请求URI
     * @return 模块名，无法解析返回 null
     */
    private String resolveModule(String permissionCode, String uri) {
        if (StringUtils.hasText(permissionCode)) {
            return resolveCodeMeta(permissionCode).getModule();
        }
        if (LOGIN_URI.equals(uri)) {
            return "登录";
        }
        if (LOGOUT_URI.equals(uri)) {
            return "登出";
        }
        PathMeta menu = resolveMenuMeta(uri);
        return menu == null ? null : menu.getModule();
    }

    /**
     * 取权限节点的模块名：父节点为菜单时取父节点名，否则取自身名
     *
     * @param node 权限节点
     * @return 模块名
     */
    private String resolveModuleName(AdminPermissionEntity node) {
        Long parentId = node.getParentId();
        if (parentId == null || parentId <= 0) {
            return node.getPermissionName();
        }
        AdminPermissionEntity parent = permissionMapper.selectById(parentId);
        return parent == null ? node.getPermissionName() : parent.getPermissionName();
    }

    /**
     * 解析操作类型
     *
     * @param permissionCode 权限编码
     * @param uri 请求URI
     * @return 操作类型
     */
    private int resolveOperationType(String permissionCode, String uri) {
        if (LOGIN_URI.equals(uri)) {
            return TYPE_LOGIN;
        }
        if (LOGOUT_URI.equals(uri)) {
            return TYPE_LOGOUT;
        }
        if (!StringUtils.hasText(permissionCode)) {
            return TYPE_OTHER;
        }
        String code = permissionCode.toLowerCase();
        if (code.contains("create") || code.contains("add")) {
            return TYPE_CREATE;
        }
        if (code.contains("delete") || code.contains("remove")) {
            return TYPE_DELETE;
        }
        if (code.contains("update") || code.contains("assign") || code.contains("reset")
                || code.contains("disable") || code.contains("enable") || code.contains("restore")
                || code.contains("unlock")) {
            return TYPE_UPDATE;
        }
        if (code.contains("list") || code.contains("detail") || code.contains("query")
                || code.contains("search")) {
            return TYPE_QUERY;
        }
        return TYPE_OTHER;
    }

    /**
     * 解析操作名称：优先取 @Operation 的 summary，缺省用方法名
     *
     * @param method 目标方法
     * @return 操作名称
     */
    private String resolveOperation(Method method) {
        Operation operation = method.getAnnotation(Operation.class);
        if (operation != null && StringUtils.hasText(operation.summary())) {
            return operation.summary();
        }
        return method.getName();
    }

    /**
     * 解析操作人用户名：优先取认证过滤器写入的 request 属性，登录接口回退到入参
     *
     * @param args 方法入参
     * @param request HTTP请求
     * @return 用户名，无法解析返回 null
     */
    private String resolveUsername(Object[] args, HttpServletRequest request) {
        Object attr = request.getAttribute("adminUsername");
        if (attr instanceof String && StringUtils.hasText((String) attr)) {
            return (String) attr;
        }
        if (args == null) {
            return null;
        }
        for (Object arg : args) {
            if (arg instanceof AdminUserEntity user) {
                return user.getUsername();
            }
        }
        return null;
    }

    /**
     * 序列化请求参数（过滤 Servlet 对象、敏感字段脱敏、超长截断）
     *
     * @param args 方法入参
     * @return 参数 JSON，无参数或序列化失败返回 null
     */
    private String buildParams(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }
        List<Object> candidates = new ArrayList<>();
        for (Object arg : args) {
            if (arg == null || arg instanceof ServletRequest || arg instanceof ServletResponse) {
                continue;
            }
            candidates.add(arg);
        }
        if (candidates.isEmpty()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.valueToTree(candidates.size() == 1 ? candidates.get(0) : candidates);
            maskSensitive(root);
            String json = objectMapper.writeValueAsString(root);
            return truncate(json, PARAM_MAX_LENGTH);
        } catch (Exception e) {
            log.warn("操作日志请求参数序列化失败", e);
            return null;
        }
    }

    /**
     * 序列化响应结果（敏感字段脱敏、超长截断）
     *
     * @param result 方法返回值
     * @return 响应 JSON，无结果或序列化失败返回 null
     */
    private String buildResponse(Object result) {
        if (result == null) {
            return null;
        }
        try {
            JsonNode root = objectMapper.valueToTree(result);
            maskSensitive(root);
            String json = objectMapper.writeValueAsString(root);
            return truncate(json, PARAM_MAX_LENGTH);
        } catch (Exception e) {
            log.warn("操作日志响应结果序列化失败", e);
            return null;
        }
    }

    /**
     * 递归脱敏敏感字段
     *
     * @param node JSON节点
     */
    private void maskSensitive(JsonNode node) {
        if (node == null) {
            return;
        }
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> iterator = objectNode.properties().iterator();
            while (iterator.hasNext()) {
                Map.Entry<String, JsonNode> entry = iterator.next();
                if (SENSITIVE_FIELDS.contains(entry.getKey().toLowerCase())) {
                    objectNode.put(entry.getKey(), MASK);
                } else {
                    maskSensitive(entry.getValue());
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskSensitive(child);
            }
        }
    }

    /**
     * 获取客户端真实IP（前后端分离场景优先取代理转发头）
     *
     * @param request HTTP请求
     * @return IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(ip) && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded) && !"unknown".equalsIgnoreCase(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * 截断字符串
     *
     * @param value 原字符串
     * @param maxLength 最大长度
     * @return 截断后的字符串，入参为 null 时返回 null
     */
    private String truncate(String value, int maxLength) {
        if (value == null || maxLength <= 0) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    /**
     * 权限节点元数据（权限码维度）
     */
    private static class NodeMeta {

        private final boolean logFlag;
        private final String module;

        NodeMeta(boolean logFlag, String module) {
            this.logFlag = logFlag;
            this.module = module;
        }

        public boolean isLogFlag() {
            return logFlag;
        }

        public String getModule() {
            return module;
        }
    }

    /**
     * 菜单节点元数据（路径维度）
     */
    private static class PathMeta {

        private final String path;
        private final boolean logFlag;
        private final String module;

        PathMeta(String path, boolean logFlag, String module) {
            this.path = path;
            this.logFlag = logFlag;
            this.module = module;
        }

        public String getPath() {
            return path;
        }

        public boolean isLogFlag() {
            return logFlag;
        }

        public String getModule() {
            return module;
        }
    }
}
