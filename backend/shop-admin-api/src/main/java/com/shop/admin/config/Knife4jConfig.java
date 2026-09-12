package com.shop.admin.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Knife4j配置类 - API文档展示与授权配置
 * <p>
 * 启用 Token 请求头认证方案，用户在 Swagger UI 授权弹窗输入 Token 后，
 * 后续请求自动携带 Token 请求头进行鉴权。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Configuration
public class Knife4jConfig {

    private static final String SECURITY_SCHEME_TOKEN = "tokenAuth";

    /**
     * 配置OpenAPI文档信息与安全方案
     * <p>
     * 安全方案：APIKEY (Token请求头) - 用于已获取 Token 后的直接认证
     * </p>
     *
     * @return OpenAPI配置实例
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        // Token 请求头认证方案
                        .addSecuritySchemes(SECURITY_SCHEME_TOKEN, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("Token")
                                .description("直接输入Token值。例如：0bd1381681e34bd199539aa6b80c554a"))
                )
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
