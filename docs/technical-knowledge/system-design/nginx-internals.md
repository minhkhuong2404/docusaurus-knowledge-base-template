---
id: nginx-internals
title: Nginx Internals & Architecture
sidebar_label: Nginx Internals
description: Comprehensive deep dive into Nginx internals — Master-Worker architecture, epoll/kqueue event loop, thread pools, connection lifecycle, upstream proxying, load balancing, SSL/TLS termination, HTTP/2, caching, rate limiting, and production tuning.
tags: [system-design, networking, proxy, nginx, event-loop, load-balancing, ssl, http2, caching, rate-limiting, reverse-proxy]
---

import NginxArchitectureDiagram from '@site/src/components/NginxArchitectureDiagram';
import NginxEventLoopDiagram from '@site/src/components/NginxEventLoopDiagram';
import NginxThreadPoolDiagram from '@site/src/components/NginxThreadPoolDiagram';
import NginxUpstreamProxyDiagram from '@site/src/components/NginxUpstreamProxyDiagram';
import NginxLoadBalancingDiagram from '@site/src/components/NginxLoadBalancingDiagram';
import NginxTlsInternalsDiagram from '@site/src/components/NginxTlsInternalsDiagram';
import NginxHttp2Http3Diagram from '@site/src/components/NginxHttp2Http3Diagram';
import NginxCacheRateLimitDiagram from '@site/src/components/NginxCacheRateLimitDiagram';
import Http2MultiplexingDiagram from '@site/src/components/Http2MultiplexingDiagram';
import Http3QuicDiagram from '@site/src/components/Http3QuicDiagram';
import NginxPerformanceTuningDiagram from '@site/src/components/NginxPerformanceTuningDiagram';
import NginxGotchasChecklistDiagram from '@site/src/components/NginxGotchasChecklistDiagram';
import NginxProsConsDiagram from '@site/src/components/NginxProsConsDiagram';
import NginxConnectionLifecycleDiagram from '@site/src/components/NginxConnectionLifecycleDiagram';
import EpollTriggerModeDiagram from '@site/src/components/EpollTriggerModeDiagram';

# Nginx Internals & Architecture

**Nginx** (pronounced *"engine-x"*) is an open-source, ultra-high-performance HTTP server, reverse proxy, and load balancer. Originally written by Igor Sysoev in 2004 to conquer the **C10K problem** (handling 10,000 concurrent client connections on a single commodity server), NGINX revolutionized web infrastructure by replacing traditional *thread-per-connection* architectures with an asynchronous, non-blocking **event-driven epoll loop**.

Today, NGINX powers over a third of the world's busiest web services, serving as the frontline gateway for TLS termination, reverse proxy routing, static asset acceleration, and microservice load balancing.

---

## 1. The Core Mental Model: Why NGINX is Fast

```
Traditional Web Server (Apache MPM Prefork/Worker):
10,000 Connections ➔ 10,000 OS Threads ➔ ~20GB+ RAM (2-8MB stack/thread) + Severe CPU Context Thrashing

NGINX Asynchronous Event Loop:
10,000 Connections ➔ 1 Single-Threaded Worker Process (1 CPU Core) ➔ ~25MB RAM (~2.5KB/connection) + 0 CPU Idle Cost
```

<NginxArchitectureDiagram />

### Key Architectural Concepts That Make NGINX "Click"

1. **Non-Blocking OS Event Notifications (`epoll` / `kqueue`):** Instead of dedicating a thread that blocks waiting for a slow client to send HTTP bytes, NGINX registers tens of thousands of file descriptors with the Linux kernel's `epoll` subsystem. The worker process sleeps until the kernel fires an interrupt stating: *"Socket #482 has 1,024 bytes ready to read."* The worker reads the bytes, handles the state machine, and moves immediately to the next ready socket.
2. **Reverse Proxy vs. Forward Proxy:**
   - **Forward Proxy (Client-Facing):** Sits in front of client browsers (e.g. corporate VPN/gateway) to hide client IPs, filter outbound traffic, and bypass content restrictions.
   - **Reverse Proxy (Server-Facing):** Sits in front of internal microservices to hide backend IPs, terminate SSL/TLS, compress responses, cache assets, and distribute traffic across upstream clusters.
3. **Zero-Copy Static File Delivery (`sendfile`):** With `sendfile on;`, NGINX serves static files directly from the OS page cache to the network card via Direct Memory Access (DMA), avoiding 4 context switches and 2 in-memory CPU buffer copies per request.

---

## 2. Master-Worker Process Architecture

### The Master Process

The master process runs as `root` (required for binding to privileged ports < 1024) and never handles any client connection directly. Its sole responsibilities:

- **Configuration parsing and validation**: reads `nginx.conf`, validates syntax, resolves `include` directives.
- **Port binding**: opens the listening sockets (bind to port 80/443). These sockets are shared with worker processes via inheritance after `fork()`.
- **Worker lifecycle management**: spawns workers via `fork()`, monitors them with signals, restarts crashed workers automatically.
- **Signal handling**: interprets Unix signals to reload config, upgrade binary, gracefully shut down, or immediately terminate.

