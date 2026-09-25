package com.shop.admin.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.dto.IdRequest;
import com.shop.admin.dto.OperationLogListRequest;
import com.shop.admin.entity.AdminOperationLogEntity;
import com.shop.admin.service.AdminOperationLogService;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 后台操作日志控制器
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "操作日志管理", description = "后台操作日志管理接口")
@RestController
@RequestMapping("/operationLog")
public class AdminOperationLogController {

    private final AdminOperationLogService adminOperationLogService;

    public AdminOperationLogController(AdminOperationLogService adminOperationLogService) {
        this.adminOperationLogService = adminOperationLogService;
    }

    /**
     * 分页查询操作日志
     *
     * @param request 查询条件（含分页与过滤）
     * @return 操作日志分页数据
     */
    @PreAuthorize("hasAuthority('system:operationlog:list')")
    @Operation(summary = "分页查询操作日志")
    @PostMapping("/list")
    public Result<IPage<AdminOperationLogEntity>> list(@RequestBody OperationLogListRequest request) {
        return adminOperationLogService.pageOperationLog(request);
    }

    /**
     * 操作日志详情
     *
     * @param request 主键请求，含日志ID
     * @return 操作日志详情
     */
    @PreAuthorize("hasAuthority('system:operationlog:list')")
    @Operation(summary = "操作日志详情")
    @PostMapping("/detail")
    public Result<AdminOperationLogEntity> detail(@RequestBody @Validated IdRequest request) {
        return adminOperationLogService.getOperationLogDetail(request.getId());
    }
}
