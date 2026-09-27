package com.shop.admin.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.spring.service.IService;
import com.shop.admin.dto.OperationLogListRequest;
import com.shop.admin.entity.AdminOperationLogEntity;
import com.shop.common.Result;

/**
 * 后台操作日志服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface AdminOperationLogService extends IService<AdminOperationLogEntity> {

    /**
     * 记录一条操作日志
     * <p>
     * 由切面调用；写入失败只记录 error 日志，不向业务抛出。
     * </p>
     *
     * @param operationLog 操作日志实体
     */
    void record(AdminOperationLogEntity operationLog);

    /**
     * 分页查询操作日志
     *
     * @param request 查询条件（含分页与过滤，字段见 OperationLogListRequest）
     * @return 操作日志分页数据
     */
    Result<IPage<AdminOperationLogEntity>> pageOperationLog(OperationLogListRequest request);

    /**
     * 操作日志详情
     *
     * @param id 日志ID
     * @return 操作日志实体
     */
    Result<AdminOperationLogEntity> getOperationLogDetail(Long id);
}