**Signal reference:**

```bash
nginx -s reload       # SIGHUP   — reload config (zero-downtime)
nginx -s quit         # SIGQUIT  — graceful shutdown (drain connections)
nginx -s stop         # SIGTERM  — immediate shutdown
nginx -s reopen       # SIGUSR1  — reopen log files (after logrotate)
kill -SIGUSR2 <pid>   # Binary upgrade — start new master with new binary
```

### Zero-Downtime Config Reload — How It Works

```
nginx -s reload triggers:

t=0s   Master receives SIGHUP signal
t=0s   Master forks NEW worker processes with new configuration
t=0s   Old workers receive graceful shutdown signal
t=0s   New workers begin accepting connections on the shared socket
t=Xs   Old workers finish processing in-flight requests
t=Xs   Old workers exit (X = however long last active request takes)

Result: zero dropped connections, zero downtime
        new config live immediately for new connections
        old connections served out by old workers until completion
```

### Zero-Downtime Binary Upgrade

```bash
# Step 1: Send SIGUSR2 to old master — spawns new master with new binary
kill -SIGUSR2 $(cat /run/nginx.pid)

# Step 2: Old master continues running with old workers
#         New master starts and spawns new workers (both running simultaneously)

# Step 3: Gracefully shut down old master's workers
kill -SIGWINCH $(cat /run/nginx.pid.oldbin)

# Step 4: After old connections drain, kill old master
kill -SIGQUIT $(cat /run/nginx.pid.oldbin)

# Both masters share the listening socket simultaneously during transition
# Zero connection drops, zero downtime
```

### Worker Process Isolation

Each worker process:
- Runs under an unprivileged user (`nginx`, `www-data`) — reduced attack surface.
- Is completely independent — no shared memory, no locks, no inter-worker communication for connection handling.
- Has its own file descriptor table, memory space, and event loop state.
- If a worker crashes (segfault, OOM), the master automatically spawns a replacement — other workers are unaffected.

```nginx
# nginx.conf — process model configuration
worker_processes auto;          # One per CPU core (auto-detected)
worker_cpu_affinity auto;       # Pin each worker to a specific CPU core
                                # Eliminates CPU cache invalidation from core-hopping

worker_rlimit_nofile 65535;     # Max open file descriptors per worker
                                # Must be >= worker_connections × 2
                                # (each connection uses 2 FDs: client + upstream)

events {
    worker_connections 16384;   # Max concurrent connections per worker
                                # Total system capacity = worker_processes × worker_connections
    use epoll;                  # Explicitly select epoll (Linux) — usually auto-detected
    multi_accept on;            # Accept all pending connections in one syscall
                                # instead of one at a time (reduces latency under load)
    accept_mutex off;           # Disable the mutex that serializes accept() across workers
                                # Beneficial under high load — workers compete directly
}
```

---

## 3. The Asynchronous Event Loop — Internals

### The Impedance Mismatch: Network vs. Disk I/O

<NginxEventLoopDiagram />


This distinction is why Nginx needs both an event loop AND a thread pool — they solve different I/O problems.

### epoll — The Linux Kernel Interface

`epoll` is a Linux kernel interface that monitors a set of file descriptors and notifies a process when any of them become ready for I/O. It is the foundation of Nginx's event loop on Linux.

```c
// Conceptual internal operation of the Nginx event loop (simplified)

// Initialization (once at worker startup)
epoll_fd = epoll_create1(0);           // Create epoll instance

// Register all listening sockets with epoll
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, listen_fd, &event);

// Main event loop (runs continuously)
while (running) {
    // BLOCKING: waits until at least one FD is ready
    // Returns immediately if events are already pending
    // Timeout of -1 means wait indefinitely
    int n_events = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);

    for (int i = 0; i < n_events; i++) {
        if (events[i].data.fd == listen_fd) {
            // New client connection — accept it
            int client_fd = accept(listen_fd, &addr, &addrlen);
            set_nonblocking(client_fd);
            epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &event); // Watch new connection
        } else {
            // Data ready on existing connection
            handle_connection_event(&events[i]);
            // handle_* functions are non-blocking:
            // they read/write what's available and return immediately
        }
    }
}
```

**epoll vs. older alternatives:**

| Mechanism | Complexity | Max FDs | Scalability | OS Support |
|:---|:---|:---|:---|:---|
| `select` | O(n) scan all FDs | 1024 (FD_SETSIZE) | ❌ Poor | POSIX |
| `poll` | O(n) scan all FDs | Unlimited | ❌ Poor | POSIX |
| `epoll` | O(1) per event | Millions | ✅ Excellent | Linux only |
| `kqueue` | O(1) per event | Millions | ✅ Excellent | BSD/macOS |

