package com.shop.admin.aspect;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.shop.admin.config.AsyncConfig;
import com.shop.admin.entity.AdminOperationLogEntity;
import com.shop.admin.service.AdminOperationLogService;

import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * 操作日志异步写入器
 * <p>
 * 承接 {@link OperationLogAspect} 在请求线程内采集到的日志数据，在
 * {@link AsyncConfig#OPERATION_LOG_EXECUTOR} 专用线程池中完成「请求参数 / 响应结果」
 * 的 JSON 序列化、脱敏、截断与落库，使请求线程不再承担这部分耗时。
 * </p>
 * <p>
 * 写入失败只记录 error 日志，绝不向业务抛出（异步执行无调用方，异常必须就地消化）。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Component
public class OperationLogWriter {

    /**
     * 错误消息最大保存长度
     */
    private static final int MAX_MESSAGE_LENGTH = 500;

    /**
     * 请求参数 / 响应结果保存的最大长度，超出部分截断
     */
    private static final int PARAM_MAX_LENGTH = 2000;

    /**
     * 敏感字段脱敏掩码
     */
    private static final String MASK = "******";

    /**
     * 需要脱敏的字段名（比较时统一小写）
     */
    private static final List<String> SENSITIVE_FIELDS =
            Arrays.asList("password", "oldpassword", "newpassword", "confirmpassword", "token");

    /**
     * 降级文本中的敏感字段模式：兼容 {@code password=xxx} 与 {@code "password":"xxx"} 两种写法
     */
    private static final Pattern SENSITIVE_TEXT_PATTERN = Pattern.compile(
            "(?i)(['\"]?(?:" + String.join("|", SENSITIVE_FIELDS) + ")['\"]?\\s*[:=]\\s*)('?\"?)([^,;)\\]}\\s\"']+)");

    private final AdminOperationLogService operationLogService;

    private final ObjectMapper objectMapper;

    public OperationLogWriter(AdminOperationLogService operationLogService, ObjectMapper objectMapper) {
        this.operationLogService = operationLogService;
        this.objectMapper = objectMapper;
    }

    /**
     * 异步补全并写入一条操作日志
     * <p>
     * 入参实体已由切面填充 URI、操作人、权限、耗时、成功标志等字段；
     * 本方法负责序列化请求参数与响应结果、截断失败消息，然后落库。
     * </p>
     *
     * @param entity 操作日志实体（requestParams / responseData / message 由本方法补全）
     * @param args   目标 Controller 方法入参
     * @param result 目标 Controller 方法返回值
     */
    @Async(AsyncConfig.OPERATION_LOG_EXECUTOR)
    public void write(AdminOperationLogEntity entity, Object[] args, Object result) {
        try {
            entity.setRequestParams(buildParams(args));
            entity.setResponseData(buildResponse(result));
            entity.setMessage(truncate(entity.getMessage(), MAX_MESSAGE_LENGTH));
            operationLogService.record(entity);
        } catch (Exception e) {
            log.error("异步记录操作日志失败, uri: {}", entity.getRequestUri(), e);
        }
    }

    /**
     * 序列化请求参数（过滤 Servlet 对象、敏感字段脱敏、超长截断）
     *
     * @param args 方法入参
     * @return 参数 JSON；无参数返回 null；序列化失败时降级为原始文本，尽量保留数据
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
        return toLogJson(candidates.size() == 1 ? candidates.get(0) : candidates);
    }

    /**
     * 序列化响应结果（敏感字段脱敏、超长截断）
     *
     * @param result 方法返回值
     * @return 响应 JSON；无结果返回 null；序列化失败时降级为原始文本，尽量保留数据
     */
    private String buildResponse(Object result) {
        if (result == null) {
            return null;
        }
        return toLogJson(result);
    }

    /**
     * 日志内容统一序列化出口：优先输出脱敏后的 JSON，解析失败则降级为原始文本
     * <p>
     * 解析失败时不丢弃数据：改为记录对象的原始文本表示（先做尽力而为的敏感字段脱敏，再按最大长度截断），
     * 保证日志表尽最大可能保留入参 / 出参的原始信息。
     * </p>
     *
     * @param payload 待记录对象
     * @return 脱敏后的 JSON，或解析失败时降级的原始文本
     */
    private String toLogJson(Object payload) {
        try {
            JsonNode root = objectMapper.valueToTree(payload);
            maskSensitive(root);
            return truncate(objectMapper.writeValueAsString(root), PARAM_MAX_LENGTH);
        } catch (Exception e) {
            log.warn("操作日志序列化失败，降级记录原始文本, type: {}", payload.getClass().getName(), e);
            return truncate(fallbackText(payload), PARAM_MAX_LENGTH);
        }
    }

    /**
     * 序列化失败时的原始文本兜底
     *
     * @param payload 待记录对象
     * @return 脱敏后的原始文本；连 toString 都失败时退化为类名
     */
    private String fallbackText(Object payload) {
        try {
            return maskFallbackText(String.valueOf(payload));
        } catch (Exception e) {
            return payload.getClass().getName();
        }
    }

    /**
     * 对降级原始文本做尽力而为的敏感字段脱敏
     * <p>
     * 原始文本无法像 JSON 那样按字段精确脱敏，这里用模式匹配兜住
     * {@code password=xxx} / {@code "password":"xxx"} 等常见写法，避免明文密码落库。
     * </p>
     *
     * @param text 原始文本
     * @return 脱敏后的文本
     */
    private String maskFallbackText(String text) {
        return SENSITIVE_TEXT_PATTERN.matcher(text).replaceAll("$1$2" + MASK);
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
     * 截断字符串
     *
     * @param value     原字符串
     * @param maxLength 最大长度
     * @return 截断后的字符串，入参为 null 时返回 null
     */
    private String truncate(String value, int maxLength) {
        if (value == null || maxLength <= 0) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
