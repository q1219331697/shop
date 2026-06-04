@echo off
chcp 65001 >nul
REM ============================================================
REM Shop 项目 Docker 镜像构建脚本 (Windows)
REM 用法:
REM   build.bat           # 构建所有镜像
REM   build.bat admin     # 仅构建 shop-admin
REM   build.bat api       # 仅构建 shop-api
REM   build.bat admin-ui  # 仅构建 shop-admin-ui
REM   build.bat --no-cache # 不使用缓存构建
REM
REM 版本标签格式: 基础版本-日期-序号（如 1.0.0-20260518-1）
REM   -v 1.2.0             → 1.2.0-20260518-1
REM   同日再次构建          → 1.2.0-20260518-2
REM ============================================================

setlocal enabledelayedexpansion

REM 在 shift 前保存脚本目录（shift 会改变 %0）
set SCRIPT_DIR=%~dp0

set BASE_VERSION=1.0.0
set NO_CACHE=
set TARGET=all

REM 生成构建日期（YYYYMMDD）
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value ^| find "="') do set DATETIME=%%i
set BUILD_DATE=%DATETIME:~0,8%

:parse_args
if "%~1"=="" goto end_parse
if /i "%~1"=="--no-cache" (
    set NO_CACHE=--no-cache
    shift
    goto parse_args
)
if /i "%~1"=="admin" (
    set TARGET=admin
    shift
    goto parse_args
)
if /i "%~1"=="api" (
    set TARGET=api
    shift
    goto parse_args
)
if /i "%~1"=="admin-ui" (
    set TARGET=admin-ui
    shift
    goto parse_args
)
if /i "%~1"=="-v" (
    set BASE_VERSION=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-h" (
    echo 用法: %~nx0 [选项] [目标]
    echo.
    echo 目标:
    echo   admin       仅构建 shop-admin 镜像
    echo   api         仅构建 shop-api 镜像
    echo   admin-ui    仅构建 shop-admin-ui 镜像
    echo   all         构建所有镜像（默认）
    echo.
    echo 选项:
    echo   --no-cache  不使用 Docker 缓存
    echo   -v VERSION  指定基础版本号（默认: 1.0.0，自动追加日期序号）
    echo   -h          显示帮助信息
    echo.
    echo 版本标签格式: 基础版本-日期-序号
    echo   示例: 1.0.0-20260518-1
    echo   同日多次构建序号自动递增: 1.0.0-20260518-1 → 1.0.0-20260518-2
    exit /b 0
)
echo [ERROR] 未知参数: %~1
exit /b 1
:end_parse

REM 切换到项目根目录（scripts 在 docker/scripts 下，需向上两级）
cd /d "%SCRIPT_DIR%..\.."
set PROJECT_ROOT=%CD%

echo.
echo ========================================
echo   Shop 项目 Docker 镜像构建
echo ========================================
echo [INFO] 项目根目录: %CD%
echo [INFO] 基础版本:   %BASE_VERSION%
echo [INFO] 构建日期:   %BUILD_DATE%
echo [INFO] 构建目标:   %TARGET%
if "%NO_CACHE%"=="--no-cache" (
    echo [WARN] 已启用 --no-cache，将不使用 Docker 缓存
)
echo.

REM -------------------- 阶段1: 前置检查 --------------------
echo [1/4] 前置检查
echo ----------------------------------------

echo [CHECK] 检查 Docker 是否运行...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未运行或未安装，请先启动 Docker
    exit /b 1
)
echo [OK] Docker 正在运行

echo [CHECK] 检查 Docker 磁盘空间...
for /f "tokens=*" %%i in ('docker system df --format "{{.Size}}" 2^>nul') do echo [OK] Docker 磁盘使用: %%i

echo [CHECK] 检查项目文件完整性...
if not exist "backend\pom.xml" (
    echo [ERROR] 未找到 backend\pom.xml，请确认在项目根目录运行
    exit /b 1
)
echo [OK] backend\pom.xml 存在
if not exist "docker\Dockerfile.admin" (
    echo [ERROR] 未找到 docker\Dockerfile.admin
    exit /b 1
)
echo [OK] Dockerfile.admin 存在
if not exist "docker\Dockerfile.api" (
    echo [ERROR] 未找到 docker\Dockerfile.api
    exit /b 1
)
echo [OK] Dockerfile.api 存在
if not exist "docker\Dockerfile.admin-ui" (
    echo [ERROR] 未找到 docker\Dockerfile.admin-ui
    exit /b 1
)
echo [OK] Dockerfile.admin-ui 存在
echo.