`select` and `poll` require the kernel to scan all registered file descriptors on every call — at 10,000 connections, that's 10,000 entries scanned to find the handful that are ready. `epoll` maintains a kernel-side readiness list and returns only the FDs that are actually ready — O(1) regardless of total connection count.

### The Complete Connection Lifecycle

<NginxConnectionLifecycleDiagram />


### Edge-Triggered vs Level-Triggered epoll

<EpollTriggerModeDiagram />


---

## 4. Thread Pool — Solving the Disk I/O Problem

Standard filesystem read operations (`read()`, `pread()`) block the calling thread until data is available from disk. On an SSD with a cache miss, this is ~100µs. On an HDD, it can be 10ms+. A single blocking call freezes the entire event loop and all thousands of connections it manages.

<NginxThreadPoolDiagram />


### Thread Pool Configuration

```nginx
# nginx.conf

# Define a named thread pool
# threads=32: number of worker threads in the pool
# max_queue=65536: max pending tasks; beyond this, Nginx returns 500 error
thread_pool disk_io_pool threads=32 max_queue=65536;

# A second pool for different workloads with different priority
thread_pool large_files_pool threads=8 max_queue=1024;

http {
    server {
        location /static/ {
            root /var/www;
            aio threads=disk_io_pool;    # Use thread pool for async file I/O
            aio_write on;                # Also use thread pool for writes (e.g., cache)

            # directio: bypass page cache for files > threshold
            # Useful for large files that won't benefit from caching
            # Direct I/O avoids double-buffering (page cache + app buffer)
            directio 4m;                 # Direct I/O for files > 4MB
            directio_alignment 512;      # Must match disk sector size

            output_buffers 2 512k;       # Buffer size for output
            sendfile on;                 # sendfile for files already in page cache
        }

        location /media/ {
            root /var/media;
            aio threads=large_files_pool;
            directio 1m;
        }
    }
}
```

**When to use thread pools vs. not:**

```
USE thread pools (aio threads) when:
    ✅ Serving large static files (videos, downloads) frequently missing the page cache
    ✅ Running on HDDs with high seek latency (not SSDs with NVMe)
    ✅ Cache miss rate is high (more unique files than page cache can hold)
    ✅ High concurrent request count — even brief event loop blocks are costly

DO NOT USE thread pools when:
    ❌ Serving small files that fit entirely in the OS page cache
       (sendfile on cached files is zero-copy and effectively instantaneous)
    ❌ Running on NVMe SSDs with sub-100µs latency
       (thread pool overhead may exceed the latency benefit)
    ❌ Low concurrency — the event loop block is negligible at low load
```

---

## 5. Upstream Proxying Internals

Nginx as a reverse proxy manages two separate event-loop state machines simultaneously: one for the **downstream** connection (client ↔ Nginx) and one for the **upstream** connection (Nginx ↔ backend server). Both are managed by the same single-threaded event loop using non-blocking I/O.

<NginxUpstreamProxyDiagram />


### Upstream Connection Pooling (`keepalive`)

Without connection pooling, every proxied request requires a new TCP connection to the upstream — including a 3-way handshake and potentially a TLS handshake. Under high traffic, this adds significant latency and causes connection exhaustion on the upstream.

```nginx
upstream backend {
    server 10.0.1.5:8080;
    server 10.0.1.6:8080;
    server 10.0.1.7:8080;

    keepalive 64;            # Keep up to 64 idle upstream connections per worker
                             # Total pool = 64 × worker_processes (e.g., 64 × 4 = 256 connections)
    keepalive_requests 1000; # Max requests per kept-alive upstream connection before close
    keepalive_timeout 60s;   # Close idle upstream connections after 60 seconds
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;              # Required for upstream keepalive
        proxy_set_header Connection "";      # Clear "Connection: close" from client request
                                             # so upstream doesn't close the connection
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Upstream timeouts — critical for preventing resource exhaustion
        proxy_connect_timeout 5s;   # Max time to establish upstream connection
        proxy_send_timeout 30s;     # Max time to send request to upstream
        proxy_read_timeout 30s;     # Max time to read response from upstream

        # Buffering — Nginx reads full upstream response before sending to client
        # Prevents slow clients from holding upstream connections open
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
}
```

**Proxy buffering — a critical behavior to understand:**

```
proxy_buffering on (default):
  Nginx reads full upstream response → buffers in memory/disk
  → Sends buffered response to client at client's pace
  → Upstream connection freed as soon as response is buffered
  → Client can be slow without holding the upstream connection

proxy_buffering off:
  Nginx passes data directly from upstream to client in real time
  → Upstream connection held open until client finishes reading
  → Required for: streaming responses, SSE, long polling
  → Risk: slow clients hold upstream connections open indefinitely
```

---

## 6. Load Balancing Algorithms

<NginxLoadBalancingDiagram />


### Round Robin (Default)

```nginx
upstream backend {
    server 10.0.1.5:8080;
    server 10.0.1.6:8080;
    server 10.0.1.7:8080;
    # Requests: A→5, B→6, C→7, D→5, E→6, F→7...
}
```

