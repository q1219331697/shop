package com.shop.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.dto.LoginLogListRequest;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

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
     * @param request 查询条件（含分页与过滤）
     * @return 登录日志分页数据
     */
    @PreAuthorize("hasAuthority('system:loginlog:list')")
    @Operation(summary = "分页查询登录日志")
    @PostMapping("/list")
    public Result<IPage<AdminLoginLogEntity>> list(@RequestBody LoginLogListRequest request) {
        return adminLoginLogService.pageLoginLog(
                request.getPageNum(),
                request.getPageSize(),
                request.getUsername(),
                request.getIp(),
                request.getSuccess(),
                request.getStartTime(),
                request.getEndTime());
    }
}