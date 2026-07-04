package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.CategoryEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分类Mapper接口
 * 提供分类数据的数据库操作
 * @since 1.0.0
 */
@Mapper
public interface CategoryMapper extends BaseMapper<CategoryEntity> {
}
