package com.shop.api;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 前台API启动类
 *
 * @author shop
 * @since 1.0.0
 */
@SpringBootApplication(scanBasePackages = "com.shop")
@MapperScan("com.shop.**.mapper")
public class ShopApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApiApplication.class, args);
    }
}
