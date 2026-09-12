package com.shop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类
 *
 * @author shop
 * @since 1.0.0
 */
@Configuration
public class RedisConfig {

    /**
     * RedisTemplate 配置
     * @param connectionFactory Redis 连接工厂
     * @return RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 设置 key 的序列化方式为 String
        template.setKeySerializer(new StringRedisSerializer());
        // 设置 value 的序列化方式为 JSON
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        // 设置 hash 的 key 的序列化方式为 String
        template.setHashKeySerializer(new StringRedisSerializer());
        // 设置 hash 的 value 的序列化方式为 JSON
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }
}
