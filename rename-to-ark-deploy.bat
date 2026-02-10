@echo off
echo ========================================
echo Renomeando projeto para Ark Deploy
echo ========================================
echo.

REM Fechar processos que possam estar usando a pasta
echo [1/3] Parando containers Docker...
docker-compose down
echo.

echo [2/3] Aguardando 5 segundos...
timeout /t 5 /nobreak
echo.

echo [3/3] Renomeando pasta...
cd ..
rename deploy-manager ark-deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Sucesso! Pasta renomeada para ark-deploy
    echo ========================================
    echo.
    echo Proximos passos:
    echo 1. Feche o VS Code
    echo 2. Abra a pasta ark-deploy no VS Code
    echo 3. Execute: docker-compose up -d
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO ao renomear!
    echo ========================================
    echo.
    echo Possivel causa: Arquivos em uso
    echo.
    echo Solucao:
    echo 1. Feche o VS Code
    echo 2. Feche o terminal
    echo 3. Execute este script novamente
    echo.
)

pause
