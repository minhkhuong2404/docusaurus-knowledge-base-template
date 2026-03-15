---
id: docker-networking
title: Docker Networking
sidebar_label: Docker Networking
description: Complete guide to Docker networking — bridge, host, overlay, and none drivers, container DNS resolution, port publishing, creating custom networks, and connecting containers across Compose services.
tags: [docker, networking, bridge, overlay, dns, port-mapping, docker-compose, intermediate]
---

# Docker Networking

> Containers are isolated by default. Networking is how they talk to each other and the outside world.

---

## Network Drivers Overview

| Driver | Scope | Use Case |
|---|---|---|
| **bridge** | Single host | Default. Containers on same host communicate. |
| **host** | Single host | Container shares host's network stack. |
| **overlay** | Multi-host | Docker Swarm / multi-node communication. |
| **none** | Single host | Complete network isolation. |
| **macvlan** | Single host | Assign MAC address — container looks like physical device. |
| **ipvlan** | Single host | IP-level control without MAC assignment. |

---

## Bridge Network (Default)

When you run `docker run myapp`, Docker attaches it to the default `bridge` network.

```
Host Machine
  ├─ eth0 (172.31.0.1) — real network interface
  └─ docker0 (172.17.0.1) — virtual bridge
       ├─ container-A (172.17.0.2)
       ├─ container-B (172.17.0.3)
       └─ container-C (172.17.0.4)
```

```bash
# Inspect the default bridge
docker network inspect bridge

# Containers on default bridge can reach each other by IP
# but NOT by name — name-based DNS only works on user-defined bridges

# Test connectivity between containers
docker run -d --name container-a nginx
docker run --rm -it ubuntu bash
  $ ping 172.17.0.2   # Works (by IP)
  $ ping container-a  # FAILS on default bridge — no DNS
```

### User-Defined Bridge Networks (Recommended)

```bash
# Create custom network
docker network create --driver bridge my-network

# Attach containers at run time
docker run -d --name api    --network my-network myapp:1.0.0
docker run -d --name db     --network my-network postgres:16
docker run -d --name cache  --network my-network redis:7-alpine

# Now containers can communicate by SERVICE NAME
docker exec -it api bash
  $ ping db      # ✅ Works — DNS resolves "db" to db's IP
  $ ping cache   # ✅ Works
  $ curl http://api:8080/health  # ✅ Works
```

**User-defined bridge vs default bridge:**
| Feature | Default bridge | User-defined bridge |
|---|---|---|
| DNS (by name) | ❌ | ✅ |
| Automatic DNS | ❌ | ✅ |
| Network isolation | ❌ (all containers share) | ✅ (only connected containers) |
| Configurable CIDR | ❌ | ✅ |

---

## Host Network

Container shares the host's network namespace. No NAT. Best performance.

```bash
docker run --network host nginx
# nginx listens on port 80 of the HOST directly
# No -p flag needed (or possible)
```

```
Host Network Mode:
  ┌──────────────────────────────────────┐
  │  Host OS                              │
  │  eth0: 192.168.1.100                  │
  │                                       │
  │  Container (--network host)           │
  │  Shares:  192.168.1.100 — same IP!    │
  └──────────────────────────────────────┘
```

**Use cases:** High-performance networking, where NAT overhead matters (monitoring agents, network tools).  
**Limitation:** Only available on Linux hosts. Not available on Docker Desktop (macOS/Windows).

---

## None Network

Complete network isolation. No interfaces except loopback.

```bash
docker run --network none myapp
# Container has no network access at all
# Useful for: batch processing, security-sensitive workloads
```

---

## Port Publishing

```
Host Machine                Container
   :8080 ──────────────────→ :8080
   :5432 ──────────────────→ :5432
```

```bash
# -p host_port:container_port
docker run -p 8080:8080 myapp        # Bind on all interfaces
docker run -p 127.0.0.1:8080:8080 myapp  # Localhost only (secure)
docker run -p 0.0.0.0:8080:8080 myapp    # All interfaces (explicit)
docker run -p 8080:8080/udp myapp         # UDP port

# -P: publish ALL EXPOSE'd ports to random host ports
docker run -P myapp
docker port myapp   # → 0.0.0.0:32768 → 8080/tcp

# Multiple ports
docker run -p 8080:8080 -p 9090:9090 -p 5701:5701 myapp
```

### View Port Mappings
```bash
docker port my-api
# 8080/tcp -> 0.0.0.0:8080
# 9090/tcp -> 0.0.0.0:9090

docker ps --format "table {{.Names}}\t{{.Ports}}"
```

