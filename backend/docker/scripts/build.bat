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
echo [INFO] 镜像版本:   %VERSION%
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
if not exist "pom.xml" (
    echo [ERROR] 未找到 pom.xml，请确认在项目根目录运行
    exit /b 1
)
echo [OK] pom.xml 存在
if not exist "docker\dockerfile.admin" (
    echo [ERROR] 未找到 docker\dockerfile.admin
    exit /b 1
)
echo [OK] Dockerfile.admin 存在
if not exist "docker\dockerfile.api" (
    echo [ERROR] 未找到 docker\dockerfile.api
    exit /b 1
)
echo [OK] Dockerfile.api 存在
echo.

REM -------------------- 阶段2: 拉取基础镜像 --------------------
echo [2/4] 拉取基础镜像
echo ----------------------------------------

echo [PULL] 拉取 Maven + JDK17 构建镜像 (maven:3.9-eclipse-temurin-17)...
docker pull maven:3.9-eclipse-temurin-17
if errorlevel 1 (
    echo [ERROR] 拉取 maven:3.9-eclipse-temurin-17 失败
    exit /b 1
)
echo [OK] maven:3.9-eclipse-temurin-17 拉取成功

echo [PULL] 拉取 JRE17 运行镜像 (eclipse-temurin:17-jre-alpine)...
docker pull eclipse-temurin:17-jre-alpine
if errorlevel 1 (
    echo [ERROR] 拉取 eclipse-temurin:17-jre-alpine 失败
    exit /b 1
)
echo [OK] eclipse-temurin:17-jre-alpine 拉取成功
echo.

if not "%TARGET%"=="admin" if not "%TARGET%"=="api" if not "%TARGET%"=="all" (
    echo [ERROR] 未知目标: %TARGET%
    exit /b 1
)

REM -------------------- 阶段3: 构建应用镜像 --------------------
echo [3/4] 构建应用镜像
echo ----------------------------------------

:build_admin
if not "%TARGET%"=="admin" if not "%TARGET%"=="all" goto build_api
echo [BUILD] 构建 shop-admin:%VERSION%
echo [BUILD]   阶段1: maven:3.9-eclipse-temurin-17 (编译打包)
echo [BUILD]   阶段2: eclipse-temurin:17-jre-alpine (精简运行)
echo.
docker build %NO_CACHE% --progress=plain -t shop-admin:%VERSION% -t shop-admin:latest -f docker/Dockerfile.admin .
if errorlevel 1 (
    echo.
    echo [ERROR] shop-admin:%VERSION% 构建失败！请检查上方构建日志
    exit /b 1
)
echo.
echo [OK] shop-admin:%VERSION% 构建成功
echo.

:build_api
if not "%TARGET%"=="api" if not "%TARGET%"=="all" goto done
echo [BUILD] 构建 shop-api:%VERSION%
echo [BUILD]   阶段1: maven:3.9-eclipse-temurin-17 (编译打包)
echo [BUILD]   阶段2: eclipse-temurin:17-jre-alpine (精简运行)
echo.
docker build %NO_CACHE% --progress=plain -t shop-api:%VERSION% -t shop-api:latest -f docker/Dockerfile.api .
if errorlevel 1 (
    echo.
    echo [ERROR] shop-api:%VERSION% 构建失败！请检查上方构建日志
    exit /b 1
)
echo.
echo [OK] shop-api:%VERSION% 构建成功
echo.

REM -------------------- 阶段4: 构建结果汇总 --------------------
:done
echo [4/4] 构建结果汇总
echo ----------------------------------------
echo [OK] 全部构建完成！
echo.
echo 镜像列表:
docker images --format "  {{.Repository}}:{{.Tag}}	{{.Size}}	{{.CreatedAt}}" | findstr "shop-admin shop-api"
echo.
echo 运行方式:
echo   docker-compose -f docker/docker-compose.app.yml up -d
exit /b 0
