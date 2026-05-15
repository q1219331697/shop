package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.CategoryEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 商品分类Mapper接口
 * 提供商品分类数据的数据库操作
 */
@Mapper
public interface CategoryMapper extends BaseMapper<CategoryEntity> {
}