Simple rotation. Best when all servers have equal capacity and request processing time is uniform.

### Weighted Round Robin

```nginx
upstream backend {
    server 10.0.1.5:8080 weight=3;  # Receives 3/5 of traffic (60%)
    server 10.0.1.6:8080 weight=1;  # Receives 1/5 of traffic (20%)
    server 10.0.1.7:8080 weight=1;  # Receives 1/5 of traffic (20%)
}
```

Use when servers have different hardware capacity or when you want to gradually shift traffic during a canary deployment (e.g., new version at weight=1, stable at weight=9).

### Least Connections (`least_conn`)

```nginx
upstream backend {
    least_conn;   # Route to server with fewest active connections
    server 10.0.1.5:8080;
    server 10.0.1.6:8080;
    server 10.0.1.7:8080;
}
```

Optimal for heterogeneous request processing times — prevents a slow backend from accumulating a long backlog while fast backends are idle. Works best when request processing time varies significantly.

### IP Hash (`ip_hash`)

```nginx
upstream backend {
    ip_hash;   # Same client IP → always same upstream server
    server 10.0.1.5:8080;
    server 10.0.1.6:8080;
    server 10.0.1.7:8080;
}
```

Provides session affinity — useful for stateful applications that store session data in memory rather than a shared store. Uses the first 3 octets of the IPv4 address (or full IPv6) to select the server.

:::warning[IP hash is a brittle session affinity mechanism]
If a backend server is removed from the pool, all sessions that were pinned to it are redistributed — effectively logging out those users. Modern architectures prefer storing session state in Redis or a database, making session affinity unnecessary. Avoid `ip_hash` for new systems; prefer `least_conn` with application-level session management.
:::

### Hash (Custom Key)

```nginx
upstream backend {
    hash $request_uri consistent;  # Route by URI — same path → same upstream
    # "consistent" uses consistent hashing (ketama algorithm)
    # Minimizes remapping when servers are added/removed
    server 10.0.1.5:8080;
    server 10.0.1.6:8080;
}
```

Useful for cache locality — requests for the same resource always reach the same upstream, maximizing the upstream's in-process cache hit rate.

### Upstream Health Checks (Nginx Plus) and Passive Health (OSS)

```nginx
# Passive health checking (open-source Nginx)
# After max_fails failures in fail_timeout window, mark server down
upstream backend {
    server 10.0.1.5:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.6:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.7:8080 backup;   # Only used when primary servers are down
}
```

---

## 7. SSL/TLS Termination Internals

<NginxTlsInternalsDiagram />


### TLS Handshake Overhead and Session Resumption

A full TLS 1.3 handshake adds ~1 RTT (round-trip time) latency before any HTTP data flows. For HTTPS connections over the public internet (50ms RTT), this adds 50ms to the first request of each connection.

```nginx
ssl_session_cache shared:SSL:50m;      # Shared session cache across all workers (50MB)
                                        # Stores session tickets/IDs for resumption
ssl_session_timeout 1d;                # Sessions valid for 1 day
ssl_session_tickets off;               # Disable stateless session tickets (PFS concern)
                                        # Use server-side session cache instead

# TLS 1.3 0-RTT (early data) — reduces handshake to zero additional RTT on resumption
# Risk: 0-RTT data can be replayed by adversaries — only use for idempotent requests
ssl_early_data on;
proxy_set_header Early-Data $ssl_early_data;  # Pass flag to upstream so it can reject non-idempotent early data
```

### OCSP Stapling — Eliminating Revocation Check Latency

Without OCSP stapling, the client must contact the Certificate Authority's OCSP responder to verify the certificate is not revoked — adding a DNS lookup + TCP + HTTP round-trip (50–300ms) to every new TLS connection.

With OCSP stapling, Nginx fetches the OCSP response from the CA and includes it in the TLS handshake — no separate client round-trip required:

```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    ssl_stapling on;              # Enable OCSP stapling
    ssl_stapling_verify on;       # Verify the OCSP response
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;  # Full chain for verification
    resolver 8.8.8.8 8.8.4.4 valid=300s;  # DNS resolver for OCSP lookup
    resolver_timeout 5s;

    ssl_protocols TLSv1.2 TLSv1.3;    # Disable SSLv3, TLS 1.0, 1.1 (deprecated)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...';
    ssl_prefer_server_ciphers on;
    ssl_ecdh_curve X25519:prime256v1;   # Preferred ECDH curves
}
```

### mTLS (Mutual TLS) — Client Certificate Verification

```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # Require clients to present a valid certificate signed by our CA
    ssl_client_certificate /etc/nginx/ssl/ca.crt;
    ssl_verify_client on;           # Reject connections without valid client cert
    ssl_verify_depth 2;             # Verify up to 2 levels in the cert chain

    location /internal-api/ {
        # Pass client cert subject to upstream for authorization
        proxy_set_header X-SSL-Client-CN  $ssl_client_s_dn_cn;
        proxy_set_header X-SSL-Client-DN  $ssl_client_s_dn;
        proxy_set_header X-SSL-Verified   $ssl_client_verify;
        proxy_pass http://backend;
    }
}
```

