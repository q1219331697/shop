@echo off
REM ============================================================
REM Shop 项目 Docker 镜像构建脚本 (Windows)
REM 用法:
REM   build.bat           # 构建所有镜像
REM   build.bat admin     # 仅构建 shop-admin
REM   build.bat api       # 仅构建 shop-api
REM   build.bat --no-cache # 不使用缓存构建
REM ============================================================

setlocal enabledelayedexpansion

REM 在 shift 前保存脚本目录（shift 会改变 %0）
set SCRIPT_DIR=%~dp0

set VERSION=1.0.0
set NO_CACHE=
set TARGET=all

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
if /i "%~1"=="-v" (
    set VERSION=%~2
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
    echo   all         构建所有镜像（默认）
    echo.
    echo 选项:
    echo   --no-cache  不使用 Docker 缓存
    echo   -v VERSION  指定版本号（默认: 1.0.0）
    echo   -h          显示帮助信息
    exit /b 0
)
shift
goto parse_args
:end_parse

REM 切换到项目根目录（scripts 在 docker/scripts 下，需向上两级）
cd /d "%SCRIPT_DIR%..\.."
set PROJECT_ROOT=%CD%

echo [INFO] 项目根目录: %CD%
echo [INFO] 镜像版本: %VERSION%

if "%TARGET%"=="admin" goto build_admin
if "%TARGET%"=="api" goto build_api
if "%TARGET%"=="all" goto build_all

:build_admin
echo ==========================================
echo [INFO] 构建 shop-admin:%VERSION% 镜像（多阶段构建）
echo ==========================================
docker build %NO_CACHE% -t shop-admin:%VERSION% -t shop-admin:latest -f docker/Dockerfile.admin .
if errorlevel 1 (
    echo [ERROR] shop-admin 构建失败
    exit /b 1
)
echo [INFO] shop-admin:%VERSION% 构建成功
if "%TARGET%"=="admin" goto done

:build_api
echo ==========================================
echo [INFO] 构建 shop-api:%VERSION% 镜像（多阶段构建）
echo ==========================================
docker build %NO_CACHE% -t shop-api:%VERSION% -t shop-api:latest -f docker/Dockerfile.api .
if errorlevel 1 (
    echo [ERROR] shop-api 构建失败
    exit /b 1
)
echo [INFO] shop-api:%VERSION% 构建成功
if "%TARGET%"=="api" goto done

:build_all
call :build_admin
if errorlevel 1 exit /b 1
call :build_api
if errorlevel 1 exit /b 1
goto done

:done
echo ==========================================
echo [INFO] 构建完成！
echo ==========================================
docker images | findstr "shop-admin shop-api"
