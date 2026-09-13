package com.shop.admin.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.admin.entity.AdminLoginLogEntity;
import com.shop.common.Result;

/**
 * 后台登录日志服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface AdminLoginLogService extends IService<AdminLoginLogEntity> {

    /**
     * 记录登录日志
     *
     * @param userId 用户ID
     * @param username 用户名
     * @param ip 登录IP地址
     * @param success 是否成功：0-失败，1-成功
     * @param message 提示信息
     */
    void recordLoginLog(Long userId, String username, String ip, Integer success, String message);

    /**
     * 分页查询登录日志
     *
     * @param pageNum 当前页码
     * @param pageSize 每页条数
     * @param username 用户名（可选，模糊匹配）
     * @param ip 登录IP（可选，模糊匹配）
     * @param success 是否成功（可选）：0-失败，1-成功
     * @param startTime 开始时间（可选，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     * @param endTime 结束时间（可选，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     * @return 登录日志分页数据
     */
    Result<IPage<AdminLoginLogEntity>> pageLoginLog(Long pageNum, Long pageSize,
                                                       String username, String ip, Integer success,
                                                       String startTime, String endTime);
}