---

## 8. HTTP/2 and HTTP/3

<NginxHttp2Http3Diagram />


### HTTP/2 Multiplexing

<Http2MultiplexingDiagram />


```nginx
server {
    listen 443 ssl;
    http2 on;               # Enable HTTP/2 (Nginx 1.25.1+ syntax)
                            # Older: listen 443 ssl http2;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # HTTP/2 stream limits
    http2_max_concurrent_streams 128;   # Max simultaneous streams per connection
    http2_recv_buffer_size 256k;
    http2_chunk_size 8k;               # Size of DATA frame chunks

    # Server push (HTTP/2) — proactively send resources client will need
    # Note: browser support is declining; evaluate before using
    location /index.html {
        http2_push /styles/main.css;
        http2_push /scripts/app.js;
    }
}
```

### HTTP/3 and QUIC

<Http3QuicDiagram />


```nginx
# HTTP/3 support (requires Nginx built with QUIC support — Nginx 1.25+)
server {
    listen 443 quic reuseport;    # QUIC/HTTP3 (UDP)
    listen 443 ssl;               # TCP/HTTP2 and HTTP1.1 (keep both)
    http2 on;
    http3 on;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Tell clients HTTP/3 is available via Alt-Svc header
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

---

## 9. Caching

<NginxCacheRateLimitDiagram />


```nginx
# Cache zone definition (must be in http {} block)
# keys_zone: name=cache-name size=shared-memory-for-keys
# max_size:  max disk space for cached content
# inactive:  remove cached content not accessed in this time
# use_temp_path=off: write directly to cache dir (avoids extra copy)
proxy_cache_path /var/cache/nginx
    keys_zone=api_cache:10m
    max_size=1g
    inactive=60m
    use_temp_path=off;

server {
    location /api/ {
        proxy_cache api_cache;
        proxy_cache_valid 200 301 302  10m;  # Cache 200/301/302 for 10 minutes
        proxy_cache_valid 404           1m;  # Cache 404 for 1 minute
        proxy_cache_valid any           30s; # Cache anything else for 30 seconds

        proxy_cache_key "$scheme$request_method$host$request_uri";  # Cache key

        # Cache bypass: if client sends Cache-Control: no-cache, bypass cache
        proxy_cache_bypass $http_cache_control;
        proxy_no_cache $http_cache_control;    # Don't cache this response

        # Serve stale content if upstream is unavailable
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
        proxy_cache_lock on;       # Only one request fetches a missing cache entry
                                   # Other concurrent requests wait (prevents thundering herd)
        proxy_cache_lock_timeout 5s;

        # Add cache status header for debugging
        add_header X-Cache-Status $upstream_cache_status;  # HIT, MISS, BYPASS, EXPIRED, STALE
        # STALE: served stale content because upstream was down (use_stale)
        # UPDATING: served stale while background refresh runs

        proxy_pass http://backend;
    }

    # Micro-caching: cache responses for just 1 second
    # Even 1s cache can absorb hundreds of requests to a slow endpoint
    location /api/hot-endpoint {
        proxy_cache api_cache;
        proxy_cache_valid 200 1s;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_pass http://backend;
    }
}
```

### Cache Purge (Nginx Plus or `ngx_cache_purge` module)

```nginx
# Purge a cached URL via a PURGE HTTP method
location ~ /purge(/.*) {
    allow 127.0.0.1;           # Only allow from localhost
    allow 10.0.0.0/8;          # And internal network
    deny all;
    proxy_cache_purge api_cache "$scheme$request_method$host$1";
}
```

```bash
# Purge specific URL from cache
curl -X PURGE http://localhost/api/users/123

