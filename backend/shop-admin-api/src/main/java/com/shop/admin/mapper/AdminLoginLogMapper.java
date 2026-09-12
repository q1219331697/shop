package com.shop.admin.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminLoginLogEntity;

/**
 * 后台登录日志Mapper接口
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface AdminLoginLogMapper extends BaseMapper<AdminLoginLogEntity> {
}
