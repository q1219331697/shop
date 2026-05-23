package com.shop.admin.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限校验注解
 * <p>
 * 标注在Controller方法或类上，表示访问该接口需要的权限编码。
 * RbacInterceptor会读取此注解，校验当前用户是否拥有对应权限。
 * </p>
 *
 * @since 1.0.0
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequirePermission {

    /**
     * 权限编码，如 "system:admin:query"
     *
     * @return 权限编码
     */
    String value();
}
