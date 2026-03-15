---
id: docker-volumes
title: Docker Volumes & Storage
sidebar_label: Volumes & Storage
description: Complete guide to Docker storage — named volumes, bind mounts, tmpfs, volume drivers, backup and restore strategies, and data persistence patterns for databases and applications.
tags: [docker, volumes, storage, bind-mount, tmpfs, persistence, intermediate]
---

# Docker Volumes & Storage

> A container's filesystem is ephemeral — when the container is removed, all data inside is gone. Volumes solve this.

---

## The Problem

```bash
docker run -d --name postgres postgres:16
docker exec -it postgres psql -U postgres -c "CREATE TABLE users (id serial, name text);"
docker exec -it postgres psql -U postgres -c "INSERT INTO users VALUES (1, 'Alice');"

docker rm -f postgres          # Remove container

docker run -d --name postgres postgres:16
docker exec -it postgres psql -U postgres -c "SELECT * FROM users;"
# ERROR: relation "users" does not exist  ← Data is gone!
```

---

## Three Types of Storage

```
┌─────────────────────────────────────────────────────┐
│  Host Filesystem                                     │
│                                                      │
│  /var/lib/docker/volumes/   ← Named volumes          │
│  /any/path/on/host/         ← Bind mount source      │
│                                                      │
│  Container                                           │
│  /app/data    ← volume or bind mount target          │
│  /tmp         ← tmpfs (memory only)                  │
│  /app         ← container writable layer (ephemeral) │
└─────────────────────────────────────────────────────┘
```