# Purge by wildcard (Nginx Plus)
curl -X PURGE "http://localhost/api/products/*"
```

---

## 10. Rate Limiting

Nginx implements rate limiting using the **leaky bucket algorithm** — requests fill a virtual bucket, and the bucket drains at a constant rate. Requests that overflow the bucket are either delayed or rejected.

### Request Rate Limiting (`limit_req`)

```nginx
http {
    # Define rate limit zones (shared memory for tracking)
    # $binary_remote_addr: use client IP as key (4 bytes binary, more efficient than string)
    # zone=api_limit:10m: 10MB shared memory (stores ~160,000 IPv4 addresses)
    # rate=100r/s: 100 requests per second per IP allowed
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    # Per-user rate limit (requires auth, uses user ID from JWT/session)
    limit_req_zone $http_x_user_id zone=user_limit:10m rate=50r/s;

    # Global rate limit across all IPs combined
    limit_req_zone $server_name zone=global_limit:1m rate=10000r/s;

    server {
        location /api/ {
            # Apply rate limit with burst
            # burst=200: allow up to 200 requests to queue (burst) above the rate
            # nodelay: don't delay burst requests — serve immediately up to burst limit
            #          requests beyond burst+rate are rejected with 429
            limit_req zone=api_limit burst=200 nodelay;
            limit_req zone=global_limit burst=5000 nodelay;

            limit_req_status 429;               # Return 429 (not default 503) on limit
            limit_req_log_level warn;           # Log rate-limited requests as warnings

            proxy_pass http://backend;
        }

        # Stricter limit for login endpoint (anti-brute-force)
        location /auth/login {
            limit_req zone=api_limit burst=5 nodelay;
            limit_req_status 429;
            proxy_pass http://auth-backend;
        }
    }
}
```

### Connection Rate Limiting (`limit_conn`)

```nginx
http {
    # Limit simultaneous connections per IP
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        location /downloads/ {
            limit_conn conn_limit 10;    # Max 10 simultaneous connections per IP
            limit_conn_status 429;
            limit_rate 1m;              # Bandwidth: 1MB/s per connection
            limit_rate_after 10m;       # Apply rate limiting after first 10MB (full speed initially)
            root /var/downloads;
        }
    }
}
```

**Burst + nodelay explained:**

```
rate=100r/s, burst=200, nodelay:

Allowed:       First 200 requests arrive simultaneously → all served immediately (burst)
               Next requests at ≤ 100r/s → served immediately (within rate)
Rejected (429): Requests exceeding rate when burst queue is full

Without nodelay:
               Burst requests are queued and served slowly at the rate
               200 burst requests → served over 2 seconds (100r/s)
               Creates artificial latency, but still serves all requests

Use nodelay when: you want fast response for legitimate burst traffic
                  (e.g., user clicking multiple things at once)
Omit nodelay when: you want to smooth out bursts to protect the upstream
```

---

## 11. Performance Tuning Reference

<NginxPerformanceTuningDiagram />


### Worker and Connection Tuning

```nginx
worker_processes auto;          # Match CPU count
worker_cpu_affinity auto;       # Pin workers to CPUs (improves L1/L2 cache locality)
worker_rlimit_nofile 65535;     # File descriptors per worker
                                # Must be set before worker_connections

events {
    worker_connections 16384;   # Connections per worker
    use epoll;                  # epoll on Linux (auto-detected, but explicit is clear)
    multi_accept on;            # Accept all queued connections per epoll event
    accept_mutex off;           # Off improves latency under high load
}
```

### Buffer and Timeout Tuning

```nginx
http {
    # Request body limits
    client_max_body_size 100m;          # Max request body size (0 = unlimited)
    client_body_buffer_size 128k;       # Buffer for request body in memory
                                        # If body > this, written to temp file

    # Header limits
    client_header_buffer_size 1k;       # Buffer for reading request headers
    large_client_header_buffers 4 8k;   # For large headers (cookies, JWT tokens)

    # Timeouts (all critical for resource cleanup)
    client_header_timeout 15s;    # Time to receive full headers
    client_body_timeout   30s;    # Time between successive body reads
    send_timeout          30s;    # Time between successive sends to client
    keepalive_timeout     65s;    # How long to keep idle keepalive connections
    keepalive_requests    1000;   # Max requests per keepalive connection

    # TCP optimizations
    sendfile on;                  # Zero-copy file transfer
    tcp_nopush on;                # Batch TCP packets (with sendfile only)
                                  # Sends headers + start of file in one TCP packet
    tcp_nodelay on;               # Disable Nagle algorithm for keepalive connections
                                  # Reduces latency for small responses
}
```

### Compression

```nginx
http {
    gzip on;
    gzip_comp_level 4;            # 1 (fastest) to 9 (smallest) — 4-6 is balanced
    gzip_min_length 1000;         # Don't compress responses < 1KB (overhead not worth it)
    gzip_types
        text/plain text/css text/xml text/javascript
        application/json application/javascript application/xml
        application/rss+xml image/svg+xml;
    gzip_vary on;                 # Add Vary: Accept-Encoding header (for caches)
    gzip_proxied any;             # Compress responses proxied from upstream

    # Pre-compressed files — serve .gz files if client accepts gzip
    # Pre-compress static assets at build time; serves without CPU cost at runtime
    gzip_static on;
}
```

### OS-Level Kernel Tuning (sysctl.conf)

```bash
# /etc/sysctl.conf — kernel parameters that Nginx depends on

# Increase listen backlog — connections waiting to be accepted
net.core.somaxconn = 65535

# Increase the socket receive/send buffer sizes
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# TCP receive/send buffer auto-tuning range
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Allow reuse of TIME_WAIT sockets for new connections
net.ipv4.tcp_tw_reuse = 1

# Increase ephemeral port range (for outbound connections to upstream)
net.ipv4.ip_local_port_range = 1024 65535

# Increase max file descriptors system-wide
fs.file-max = 2000000

