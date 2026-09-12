package com.shop.admin.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shop.admin.service.TestDataCleanupService;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * E2E 测试数据清理控制器
 * <p>
 * 仅用于 E2E 测试环境清理残留的测试数据（e2e- 前缀的用户/角色）。
 * 该接口只会物理删除 e2e- 前缀的数据，不会触碰 admin 及真实业务数据。
 * </p>
 * <p>
 * 仅在 dev profile 下注册本 Controller（@Profile("dev")）：
 * dev 环境通过 SPRING_PROFILES_ACTIVE=dev 激活；非 dev 环境不激活 dev profile，则整个 Controller 不注册，接口 404。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "E2E测试清理", description = "E2E 测试数据清理接口")
@RestController
@RequestMapping("/internal/test")
@Profile("dev")
public class TestCleanupController {

    private final TestDataCleanupService testDataCleanupService;

    public TestCleanupController(TestDataCleanupService testDataCleanupService) {
        this.testDataCleanupService = testDataCleanupService;
    }

    /**
     * 物理清理 E2E 测试残留数据（用户、角色及其关联）
     * <p>必须显式指定以 e2e- 开头的前缀（按用例清理，如 e2e-TC-PERM-05-），
     * 缺失或前缀不合法将拒绝执行，避免误删真实业务数据。</p>
     *
     * @param prefix 清理前缀（必填，须以 e2e- 开头）
     * @return 清理结果
     */
    @PreAuthorize("hasAuthority('system:admin:delete')")
    @Operation(summary = "物理清理 E2E 测试残留数据")
    @DeleteMapping("/cleanup-e2e")
    public Result<Void> cleanupE2E(@RequestParam String prefix) {
        return testDataCleanupService.cleanupE2EData(prefix);
    }
}
