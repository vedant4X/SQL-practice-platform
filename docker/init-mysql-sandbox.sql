-- Dedicated MySQL Sandbox Initialization
CREATE USER IF NOT EXISTS 'sandbox_ro'@'%' IDENTIFIED BY 'sandbox_ro_pass';
GRANT SELECT ON *.* TO 'sandbox_ro'@'%';

CREATE USER IF NOT EXISTS 'sandbox_rw'@'%' IDENTIFIED BY 'sandbox_rw_pass';
GRANT ALL PRIVILEGES ON `sbx\_%`.* TO 'sandbox_rw'@'%';
GRANT ALL PRIVILEGES ON `play\_%`.* TO 'sandbox_rw'@'%';

FLUSH PRIVILEGES;
