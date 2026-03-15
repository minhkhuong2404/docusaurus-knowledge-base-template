---
id: docker-commands
title: Docker CLI Commands
sidebar_label: Docker Commands
description: Complete Docker CLI command reference with examples — images, containers, volumes, networks, inspection, debugging, system cleanup, and Docker Hub operations.
tags: [docker, cli, commands, reference, beginner]
---

# Docker CLI Commands

> All the commands you'll use day-to-day, with practical examples.

---

## Image Commands

```bash
# ─── Build ────────────────────────────────────────────────────────
docker build -t myapp:1.0.0 .                  # Build from current directory
docker build -t myapp:1.0.0 -f Dockerfile.prod . # Use a specific Dockerfile
docker build --no-cache -t myapp:1.0.0 .       # Bypass layer cache
docker build --build-arg PROFILE=prod -t myapp . # Pass build arg

# ─── List / Inspect ───────────────────────────────────────────────
docker images                                   # List all local images
docker images -a                                # Include intermediate layers
docker image ls --filter "dangling=true"        # Show untagged images
docker image inspect myapp:1.0.0                # Full JSON metadata
docker image inspect myapp:1.0.0 \
  --format '{{.Config.ExposedPorts}}'           # Filter specific field
docker history myapp:1.0.0                      # Show layers and sizes

# ─── Tag ──────────────────────────────────────────────────────────
docker tag myapp:1.0.0 myapp:latest             # Add another tag
docker tag myapp:1.0.0 registry.example.com/myapp:1.0.0

# ─── Pull / Push ──────────────────────────────────────────────────
docker pull ubuntu:24.04                        # Pull from Docker Hub
docker pull --platform linux/arm64 ubuntu:24.04 # Pull specific platform
docker push myapp:1.0.0                         # Push to registry
docker push registry.example.com/myapp:1.0.0

# ─── Remove ───────────────────────────────────────────────────────
docker rmi myapp:1.0.0                          # Remove image by tag
docker rmi $(docker images -q)                  # Remove all images
docker image prune                              # Remove dangling images
docker image prune -a                           # Remove all unused images

# ─── Save / Load (export image to file) ───────────────────────────
docker save myapp:1.0.0 | gzip > myapp.tar.gz  # Export to file
docker load < myapp.tar.gz                      # Import from file
```

---

## Container Commands

