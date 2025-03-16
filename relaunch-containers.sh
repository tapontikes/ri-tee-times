#!/bin/bash

# Specify the container name and teetimes name
SERVICE_NAME="app"
CONTAINER_NAME="tee-times"

# Shut down the container
echo "Stopping container ${CONTAINER_NAME}..."
docker compose stop ${SERVICE_NAME}

# Rebuild the container without cache
echo "Rebuilding the container ${CONTAINER_NAME} without cache..."
docker compose build --no-cache ${SERVICE_NAME}

# Restart the container
echo "Starting container ${CONTAINER_NAME}..."
docker compose up -d ${SERVICE_NAME}

echo "Container ${CONTAINER_NAME} has been rebuilt and restarted."
