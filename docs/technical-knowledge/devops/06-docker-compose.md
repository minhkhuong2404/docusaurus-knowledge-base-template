---
id: docker-compose
title: Docker Compose
sidebar_label: Docker Compose
description: Complete Docker Compose guide — YAML syntax, services, networks, volumes, environment variables, health checks, dependency ordering, profiles, override files, and production patterns.
tags: [docker, docker-compose, yaml, multi-container, services, intermediate]
---

# Docker Compose

> Docker Compose lets you define and run **multi-container applications** with a single YAML file and one command.

---

## Why Docker Compose?

Without Compose, running a typical web stack means:
```bash
# Without Compose — painful
docker network create myapp-net
docker volume create pgdata
docker run -d --name postgres --network myapp-net -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:16
docker run -d --name redis --network myapp-net redis:7-alpine
docker run -d --name api --network myapp-net -p 8080:8080 -e DB_URL=jdbc:postgresql://postgres:5432/mydb myapp:1.0.0

# With Compose — one command
docker compose up -d
```

---

## docker-compose.yml Structure

```yaml
# Top-level keys
version: "3.9"         # Compose file format version (optional in newer versions)

services:              # Define containers
  service-name:
    ...

networks:              # Define networks
  network-name:
    ...

volumes:               # Define volumes
  volume-name:
    ...

secrets:               # Define secrets
  secret-name:
    ...

configs:               # Define configs
  config-name:
    ...
```

---

## Service Configuration — All Options

```yaml
services:
  api:
    # ─── Image ────────────────────────────────────────────────────
    image: myapp:1.0.0            # Use existing image
    # OR
    build:
      context: .                  # Build context directory
      dockerfile: Dockerfile      # Dockerfile name
      target: runtime             # Multi-stage target
      args:
        BUILD_ENV: production
        GIT_COMMIT: ${GIT_COMMIT}
      cache_from:
        - myapp:latest            # Use for layer cache
      labels:
        - "com.example.version=1.0"

    # ─── Container Config ─────────────────────────────────────────
    container_name: my-api        # Fixed name (overrides generated name)
    hostname: api                 # Hostname inside network
    restart: unless-stopped       # no | always | on-failure[:n] | unless-stopped

    # ─── Ports ────────────────────────────────────────────────────
    ports:
      - "8080:8080"               # host:container
      - "127.0.0.1:9090:9090"     # Bind to localhost only
      - "8080"                    # Random host port → container 8080

    # ─── Environment ──────────────────────────────────────────────
    environment:
      SPRING_PROFILES_ACTIVE: production
      DB_HOST: postgres           # Service name as hostname
      DB_PORT: 5432
    # OR load from .env file:
    env_file:
      - .env
      - .env.production

    # ─── Volumes ──────────────────────────────────────────────────
    volumes:
      - app-data:/app/data        # Named volume
      - ./config:/app/config:ro   # Bind mount (read-only)
      - /tmp                      # Anonymous volume (not recommended)

    # ─── Networks ─────────────────────────────────────────────────
    networks:
      - frontend
      - backend
    # OR with aliases:
    networks:
      backend:
        aliases:
          - api-internal

    # ─── Dependencies ─────────────────────────────────────────────
    depends_on:
      postgres:
        condition: service_healthy    # Wait for healthcheck
      redis:
        condition: service_started    # Just started (no healthcheck)

    # ─── Health Check ─────────────────────────────────────────────
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s            # Grace period at startup

    # ─── Resource Limits ──────────────────────────────────────────
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          memory: 256M
      replicas: 2                  # Number of instances

    # ─── Commands ─────────────────────────────────────────────────
    command: ["java", "-Xmx512m", "-jar", "/app/app.jar"]
    entrypoint: ["/app/entrypoint.sh"]

    # ─── User / Security ──────────────────────────────────────────
    user: "1001:1001"
    read_only: true
    tmpfs:
      - /tmp
      - /run

    # ─── Logging ──────────────────────────────────────────────────
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # OR
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: myapp.api

    # ─── Labels ───────────────────────────────────────────────────
    labels:
      - "traefik.enable=true"
      - "com.example.team=backend"

    # ─── Extra Hosts ──────────────────────────────────────────────
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Access host machine
```

---

## Real-World Example: Spring Boot Stack

```yaml
# docker-compose.yml
services:
  # ─── API ──────────────────────────────────────────────────────
  api:
    build:
      context: .
      target: runtime
    container_name: myapp-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/mydb
      SPRING_DATASOURCE_USERNAME: myapp
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      JAVA_OPTS: "-Xms256m -Xmx512m"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - backend
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  # ─── PostgreSQL ───────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: myapp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro  # SQL init scripts
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myapp -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    # NOT exposed to host — only accessible via backend network

  # ─── Redis ────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # ─── Nginx (Reverse Proxy) ────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    networks:
      - frontend
      - backend
    depends_on:
      api:
        condition: service_healthy

networks:
  frontend:
  backend:
    internal: true    # No internet access from backend

volumes:
  pgdata:
  redisdata:
```

