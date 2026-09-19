package com.shop.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 示例接口控制器
 * <p>
 * 前台 API 模块当前仅保留最小可运行骨架，业务接口后续按需补充
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "示例", description = "最小骨架示例接口")
@RestController
@RequestMapping("/hello")
public class HelloController {

    /**
     * Hello World 示例接口
     *
     * @return 问候信息
     */
    @Operation(summary = "Hello World")
    @GetMapping
    public Result<String> hello() {
        return Result.success("Hello World");
    }
}
