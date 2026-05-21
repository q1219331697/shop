package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.admin.security.RequirePermission;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台登录日志控制器
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "登录日志管理", description = "后台登录日志管理接口")
@RestController
@RequestMapping("/adminLoginLog")
public class AdminLoginLogController {

    @Autowired
    private AdminLoginLogService adminLoginLogService;

    /**
     * 分页查询登录日志
     *
     * @param pageNum 当前页码
     * @param pageSize 每页条数
     * @param username 用户名（可选）
     * @param status 状态（可选）：0-失败，1-成功
     * @param startTime 开始时间（可选），格式：yyyy-MM-dd HH:mm:ss
     * @param endTime 结束时间（可选），格式：yyyy-MM-dd HH:mm:ss
     * @return 登录日志分页数据
     */
    @RequirePermission("system:loginlog:query")
    @Operation(summary = "分页查询登录日志")
    @GetMapping("/list")
    public Result<IPage<AdminLoginLogEntity>> list(
            @Parameter(description = "当前页码") @RequestParam(defaultValue = "1") Long pageNum,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") Long pageSize,
            @Parameter(description = "用户名") @RequestParam(required = false) String username,
            @Parameter(description = "状态：0-失败，1-成功") @RequestParam(required = false) Integer status,
            @Parameter(description = "开始时间，格式：yyyy-MM-dd HH:mm:ss") @RequestParam(required = false) String startTime,
            @Parameter(description = "结束时间，格式：yyyy-MM-dd HH:mm:ss") @RequestParam(required = false) String endTime) {
        return adminLoginLogService.pageLoginLog(pageNum, pageSize, username, status, startTime, endTime);
    }
}