---

## DNS Resolution in Docker

Docker has a built-in DNS server at `127.0.0.11` for user-defined networks.

```
Container "api" wants to reach "db":
  1. api → DNS query for "db" → Docker internal DNS (127.0.0.11)
  2. Docker DNS → resolves "db" to its container IP
  3. api → connects to db's IP

Container aliases:
docker run --network my-net --network-alias primary-db postgres
docker run --network my-net --network-alias primary-db --network-alias pg postgres
# Both "primary-db" and "pg" resolve to the same container
```

---

## Overlay Network (Multi-Host / Docker Swarm)

Used when containers run on **different physical or virtual machines**.

```
Machine A                   Machine B
  container-1                 container-2
  container-3
      ↓                           ↓
  overlay network (VXLAN tunnel across hosts)
      └─── container-1 ←──────────→ container-2 ───┘
           (transparent — looks like same network)
```

```bash
# Only available in Docker Swarm mode
docker swarm init
docker network create --driver overlay --attachable my-overlay
docker service create --network my-overlay myapp
```

---

## Container-to-Container Communication Patterns

### Pattern 1: Shared User-Defined Network
```bash
docker network create app-net

docker run -d \
  --name postgres \
  --network app-net \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

docker run -d \
  --name api \
  --network app-net \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/mydb \
  myapp:1.0.0
# "api" resolves "postgres" by name → connects to DB container
```

### Pattern 2: Connect Container to Multiple Networks
```bash
docker network create frontend-net
docker network create backend-net

docker run -d --name nginx --network frontend-net nginx
docker run -d --name api --network backend-net myapp

# Connect api to both networks
docker network connect frontend-net api
# Now: nginx can reach api (frontend-net), api can reach db (backend-net)
# nginx cannot reach db directly (different network)
```

---

## Networking in Docker Compose

Docker Compose automatically creates a network and uses service names as DNS hostnames.

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/mydb
      SPRING_REDIS_HOST: redis
    networks:
      - backend
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: secret
    networks:
      - backend
    # NOT exposed to host — only accessible within backend network

  redis:
    image: redis:7-alpine
    networks:
      - backend
    # NOT exposed to host

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"       # ← Only nginx exposed to internet
    networks:
      - frontend
      - backend        # ← nginx is in both networks (bridges them)

networks:
  frontend:            # Internet-facing
  backend:             # Internal only
    internal: true     # No internet access from backend network
```

```
Internet → nginx (frontend + backend) → api (backend) → postgres (backend)
                                                       → redis (backend)
Internet CANNOT reach postgres or redis directly — they're on internal backend network only.
```

---

## Useful Networking Commands

```bash
# See which network a container is on
docker inspect my-api --format '{{json .NetworkSettings.Networks}}' | jq

# Get container IP in a specific network
docker inspect my-api \
  --format '{{.NetworkSettings.Networks.my-network.IPAddress}}'

# List all networks
docker network ls

# See all containers connected to a network
docker network inspect my-network \
  --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'

# Test DNS from inside container
docker exec -it api sh -c "nslookup postgres"
docker exec -it api sh -c "wget -qO- http://postgres:5432"
docker exec -it api sh -c "nc -zv postgres 5432"  # Check port open
```

---

## Troubleshooting Network Issues

```bash
# Container can't reach another by name?
# → Check they're on the SAME user-defined network
docker inspect container-a | grep NetworkMode
docker inspect container-b | grep NetworkMode

# Container can't reach internet?
# → Check DNS config inside container
docker exec container-a cat /etc/resolv.conf
docker exec container-a ping 8.8.8.8    # IP works?
docker exec container-a ping google.com  # DNS works?

# Port not accessible from host?
docker ps | grep 8080                   # Is port mapped?
docker port my-api                      # What host port?
# Check if binding to 127.0.0.1 (localhost only) vs 0.0.0.0

# Inspect full network config
docker network inspect bridge
```

---

## Interview Questions

1. What is the default Docker network driver and what are its limitations?
2. What is the difference between a user-defined bridge and the default bridge?
3. How do containers resolve each other by name?
4. When would you use `--network host` mode?
5. What does `-p 127.0.0.1:8080:8080` do vs `-p 8080:8080`?
6. How does Docker Compose handle networking between services?
7. How do you isolate the database container so it's not accessible from the internet in a Docker Compose setup?
8. What is an overlay network and when is it needed?
