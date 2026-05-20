@echo off
chcp 65001 >nul
REM ============================================================
REM Shop 项目 Docker 部署脚本 - Windows（支持多环境）
REM 用法:
REM   deploy.bat infra             # 启动基础设施（默认环境）
REM   deploy.bat app               # 启动应用服务（默认环境）
REM   deploy.bat -e prod all       # 生产环境启动所有服务
REM   deploy.bat down              # 停止默认环境所有服务
REM   deploy.bat status            # 查看默认环境服务状态
REM   deploy.bat logs              # 查看默认环境应用日志
REM
REM 环境说明:
REM   prod  - 生产环境（.env.prod，需先从模板创建）
REM   默认  - 测试/开发环境（.env）
REM ============================================================

setlocal enabledelayedexpansion

REM 颜色定义（Windows 10+ 支持 ANSI 转义码）
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "BLUE=%ESC%[94m"
set "NC=%ESC%[0m"

REM 保存脚本目录
set SCRIPT_DIR=%~dp0

cd /d "%SCRIPT_DIR%.."
set DOCKER_DIR=%CD%

REM ==================== 解析环境参数 ====================
set ENV=default
set COMMAND=

:parse_args
if "%~1"=="" goto parse_done
if /i "%~1"=="-e" (
    shift
    set ENV=%~1
    shift
    goto parse_args
)
if /i "%~1"=="--env" (
    shift
    set ENV=%~1
    shift
    goto parse_args
)
set COMMAND=%~1
shift
goto parse_args

:parse_done

REM 验证环境参数
if /i "%ENV%"=="default" goto env_ok
if /i "%ENV%"=="prod" goto env_ok
echo %RED%[ERROR]%NC% 不支持的环境: %ENV%，仅支持 default / prod
goto help

:env_ok

REM 确定环境配置文件
if /i "%ENV%"=="prod" (
    set ENV_FILE=%DOCKER_DIR%\.env.prod
    if not exist "%ENV_FILE%" (
        echo %RED%[ERROR]%NC% 生产环境配置不存在，请先创建: copy .env.prod.template .env.prod 并修改配置值
        exit /b 1
    )
) else (
    set ENV_FILE=%DOCKER_DIR%\.env
    if not exist "%ENV_FILE%" (
        echo %RED%[ERROR]%NC% 环境配置文件不存在: %ENV_FILE%
        exit /b 1
    )
)

REM 读取 APP_NAME
for /f "tokens=1,* delims==" %%a in ('findstr /b "APP_NAME=" "%ENV_FILE%"') do set ENV_NAME=%%b

echo %GREEN%[INFO]%NC% 环境: %ENV% (%ENV_NAME%)
echo %GREEN%[INFO]%NC% Docker 目录: %DOCKER_DIR%

REM Compose 公共参数
set COMPOSE_OPTS=--env-file %ENV_FILE%

if "%COMMAND%"=="" goto help
if /i "%COMMAND%"=="infra" goto infra
if /i "%COMMAND%"=="app" goto app
if /i "%COMMAND%"=="all" goto all
if /i "%COMMAND%"=="down" goto down
if /i "%COMMAND%"=="restart" goto restart
if /i "%COMMAND%"=="status" goto status
if /i "%COMMAND%"=="logs" goto logs
if /i "%COMMAND%"=="build" goto build
if /i "%COMMAND%"=="help" goto help
if /i "%COMMAND%"=="-h" goto help

echo %RED%[ERROR]%NC% 未知命令: %COMMAND%
goto help

:infra
echo %GREEN%[INFO]%NC% 启动基础设施服务 [%ENV%]...
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml up -d
echo %GREEN%[INFO]%NC% 等待基础设施就绪...
timeout /t 10 /nobreak >nul
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml ps
echo.
echo %GREEN%[INFO]%NC% 基础设施启动完成 [%ENV%]
echo   MySQL:          localhost:3306
echo   Redis:          localhost:6379
echo   Kafka:          localhost:9094
echo   RabbitMQ:       http://localhost:15672 (shop/shop123)
echo   Elasticsearch:  http://localhost:9200
echo   Kibana:         http://localhost:5601
goto done

