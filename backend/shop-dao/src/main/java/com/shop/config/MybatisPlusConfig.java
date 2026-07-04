package com.shop.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis Plus 配置类
 * @since 1.0.0
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * 分页插件配置
     */
    private static final Long MAX_PAGE_LIMIT = 500L;

    /**
     * 配置MyBatis Plus插件
     * @return MyBatis Plus插件
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        // 设置请求的页面大于最大页后操作，true调回到首页，false 继续请求  默认false
        paginationInterceptor.setOverflow(false);
        // 单页分页条数限制，默认500条，-1不受限制
        paginationInterceptor.setMaxLimit(MAX_PAGE_LIMIT);
        // 添加分页插件
        interceptor.addInnerInterceptor(paginationInterceptor);
        return interceptor;
    }
}
