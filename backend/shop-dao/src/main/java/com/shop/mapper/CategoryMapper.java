package com.shop.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.CategoryEntity;

/**
 * 分类Mapper接口
 * 提供分类数据的数据库操作
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface CategoryMapper extends BaseMapper<CategoryEntity> {
}
