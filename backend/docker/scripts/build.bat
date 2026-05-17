@echo off
chcp 65001 >nul
REM ============================================================
REM Shop 项目 Docker 镜像构建脚本 (Windows)
REM 用法:
REM   build.bat           # 构建所有镜像
REM   build.bat admin     # 仅构建 shop-admin
REM   build.bat api       # 仅构建 shop-api
REM   build.bat --no-cache # 不使用缓存构建
REM ============================================================

setlocal enabledelayedexpansion

REM 颜色定义（Windows 10+ 支持 ANSI 转义码）
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "NC=%ESC%[0m"

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
echo %RED%[ERROR]%NC% 未知参数: %~1
exit /b 1
:end_parse

REM 切换到项目根目录（scripts 在 docker/scripts 下，需向上两级）
cd /d "%SCRIPT_DIR%..\.."
set PROJECT_ROOT=%CD%

echo %GREEN%[INFO]%NC% 项目根目录: %CD%
echo %GREEN%[INFO]%NC% 镜像版本: %VERSION%

REM -------------------- 拉取基础镜像 --------------------
echo ==========================================
echo %GREEN%[INFO]%NC% 拉取基础镜像...
echo ==========================================
docker pull maven:3.9-eclipse-temurin-17
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 拉取 maven:3.9-eclipse-temurin-17 失败
    exit /b 1
)
docker pull eclipse-temurin:17-jre-alpine
if errorlevel 1 (
    echo %RED%[ERROR]%NC% 拉取 eclipse-temurin:17-jre-alpine 失败
    exit /b 1
)
echo %GREEN%[INFO]%NC% 基础镜像拉取完成

if not "%TARGET%"=="admin" if not "%TARGET%"=="api" if not "%TARGET%"=="all" (
    echo %RED%[ERROR]%NC% 未知目标: %TARGET%
    exit /b 1
)

:build_admin
if not "%TARGET%"=="admin" if not "%TARGET%"=="all" goto build_api
echo ==========================================
echo %GREEN%[INFO]%NC% 构建 shop-admin:%VERSION% 镜像（多阶段构建）
echo ==========================================
docker build %NO_CACHE% -t shop-admin:%VERSION% -t shop-admin:latest -f docker/Dockerfile.admin .
if errorlevel 1 (
    echo %RED%[ERROR]%NC% shop-admin 构建失败
    exit /b 1
)
echo %GREEN%[INFO]%NC% shop-admin:%VERSION% 构建成功

:build_api
if not "%TARGET%"=="api" if not "%TARGET%"=="all" goto done
echo ==========================================
echo %GREEN%[INFO]%NC% 构建 shop-api:%VERSION% 镜像（多阶段构建）
echo ==========================================
docker build %NO_CACHE% -t shop-api:%VERSION% -t shop-api:latest -f docker/Dockerfile.api .
if errorlevel 1 (
    echo %RED%[ERROR]%NC% shop-api 构建失败
    exit /b 1
)
echo %GREEN%[INFO]%NC% shop-api:%VERSION% 构建成功
goto done

:done
echo ==========================================
echo %GREEN%[INFO]%NC% 构建完成！
echo ==========================================
docker images | findstr "shop-admin shop-api"
exit /b 0
