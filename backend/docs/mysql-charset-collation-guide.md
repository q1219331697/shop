# 字符集与排序规则备忘

> `utf8mb4_0900_ai_ci` 自 **MySQL 8.0** 起可用，为 8.0 默认排序规则；MySQL 5.7 及以下请使用 `utf8mb4_unicode_ci`。

## 命名拆解

项目统一使用 `utf8mb4_0900_ai_ci`，各部分含义：

| 部分 | 含义 | 说明 |
|------|------|------|
| `utf8mb4` | 每字符最多 4 字节 | 完整支持 Unicode，含 Emoji |
| `0900` | 基于 Unicode 9.0 | 排序精度：`general_ci`(3.x) → `unicode_ci`(4.0) → `0900`(9.0) 递增 |
| `ai` | Accent Insensitive | 不区分重音（é = e, ü = u） |
| `ci` | Case Insensitive | 不区分大小写（A = a） |

## 排序规则演进

`general_ci`（Unicode 3.x）→ `unicode_ci`（Unicode 4.0）→ `0900_ai_ci`（Unicode 9.0）

## 变体一览

| 排序规则 | 重音 | 大小写 | 适用场景 |
|----------|------|--------|----------|
| `utf8mb4_general_ci` | 不区分 | 不区分 | 最旧，基于 Unicode 3.x，排序最不精确 |
| `utf8mb4_unicode_ci` | 不区分 | 不区分 | MySQL 5.7 兼容，基于 Unicode 4.0 |
| `utf8mb4_0900_ai_ci` | 不区分 | 不区分 | **项目默认**（MySQL 8.0+），基于 Unicode 9.0 |
| `utf8mb4_0900_as_ci` | 区分 | 不区分 | 需要区分重音 |
| `utf8mb4_0900_ai_cs` | 不区分 | 区分 | 需要区分大小写 |
| `utf8mb4_0900_as_cs` | 区分 | 区分 | 精确匹配 |
| `utf8mb4_0900_bin` | — | — | 二进制精确匹配 |
