@echo off
chcp 65001 >nul

REM ============================================================
REM 商项目Docker镜像构建脚本 (Windows)
REM 使用方法:
REM   ./build.bat           # 构建所有镜像
REM   ./build.bat admin     # 仅构建 shop-admin-api
REM   ./build.bat api       # 仅构建 shop-app-api
REM   ./build.bat admin-ui  # 仅构建 shop-admin-ui
REM   ./build.bat --no-cache # 不使用缓存构建
REM   ./build.bat -v 2.1.0 --no-cache admin  # 使用版本2.1.0无缓存构建admin-api
REM ============================================================

REM 设置默认版本
set BASE_VERSION=1.0.0

REM 使用bash风格切换目录
cd /d "%~dp0..\.."

REM 设置默认值
set BUILD_TARGET=all
set NO_CACHE=0
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..\..
REM 使用bash风格参数解析
:parse_args
if "%~1"=="" goto start_build
if /i "%~1"=="admin" (
    set BUILD_TARGET=admin
    shift
    goto parse_args
)
if /i "%~1"=="api" (
    set BUILD_TARGET=api
    shift
    goto parse_args
)
if /i "%~1"=="admin-ui" (
    set BUILD_TARGET=admin-ui
    shift
    goto parse_args
)
if /i "%~1"=="--no-cache" (
    set NO_CACHE=1
    shift
    goto parse_args
)
if /i "%~1"=="-v" (
    set BASE_VERSION=%~2
    shift
    shift
    goto parse_args
)
echo 错误: 未知参数 "%~1"
exit /b 1

:start_build
echo 开始构建镜像, 版本: %BASE_VERSION%
echo 构建目标: %BUILD_TARGET%
echo 无缓存: %NO_CACHE%

if %NO_CACHE%==1 (
    set CACHE_FLAG=--no-cache
) else (
    set CACHE_FLAG=
)

echo.
echo 正在构建镜像...

REM 构建镜像
if "%BUILD_TARGET%"=="all" (
    echo 正在构建所有镜像...

    echo.
    echo 正在构建 shop-admin-api...
    docker build -f docker/Dockerfile.admin-api -t shop-admin-api:%BASE_VERSION% -t shop-admin-api:latest %CACHE_FLAG% .

    echo.
    echo 正在构建 shop-app-api...
    docker build -f docker/Dockerfile.app-api -t shop-app-api:%BASE_VERSION% -t shop-app-api:latest %CACHE_FLAG% .

    echo.
    echo 正在构建 shop-admin-ui...
    docker build -f docker/Dockerfile.admin-ui -t shop-admin-ui:%BASE_VERSION% -t shop-admin-ui:latest %CACHE_FLAG% .
) else if "%BUILD_TARGET%"=="admin" (
    echo 正在构建 shop-admin-api...
    docker build -f docker/Dockerfile.admin-api -t shop-admin-api:%BASE_VERSION% -t shop-admin-api:latest %CACHE_FLAG% .
) else if "%BUILD_TARGET%"=="api" (
    echo 正在构建 shop-app-api...
    docker build -f docker/Dockerfile.app-api -t shop-app-api:%BASE_VERSION% -t shop-app-api:latest %CACHE_FLAG% .
) else if "%BUILD_TARGET%"=="admin-ui" (
    echo 正在构建 shop-admin-ui...
    docker build -f docker/Dockerfile.admin-ui -t shop-admin-ui:%BASE_VERSION% -t shop-admin-ui:latest %CACHE_FLAG% .
) else (
    echo 错误: 未知构建目标 "%BUILD_TARGET%"
    exit /b 1
)

echo.
echo 构建完成!
exit /b 0