### .env file
```bash
# .env — never commit to git!
DB_PASSWORD=supersecretpassword123
REDIS_PASSWORD=redissecret456
GIT_COMMIT=abc123def
```

---

## Docker Compose Commands

```bash
# ─── Start ────────────────────────────────────────────────────────
docker compose up                     # Start in foreground
docker compose up -d                  # Detached (background)
docker compose up --build             # Rebuild images before starting
docker compose up --build --no-cache  # Force full rebuild
docker compose up api                 # Start only "api" service
docker compose up --scale api=3       # Start 3 instances of api

# ─── Stop ─────────────────────────────────────────────────────────
docker compose down                   # Stop + remove containers & networks
docker compose down -v                # Also remove volumes ⚠ data loss!
docker compose down --rmi all         # Also remove images
docker compose stop                   # Stop without removing
docker compose stop api               # Stop specific service

# ─── Restart ──────────────────────────────────────────────────────
docker compose restart
docker compose restart api

# ─── Status ───────────────────────────────────────────────────────
docker compose ps                     # Container status
docker compose ps -a                  # All (including stopped)
docker compose top                    # Processes in each service

# ─── Logs ─────────────────────────────────────────────────────────
docker compose logs                   # All service logs
docker compose logs -f                # Follow
docker compose logs -f api            # Follow specific service
docker compose logs --tail=100 api
docker compose logs --since=1h api

# ─── Execute ──────────────────────────────────────────────────────
docker compose exec api bash          # Shell into running service
docker compose exec api java -version # Single command
docker compose exec postgres psql -U myapp -d mydb

# ─── Run one-off commands ─────────────────────────────────────────
docker compose run --rm api mvn test  # Run test in fresh container
docker compose run --rm api sh        # Temporary shell

# ─── Build ────────────────────────────────────────────────────────
docker compose build                  # Build all services
docker compose build api              # Build specific service
docker compose build --no-cache       # Force full rebuild

# ─── Config Validation ────────────────────────────────────────────
docker compose config                 # Validate and print merged config
docker compose config --services      # List service names
```

---

## Override Files

Compose merges multiple files. Use this pattern for environment-specific config.

```yaml
# docker-compose.yml (base — committed to git)
services:
  api:
    image: myapp:${IMAGE_TAG:-latest}
    environment:
      SPRING_PROFILES_ACTIVE: default

# docker-compose.override.yml (dev overrides — committed to git)
services:
  api:
    build: .                         # Override: build locally in dev
    volumes:
      - .:/workspace                 # Hot-reload source
    environment:
      SPRING_PROFILES_ACTIVE: dev
    ports:
      - "5005:5005"                  # Debug port

# docker-compose.prod.yml (prod overrides — in CI/CD)
services:
  api:
    restart: always
    deploy:
      replicas: 3

# Usage:
docker compose up                                # Uses base + override.yml (auto)
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml up -d  # Production
```

---

## Profiles (Conditional Services)

```yaml
services:
  api:
    # No profile = always started

  postgres:
    # No profile = always started

  pgadmin:
    image: dpage/pgadmin4
    profiles:
      - tools                   # Only start when tools profile active
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin

  prometheus:
    image: prom/prometheus
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana
    profiles:
      - monitoring
```

```bash
# Start with tools profile (includes pgadmin)
docker compose --profile tools up -d

# Start with monitoring
docker compose --profile monitoring up -d

# Multiple profiles
docker compose --profile tools --profile monitoring up -d
```

---

## Environment Variable Interpolation

```yaml
services:
  api:
    image: myapp:${IMAGE_TAG:-1.0.0}      # Default to 1.0.0 if not set
    environment:
      - DB_PASSWORD=${DB_PASSWORD:?DB_PASSWORD must be set}  # Error if missing
      - APP_ENV=${APP_ENV:-development}   # Default value
```

```bash
# Compose reads .env file automatically
# Or pass inline:
IMAGE_TAG=2.0.0 docker compose up -d

# Or export:
export IMAGE_TAG=2.0.0
docker compose up -d
```

---

## Healthchecks and Wait Strategies

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s      # Don't check for 30s after start

  api:
    depends_on:
      postgres:
        condition: service_healthy  # Won't start until postgres is healthy
```

---

## Interview Questions

1. What problem does Docker Compose solve?
2. What is the difference between `depends_on: condition: service_healthy` and `service_started`?
3. How does service name resolution work in Docker Compose?
4. What does `docker compose down -v` do and why is it dangerous?
5. What is a Docker Compose override file and when would you use one?
6. How do you pass secrets into a Docker Compose service without committing them to git?
7. What is the `internal: true` option on a Compose network?
8. How do you run a one-off command (like a database migration) with Docker Compose?
9. What are Compose profiles used for?
10. How do you scale a service to 3 replicas with Docker Compose?
