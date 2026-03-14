---
id: network-performance-optimization
title: Network Performance & Optimization
description: Latency, bandwidth, throughput, connection pooling, keep-alive, HTTP/2 multiplexing, QUIC, compression, and practical tuning techniques.
tags: [networking, performance, latency, bandwidth, quic, http2, compression, keep-alive, optimization]
sidebar_position: 13
---

# Network Performance & Optimization

## Key Metrics

| Metric | Definition | Typical Values |
|--------|-----------|----------------|
| **Latency (RTT)** | Round-trip time for a packet | Same datacenter: &lt;1ms; Cross-continent: 100–200ms |
| **Bandwidth** | Maximum data rate | 1 Gbps server NIC; 100 Mbps home broadband |
| **Throughput** | Actual data transferred per second | Always ≤ bandwidth (overhead reduces it) |
| **Packet loss** | % of packets not delivered | >1% causes severe TCP performance degradation |
| **Jitter** | Variance in latency | High jitter = poor VoIP/video quality |
| **TTFB** | Time To First Byte | Time from request → first byte of response |

---

## The Latency Hierarchy

```
Intra-CPU cache:    < 1 ns
RAM access:           100 ns
SSD read:           0.1 ms
Same datacenter:    0.5–1 ms   ← optimize heavily here
Same city (LAN):     5–10 ms
Same country:       20–50 ms
Cross-continent:   100–200 ms
Satellite (LEO):   20–40 ms   (Starlink)
Satellite (GEO):   600+ ms

Speed of light in fiber ≈ 200,000 km/s (⅔ of c)
NY → London = 5,600 km → minimum one-way: 28ms → RTT ≥ 56ms
```

---

## Connection Overhead

Every new TCP+TLS connection requires:
```
TCP handshake:     1 RTT   (SYN → SYN-ACK → ACK)
TLS 1.3:           1 RTT   (combined in QUIC)
TLS 1.2:           2 RTT

Total for HTTPS (TCP + TLS 1.3): 2 RTT before first byte of HTTP
On a 100ms RTT link: 200ms just to establish connection!

Solution: connection reuse (keep-alive, connection pooling)
```

---

## HTTP Keep-Alive & Connection Reuse

```
Without Keep-Alive:
  [TCP handshake][TLS][HTTP req/resp][TCP close]  ← every request!
  [TCP handshake][TLS][HTTP req/resp][TCP close]

With Keep-Alive:
  [TCP handshake][TLS][HTTP req/resp][HTTP req/resp][HTTP req/resp][close]
  One connection, many requests!
```

```http
# HTTP/1.1: keep-alive is default
Connection: keep-alive
Keep-Alive: timeout=5, max=1000

# HTTP/2: multiplexing makes this even better
# Multiple requests on one connection simultaneously
```

```java
// Spring RestTemplate connection pooling
@Bean
public RestTemplate restTemplate() {
    PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
    cm.setMaxTotal(200);            // max total connections
    cm.setDefaultMaxPerRoute(20);   // max per host

    CloseableHttpClient client = HttpClients.custom()
        .setConnectionManager(cm)
        .setKeepAliveStrategy((response, context) -> 30_000)  // 30s keep-alive
        .setDefaultRequestConfig(RequestConfig.custom()
            .setConnectTimeout(Timeout.ofSeconds(5))
            .setResponseTimeout(Timeout.ofSeconds(30))
            .build())
        .build();

    return new RestTemplate(new HttpComponentsClientHttpRequestFactory(client));
}

// Spring WebClient (preferred for reactive)
@Bean
public WebClient webClient() {
    ConnectionProvider provider = ConnectionProvider.builder("http-pool")
        .maxConnections(200)
        .pendingAcquireMaxCount(500)
        .maxIdleTime(Duration.ofSeconds(20))
        .build();

    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(
            HttpClient.create(provider)
                .responseTimeout(Duration.ofSeconds(30))))
        .baseUrl("https://api.example.com")
        .build();
}
```

---

## HTTP/2 Multiplexing

```
HTTP/1.1: max 6 connections per origin (browser limit)
          1 request per connection at a time = 6 concurrent requests

HTTP/2: 1 connection, unlimited concurrent streams
        100 requests fly in parallel over 1 TCP connection

Key HTTP/2 performance features:
  ┌─────────────────────────────────────────────┐
  │ HPACK header compression: ~85% header reduction  │
  │ Multiplexing: concurrent requests, 1 connection  │
  │ Server push: proactively send CSS/JS with HTML   │
  │ Stream prioritization: critical resources first  │
  └─────────────────────────────────────────────┘
```

