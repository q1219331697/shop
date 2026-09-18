package com.shop.api.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import lombok.extern.slf4j.Slf4j;

/**
 * 全局异常处理器（前台API）：把各类异常统一转换为业务错误码返回（HTTP 始终 200）。
 *
 * <p>与后台保持一致：异常不返回 4xx/5xx，而是返回 {@code Result.error(...)}，
 * 由前端按 body.code 判断；兜底只返回通用文案，异常堆栈只进日志。</p>
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 请求体无法解析（JSON 语法错误、字段类型与实体不符等）
     *
     * @param ex 请求体解析异常
     * @return 参数错误结果
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public Result<Void> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("请求体解析失败", ex);
        return Result.error(ResultCodeEnum.PARAM_ERROR, "请求体格式错误");
    }

    /**
     * 请求参数缺失或类型不匹配
     *
     * @param ex 参数绑定异常
     * @return 参数错误结果
     */
    @ExceptionHandler({MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    public Result<Void> handleRequestParamBinding(Exception ex) {
        log.warn("请求参数不合法", ex);
        return Result.error(ResultCodeEnum.PARAM_ERROR, "请求参数不合法");
    }

    /**
     * 无权限访问
     *
     * @param ex 鉴权异常
     * @return 无权限结果
     */
    @ExceptionHandler(AccessDeniedException.class)
    public Result<Void> handleAccessDenied(AccessDeniedException ex) {
        log.warn("无权限访问", ex);
        return Result.error(ResultCodeEnum.FORBIDDEN, "无权限访问");
    }

    /**
     * 请求路径不存在
     *
     * @param ex 资源不存在异常
     * @return 失败结果
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public Result<Void> handleNoResourceFound(NoResourceFoundException ex) {
        log.warn("请求路径不存在: {}", ex.getMessage(), ex);
        return Result.error(ResultCodeEnum.ERROR, "请求的资源不存在");
    }

    /**
     * 数据库访问异常（SQL 执行失败、约束冲突、连接异常等）
     *
     * @param ex 数据访问异常
     * @return 操作失败结果
     */
    @ExceptionHandler(DataAccessException.class)
    public Result<Void> handleDataAccess(DataAccessException ex) {
        log.error("数据库访问异常", ex);
        return Result.error(ResultCodeEnum.OPERATION_FAILED, "数据操作失败，请稍后重试");
    }

    /**
     * 兜底：未预期的异常
     *
     * @param ex 异常
     * @return 系统异常结果
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception ex) {
        log.error("系统异常", ex);
        return Result.error(ResultCodeEnum.ERROR, "系统异常，请稍后重试");
    }
}
