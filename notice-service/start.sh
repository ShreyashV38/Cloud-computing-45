#!/bin/bash

# Ensure MySQL data directory has correct permissions
usermod -d /var/lib/mysql/ mysql
service mysql start

# Wait for MySQL to be ready
echo "Waiting for MySQL to start..."
sleep 5

# Initialize Database and User
mysql -e "CREATE DATABASE IF NOT EXISTS noticedb;"
mysql -e "CREATE USER IF NOT EXISTS 'notice_user'@'localhost' IDENTIFIED BY '4019';"
mysql -e "CREATE USER IF NOT EXISTS 'notice_user'@'%' IDENTIFIED BY '4019';"
mysql -e "GRANT ALL PRIVILEGES ON noticedb.* TO 'notice_user'@'localhost';"
mysql -e "GRANT ALL PRIVILEGES ON noticedb.* TO 'notice_user'@'%';"
mysql -e "FLUSH PRIVILEGES;"

# Start Node.js application
cd /app
echo "Starting Node API..."
node src/index.js