| Type | Managed by | Persists after rm? | Use Case |
|---|---|---|---|
| **Named Volume** | Docker | ✅ Yes | Databases, app data |
| **Bind Mount** | Host OS | ✅ Yes (it's a host dir) | Dev: hot reload source code |
| **tmpfs Mount** | Memory | ❌ No | Sensitive temp data, performance |

---

## Named Volumes

Docker manages the storage location (`/var/lib/docker/volumes/`). Preferred for production.

```bash
# Create a volume
docker volume create pgdata

# Use in a container
docker run -d \
  --name postgres \
  -v pgdata:/var/lib/postgresql/data \   # name:container-path
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# Data survives container removal
docker rm -f postgres
docker run -d \
  --name postgres-new \
  -v pgdata:/var/lib/postgresql/data \   # Same volume → data intact
  postgres:16-alpine

# Inspect volume
docker volume inspect pgdata
# Shows: /var/lib/docker/volumes/pgdata/_data  (host path)

# List volumes
docker volume ls

# Remove volume (⚠ destroys data!)
docker volume rm pgdata
```

### --mount syntax (more explicit, preferred)
```bash
docker run -d \
  --name postgres \
  --mount type=volume,src=pgdata,dst=/var/lib/postgresql/data \
  postgres:16-alpine
```

---

## Bind Mounts

Mount a **specific directory from the host** into the container. Changes on either side are immediately visible.

```bash
# Mount current directory into container
docker run -d \
  --name api \
  -v $(pwd)/config:/app/config:ro \       # :ro = read-only
  myapp:1.0.0

# Hot-reload development pattern
docker run -d \
  --name spring-dev \
  -v $(pwd)/src:/app/src \               # Source code mounted in
  -v $(pwd)/target:/app/target \         # Compiled output
  -p 8080:8080 \
  -e SPRING_DEVTOOLS_RESTART_ENABLED=true \
  myapp:dev

# --mount syntax
docker run -d \
  --mount type=bind,src=$(pwd)/config,dst=/app/config,readonly \
  myapp:1.0.0
```

**⚠ Bind mount gotchas:**
- Uses absolute paths — `./relative` fails (use `$(pwd)/relative`)
- File permissions: files created inside container may be owned by root on host
- OS path differences: Windows paths need special handling (`C:\Users\...`)

---

## tmpfs Mounts

Stored in **host memory only**. Never written to disk. Auto-deleted when container stops.

```bash
# Use tmpfs for sensitive data
docker run -d \
  --name api \
  --tmpfs /tmp \                              # tmpfs at /tmp
  --tmpfs /run/secrets:rw,size=10m,mode=700 \ # With options
  myapp:1.0.0

# --mount syntax
docker run --mount type=tmpfs,dst=/tmp,tmpfs-size=100m myapp
```

**Use cases:**
- Temporary files with sensitive content (API keys written to /tmp)
- High-performance temporary storage (I/O-heavy scratch space)
- Cache directories that shouldn't persist

---

## Volumes in Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data         # Named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # Bind mount

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data                         # Named volume
    command: redis-server --appendonly yes       # Enable persistence

  api:
    build: .
    volumes:
      - ./config:/app/config:ro                 # Bind mount for config
      - app-logs:/app/logs                      # Named volume for logs

  # Dev-only: mount source for hot-reload
  api-dev:
    build:
      context: .
      target: builder          # Stop at builder stage
    volumes:
      - .:/workspace            # Entire project mounted
    command: mvn spring-boot:run

# ─── Volume Declarations ───────────────────────────────────────────
volumes:
  pgdata:                        # Managed by Docker Compose
    driver: local

  redisdata:
    driver: local

  app-logs:
    driver: local
    driver_opts:
      type: nfs                  # NFS volume (external storage)
      o: "addr=nfs-server,rw"
      device: ":/data/logs"

  external-pgdata:
    external: true               # Pre-existing volume, not managed by Compose
    name: production-pgdata      # Actual volume name on host
```

---

## Volume Backup & Restore

```bash
# ─── Backup a named volume ────────────────────────────────────────
# Spin up temp container, tar the volume, write to host
docker run --rm \
  -v pgdata:/data:ro \             # Mount volume (read-only)
  -v $(pwd)/backups:/backup \      # Mount backup dir on host
  alpine \
  tar czf /backup/pgdata-$(date +%Y%m%d).tar.gz -C /data .

# ─── Restore a volume ─────────────────────────────────────────────
docker volume create pgdata-restored

docker run --rm \
  -v pgdata-restored:/data \       # Mount new empty volume
  -v $(pwd)/backups:/backup:ro \   # Mount backup
  alpine \
  tar xzf /backup/pgdata-20240101.tar.gz -C /data

# ─── Copy between volumes ─────────────────────────────────────────
docker run --rm \
  -v source-vol:/source:ro \
  -v dest-vol:/dest \
  alpine \
  cp -a /source/. /dest/

# ─── PostgreSQL-specific backup (proper SQL dump) ─────────────────
docker exec postgres \
  pg_dump -U postgres mydb > backup.sql

docker exec -i postgres \
  psql -U postgres mydb < backup.sql
```

---

## Volume Drivers (External Storage)

For cloud-native deployments, use volume drivers to provision cloud storage.

```bash
# AWS EFS via rexray/efs
docker volume create \
  --driver rexray/efs \
  --opt size=20 \
  my-efs-volume

# GCP Persistent Disk
docker volume create \
  --driver gcepd \
  --opt size=100 \
  --opt type=pd-ssd \
  my-gcp-volume

# Docker NFS volume
docker volume create \
  --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/mnt/data \
  nfs-volume
```

---

## Common Data Patterns

### Database with Persistent Data
```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d:ro  # Init scripts
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password  # Secret via file
    secrets:
      - pg_password

secrets:
  pg_password:
    file: ./secrets/pg_password.txt

volumes:
  pgdata:
```

### Application with Shared Upload Storage
```yaml
services:
  api-1:
    image: myapp:1.0.0
    volumes:
      - uploads:/app/uploads    # Both instances share same volume
  api-2:
    image: myapp:1.0.0
    volumes:
      - uploads:/app/uploads    # ← same named volume → shared files

volumes:
  uploads:
```

### Development with Live Code Reload
```yaml
services:
  api:
    build:
      context: .
      target: builder           # Build up to Maven stage
    volumes:
      - .:/workspace            # Mount source code
      - maven-cache:/root/.m2   # Cache Maven deps (speed up)
    working_dir: /workspace
    command: mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=..."
    ports:
      - "8080:8080"
      - "5005:5005"             # Remote debug port

volumes:
  maven-cache:                  # Persist Maven cache between runs
```

---

## Permissions Gotchas

```bash
# Problem: container writes files as root → host sees root-owned files
docker run -v $(pwd)/data:/app/data myapp
ls -la data/   # → -rw-r--r-- root root   myfile.txt  ← owned by root!

# Fix 1: Match UID in Dockerfile
ARG USER_ID=1001
RUN adduser -u $USER_ID appuser
USER appuser
# Build: docker build --build-arg USER_ID=$(id -u) .

# Fix 2: Run with your host UID
docker run --user $(id -u):$(id -g) -v $(pwd)/data:/app/data myapp

# Fix 3: Set permissions on volume at init
docker run -v myvolume:/data alpine chown -R 1001:1001 /data
```

---

## Interview Questions

1. What is the difference between a Docker volume and a bind mount?
2. What happens to data in a named volume when the container is removed?
3. When would you use a tmpfs mount?
4. How do you back up a Docker volume?
5. How do two containers share the same data via volumes?
6. What is the `external` flag in a Docker Compose volume declaration?
7. How do you handle file permission issues when using bind mounts?
8. Why should a database always use a volume rather than writing to the container layer?
