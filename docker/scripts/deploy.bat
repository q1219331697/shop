@echo off
chcp 65001 >nul

REM ============================================================
REM 商项目Docker部署脚本 (Windows)
REM 使用方法:
REM   deploy.bat [命令] [选项]
REM 
REM 命令:
REM   infra      仅启动基础设施服务
REM   app        仅启动应用服务
REM   all        启动所有服务
REM   down       停止当前环境所有服务
REM   restart    重启应用服务
REM   status     查看服务状态
REM   logs [svc] 查看日志
REM   build      构建镜像后部署
REM 
REM 选项:
REM   -e <env>   指定环境 (dev/uat/prod)
REM   -h         显示帮助信息
REM ============================================================

REM 设置默认值
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..set COMPOSE_DIR=%PROJECT_DIR%docker
set ENV_FILE=%COMPOSE_DIR%\.env
set ENV_NAME=dev  REM 默认环境
set COMMAND=

REM 显示帮助信息
:show_help
echo 商项目Docker部署脚本
echo.
echo 用法: %0 [命令] [选项]
echo.
echo 命令:
echo   infra      仅启动基础设施服务
echo   app        仅启动应用服务
echo   all        启动所有服务
echo   down       停止当前环境所有服务
echo   restart    重启应用服务
echo   status     查看服务状态
echo   logs [svc] 查看日志
echo   build      构建镜像后部署
echo.
echo 选项:
echo   -e ^<env^>   指定环境 (dev/uat/prod)
echo   -h         显示帮助信息
echo.
echo 示例:
echo   %0 all                    REM 默认环境启动所有服务
echo   %0 -e prod all            REM 生产环境启动所有服务
echo   %0 -e uat status          REM UAT环境查看服务状态
echo   %0 logs shop-admin       REM 查看shop-admin日志
goto :eof

REM 解析命令行参数
:parse_args
if "%~1"=="" goto :start_command
if /i "%~1"=="-h" (
    call :show_help
    exit /b 0
)
if /i "%~1"=="-e" (
    set ENV_NAME=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="infra" (
    set COMMAND=infra
    shift
    goto :parse_args
)
if "%~1"=="app" (
    set COMMAND=app
    shift
    goto :parse_args
)
if "%~1"=="all" (
    set COMMAND=all
    shift
    goto :parse_args
)
if "%~1"=="down" (
    set COMMAND=down
    shift
    goto :parse_args
)
if "%~1"=="restart" (
    set COMMAND=restart
    shift
    goto :parse_args
)
if "%~1"=="status" (
    set COMMAND=status
    shift
    goto :parse_args
)
if "%~1"=="logs" (
    set COMMAND=logs
    shift
    goto :parse_args
)
if "%~1"=="build" (
    set COMMAND=build
    shift
    goto :parse_args
)
REM 如果第一个参数不是选项，则视为命令
if "%COMMAND%"=="" (
    set COMMAND=%~1
    shift
    goto :parse_args
)
echo 错误: 未知参数 "%~1"
exit /b 1

REM 设置环境变量文件
:set_env_file
if "%ENV_NAME%"=="dev" (
    set ENV_FILE=%COMPOSE_DIR%\.env
) else if "%ENV_NAME%"=="uat" (
    set ENV_FILE=%COMPOSE_DIR%\.env.uat
) else if "%ENV_NAME%"=="prod" (
    if not exist "%COMPOSE_DIR%\.env.prod" (
        echo 警告: 生产环境配置文件不存在，从模板创建...
        copy "%COMPOSE_DIR%\.env.prod.template" "%COMPOSE_DIR%\.env.prod" >nul
        echo 请编辑 %COMPOSE_DIR%\.env.prod 文件，修改敏感配置（如密码等）后再试。
        exit /b 1
    )
    set ENV_FILE=%COMPOSE_DIR%\.env.prod
) else (
    echo 错误: 未知环境 "%ENV_NAME%"，支持的环境: dev, uat, prod
    exit /b 1
)
goto :eof

REM 执行Docker命令
:run_docker
set cmd=%1
shift
echo 执行: docker compose -f "%COMPOSE_DIR%\docker-compose.yml" %cmd% %*
docker compose -f "%COMPOSE_DIR%\docker-compose.yml" %cmd% %*
goto :eof

REM 执行Docker命令（使用指定环境文件）
:run_docker_with_env
set cmd=%1
shift
echo 执行: docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.yml" %cmd% %*
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.yml" %cmd% %*
goto :eof

REM 执行Docker命令（仅基础设施）
:run_docker_infra
set cmd=%1
shift
echo 执行: docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.infra.yml" %cmd% %*
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.infra.yml" %cmd% %*
goto :eof

REM 执行Docker命令（仅应用）
:run_docker_app
set cmd=%1
shift
echo 执行: docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.app.yml" %cmd% %*
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_DIR%\docker-compose.app.yml" %cmd% %*
goto :eof

REM 构建镜像
:build_images
echo 构建Docker镜像...
call "%SCRIPT_DIR%build.bat" all
if %ERRORLEVEL% neq 0 (
    echo 错误: 镜像构建失败
    exit /b 1
)
goto :eof

REM 主程序
:start_command
call :parse_args %*

REM 如果没有指定命令，显示帮助
if "%COMMAND%"=="" (
    call :show_help
    exit /b 0
)

REM 设置环境变量文件
call :set_env_file

REM 根据命令执行相应操作
if "%COMMAND%"=="infra" (
    echo 启动基础设施服务 (环境: %ENV_NAME%)...
    call :run_docker_infra up -d
) else if "%COMMAND%"=="app" (
    echo 启动应用服务 (环境: %ENV_NAME%)...
    call :run_docker_app up -d
) else if "%COMMAND%"=="all" (
    echo 启动所有服务 (环境: %ENV_NAME%)...
    call :run_docker_with_env up -d
) else if "%COMMAND%"=="down" (
    echo 停止所有服务 (环境: %ENV_NAME%)...
    call :run_docker_with_env down
) else if "%COMMAND%"=="restart" (
    echo 重启应用服务 (环境: %ENV_NAME%)...
    call :run_docker_app restart
) else if "%COMMAND%"=="status" (
    echo 服务状态 (环境: %ENV_NAME%):
    call :run_docker_with_env ps
) else if "%COMMAND%"=="logs" (
    set service=%1
    if not "%service%"=="" (
        echo 查看服务 %service% 日志 (环境: %ENV_NAME%):
        call :run_docker_with_env logs -f %service%
    ) else (
        echo 查看所有服务日志 (环境: %ENV_NAME%):
        call :run_docker_with_env logs -f
    )
) else if "%COMMAND%"=="build" (
    echo 构建镜像并部署 (环境: %ENV_NAME%)...
    call :build_images
    call :run_docker_with_env up -d
) else (
    echo 错误: 未知命令 "%COMMAND%"
    echo 使用 -h 或 --help 查看帮助信息
    exit /b 1
)
