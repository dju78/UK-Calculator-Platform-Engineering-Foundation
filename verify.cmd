@echo off
call npm run build || exit /b 1
call npm run lint || exit /b 1
call npm run test || exit /b 1
call npm run bench:reference || exit /b 1
call npm --workspace=web run build || exit /b 1
call npm run test:e2e || exit /b 1
echo ALL TESTS PASSED
