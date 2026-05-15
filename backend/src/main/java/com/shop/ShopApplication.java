package com.shop;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 商城系统启动类
 * Spring Boot应用程序入口
 * @since 1.0.0
 */
@SpringBootApplication
@MapperScan("com.shop.mapper")
public class ShopApplication {

    /**
     * 应用程序主方法
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
