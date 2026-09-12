package com.shop.admin.service;

import com.shop.common.Result;

/**
 * E2E 测试数据清理服务接口
 * <p>
 * 用于物理删除 E2E 测试产生的临时数据（用户名/角色名/权限名以 e2e- 开头的记录）。
 * 注意：这是测试专用接口，仅供前端 E2E 测试在调用前/后清理残留数据，
 * 不会触碰 admin 及任何真实业务数据。生产环境应通过配置开关关闭。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
public interface TestDataCleanupService {

    /**
     * 物理清理 E2E 测试残留数据（用户、角色、权限及其关联）
     * <p>删除顺序：先删关联（用户-角色、角色-权限），再删用户与角色。</p>
     * <p>prefix 必须显式指定且以 e2e- 开头，否则拒绝执行（安全校验，防止误删）。
     * 按用例清理：传 e2e-「用例ID」- 即可一次清掉该用例（跨用户/角色/权限模块）的全部造数。</p>
     *
     * @param prefix 清理前缀（必填，须以 e2e- 开头）
     * @return 清理结果
     */
    Result<Void> cleanupE2EData(String prefix);
}
