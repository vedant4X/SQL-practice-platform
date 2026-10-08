@echo off
echo ===================================================
echo Starting MySQL 8.4 Sandbox Daemon (Port 3307)
echo ===================================================
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --port=3307 --datadir="c:\SQL_WEB2\data\mysql-sandbox-data" --skip-log-bin --local-infile=OFF --secure-file-priv="" --sql-mode="ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci --default-time-zone="+00:00"
