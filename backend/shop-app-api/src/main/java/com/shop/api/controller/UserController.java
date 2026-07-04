package com.shop.api.controller;

import com.shop.common.Result;
import com.shop.entity.UserEntity;
import com.shop.service.UserService;
import com.shop.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户控制器
 * @since 1.0.0
 */
@Tag(name = "用户管理", description = "用户相关接口")
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 用户登录
     *
     * @param user 用户登录信息
     * @return 登录令牌
     */
    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody UserEntity user) {
        Result<UserEntity> result = userService.login(user);
        if (result.isSuccess()) {
            UserEntity loginUser = result.getData();
            String token = jwtUtil.generateToken(loginUser.getId(), loginUser.getUsername());
            return Result.success(token);
        }
        return Result.error(result.getCode(), result.getMessage());
    }

    /**
     * 用户注册
     *
     * @param user 用户注册信息
     * @return 操作结果
     */
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<Void> register(@RequestBody UserEntity user) {
        return userService.register(user);
    }

    /**
     * 获取用户信息
     *
     * @param id 用户ID
     * @return 用户信息
     */
    @Operation(summary = "获取用户信息")
    @GetMapping("/{id}")
    public Result<UserEntity> getUserInfo(@PathVariable Long id) {
        return userService.getUserInfo(id);
    }

    /**
     * 更新用户信息
     *
     * @param id 用户ID
     * @param user 用户信息
     * @return 操作结果
     */
    @Operation(summary = "更新用户信息")
    @PutMapping("/{id}")
    public Result<Void> updateUser(@PathVariable Long id, @RequestBody UserEntity user) {
        user.setId(id);
        return userService.updateUser(user);
    }
}