```bash
# ─── Run ──────────────────────────────────────────────────────────
docker run myapp:1.0.0                          # Run container (foreground)
docker run -d myapp:1.0.0                       # -d = detached (background)
docker run -it ubuntu:24.04 bash                # Interactive terminal
docker run --rm myapp:1.0.0                     # Remove container after exit
docker run --name my-api myapp:1.0.0            # Give it a name

# ─── Port Mapping ─────────────────────────────────────────────────
docker run -p 8080:8080 myapp                   # host:container
docker run -p 127.0.0.1:8080:8080 myapp         # Bind to localhost only
docker run -p 8080:8080 -p 9090:9090 myapp      # Multiple ports
docker run -P myapp                             # Publish ALL exposed ports (random host ports)

# ─── Environment Variables ────────────────────────────────────────
docker run -e SPRING_PROFILES_ACTIVE=prod myapp
docker run -e DB_USER=admin -e DB_PASS=secret myapp
docker run --env-file .env myapp               # Load from file

# ─── Volumes / Mounts ─────────────────────────────────────────────
docker run -v myvolume:/app/data myapp          # Named volume
docker run -v $(pwd)/data:/app/data myapp       # Bind mount (absolute path)
docker run --mount type=volume,src=myvolume,dst=/app/data myapp
docker run --mount type=bind,src=$(pwd)/config,dst=/app/config,readonly myapp
docker run --tmpfs /tmp myapp                   # In-memory tmpfs

# ─── Resource Limits ──────────────────────────────────────────────
docker run --memory="512m" myapp                # Max 512 MB RAM
docker run --memory="512m" --memory-swap="1g" myapp  # RAM + swap
docker run --cpus="1.5" myapp                   # Max 1.5 CPU cores
docker run --cpu-shares=512 myapp               # Relative CPU weight

# ─── Network ──────────────────────────────────────────────────────
docker run --network mynetwork myapp            # Join specific network
docker run --network host myapp                 # Share host networking
docker run --network none myapp                 # No network access

# ─── User / Security ──────────────────────────────────────────────
docker run --user 1001:1001 myapp               # Run as specific UID:GID
docker run --read-only --tmpfs /tmp myapp       # Read-only filesystem
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp

# ─── Restart Policy ───────────────────────────────────────────────
docker run --restart=always myapp               # Always restart (even after reboot)
docker run --restart=unless-stopped myapp       # Unless manually stopped
docker run --restart=on-failure:3 myapp         # Restart on failure, max 3 times

# ─── Naming and Labels ────────────────────────────────────────────
docker run --name my-api \
           --label env=production \
           --label team=backend \
           myapp:1.0.0

# ─── List Running Containers ──────────────────────────────────────
docker ps                                       # Running containers
docker ps -a                                    # All containers (including stopped)
docker ps -q                                    # Only IDs (quiet mode)
docker ps --filter "status=exited"              # Only stopped containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ─── Start / Stop / Restart ───────────────────────────────────────
docker start my-api                             # Start stopped container
docker stop my-api                              # Graceful stop (SIGTERM → SIGKILL after 10s)
docker stop -t 30 my-api                        # 30s grace period
docker restart my-api
docker kill my-api                              # Immediate SIGKILL

# ─── Remove ───────────────────────────────────────────────────────
docker rm my-api                                # Remove stopped container
docker rm -f my-api                             # Force remove (even if running)
docker rm $(docker ps -aq)                      # Remove all stopped containers
docker container prune                          # Remove all stopped containers
```

---

## Exec and Inspect (Debugging)

```bash
# ─── Execute Commands Inside Running Container ────────────────────
docker exec my-api ls /app                      # Run single command
docker exec -it my-api bash                     # Interactive bash shell
docker exec -it my-api sh                       # sh (for Alpine)
docker exec -it my-api java -version            # Check Java version inside

# ─── View Logs ────────────────────────────────────────────────────
docker logs my-api                              # All logs
docker logs -f my-api                           # Follow (tail -f)
docker logs --tail=100 my-api                   # Last 100 lines
docker logs --since="2024-01-01T00:00:00" my-api
docker logs --since=1h my-api                   # Since 1 hour ago
docker logs -f --timestamps my-api              # With timestamps

# ─── Inspect ──────────────────────────────────────────────────────
docker inspect my-api                           # Full container JSON
docker inspect my-api --format '{{.State.Status}}'
docker inspect my-api --format '{{.NetworkSettings.IPAddress}}'
docker inspect my-api --format \
  '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# ─── Stats (Live Resource Usage) ──────────────────────────────────
docker stats                                    # All running containers
docker stats my-api                             # Specific container
docker stats --no-stream                        # One-time snapshot (no refresh)
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# ─── Process List Inside Container ───────────────────────────────
docker top my-api                               # Processes inside container

# ─── File System Diff ─────────────────────────────────────────────
docker diff my-api                              # Files changed since container start
# A = added, C = changed, D = deleted

# ─── Copy Files ───────────────────────────────────────────────────
docker cp my-api:/app/logs/app.log ./app.log    # From container to host
docker cp ./config.yml my-api:/app/config.yml   # From host to container

# ─── Port Mapping Info ────────────────────────────────────────────
docker port my-api                              # Show port mappings
docker port my-api 8080                         # Show mapping for specific port
```

---

## Volume Commands

