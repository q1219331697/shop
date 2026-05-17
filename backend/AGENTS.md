# 项目 AI 编码约定

> 本文件供 AI 编码助手参考，修改代码前请务必遵守以下约定。

---

## 禁止直接用终端命令修改 .sh 文件

- build.sh / deploy.sh 等 Linux 脚本中包含 `${var}`、`$(command)` 等 bash 语法
- 当前命令行为 PowerShell，其转义规则会破坏这些语法，导致文件损坏
- **修改 .sh 文件必须用 create_file 整体重写，禁止用终端命令行替换**

## 语言环境

- 所有注释、文档、日志输出、提示信息必须使用**中文**
- 代码变量名、函数名、类名使用英文，但注释和文档用中文
- commit message 使用中文
- README 等文档使用中文

## 终端环境

- 当前终端环境为 **Windows PowerShell**
- PowerShell 与 Bash 语法差异大，执行终端命令时必须使用 PowerShell 语法
  - 变量引用：`$var`（非 `${var}`）
  - 字符串拼接：用 `+` 或直接双引号内插值
  - 换行符：`` ` ``（反引号，非 `\`）
  - 路径分隔符：`\` 或 `/` 均可
  - 管道和重定向语法与 Bash 不同
- 修改 .sh 文件必须用 create_file 整体重写，禁止用终端命令行替换（PowerShell 转义会破坏 bash 语法）

## 文件编码

- 所有 .bat 文件开头必须有 `chcp 65001 >nul`，防止中文乱码
- .sh 文件使用 UTF-8 编码，换行符为 LF

## Docker 相关

- Dockerfile 保持两个独立文件：`Dockerfile.admin` 和 `Dockerfile.api`，不合并
- docker-compose.yml 使用 `include` 引入 infra 和 app 文件，不重复定义服务
- 基础设施服务必须配置 `restart: unless-stopped`
- Elasticsearch 必须配置 `mem_limit: 1g`

## 脚本风格

- .bat 文件使用 ANSI 颜色输出（GREEN/RED/YELLOW/BLUE）
- .sh 文件使用 echo -e 颜色输出
- 错误信息用红色 [ERROR]，普通信息用绿色 [INFO]，警告用黄色 [WARN]