if not "%TARGET%"=="admin" if not "%TARGET%"=="api" if not "%TARGET%"=="admin-ui" if not "%TARGET%"=="all" (
    echo [ERROR] 未知目标: %TARGET%
    exit /b 1
)

REM -------------------- 阶段2: 构建应用镜像 --------------------
echo [2/3] 构建应用镜像
echo ----------------------------------------

REM 自动计算当日构建序号
:calc_seq
set SEQ=1
for /f "tokens=*" %%t in ('docker images --format "{{.Tag}}" shop-admin 2^>nul ^| findstr /r ".*-%BUILD_DATE%-[0-9]*"') do (
    for /f "tokens=3 delims=-" %%s in ("%%t") do (
        if %%s GEQ !SEQ! set /a SEQ=%%s+1
    )
)
set VERSION=%BASE_VERSION%-%BUILD_DATE%-%SEQ%
echo [INFO] 镜像版本:   %VERSION%
echo.

:build_admin
if not "%TARGET%"=="admin" if not "%TARGET%"=="all" goto build_api
echo [BUILD] 构建 shop-admin:%VERSION%
echo [BUILD]   阶段1: maven:3.9-eclipse-temurin-17 (编译打包)
echo [BUILD]   阶段2: eclipse-temurin:17-jre-alpine (精简运行)
echo.
docker build %NO_CACHE% --progress=plain -t shop-admin:%VERSION% -t shop-admin:latest -t shop-admin:%BASE_VERSION% -f docker/Dockerfile.admin .
if errorlevel 1 (
    echo.
    echo [ERROR] shop-admin:%VERSION% 构建失败！请检查上方构建日志
    exit /b 1
)
echo.
echo [OK] shop-admin:%VERSION% 构建成功
echo.

:build_api
if not "%TARGET%"=="api" if not "%TARGET%"=="all" goto build_admin_ui
echo [BUILD] 构建 shop-api:%VERSION%
echo [BUILD]   阶段1: maven:3.9-eclipse-temurin-17 (编译打包)
echo [BUILD]   阶段2: eclipse-temurin:17-jre-alpine (精简运行)
echo.
docker build %NO_CACHE% --progress=plain -t shop-api:%VERSION% -t shop-api:latest -t shop-api:%BASE_VERSION% -f docker/Dockerfile.api .
if errorlevel 1 (
    echo.
    echo [ERROR] shop-api:%VERSION% 构建失败！请检查上方构建日志
    exit /b 1
)
echo.
echo [OK] shop-api:%VERSION% 构建成功
echo.

:build_admin_ui
if not "%TARGET%"=="admin-ui" if not "%TARGET%"=="all" goto done
echo [BUILD] 构建 shop-admin-ui:%VERSION%
echo [BUILD]   阶段1: node:20-alpine (编译打包)
echo [BUILD]   阶段2: nginx:1.27-alpine (精简运行)
echo.
docker build %NO_CACHE% --progress=plain -t shop-admin-ui:%VERSION% -t shop-admin-ui:latest -t shop-admin-ui:%BASE_VERSION% -f docker/Dockerfile.admin-ui .
if errorlevel 1 (
    echo.
    echo [ERROR] shop-admin-ui:%VERSION% 构建失败！请检查上方构建日志
    exit /b 1
)
echo.
echo [OK] shop-admin-ui:%VERSION% 构建成功
echo.

REM -------------------- 阶段3: 构建结果汇总 --------------------
:done
echo [3/3] 构建结果汇总
echo ----------------------------------------

REM 删除历史版本的镜像（保留 latest 和 BASE_VERSION）
echo [CLEAN] 清理历史版本镜像...
for /f "tokens=*" %%i in ('docker images --format "{{.Repository}}:{{.Tag}}" ^| findstr /r "shop-admin:.*-%BUILD_DATE%- shop-api:.*-%BUILD_DATE%- shop-admin-ui:.*-%BUILD_DATE%-"') do (
    if not "%%i"=="shop-admin:%VERSION%" (
        if not "%%i"=="shop-api:%VERSION%" (
            if not "%%i"=="shop-admin-ui:%VERSION%" (
                echo [DELETE] %%i
                docker rmi %%i 2>nul
            )
        )
    )
)
echo [OK] 历史版本镜像清理完成
echo.

echo [OK] 全部构建完成！
echo.
echo 镜像列表:
docker images --format "  {{.Repository}}:{{.Tag}}	{{.Size}}	{{.CreatedAt}}" | findstr "shop-admin shop-api shop-admin-ui"
echo.
echo 运行方式:
echo   docker-compose -f docker/docker-compose.app.yml up -d
exit /b 0
