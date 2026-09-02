@echo off
REM Cpush Coupon Scraper - Windows quick run
REM Usage: run.bat [hostinger] [AFFILIATE_ID]
set BRAND=%1
if "%BRAND%"=="" set BRAND=hostinger
set AFFID=%2

echo === Cpush Scraper: %BRAND% ===
if "%AFFID%"=="" (
    python scraper.py --brand %BRAND%
) else (
    python scraper.py --brand %BRAND% --affiliate %AFFID%
)
echo.
echo === Latest CSV ===
dir /b output\*.csv
echo.
echo To import: php import.php output\%BRAND%-coupons-*.csv
pause
