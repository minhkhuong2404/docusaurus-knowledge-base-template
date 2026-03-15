---
id: dockerfile
title: Writing Dockerfiles
sidebar_label: Dockerfile
description: Complete guide to writing Dockerfiles — all instructions explained, multi-stage builds, layer caching optimisation, security hardening, and production-ready Spring Boot examples.
tags: [docker, dockerfile, multi-stage-build, layer-cache, best-practices, spring-boot, beginner]
---

# Writing Dockerfiles

A **Dockerfile** is a plain-text script of instructions that Docker executes top-to-bottom to build an image. Each instruction creates a new layer.

---

## Dockerfile Instructions Reference

### FROM — Base Image
```dockerfile
FROM eclipse-temurin:21-jre-alpine

# Multi-stage: name each stage
FROM maven:3.9-eclipse-temurin-21 AS builder
FROM eclipse-temurin:21-jre-alpine AS runtime
```

> Always pin to a specific version tag. Never use `FROM ubuntu` (resolves to `latest`).

---

### WORKDIR — Set Working Directory
```dockerfile
WORKDIR /app
# Creates the directory if it doesn't exist.
# All subsequent instructions run relative to this path.
# Preferred over RUN cd /app
```

---

### COPY vs ADD
```dockerfile
# COPY — preferred for most cases
COPY src/main/resources/application.yml /app/config/
COPY target/myapp.jar /app/myapp.jar
COPY . .   # Copy everything from build context

# ADD — avoid unless you specifically need its extras:
#   - Auto-extract tar archives (ADD app.tar.gz /app)
#   - Fetch remote URLs (avoid — non-deterministic, use curl instead)
ADD https://example.com/file.tar.gz /tmp/  # ❌ Non-reproducible
```

---

### RUN — Execute Commands
```dockerfile
# Single command
RUN apt-get update

# Chain commands with && to keep in ONE layer
# ✅ Efficient — one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl wget && \
    rm -rf /var/lib/apt/lists/*   # Clean up in same layer!

# ❌ Inefficient — three layers
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

> Clean up package manager caches **in the same RUN** instruction — once the layer is committed, you can't remove files from it in a later layer.

---

### CMD vs ENTRYPOINT

```dockerfile
# CMD — default command, easily overridden at runtime
CMD ["java", "-jar", "/app/myapp.jar"]
docker run myapp                          # runs: java -jar /app/myapp.jar
docker run myapp java -jar other.jar      # overrides CMD entirely

# ENTRYPOINT — fixed command, arguments are appended
ENTRYPOINT ["java"]
CMD ["-jar", "/app/myapp.jar"]
docker run myapp                          # runs: java -jar /app/myapp.jar
docker run myapp -jar other.jar           # runs: java -jar other.jar (CMD overridden)

# Best pattern for applications — combine both:
ENTRYPOINT ["java"]
CMD ["-jar", "/app/myapp.jar"]

# Exec form (preferred) vs Shell form:
CMD ["java", "-jar", "app.jar"]   # ✅ Exec form — signals go directly to process
CMD java -jar app.jar             # ❌ Shell form — runs via /bin/sh -c, PID 1 is shell
```

---

### ENV — Environment Variables
```dockerfile
ENV APP_HOME=/app
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV SPRING_PROFILES_ACTIVE=production

# Multi-line (Docker 1.9+)
ENV APP_HOME=/app \
    APP_PORT=8080

# Access in RUN
RUN echo $APP_HOME
```

> Prefer passing secrets at runtime (`docker run -e SECRET=...`) — ENV values baked into image are visible in image history.

---

### ARG — Build-Time Variables
```dockerfile
ARG JAR_FILE=target/myapp.jar
ARG BUILD_DATE
ARG GIT_COMMIT

COPY ${JAR_FILE} /app/app.jar

# Pass at build time
docker build --build-arg JAR_FILE=target/myapp-1.0.jar \
             --build-arg GIT_COMMIT=$(git rev-parse HEAD) .

# ARG values not present in final image (unlike ENV)
# ⚠ Exception: ARG before FROM applies to FROM only
ARG BASE_IMAGE=eclipse-temurin:21-jre-alpine
FROM ${BASE_IMAGE}
```

---

### EXPOSE — Document Port
```dockerfile
EXPOSE 8080
EXPOSE 8080/tcp
EXPOSE 9090/udp

# EXPOSE is documentation only — it does NOT publish the port.
# Use -p flag at runtime to actually publish:
docker run -p 8080:8080 myapp
```

---

### VOLUME — Declare Mount Point
```dockerfile
VOLUME ["/app/data"]
VOLUME /app/logs /app/uploads

# Declares that these paths should be persisted outside the container.
# Docker creates an anonymous volume automatically at runtime.
# Better: explicitly define volumes in docker run / docker-compose.
```

---

### USER — Non-Root User
```dockerfile
# Create group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Switch to non-root
USER appuser

# Or by UID
USER 1001
```

---

### HEALTHCHECK — Container Health
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Status: healthy / unhealthy / starting
```

---

### LABEL — Metadata
```dockerfile
LABEL maintainer="team@example.com" \
      version="1.0.0" \
      description="My Spring Boot API" \
      org.opencontainers.image.source="https://github.com/org/repo" \
      org.opencontainers.image.revision="${GIT_COMMIT}"
```

---

## Multi-Stage Builds

Build in one stage, copy only the result to the final image. Drastically reduces image size.