# Apply without reboot
sysctl -p
```

**Corresponding `/etc/security/limits.conf` for Nginx process:**

```
nginx   soft   nofile   65535
nginx   hard   nofile   65535
```

---

## 12. Observability — Metrics and Logging

### Stub Status (Basic OSS Metrics)

```nginx
server {
    listen 127.0.0.1:8080;   # Bind only to localhost — never expose publicly

    location /nginx_status {
        stub_status;
        allow 127.0.0.1;
        deny all;
    }
}
```

```bash
curl http://127.0.0.1:8080/nginx_status

# Output:
# Active connections: 512
# server accepts handled requests
#  10000    10000    25000
# Reading: 12 Writing: 24 Waiting: 476
#
# Active connections: total open connections (Reading + Writing + Waiting)
# accepts: total TCP connections accepted since start
# handled: should equal accepts (drops = accepts > handled)
# requests: total HTTP requests served (> handled due to keepalive)
# Reading:  connections reading request (parsing headers)
# Writing:  connections sending response
# Waiting:  idle keepalive connections (not currently transferring)
```

### Structured Access Log

```nginx
http {
    # JSON-structured access log for log aggregation (Elasticsearch, Loki, etc.)
    log_format json_combined escape=json
        '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes":$body_bytes_sent,'
        '"request_time":$request_time,'         # Total request time (seconds)
        '"upstream_time":"$upstream_response_time",'  # Time waiting for upstream
        '"upstream_addr":"$upstream_addr",'     # Which backend served the request
        '"http_referrer":"$http_referer",'
        '"http_user_agent":"$http_user_agent",'
        '"cache_status":"$upstream_cache_status"'
        '}';

    access_log /var/log/nginx/access.log json_combined buffer=32k flush=5s;
    # buffer=32k: buffer log writes (reduce disk I/O)
    # flush=5s: flush buffer every 5 seconds (slight log delay, acceptable)

    error_log /var/log/nginx/error.log warn;    # warn, error, crit — not info in production
}
```

---

## 13. Common Gotchas & Anti-Patterns

<NginxGotchasChecklistDiagram />


### 1. Blocking the Event Loop with Synchronous Code

```nginx
# ❌ ANTI-PATTERN: blocking Lua code in the request path
location /api/ {
    content_by_lua_block {
        -- Synchronous HTTP call — blocks the entire event loop for the duration!
        local http = require "resty.http"
        local httpc = http.new()
        local res = httpc:request_uri("http://slow-service:8080/data")
        ngx.say(res.body)
    }
}

# ✅ FIX: use cosocket-based async Lua (nginx-lua's cosockets)
location /api/ {
    content_by_lua_block {
        local http = require "resty.http"
        local httpc = http.new()
        -- resty.http uses cosockets: yields to event loop while waiting
        local res, err = httpc:request_uri("http://service:8080/data")
        ngx.say(res.body)
    }
}
```

### 2. Too Many or Too Few Worker Processes

```nginx
# ❌ TOO MANY: worker_processes 32 on a 4-core machine
# Creates 32 processes competing for 4 CPUs → context-switching overhead

# ❌ TOO FEW: worker_processes 1 on a 16-core machine
# Only one CPU used → CPU-bound operations (TLS, gzip) bottleneck on one core

# ✅ CORRECT:
worker_processes auto;          # Nginx detects CPU count automatically
worker_cpu_affinity auto;       # Pin each worker to a dedicated core
```

### 3. Forgetting `proxy_set_header Connection ""`

```nginx
# ❌ Without clearing Connection header:
# Client sends "Connection: close" → Nginx forwards it to upstream
# Upstream closes the connection after response → no keepalive benefit
location /api/ {
    proxy_pass http://backend;
    # Missing: proxy_set_header Connection "";
}

# ✅ Correct upstream keepalive configuration:
location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";  # Clear connection header so upstream keeps alive
}
```

### 4. Using `add_header` in Multiple Blocks (Inheritance Bug)

```nginx
# ❌ BROKEN: add_header in child block overwrites ALL headers from parent
http {
    add_header X-Frame-Options SAMEORIGIN;      # Security header

    server {
        add_header X-Custom-Header "value";     # This REPLACES X-Frame-Options!
                                                # Parent add_header is LOST
    }
}

# ✅ FIX: repeat all headers in every block that uses add_header
server {
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Custom-Header "value";
}
# Or use: include headers.conf; in each block
```

### 5. Leaking Real Client IPs to Upstream

```nginx
# ❌ Without X-Real-IP / X-Forwarded-For:
# Upstream sees Nginx's IP (127.0.0.1 or internal IP) as the client
# Access logs show wrong IPs, rate limiting by IP fails, geo-blocking fails

# ✅ Always set IP forwarding headers:
location / {
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host              $host;
    proxy_pass http://backend;
}

# If Nginx is behind another proxy/CDN, trust the existing X-Forwarded-For:
set_real_ip_from 10.0.0.0/8;           # Trust IPs from internal network
real_ip_header X-Forwarded-For;         # Use this header to find real client IP
real_ip_recursive on;                   # Peel back IPs in X-Forwarded-For chain
```

### 6. Misconfigured `worker_rlimit_nofile`

```
Each active connection uses at minimum 2 file descriptors:
  - 1 for the client socket
  - 1 for the upstream connection (if proxying)

