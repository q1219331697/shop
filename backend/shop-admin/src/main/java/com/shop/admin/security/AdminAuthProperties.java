package com.shop.admin.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 管理员认证配置属性
 * <p>
 * 从application.yml中读取admin.auth下的白名单路径配置
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Component
@ConfigurationProperties(prefix = "admin.auth")
public class AdminAuthProperties {

    /**
     * 前缀匹配的放行路径列表（无需认证即可访问）
     */
    private List<String> permitPrefixPaths = new ArrayList<>();

}
