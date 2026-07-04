package com.shop.redis;

import com.shop.entity.ProductEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 商品 Redis 缓存操作类
 */
@Component
public class ProductRedisCache {

    /** 缓存过期时间（分钟） */
    private static final int CACHE_EXPIRE_MINUTES = 30;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存商品信息
     * @param product 商品信息
     */
    public void cacheProduct(ProductEntity product) {
        if (product != null && product.getId() != null) {
            String key = "product:" + product.getId();
            redisTemplate.opsForValue().set(key, product, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        }
    }

    /**
     * 获取缓存的商品信息
     * @param productId 商品ID
     * @return 商品信息
     */
    public ProductEntity getCachedProduct(Long productId) {
        if (productId == null) {
            return null;
        }
        String key = "product:" + productId;
        return (ProductEntity) redisTemplate.opsForValue().get(key);
    }

    /**
     * 删除商品缓存
     * @param productId 商品ID
     */
    public void evictProductCache(Long productId) {
        if (productId != null) {
            String key = "product:" + productId;
            redisTemplate.delete(key);
        }
    }
}
