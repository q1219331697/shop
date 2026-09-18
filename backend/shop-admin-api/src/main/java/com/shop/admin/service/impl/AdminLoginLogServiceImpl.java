package com.shop.admin.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.admin.mapper.AdminLoginLogMapper;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import lombok.extern.slf4j.Slf4j;

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

    /**
     * 完整时间格式：yyyy-MM-dd HH:mm:ss
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 纯日期格式：yyyy-MM-dd
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 纯日期字符串长度（yyyy-MM-dd）
     */
    private static final int DATE_ONLY_LENGTH = 10;

    @Override
    public void recordLoginLog(Long userId, String username, String ip, Integer success,
                               String message) {
        try {
            AdminLoginLogEntity loginLog = new AdminLoginLogEntity();
            loginLog.setUserId(userId);
            loginLog.setUsername(username);
            loginLog.setIp(ip);
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
                                                           String username, String ip, Integer success,
                                                           String startTime, String endTime) {
        try {
            Page<AdminLoginLogEntity> page = new Page<>(pageNum, pageSize);
            LambdaQueryWrapper<AdminLoginLogEntity> queryWrapper = new LambdaQueryWrapper<>();

            // 用户名模糊查询
            if (StringUtils.hasText(username)) {
                queryWrapper.like(AdminLoginLogEntity::getUsername, username);
            }

            // 登录IP模糊查询
            if (StringUtils.hasText(ip)) {
                queryWrapper.like(AdminLoginLogEntity::getIp, ip);
            }

            // 成功状态精确查询
            if (success != null) {
                queryWrapper.eq(AdminLoginLogEntity::getSuccess, success);
            }

            // 时间范围查询（纯日期按当天起止时间补齐，避免漏掉当天数据）
            if (StringUtils.hasText(startTime)) {
                queryWrapper.ge(AdminLoginLogEntity::getLoginTime, parseRangeStart(startTime));
            }
            if (StringUtils.hasText(endTime)) {
                queryWrapper.le(AdminLoginLogEntity::getLoginTime, parseRangeEnd(endTime));
            }

            // 按登录时间倒序排列
            queryWrapper.orderByDesc(AdminLoginLogEntity::getLoginTime);

            IPage<AdminLoginLogEntity> result = this.page(page, queryWrapper);
            return Result.success(result);
        } catch (DateTimeParseException e) {
            log.warn("分页查询登录日志失败，时间格式不正确", e);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "时间格式不正确，请使用yyyy-MM-dd或yyyy-MM-dd HH:mm:ss");
        } catch (Exception e) {
            log.error("分页查询登录日志失败", e);
            return Result.error("查询登录日志失败");
        }
    }

    /**
     * 解析时间范围起点
     * <p>
     * 支持两种格式：yyyy-MM-dd（补 00:00:00）与 yyyy-MM-dd HH:mm:ss
     * </p>
     *
     * @param value 时间字符串
     * @return 起点时间
     */
    private LocalDateTime parseRangeStart(String value) {
        String text = value.trim();
        if (text.length() == DATE_ONLY_LENGTH) {
            return LocalDate.parse(text, DATE_FORMATTER).atStartOfDay();
        }
        return LocalDateTime.parse(text, DATE_TIME_FORMATTER);
    }

    /**
     * 解析时间范围终点
     * <p>
     * 支持两种格式：yyyy-MM-dd（补当日最大时间 23:59:59.999999999）与 yyyy-MM-dd HH:mm:ss
     * </p>
     *
     * @param value 时间字符串
     * @return 终点时间
     */
    private LocalDateTime parseRangeEnd(String value) {
        String text = value.trim();
        if (text.length() == DATE_ONLY_LENGTH) {
            return LocalDateTime.of(LocalDate.parse(text, DATE_FORMATTER), LocalTime.MAX);
        }
        return LocalDateTime.parse(text, DATE_TIME_FORMATTER);
    }
}