:app
echo %GREEN%[INFO]%NC% 启动应用服务 [%ENV%]...
REM 检查基础设施网络是否存在
docker network inspect "%ENV_NAME%_network" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARN]%NC% 基础设施网络不存在，请先运行: %~nx0 -e %ENV% infra
    echo %GREEN%[INFO]%NC% 正在自动启动基础设施...
    docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml up -d
    echo %GREEN%[INFO]%NC% 等待基础设施就绪...
    timeout /t 15 /nobreak >nul
)
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml up -d
echo %GREEN%[INFO]%NC% 等待应用服务就绪...
timeout /t 10 /nobreak >nul
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml ps
echo.
echo %GREEN%[INFO]%NC% 应用服务启动完成 [%ENV%]
REM 从环境文件读取端口
for /f "tokens=2 delims==" %%a in ('findstr /b "ADMIN_PORT=" "%ENV_FILE%"') do set ADMIN_PORT_VAL=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "API_PORT=" "%ENV_FILE%"') do set API_PORT_VAL=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "ADMIN_UI_PORT=" "%ENV_FILE%"') do set ADMIN_UI_PORT_VAL=%%a
echo   shop-admin API: http://localhost:!ADMIN_PORT_VAL!
echo   shop-admin Doc: http://localhost:!ADMIN_PORT_VAL!/doc.html
echo   shop-api API:   http://localhost:!API_PORT_VAL!
echo   shop-api Doc:   http://localhost:!API_PORT_VAL!/doc.html
echo   admin-ui:       http://localhost:!ADMIN_UI_PORT_VAL!
goto done

:all
echo %GREEN%[INFO]%NC% 启动所有服务 [%ENV%]...
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml -f docker-compose.app.yml up -d
echo %GREEN%[INFO]%NC% 等待服务就绪...
timeout /t 15 /nobreak >nul
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml -f docker-compose.app.yml ps
echo %GREEN%[INFO]%NC% 所有服务启动完成 [%ENV%]
goto done

:down
echo %GREEN%[INFO]%NC% 停止所有服务 [%ENV%]...
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml down 2>nul || true
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml down 2>nul || true
echo %GREEN%[INFO]%NC% 所有服务已停止 [%ENV%]
goto done

:restart
echo %GREEN%[INFO]%NC% 重启应用服务 [%ENV%]...
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml restart
echo %GREEN%[INFO]%NC% 应用服务已重启 [%ENV%]
goto done

:status
echo %BLUE%=== 环境: %ENV% (%ENV_NAME%) ===%NC%
echo %BLUE%=== 基础设施 ===%NC%
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml ps 2>nul || echo 未启动
echo.
echo %BLUE%=== 应用服务 ===%NC%
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml ps 2>nul || echo 未启动
goto done

:logs
set SERVICE=%2
if "%SERVICE%"=="" set SERVICE=shop-admin
REM 判断是查看基础设施还是应用服务日志
if /i "%SERVICE%"=="mysql" goto logs_infra
if /i "%SERVICE%"=="redis" goto logs_infra
if /i "%SERVICE%"=="kafka" goto logs_infra
if /i "%SERVICE%"=="rabbitmq" goto logs_infra
if /i "%SERVICE%"=="elasticsearch" goto logs_infra
if /i "%SERVICE%"=="kibana" goto logs_infra
if /i "%SERVICE%"=="zookeeper" goto logs_infra
if /i "%SERVICE%"=="infra" goto logs_infra
docker compose %COMPOSE_OPTS% -f docker-compose.app.yml logs -f --tail 100 %SERVICE%
goto done
:logs_infra
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml logs -f --tail 100 %SERVICE%
goto done

:build
echo %GREEN%[INFO]%NC% 构建镜像...
call "%SCRIPT_DIR%build.bat" all
echo %GREEN%[INFO]%NC% 启动所有服务 [%ENV%]...
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml -f docker-compose.app.yml up -d
timeout /t 15 /nobreak >nul
docker compose %COMPOSE_OPTS% -f docker-compose.infra.yml -f docker-compose.app.yml ps
echo %GREEN%[INFO]%NC% 构建部署完成 [%ENV%]
goto done

:help
echo Shop 项目 Docker 部署脚本（多环境）
echo.
echo 用法: %~nx0 -e ^<环境^> ^<命令^>
echo.
echo 环境:
echo   default     测试/开发环境（默认，使用 .env）
echo   prod        生产环境（使用 .env.prod）
echo.
echo 命令:
echo   infra       仅启动基础设施（MySQL/Redis/Kafka/ELK）
echo   app         仅启动应用服务（shop-admin/shop-api/admin-ui）
echo   all         启动所有服务（基础设施 + 应用）
echo   down        停止当前环境所有服务
echo   restart     重启应用服务
echo   status      查看服务状态
echo   logs [svc]  查看日志（默认查看 shop-admin，支持 mysql/redis/kafka 等基础设施）
echo   build       构建镜像后部署
echo.
echo 示例:
echo   %~nx0 infra                      # 默认环境启动基础设施
echo   %~nx0 app                        # 默认环境启动应用
echo   %~nx0 -e prod all                # 生产环境启动所有服务
echo   %~nx0 down                       # 停止默认环境
echo   %~nx0 logs shop-admin            # 查看默认环境 shop-admin 日志
echo   %~nx0 -e prod logs mysql         # 查看生产环境 MySQL 日志
exit /b 0

:done
endlocal
