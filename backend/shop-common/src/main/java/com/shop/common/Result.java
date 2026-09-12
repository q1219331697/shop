package com.shop.common;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnore;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 统一响应结果类
 * <p>
 * 使用方式：
 * <pre>
 *   Result.success()                        // 成功，无数据
 *   Result.success(user)                    // 成功，带数据
 *   Result.error()                          // 失败，默认消息
 *   Result.error("用户名已存在")              // 失败，自定义消息
 *   Result.error(ResultCodeEnum.USER_NOT_EXIST)            // 失败，指定枚举
 *   Result.error(ResultCodeEnum.USER_NOT_EXIST, "用户不存在") // 失败，指定枚举+自定义消息
 *   Result.of("0701", "自定义错误")              // 完全自定义code和message
 * </pre>
 *
 * @param <T> 数据类型
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "统一响应结果")
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "响应码")
    private String code;

    @Schema(description = "响应消息")
    private String message;

    @Schema(description = "响应数据")
    private T data;

    private Result() { }

    private Result(String code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // ==================== 工厂方法 - 成功 ====================

    public static <T> Result<T> success() {
        return new Result<>(ResultCodeEnum.SUCCESS.getCode(), ResultCodeEnum.SUCCESS.getMsg(), null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCodeEnum.SUCCESS.getCode(), ResultCodeEnum.SUCCESS.getMsg(), data);
    }

    // ==================== 工厂方法 - 失败 ====================

    public static <T> Result<T> error() {
        return ResultCodeEnum.ERROR.toResult();
    }

    public static <T> Result<T> error(String message) {
        return ResultCodeEnum.ERROR.toResult(message);
    }

    public static <T> Result<T> error(String code, String message) {
        return new Result<>(code, message, null);
    }

    public static <T> Result<T> error(ResultCodeEnum resultCodeEnum) {
        return resultCodeEnum.toResult();
    }

    public static <T> Result<T> error(ResultCodeEnum resultCodeEnum, String message) {
        return resultCodeEnum.toResult(message);
    }

    // ==================== 工厂方法 - 自定义 ====================

    /**
     * 完全自定义响应码和消息
     *
     * @param <T>     数据类型
     * @param code    自定义响应码
     * @param message 自定义消息
     * @return 自定义响应结果
     */
    public static <T> Result<T> of(String code, String message) {
        return new Result<>(code, message, null);
    }

    // ==================== 判断方法 ====================

    /**
     * 判断是否成功
     * <p>
     * 注意：该方法为 {@code is} 前缀的 getter 方法，若不标注 {@code @JsonIgnore}，
     * Jackson 序列化时会将其自动暴露为 JSON 字段 {@code success}。
     * 该字段为根据 {@link #code} 动态计算的结果，并非响应体中的真实数据字段，因此需要忽略。
     *
     * @return true 表示成功
     */
    @JsonIgnore
    public boolean isSuccess() {
        return ResultCodeEnum.SUCCESS.getCode().equals(this.code);
    }
}
