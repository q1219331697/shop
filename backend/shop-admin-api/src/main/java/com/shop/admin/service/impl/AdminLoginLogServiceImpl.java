package com.shop.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.admin.mapper.AdminLoginLogMapper;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 后台登录日志服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminLoginLogServiceImpl
        extends ServiceImpl<AdminLoginLogMapper, AdminLoginLogEntity>
        implements AdminLoginLogService {

    @Override
    public void recordLoginLog(Long userId, String username, Integer success,
                               String message) {
        try {
            AdminLoginLogEntity loginLog = new AdminLoginLogEntity();
            loginLog.setUserId(userId);
            loginLog.setUsername(username);
            loginLog.setLoginTime(LocalDateTime.now());
            loginLog.setSuccess(success);
            loginLog.setMessage(message);
            this.save(loginLog);
        } catch (Exception e) {
            log.error("记录登录日志失败, userId: {}, username: {}",
                      userId, username, e);
        }
    }

    @Override
    public Result<IPage<AdminLoginLogEntity>> pageLoginLog(Long pageNum, Long pageSize,
                                                           String username, Integer success,
                                                           String startTime, String endTime) {
        try {
            Page<AdminLoginLogEntity> page = new Page<>(pageNum, pageSize);
            LambdaQueryWrapper<AdminLoginLogEntity> queryWrapper = new LambdaQueryWrapper<>();

            // 用户名模糊查询
            if (StringUtils.hasText(username)) {
                queryWrapper.like(AdminLoginLogEntity::getUsername, username);
            }

            // 成功状态精确查询
            if (success != null) {
                queryWrapper.eq(AdminLoginLogEntity::getSuccess, success);
            }

            // 时间范围查询
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            if (StringUtils.hasText(startTime)) {
                queryWrapper.ge(AdminLoginLogEntity::getLoginTime, LocalDateTime.parse(startTime, formatter));
            }
            if (StringUtils.hasText(endTime)) {
                queryWrapper.le(AdminLoginLogEntity::getLoginTime, LocalDateTime.parse(endTime, formatter));
            }

            // 按登录时间倒序排列
            queryWrapper.orderByDesc(AdminLoginLogEntity::getLoginTime);

            IPage<AdminLoginLogEntity> result = this.page(page, queryWrapper);
            return Result.success(result);
        } catch (Exception e) {
            log.error("分页查询登录日志失败", e);
            return Result.error("查询登录日志失败");
        }
    }
}