---

## QUIC and HTTP/3

QUIC solves TCP's fundamental limitations for HTTP:

```
Problem 1: TCP head-of-line blocking
  HTTP/2 on TCP: 1 lost packet blocks ALL streams until retransmitted
  QUIC: each stream is independent; one lost packet only blocks its own stream

Problem 2: Connection establishment latency
  TCP + TLS 1.3: 2 RTT before data
  QUIC: 1 RTT first connection; 0-RTT for resumption (known server)

Problem 3: Connection migration (mobile)
  TCP: connection identified by 4-tuple (src_ip:port, dst_ip:port)
       IP change (Wi-Fi → mobile) = connection broken, full reconnect
  QUIC: connection ID is independent of IP — survives network handoffs
```

```
0-RTT Resumption:
  First connection:  1 RTT handshake + server sends session ticket
  Later connections: client sends data + session ticket in first packet
                     0 RTT before data starts flowing!
```

---

## Compression

### Response Body Compression

```nginx
# nginx: gzip compression
gzip on;
gzip_types text/plain application/json application/javascript text/css;
gzip_min_length 1024;         # only compress if > 1KB
gzip_comp_level 6;            # 1-9, tradeoff: cpu vs ratio
gzip_vary on;                 # add Vary: Accept-Encoding header

# Brotli (better than gzip, ~15% smaller)
brotli on;
brotli_types text/plain application/json;
brotli_comp_level 6;
```

```java
// Spring Boot: enable gzip
server:
  compression:
    enabled: true
    mime-types: application/json,text/html,text/plain
    min-response-size: 1024
```

### Protocol Buffers vs JSON Size

```
JSON:     {"userId":42,"total":99.90,"status":"pending","items":[{"productId":1,"qty":2}]}
          → ~85 bytes

Protobuf: binary encoding of same message
          → ~25 bytes (3.4x smaller)
          → faster to serialize/deserialize
```

---

## TCP Tuning for High Throughput

```bash
# Increase socket buffers for high-bandwidth-delay-product paths
# BDP = bandwidth × RTT (bytes "in flight" for max throughput)
# 1 Gbps × 100ms RTT = 12.5 MB BDP → buffers must be ≥ 12.5 MB

sysctl -w net.core.rmem_max=16777216         # max receive buffer (16 MB)
sysctl -w net.core.wmem_max=16777216         # max send buffer
sysctl -w net.ipv4.tcp_rmem="4096 87380 16777216"
sysctl -w net.ipv4.tcp_wmem="4096 65536 16777216"

# Enable TCP window scaling (needed for BDP > 64KB)
sysctl -w net.ipv4.tcp_window_scaling=1

# Enable SACK (selective ack — only retransmit lost segments)
sysctl -w net.ipv4.tcp_sack=1

# BBR congestion control (better on high-latency / lossy paths)
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Increase connection backlog
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.tcp_max_syn_backlog=65535

# TIME_WAIT tuning (high-throughput servers)
sysctl -w net.ipv4.tcp_tw_reuse=1            # reuse TIME_WAIT sockets
sysctl -w net.ipv4.ip_local_port_range="1024 65535"  # more ephemeral ports
```

---

## DNS Pre-Resolution & Connection Pre-Warming

```html
<!-- Browser hints: pre-resolve DNS before user clicks link -->
<link rel="dns-prefetch" href="//api.example.com">

<!-- Pre-connect (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://api.example.com">

<!-- Prefetch entire resource -->
<link rel="prefetch" href="/api/products">
```

---

## Measuring Network Performance

```bash
# Ping: basic latency (ICMP)
ping -c 100 api.example.com    # 100 samples → see jitter
ping -i 0.2 -c 100 google.com  # 200ms interval

# traceroute: path + per-hop latency
traceroute -n api.example.com    # -n = no DNS reverse lookup
mtr api.example.com              # continuous, interactive traceroute

# TCP connection timing
curl -w "\n
DNS:     %{time_namelookup}s
Connect: %{time_connect}s
TLS:     %{time_appconnect}s
TTFB:    %{time_starttransfer}s
Total:   %{time_total}s\n" \
     -o /dev/null -s https://api.example.com

# iperf3: measure actual bandwidth
iperf3 -s                        # server mode
iperf3 -c server-ip -t 30        # client: 30 second test

# ss: socket statistics (Linux)
ss -s                            # summary
ss -tn state established         # TCP established connections
ss -tn sport = :8080             # connections on port 8080
```

