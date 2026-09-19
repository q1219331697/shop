package com.shop.api.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Knife4j配置类
 * 用于配置API文档的展示信息
 *
 * @author shop
 * @since 1.0.0
 */
@Configuration
public class Knife4jConfig {

    /**
     * 配置OpenAPI文档信息
     * @return OpenAPI文档信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // 基本信息
                .info(new Info()
                        .title("商城系统API文档")
                        .version("1.0.0")
                        .description("商城系统前台API接口文档（当前模块为最小可运行骨架，业务接口后续按需补充）")
                        .contact(new Contact()
                                .name("商城系统开发团队")
                                .email("support@shop.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                // 服务器配置
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("本地开发环境"),
                        new Server().url("http://prod.shop.com").description("生产环境")
                ));
    }
}
