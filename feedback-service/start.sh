#!/bin/bash

# Start PostgreSQL service
service postgresql start

echo "Waiting for PostgreSQL to start..."
sleep 3

# Initialize Database and User
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD '##sv_2338##';" || true
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '##sv_2338##';" || true
sudo -u postgres psql -c "CREATE DATABASE feedbackdb OWNER postgres;" || true

# Start Python application
cd /app
echo "Starting Python API..."
python3 -m app.main
