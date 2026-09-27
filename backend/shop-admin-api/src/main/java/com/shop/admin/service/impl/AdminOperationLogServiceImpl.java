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
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.shop.admin.dto.OperationLogListRequest;
import com.shop.admin.entity.AdminOperationLogEntity;
import com.shop.admin.mapper.AdminOperationLogMapper;
import com.shop.admin.service.AdminOperationLogService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import lombok.extern.slf4j.Slf4j;

/**
 * 后台操作日志服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminOperationLogServiceImpl
        extends ServiceImpl<AdminOperationLogMapper, AdminOperationLogEntity>
        implements AdminOperationLogService {

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
    public void record(AdminOperationLogEntity operationLog) {
        try {
            if (operationLog.getOperationTime() == null) {
                operationLog.setOperationTime(LocalDateTime.now());
            }
            this.save(operationLog);
        } catch (Exception e) {
            log.error("记录操作日志失败, username: {}, uri: {}",
                    operationLog.getUsername(), operationLog.getRequestUri(), e);
        }
    }

    @Override
    public Result<IPage<AdminOperationLogEntity>> pageOperationLog(OperationLogListRequest request) {
        try {
            Page<AdminOperationLogEntity> page = new Page<>(request.getPageNum(), request.getPageSize());
            LambdaQueryWrapper<AdminOperationLogEntity> queryWrapper = new LambdaQueryWrapper<>();

            if (StringUtils.hasText(request.getUsername())) {
                queryWrapper.like(AdminOperationLogEntity::getUsername, request.getUsername());
            }
            if (StringUtils.hasText(request.getModule())) {
                queryWrapper.like(AdminOperationLogEntity::getModule, request.getModule());
            }
            if (StringUtils.hasText(request.getOperation())) {
                queryWrapper.like(AdminOperationLogEntity::getOperation, request.getOperation());
            }
            if (request.getOperationType() != null) {
                queryWrapper.eq(AdminOperationLogEntity::getOperationType, request.getOperationType());
            }
            if (request.getSuccess() != null) {
                queryWrapper.eq(AdminOperationLogEntity::getSuccess, request.getSuccess());
            }
            // 时间范围查询（纯日期按当天起止时间补齐，避免漏掉当天数据）
            if (StringUtils.hasText(request.getStartTime())) {
                queryWrapper.ge(AdminOperationLogEntity::getOperationTime, parseRangeStart(request.getStartTime()));
            }
            if (StringUtils.hasText(request.getEndTime())) {
                queryWrapper.le(AdminOperationLogEntity::getOperationTime, parseRangeEnd(request.getEndTime()));
            }

            // 按操作时间倒序排列
            queryWrapper.orderByDesc(AdminOperationLogEntity::getOperationTime);

            IPage<AdminOperationLogEntity> result = this.page(page, queryWrapper);
            return Result.success(result);
        } catch (DateTimeParseException e) {
            log.warn("分页查询操作日志失败，时间格式不正确", e);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "时间格式不正确，请使用yyyy-MM-dd或yyyy-MM-dd HH:mm:ss");
        } catch (Exception e) {
            log.error("分页查询操作日志失败", e);
            return Result.error("查询操作日志失败");
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

    @Override
    public Result<AdminOperationLogEntity> getOperationLogDetail(Long id) {
        AdminOperationLogEntity entity = this.getById(id);
        if (entity == null) {
            log.warn("操作日志详情查询失败，记录不存在, id: {}", id);
            return Result.error("操作日志不存在");
        }
        return Result.success(entity);
    }
}
