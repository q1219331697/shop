package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.admin.security.RequirePermission;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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

    private static final Long DEFAULT_PAGE_SIZE = 10L;

    @Autowired
    private AdminLoginLogService adminLoginLogService;

    /**
     * 分页查询登录日志
     *
     * @param params 查询参数：pageNum, pageSize, username, success, startTime, endTime
     * @return 登录日志分页数据
     */
    @RequirePermission("system:loginlog:query")
    @Operation(summary = "分页查询登录日志")
    @GetMapping
    public Result<IPage<AdminLoginLogEntity>> list(@RequestBody Map<String, Object> params) {
        Long pageNum = params.get("pageNum") != null ? Long.valueOf(params.get("pageNum").toString()) : 1L;
        Long pageSize = params.get("pageSize") != null
                ? Long.valueOf(params.get("pageSize").toString()) : DEFAULT_PAGE_SIZE;
        String username = params.get("username") != null ? params.get("username").toString() : null;
        Integer success = params.get("success") != null ? Integer.valueOf(params.get("success").toString()) : null;
        String startTime = params.get("startTime") != null ? params.get("startTime").toString() : null;
        String endTime = params.get("endTime") != null ? params.get("endTime").toString() : null;
        return adminLoginLogService.pageLoginLog(pageNum, pageSize, username, success, startTime, endTime);
    }
}