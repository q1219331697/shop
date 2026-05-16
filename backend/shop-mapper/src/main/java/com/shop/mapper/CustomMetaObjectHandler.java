package com.shop.mapper;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 瀛楁鑷姩濉厖澶勭悊鍣?
 * 鐢ㄤ簬鍦ㄦ彃鍏ュ拰鏇存柊鎿嶄綔鏃惰嚜鍔ㄥ～鍏呭垱寤烘椂闂村拰鏇存柊鏃堕棿
 * @since 1.0.0
 */
@Component
public class CustomMetaObjectHandler implements MetaObjectHandler {

    /**
     * 鎻掑叆鎿嶄綔鏃惰嚜鍔ㄥ～鍏呭瓧娈?
     * @param metaObject 鍏冨璞?
     */
    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }

    /**
     * 鏇存柊鎿嶄綔鏃惰嚜鍔ㄥ～鍏呭瓧娈?
     * @param metaObject 鍏冨璞?
     */
    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }
}
