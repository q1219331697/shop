package com.shop.admin.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Knife4j配置类 - API文档展示与授权配置
 *
 * @since 1.0.0
 */
@Configuration
public class Knife4jConfig {

    /**
     * 配置OpenAPI文档信息与安全方案
     * <p>
     * 使用APIKEY类型安全方案，请求头名称为Token，
     * Knife4j授权弹窗输入Token值，会自动发送Token: {token}请求头。
     * </p>
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // .addSecurityItem(new SecurityRequirement().addList("token"))
                // .components(new Components()
                //         .addSecuritySchemes("token", new SecurityScheme()
                //                 .type(SecurityScheme.Type.APIKEY)
                //                 .in(SecurityScheme.In.HEADER)
                //                 .name("Token")
                //                 .description("请输入Token值。例如：0bd1381681e34bd199539aa6b80c554a")))
                .info(new Info()
                        .title("商城后台管理API文档")
                        .version("1.0.0")
                        .description("商城后台管理系统接口文档，提供用户、商品、分类、订单等管理模块的完整API接口"))
                .servers(List.of(
                        new Server().url("http://localhost:8081").description("本地开发环境"),
                        new Server().url("http://admin.shop.com").description("生产环境")
                ));
    }

}
