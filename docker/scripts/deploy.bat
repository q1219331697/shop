@echo off
chcp 65001 >nul
REM ============================================================
REM Shop 项目 Docker 部署脚本 (Windows)
REM 用法:
REM   deploy.bat infra     # 仅启动基础设施
REM   deploy.bat app       # 仅启动应用服务
REM   deploy.bat all       # 启动所有服务
REM   deploy.bat down      # 停止所有服务
REM   deploy.bat status    # 查看服务状态
REM   deploy.bat logs      # 查看应用日志
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

echo %GREEN%[INFO]%NC% Docker 目录: %CD%

if "%~1"=="" goto help
if /i "%~1"=="infra" goto infra
if /i "%~1"=="app" goto app
if /i "%~1"=="all" goto all
if /i "%~1"=="down" goto down
if /i "%~1"=="restart" goto restart
if /i "%~1"=="status" goto status
if /i "%~1"=="logs" goto logs
if /i "%~1"=="build" goto build
if /i "%~1"=="help" goto help
if /i "%~1"=="-h" goto help

echo %RED%[ERROR]%NC% 未知命令: %~1
goto help

:infra
echo %GREEN%[INFO]%NC% 启动基础设施服务...
docker compose -f docker-compose.infra.yml up -d
echo %GREEN%[INFO]%NC% 等待基础设施就绪...
timeout /t 10 /nobreak >nul
docker compose -f docker-compose.infra.yml ps
echo.
echo %GREEN%[INFO]%NC% 基础设施启动完成
echo   MySQL:          localhost:3306
echo   Redis:          localhost:6379
echo   Kafka:          localhost:9094
echo   RabbitMQ:       http://localhost:15672 (shop/shop123)
echo   Elasticsearch:  http://localhost:9200
echo   Kibana:         http://localhost:5601
goto done

:app
echo %GREEN%[INFO]%NC% 启动应用服务...
docker compose -f docker-compose.app.yml up -d
echo %GREEN%[INFO]%NC% 等待应用服务就绪...
timeout /t 10 /nobreak >nul
docker compose -f docker-compose.app.yml ps
echo.
echo %GREEN%[INFO]%NC% 应用服务启动完成
echo   shop-admin API: http://localhost:8081
echo   shop-admin Doc: http://localhost:8081/doc.html
echo   shop-api API:   http://localhost:8080
echo   shop-api Doc:   http://localhost:8080/doc.html
goto done

:all
echo %GREEN%[INFO]%NC% 启动所有服务...
docker compose up -d
echo %GREEN%[INFO]%NC% 等待服务就绪...
timeout /t 15 /nobreak >nul
docker compose ps
echo %GREEN%[INFO]%NC% 所有服务启动完成
goto done

:down
echo %GREEN%[INFO]%NC% 停止所有服务...
docker compose -f docker-compose.app.yml down 2>nul
docker compose -f docker-compose.infra.yml down 2>nul
docker compose down 2>nul
echo %GREEN%[INFO]%NC% 所有服务已停止
goto done

:restart
echo %GREEN%[INFO]%NC% 重启应用服务...
docker compose -f docker-compose.app.yml restart
echo %GREEN%[INFO]%NC% 应用服务已重启
goto done

:status
echo %BLUE%=== 基础设施 ===%NC%
docker compose -f docker-compose.infra.yml ps 2>nul || echo 未启动
echo.
echo %BLUE%=== 应用服务 ===%NC%
docker compose -f docker-compose.app.yml ps 2>nul || echo 未启动
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
docker compose -f docker-compose.app.yml logs -f --tail 100 %SERVICE%
goto done
:logs_infra
docker compose -f docker-compose.infra.yml logs -f --tail 100 %SERVICE%
goto done

:build
echo %GREEN%[INFO]%NC% 构建镜像...
call "%SCRIPT_DIR%build.bat" all
echo %GREEN%[INFO]%NC% 启动所有服务...
docker compose up -d
timeout /t 15 /nobreak >nul
docker compose ps
echo %GREEN%[INFO]%NC% 构建部署完成
goto done

:help
echo Shop 项目 Docker 部署脚本
echo.
echo 用法: %~nx0 ^<命令^>
echo.
echo 命令:
echo   infra       仅启动基础设施（MySQL/Redis/Kafka/ELK）
echo   app         仅启动应用服务（shop-admin/shop-api）
echo   all         启动所有服务（基础设施 + 应用）
echo   down        停止所有服务
echo   restart     重启应用服务
echo   status      查看服务状态
echo   logs [svc]  查看日志（默认查看 shop-admin，支持 mysql/redis/kafka 等基础设施）
echo   build       构建镜像后部署
echo.
echo 示例:
echo   %~nx0 infra              # 开发时只启动基础设施，应用在 IDE 运行
echo   %~nx0 app                # 基础设施已启动，部署应用
echo   %~nx0 build              # 构建镜像 + 启动所有服务
echo   %~nx0 logs shop-admin    # 查看 shop-admin 日志
echo   %~nx0 logs mysql         # 查看 MySQL 日志
exit /b 0

:done
endlocal