With proxy_cache: +1 FD for the cache file
With SSL: +1 FD for the TLS context

Formula: worker_rlimit_nofile ≥ worker_connections × 4 (with headroom)
         worker_rlimit_nofile = 65535 covers worker_connections = 16384 comfortably

If rlimit too low: "too many open files" errors, connections dropped
```

---

## 14. Pros vs. Cons

<NginxProsConsDiagram />


| Pros | Cons |
|:---|:---|
| **Minimal memory footprint** — ~4MB per worker, ~256 bytes per connection, scales to hundreds of thousands of concurrent connections | **Single-threaded per worker** — CPU-bound work (heavy Lua, complex regex, gzip) blocks the event loop for that worker |
| **Predictable performance** — event-driven model has linear, low variance latency across connection counts | **Disk I/O requires thread pool** — non-trivial configuration; misconfiguration silently falls back to blocking |
| **Zero-downtime ops** — config reload, binary upgrade, graceful shutdown without connection drops | **Configuration complexity** — subtle interactions between directives (e.g., `add_header` inheritance, `try_files` ordering) are easy to get wrong |
| **Worker isolation** — a crashed worker is automatically replaced; other workers unaffected | **No native async DNS** — by default, upstream hostname resolution is blocking; requires `resolver` directive and careful configuration |
| **Battle-tested at scale** — powers Netflix, Cloudflare, GitHub, and the majority of top-1000 websites | **Windows has limited feature parity** — epoll/kqueue not available; Windows port uses `select` or IOCP with lower performance |
| **Composable modules** — SSL termination, load balancing, caching, rate limiting, auth all in one process | **Advanced features require Nginx Plus** — active health checks, dynamic reconfiguration API, session persistence are commercial-only |

---

## Interview Questions

### Q1: How does Nginx handle 10,000 concurrent connections with one thread per worker?

Nginx uses an event-driven, asynchronous architecture. Instead of allocating a thread per connection, each worker registers all connection sockets with the OS kernel via epoll (Linux) or kqueue (BSD). The kernel notifies the worker only when I/O is ready — data arrived, buffer cleared, connection established. The worker's single thread processes ready events sequentially in microseconds each, then returns to `epoll_wait()`. Because there's no thread context switching and no idle threads, 10,000 connections consume only ~4MB of worker memory plus ~256 bytes per connection, with CPU used only for actual work.

---

### Q2: Why does Nginx need a thread pool if it's event-driven?

The epoll/kqueue event loop works perfectly for network sockets, which support non-blocking I/O. Regular filesystem files on standard filesystems (ext4, xfs) do not — `read()` on a file always blocks the calling thread until data is available. A single 10ms disk read (HDD cache miss) would freeze the entire event loop and all thousands of connections it manages. The thread pool offloads these blocking disk reads to separate threads, keeping the event loop free to handle network events while the thread blocks on disk.

---

### Q3: What is zero-copy sendfile and why does it matter?

Without sendfile, serving a static file requires four memory copies: disk → kernel page cache, page cache → userspace buffer, userspace buffer → socket buffer, socket buffer → NIC. With `sendfile on`, Nginx asks the kernel to copy directly from the page cache to the socket buffer, bypassing userspace entirely. This eliminates two memory copies and two context switches per file served — critical for static asset serving at high concurrency.

---

### Q4: How does Nginx achieve zero-downtime config reloads?

When `nginx -s reload` (SIGHUP) is sent, the master process forks new worker processes with the new configuration. New connections are accepted only by the new workers. The old workers receive a graceful shutdown signal — they stop accepting new connections but finish serving all active in-flight requests. Once the last active request on an old worker completes, that old worker exits. From the client's perspective, there are zero dropped connections.

---

### Q5: What is the difference between `proxy_buffering on` and off?

With `proxy_buffering on` (default), Nginx reads the complete upstream response into memory buffers before sending anything to the client. This frees the upstream connection as soon as the response is buffered, regardless of how slowly the client reads. With `proxy_buffering off`, data flows directly from upstream to client — the upstream connection is held open until the client finishes reading. `off` is required for streaming responses (SSE, chunked streaming, long polling) but risks holding upstream connections open indefinitely for slow clients.

---

### Q6: How does Nginx rate limiting work internally?

Nginx rate limiting uses the leaky bucket algorithm. A shared memory zone tracks request timestamps per key (usually client IP). Requests fill the bucket; the bucket drains at the configured rate. `limit_req zone=X rate=100r/s burst=200 nodelay` means: allow up to 200 requests immediately in a burst (filled bucket), then allow up to 100r/s continuously. Requests beyond burst capacity while the bucket is full are rejected with 429. The `nodelay` flag serves burst requests immediately rather than spreading them over the rate period.
