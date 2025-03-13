#!/bin/bash

# Stop and remove Docker Compose services
docker-compose down

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Rebuild and restart the Docker Compose stack
docker-compose up --build -d

echo "Docker stack has been rebuilt and restarted."