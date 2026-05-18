package com.shop.api;

import com.shop.api.listener.StartupLoggingListener;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;

/**
 * 前台API启动类
 * @since 1.0.0
 */
@SpringBootApplication(scanBasePackages = "com.shop")
@MapperScan("com.shop.mapper")
public class ShopApiApplication {

    private static final int STARTUP_BUFFER_CAPACITY = 2048;

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ShopApiApplication.class);
        app.setApplicationStartup(new BufferingApplicationStartup(STARTUP_BUFFER_CAPACITY));
        app.addListeners(new StartupLoggingListener());
        app.run(args);
    }
}
