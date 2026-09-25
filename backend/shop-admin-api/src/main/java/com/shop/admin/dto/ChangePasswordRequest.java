package com.shop.admin.dto;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 修改当前登录管理员密码请求入参
 * <p>
 * 自助改密：管理员身份由登录态确定，不参与入参，故此处只有新旧密码。
 * 刻意不加非空/长度校验——约束仍由 Service 层统一裁决并返回原有错误码与提示，
 * 本次只把原先弱类型的 {@code Map<String, String>} 换成具名入参，不改变任何校验契约。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "修改密码请求参数")
public class ChangePasswordRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 原密码
     */
    @Schema(description = "原密码")
    private String oldPassword;

    /**
     * 新密码
     */
    @Schema(description = "新密码")
    private String newPassword;
}
