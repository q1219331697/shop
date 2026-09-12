package com.shop.admin.exception;

import java.util.List;

import jakarta.validation.ConstraintViolationException;

import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

/**
 * 全局异常处理器：将参数校验失败统一转换为业务错误码返回（HTTP 始终 200）。
 *
 * <p>后端约定：所有请求 HTTP 状态码恒为 200，成功/失败由 body.code 区分
 * （SUCCESS=000000，参数错误=PARAM_ERROR=000002）。因此校验失败<b>绝不</b>返回 4xx/5xx，
 * 而是返回 {@code Result.error(ResultCodeEnum.PARAM_ERROR, 文案)}，由前端按 code 判断。
 * 错误文案与前端 .el-form-item__error 对齐，便于 E2E 契约用例断言同一关键字（前后端一致性守卫）。</p>
 *
 * @author shop
 * @since 1.0.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String msg = joinFieldErrors(ex.getBindingResult().getFieldErrors());
        return Result.error(ResultCodeEnum.PARAM_ERROR, msg);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public Result<Void> handleConstraintViolation(ConstraintViolationException ex) {
        return Result.error(ResultCodeEnum.PARAM_ERROR, ex.getMessage());
    }

    private String joinFieldErrors(List<FieldError> errors) {
        StringBuilder sb = new StringBuilder();
        for (FieldError fe : errors) {
            if (sb.length() > 0) {
                sb.append("；");
            }
            sb.append(fe.getDefaultMessage());
        }
        return sb.length() > 0 ? sb.toString() : "参数校验失败";
    }
}
