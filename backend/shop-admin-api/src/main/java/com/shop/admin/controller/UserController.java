package com.shop.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.vo.PageQueryVo;
import com.shop.common.Result;
import com.shop.entity.UserEntity;
import com.shop.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 会员管理控制器
 * <p>
 * 管理 C 端用户（UserEntity），区别于后台管理员（AdminUserEntity），权限码统一使用 member:* 前缀。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "会员管理", description = "会员管理接口")
@RestController
@RequestMapping("/member")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 分页查询用户列表
     *
     * @param queryVo 查询参数
     * @return 用户分页数据
     */
    @PreAuthorize("hasAuthority('member:query')")
    @Operation(summary = "分页查询用户列表")
    @GetMapping
    public Result<IPage<UserEntity>> list(PageQueryVo queryVo) {
        Page<UserEntity> page = new Page<>(queryVo.getPageNum(), queryVo.getPageSize());
        return Result.success(userService.page(page));
    }

    /**
     * 获取用户详情
     *
     * @param id 用户ID
     * @return 用户详情
     */
    @PreAuthorize("hasAuthority('member:query')")
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
    @PreAuthorize("hasAuthority('member:update')")
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
    @PreAuthorize("hasAuthority('member:delete')")
    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return userService.removeById(id) ? Result.success() : Result.error("删除用户失败");
    }
}
