CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'root'@'::1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'::1' WITH GRANT OPTION;

-- Sandbox Read-Only User for SELECT questions
CREATE USER IF NOT EXISTS 'sandbox_ro'@'%' IDENTIFIED BY 'sandbox_ro_pass';
GRANT SELECT ON *.* TO 'sandbox_ro'@'%';

-- Sandbox Ephemeral / DDL User for sbx_% and play_% databases
CREATE USER IF NOT EXISTS 'sandbox_rw'@'%' IDENTIFIED BY 'sandbox_rw_pass';
GRANT ALL PRIVILEGES ON `sbx\_%`.* TO 'sandbox_rw'@'%';
GRANT ALL PRIVILEGES ON `play\_%`.* TO 'sandbox_rw'@'%';

FLUSH PRIVILEGES;
