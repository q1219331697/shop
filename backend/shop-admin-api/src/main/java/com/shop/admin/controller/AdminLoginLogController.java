package com.shop.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
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
     * @param pageNum 页码
     * @param pageSize 每页条数
     * @param username 用户名（模糊匹配）
     * @param ip 登录IP（模糊匹配）
     * @param success 是否成功：0-失败，1-成功
     * @param startTime 开始时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     * @param endTime 结束时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     * @return 登录日志分页数据
     */
    @PreAuthorize("hasAuthority('system:loginlog:query')")
    @Operation(summary = "分页查询登录日志")
    @GetMapping
    public Result<IPage<AdminLoginLogEntity>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) Integer success,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return adminLoginLogService.pageLoginLog(pageNum, pageSize, username, ip, success, startTime, endTime);
    }
}