```bash
# ─── Create / List ────────────────────────────────────────────────
docker volume create myvolume
docker volume ls
docker volume inspect myvolume

# ─── Remove ───────────────────────────────────────────────────────
docker volume rm myvolume
docker volume prune                             # Remove all unused volumes
docker volume prune -f                          # Skip confirmation

# ─── Use in container ─────────────────────────────────────────────
docker run -v myvolume:/app/data myapp
```

---

## Network Commands

```bash
# ─── Create ───────────────────────────────────────────────────────
docker network create mynetwork                 # Bridge network
docker network create --driver overlay mynet    # Overlay (Swarm)
docker network create \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  mynetwork

# ─── List / Inspect ───────────────────────────────────────────────
docker network ls
docker network inspect mynetwork
docker network inspect bridge                   # Inspect default bridge

# ─── Connect / Disconnect ─────────────────────────────────────────
docker network connect mynetwork my-api         # Connect running container
docker network disconnect mynetwork my-api

# ─── Remove ───────────────────────────────────────────────────────
docker network rm mynetwork
docker network prune                            # Remove all unused networks
```

---

## System Commands

```bash
# ─── System Overview ──────────────────────────────────────────────
docker system df                                # Disk usage by component
docker system df -v                             # Detailed breakdown
docker info                                     # Docker engine info

# ─── Clean Up Everything ──────────────────────────────────────────
docker system prune                             # Remove stopped containers, dangling images, unused networks
docker system prune -a                          # Also remove unused images (not just dangling)
docker system prune -a --volumes                # Also remove volumes ⚠ data loss!
docker system prune --filter "until=24h"        # Only things older than 24h

# ─── Individual Cleanup ───────────────────────────────────────────
docker container prune      # Stopped containers
docker image prune          # Dangling images
docker image prune -a       # All unused images
docker volume prune         # Unused volumes
docker network prune        # Unused networks
```

---

## Docker Hub / Registry

```bash
# ─── Login / Logout ───────────────────────────────────────────────
docker login                                    # Docker Hub
docker login registry.example.com              # Private registry
docker logout

# ─── Search ───────────────────────────────────────────────────────
docker search nginx                             # Search Docker Hub
docker search --filter is-official=true nginx   # Official images only
docker search --limit 5 spring-boot

# ─── Manage Images at Registry ────────────────────────────────────
# (list/delete via registry API or web UI — docker CLI doesn't manage remote)
```

---

## Handy One-Liners

```bash
# Stop all running containers
docker stop $(docker ps -q)

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Shell into most recently started container
docker exec -it $(docker ps -q | head -1) sh

# Watch container logs in real time
docker logs -f --tail=50 my-api

# Get container IP address
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-api

# Run temporary container and auto-remove
docker run --rm -it ubuntu:24.04 bash

# Run MySQL for local dev (temporary)
docker run --rm -d \
  --name local-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=mydb \
  -p 3306:3306 \
  mysql:8

# Run PostgreSQL for local dev
docker run --rm -d \
  --name local-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:16-alpine

# Run Redis for local dev
docker run --rm -d --name local-redis -p 6379:6379 redis:7-alpine

# Execute SQL in running Postgres container
docker exec -it local-postgres psql -U postgres -d mydb

# Copy files from container
docker cp my-api:/app/logs ./logs

# Commit container changes to image (use sparingly — prefer Dockerfile)
docker commit my-api myapp:debug

# Show image size breakdown
docker image inspect myapp:1.0.0 \
  --format='{{.Size}}' | numfmt --to=iec
```

---

## Interview Questions

1. What is the difference between `docker run` and `docker start`?
2. How do you run a container in detached mode and later view its logs?
3. How do you pass environment variables to a container?
4. What does `docker exec -it container bash` do?
5. How do you copy a file from a running container to the host?
6. What does `docker system prune -a --volumes` do? What's the risk?
7. What is the difference between `docker stop` and `docker kill`?
8. How do you see the live resource usage (CPU, memory) of all running containers?
9. How do you run a container with memory and CPU limits?
10. What is `docker inspect` used for?
