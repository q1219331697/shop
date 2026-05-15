package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.ProductEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 商品Mapper接口
 * 提供商品数据的数据库操作
 */
@Mapper
public interface ProductMapper extends BaseMapper<ProductEntity> {
}
