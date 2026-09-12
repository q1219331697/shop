package com.shop.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.ProductEntity;

/**
 * 商品Mapper接口
 * 提供商品数据的数据库操作
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface ProductMapper extends BaseMapper<ProductEntity> {
}
