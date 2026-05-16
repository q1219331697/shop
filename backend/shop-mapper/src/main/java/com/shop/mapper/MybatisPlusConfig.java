package com.shop.mapper;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis Plus閰嶇疆绫?
 * @since 1.0.0
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * 鍗曢〉鍒嗛〉鏉℃暟闄愬埗
     */
    private static final Long MAX_PAGE_LIMIT = 500L;

    /**
     * 閰嶇疆MyBatis Plus鎷︽埅鍣?
     * @return MyBatis Plus鎷︽埅鍣?
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 娣诲姞鍒嗛〉鎻掍欢
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);
        // 璁剧疆璇锋眰鐨勯〉闈㈠ぇ浜庢渶澶ч〉鍚庢搷浣滐紝true璋冨洖鍒伴椤碉紝false缁х画璇锋眰  榛樿false
        paginationInterceptor.setOverflow(false);
        // 鍗曢〉鍒嗛〉鏉℃暟闄愬埗锛岄粯璁ゆ棤闄愬埗
        paginationInterceptor.setMaxLimit(MAX_PAGE_LIMIT);
        // 娣诲姞鍒嗛〉鎻掍欢
        interceptor.addInnerInterceptor(paginationInterceptor);
        return interceptor;
    }
}
