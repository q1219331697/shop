package com.shop.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import lombok.extern.slf4j.Slf4j;

/**
 * 异步执行配置
 * <p>
 * 提供操作日志专用线程池：操作日志的 JSON 序列化与数据库写入从请求线程剥离，
 * 避免每个请求都同步承担这部分开销。
 * </p>
 * <p>
 * 线程池队列有界，满载时丢弃并告警：操作日志属旁路能力，绝不阻塞或拖垮业务请求。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 操作日志异步线程池 Bean 名称（由 {@code @Async} 引用）
     */
    public static final String OPERATION_LOG_EXECUTOR = "operationLogExecutor";

    /**
     * 操作日志线程池核心线程数
     */
    private static final int CORE_POOL_SIZE = 2;

    /**
     * 操作日志线程池最大线程数
     */
    private static final int MAX_POOL_SIZE = 4;

    /**
     * 操作日志线程池等待队列容量
     */
    private static final int QUEUE_CAPACITY = 2000;

    /**
     * 操作日志专用线程池
     *
     * @return 线程池实例
     */
    @Bean(OPERATION_LOG_EXECUTOR)
    public ThreadPoolTaskExecutor operationLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(CORE_POOL_SIZE);
        executor.setMaxPoolSize(MAX_POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("op-log-");
        executor.setRejectedExecutionHandler((task, pool) -> log.warn("操作日志队列已满，丢弃该条操作日志"));
        executor.initialize();
        return executor;
    }
}