### Spring Boot — Multi-Stage Build
```dockerfile
# ─── Stage 1: Build ─────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy POM first — layer cache: only re-download deps when pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Now copy source and build
COPY src ./src
RUN mvn package -DskipTests -q

# ─── Stage 2: Extract layers (Spring Boot layered JARs) ──────────
FROM builder AS extractor
WORKDIR /build
RUN java -Djarmode=layertools -jar target/*.jar extract --destination extracted

# ─── Stage 3: Runtime ────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Security: non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy Spring Boot layers (ordered by change frequency — slowest changing first)
COPY --from=extractor --chown=spring:spring /build/extracted/dependencies/ ./
COPY --from=extractor --chown=spring:spring /build/extracted/spring-boot-loader/ ./
COPY --from=extractor --chown=spring:spring /build/extracted/snapshot-dependencies/ ./
COPY --from=extractor --chown=spring:spring /build/extracted/application/ ./

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

```
Without multi-stage:   ~650 MB (JDK + Maven + source + test deps + JAR)
With multi-stage:      ~180 MB (JRE only + app layers)
```

### Why Spring Boot Layers?
```
Spring Boot layered JAR extracts into:
  dependencies/          ← third-party JARs — rarely change
  spring-boot-loader/    ← boot loader — rarely changes
  snapshot-dependencies/ ← your SNAPSHOT deps — change occasionally
  application/           ← your code — changes often

→ Only the "application" layer is rebuilt on code change
→ CI pipeline rebuilds only the changed layer (seconds, not minutes)
```

---

## Layer Caching Optimization

The #1 performance tip: **put things that change rarely at the top, things that change often at the bottom**.

```dockerfile
# ❌ BAD ORDER — source code change invalidates ALL layers below
FROM eclipse-temurin:21-jre-alpine
COPY . .                          # ← Copies everything including source
RUN mvn package                   # ← Must re-run every time
COPY target/app.jar /app/app.jar

# ✅ GOOD ORDER — cache pom.xml deps independently of source
FROM maven:3.9-eclipse-temurin-21 AS builder
COPY pom.xml .                   # ← Only changes when deps change
RUN mvn dependency:go-offline    # ← Cached until pom.xml changes
COPY src ./src                   # ← Changes every commit
RUN mvn package -DskipTests      # ← Only re-runs when src changes
```

---

## .dockerignore

Exclude files from the **build context** sent to the Docker daemon. Speeds up builds and prevents secrets leaking into images.

```
# .dockerignore
.git
.gitignore
.idea
*.iml
target/             # Maven output — we build inside Docker
!target/myapp.jar   # But include final JAR if pre-built
*.log
.env                # ← NEVER send .env to Docker daemon
node_modules/
README.md
Dockerfile*
docker-compose*.yml
```

---

## Security Hardening Checklist

```dockerfile
# ✅ 1. Use minimal base image
FROM eclipse-temurin:21-jre-alpine  # NOT full JDK, NOT Debian

# ✅ 2. Non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# ✅ 3. No secrets in image
# Never: ENV DB_PASSWORD=secret123
# Do: docker run -e DB_PASSWORD=$SECRET at runtime

# ✅ 4. Read-only filesystem (set at runtime or in K8s)
# docker run --read-only --tmpfs /tmp myapp

# ✅ 5. Minimal layers — no build tools in final image (multi-stage)

# ✅ 6. Pin exact versions
FROM eclipse-temurin:21.0.5_11-jre-alpine  # pinned patch version
# NOT: FROM eclipse-temurin:21

# ✅ 7. Scan image for vulnerabilities
# trivy image myapp:1.0.0
```

---

## Common Dockerfile Patterns

### Pattern: Overridable JVM options
```dockerfile
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

# Override at runtime:
docker run -e JAVA_OPTS="-Xmx2g -XX:+UseG1GC" myapp
```

### Pattern: Wait for dependencies
```dockerfile
# Use wait-for-it.sh or dockerize to wait for DB before starting app
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
CMD ["/wait-for-it.sh", "db:5432", "--", "java", "-jar", "/app/app.jar"]
```

### Pattern: Configuration via environment
```dockerfile
# Spring Boot reads SPRING_* env vars automatically
docker run \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/mydb \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=$DB_PASS \
  -e SPRING_PROFILES_ACTIVE=production \
  myapp:1.0.0
```

---

## Build Commands

```bash
# Build an image
docker build -t myapp:1.0.0 .
docker build -t myapp:1.0.0 -f Dockerfile.prod .   # Custom Dockerfile name
docker build -t myapp:1.0.0 --no-cache .            # Force full rebuild
docker build -t myapp:1.0.0 --build-arg PROFILE=prod .

# Build and tag multiple
docker build -t myapp:1.0.0 -t myapp:latest .

# Multi-platform build (build for linux/amd64 AND linux/arm64)
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0.0 --push .

# Check image layers and size
docker history myapp:1.0.0
docker image inspect myapp:1.0.0
```

---

## Interview Questions

1. What is the difference between `CMD` and `ENTRYPOINT`?
2. What is a multi-stage build and why is it used?
3. Why does instruction order matter in a Dockerfile?
4. What is the `.dockerignore` file and why is it important?
5. What is the difference between `COPY` and `ADD`?
6. Why should you use `RUN apt-get update && apt-get install` in one `RUN` instruction?
7. How do Spring Boot layered JARs improve Docker build performance?
8. Why should containers run as a non-root user?
9. What is the difference between `ARG` and `ENV`?
10. What does `EXPOSE` actually do?
