package com.shop.mapper;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis Plus配置�?
 * @since 1.0.0
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * 单页分页条数限制
     */
    private static final Long MAX_PAGE_LIMIT = 500L;

    /**
     * 配置MyBatis Plus拦截�?
     * @return MyBatis Plus拦截�?
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        // 设置请求的页面大于最大页后操作，true调回到首页，false继续请求  默认false
        paginationInterceptor.setOverflow(false);
        // 单页分页条数限制，默认无限制
        paginationInterceptor.setMaxLimit(MAX_PAGE_LIMIT);
        // 添加分页插件
        interceptor.addInnerInterceptor(paginationInterceptor);
        return interceptor;
    }
}