---

## Bandwidth-Delay Product (BDP)

```
BDP = bandwidth × RTT

Example: 1 Gbps link, 100ms RTT
BDP = 1,000,000,000 bits/s × 0.1s = 100,000,000 bits = 12.5 MB

This is how much data can be "in flight" at once.
TCP window must be ≥ BDP for full link utilization.

Default TCP window: 64KB = ~5 Mbps on 100ms link!
With window scaling (up to 1 GB window): ≥ 1 Gbps on 100ms link ✅
```

---

## 🎯 Interview Questions

**Q1. What is the difference between latency, bandwidth, and throughput?**
> Latency: time for a packet to travel from source to destination (one-way) or round-trip (RTT). Bandwidth: maximum capacity of the channel (bits per second). Throughput: actual useful data transferred per second — always less than bandwidth due to overhead, protocol inefficiency, and latency-induced idle time. Analogy: a highway (bandwidth), travel time (latency), actual cars passing per hour (throughput).

**Q2. Why does connection establishment add significant overhead, and how is it minimized?**
> TCP 3-way handshake + TLS 1.3 = 2 RTTs before the first byte of HTTP data. On a 100ms RTT link, this is 200ms just for setup. Minimized by: HTTP keep-alive (reuse connections for many requests), connection pooling (pre-established pool of connections), HTTP/2 multiplexing (one connection, many concurrent requests), QUIC 0-RTT (resume previous sessions with zero handshake latency).

**Q3. What is head-of-line blocking and how does HTTP/3 solve it?**
> TCP delivers data in order — if one packet is lost, all subsequent packets queue up waiting for the retransmission (even if they belong to unrelated HTTP/2 streams). HTTP/3 uses QUIC over UDP, where each stream's byte sequence is independent. A lost packet for stream 3 only blocks stream 3, not streams 1, 2, 4. This is critical for lossy networks where HTTP/2's TCP HoL blocking degrades performance significantly.

**Q4. What is the Bandwidth-Delay Product and why does it matter for TCP?**
> BDP = bandwidth × RTT = the maximum amount of data "in flight" needed to fully utilize the link. The TCP receive window must be at least as large as the BDP for optimal throughput. Default TCP windows (64KB) limit throughput to ~5 Mbps on a 100ms RTT link regardless of bandwidth. TCP window scaling (enabled by default on modern OSes) allows windows up to 1 GB, enabling full utilization of high-BDP paths.

**Q5. How does HTTP/2 header compression (HPACK) work?**
> HPACK maintains a static table of common header name-value pairs (`:method GET`, `:status 200`, etc.) and a dynamic table of previously sent headers. Instead of sending full header strings, HPACK sends table indices. Headers not in the table are Huffman-encoded. This eliminates redundant headers (User-Agent, Authorization are the same on every request) — typically 85%+ header size reduction, critical for mobile where headers can exceed body size.

**Q6. What is QUIC 0-RTT resumption and what are its security implications?**
> 0-RTT: on the first connection, the server sends a session ticket. On reconnect, the client sends data alongside the session ticket in the first packet — no handshake RTT. Security concern: 0-RTT data can be replayed by an attacker who captures the initial packet and retransmits it. Mitigation: only use 0-RTT for idempotent requests (GET), not for state-changing operations (POST payments). gRPC over HTTP/3 and browsers enforce this.

**Q7. What tools would you use to diagnose poor network performance in production?**
> `ping`/`mtr` for latency and packet loss. `traceroute` to identify slow hops. `curl -w` timing for TTFB breakdown (DNS, connect, TLS, first byte). `iperf3` for raw bandwidth measurement. `ss -s` or `netstat` for connection states (TIME_WAIT accumulation, SYN queues). `tcpdump`/Wireshark for deep packet inspection. APM tools (Datadog, New Relic) for application-level latency breakdown. `dmesg` for kernel errors (TCP buffer overruns).

**Q8. What is TCP slow start and how does it affect first-request performance?**
> TCP slow start begins every new connection with a small congestion window (typically 10 MSS = ~14KB initial window in modern Linux). It doubles each RTT until a threshold. For a 1 MB response on a 50ms RTT link, slow start means: RTT 1: 14KB, RTT 2: 28KB, RTT 3: 56KB... taking 4-5 RTTs (200-250ms) to reach full throughput. Mitigation: keep-alive (avoids new connections), smaller responses, CDN edge caching (shorter RTT), increase initial congestion window (`ip route change ... initcwnd 100`).
