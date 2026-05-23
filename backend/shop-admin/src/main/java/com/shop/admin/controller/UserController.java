package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.security.RequirePermission;
import com.shop.common.Result;
import com.shop.entity.UserEntity;
import com.shop.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 后台用户管理控制器
 * @since 1.0.0
 */
@Tag(name = "用户管理", description = "用户管理接口")
@RestController
@RequestMapping("/user")
public class UserController {

    private static final Long DEFAULT_PAGE_SIZE = 10L;

    @Autowired
    private UserService userService;

    /**
     * 分页查询用户列表
     *
     * @param params 查询参数：pageNum, pageSize
     * @return 用户分页数据
     */
    @RequirePermission("user:query")
    @Operation(summary = "分页查询用户列表")
    @GetMapping
    public Result<IPage<UserEntity>> list(@RequestBody Map<String, Object> params) {
        Long pageNum = params.get("pageNum") != null ? Long.valueOf(params.get("pageNum").toString()) : 1L;
        Long pageSize = params.get("pageSize") != null
                ? Long.valueOf(params.get("pageSize").toString()) : DEFAULT_PAGE_SIZE;
        return Result.success(userService.page(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(pageNum, pageSize)));
    }

    /**
     * 获取用户详情
     *
     * @param id 用户ID
     * @return 用户详情
     */
    @RequirePermission("user:query")
    @Operation(summary = "获取用户详情")
    @GetMapping("/{id}")
    public Result<UserEntity> getById(@PathVariable Long id) {
        return userService.getUserInfo(id);
    }

    /**
     * 更新用户信息
     *
     * @param id 用户ID
     * @param user 用户信息
     * @return 更新结果
     */
    @RequirePermission("user:update")
    @Operation(summary = "更新用户信息")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody UserEntity user) {
        user.setId(id);
        return userService.updateUser(user);
    }

    /**
     * 删除用户
     *
     * @param id 用户ID
     * @return 删除结果
     */
    @RequirePermission("user:delete")
    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return userService.removeById(id) ? Result.success() : Result.error("删除用户失败");
    }
}
