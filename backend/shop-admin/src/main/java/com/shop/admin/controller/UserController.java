package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台用户管理控制器
 * @since 1.0.0
 */
@Tag(name = "后台-用户管理", description = "后台用户管理接口")
@RestController
@RequestMapping("/admin/user")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 分页查询用户列表
     *
     * @param current 当前页码
     * @param size 每页条数
     * @return 用户分页数据
     */
    @Operation(summary = "分页查询用户列表")
    @GetMapping("/list")
    public Result<IPage<UserEntity>> list(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return Result.success(userService.page(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(current, size)));
    }

    /**
     * 获取用户详情
     *
     * @param id 用户ID
     * @return 用户详情
     */
    @Operation(summary = "获取用户详情")
    @GetMapping("/{id}")
    public Result<UserEntity> getById(@PathVariable Long id) {
        return userService.getUserInfo(id);
    }

    /**
     * 更新用户信息
     *
     * @param user 用户信息
     * @return 更新结果
     */
    @Operation(summary = "更新用户信息")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody UserEntity user) {
        return userService.updateUser(user);
    }

    /**
     * 删除用户
     *
     * @param id 用户ID
     * @return 删除结果
     */
    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return userService.removeById(id) ? Result.success() : Result.error("删除用户失败");
    }
}
