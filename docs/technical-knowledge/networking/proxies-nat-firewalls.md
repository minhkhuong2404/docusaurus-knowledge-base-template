---
id: proxies-nat-firewalls
title: Proxies, NAT & Firewalls
description: Forward and reverse proxies, NAT traversal, stateful firewalls, iptables, VPNs, and how traffic flows through network boundaries.
tags: [networking, proxy, reverse-proxy, nat, firewall, iptables, vpn, nginx]
sidebar_position: 9
---

# Proxies, NAT & Firewalls

## Forward Proxy

A forward proxy sits between **clients and the internet**, acting on behalf of clients.

```
Clients ──► [Forward Proxy] ──► Internet (servers)

The server sees the proxy's IP, not the client's IP
```

**Use cases:**
- Corporate networks: enforce web filtering, cache content, log requests
- Anonymization: hide client's real IP
- Content filtering: block prohibited sites
- Caching: reduce bandwidth (Squid proxy)
- Bypassing geo-restrictions: clients appear to be in the proxy's location

```
Client request:
  GET http://external-site.com/path HTTP/1.1    ← full URL in request line
  Host: external-site.com
  Proxy-Authorization: Basic ...
```

### CONNECT Method (Tunneling)

For HTTPS through a forward proxy:

```
Client ──► Proxy: CONNECT api.example.com:443 HTTP/1.1
Proxy ──► Server: TCP connection
Proxy ◄── 200 Connection Established
Client ──► [Proxy passes through] ──► Server: TLS handshake
         (proxy can't decrypt — just tunnels TCP)
```

---

## Reverse Proxy

A reverse proxy sits between **the internet and backend servers**, acting on behalf of servers.

```
Internet (clients) ──► [Reverse Proxy] ──► Backend Servers

The client sees the proxy's IP; backend servers see the proxy's IP
```

**Use cases:**
- Load balancing (distribute to multiple backends)
- TLS termination (proxy handles HTTPS, backends get HTTP)
- Caching (cache responses near users)
- Compression (gzip responses before sending to client)
- DDoS protection (absorb attacks before backends)
- Path-based routing (nginx routes `/api` to one service, `/static` to another)
- Authentication gateway

```nginx
# nginx as reverse proxy
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    location /api/ {
        proxy_pass http://api-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /static/ {
        root /var/www/html;
        gzip_static on;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Forward vs Reverse Proxy

| | Forward Proxy | Reverse Proxy |
|--|--------------|--------------|
| Serves | Clients | Servers |
| Client awareness | Explicitly configured | Transparent |
| Server awareness | Transparent | Explicitly routes to |
| Use case | Client anonymity, filtering | Load balancing, TLS termination |
| Examples | Squid, corporate proxy | nginx, HAProxy, AWS ALB |

---

## NAT Deep Dive

NAT (Network Address Translation) modifies IP headers as packets pass through a router.

### SNAT — Source NAT (Masquerading)

```
Internal: 10.0.0.5:54321 → internet
NAT router rewrites: src=10.0.0.5:54321 → src=203.0.113.1:54321

Maintains NAT table:
  internal_ip:port    external_ip:port    destination       protocol
  10.0.0.5:54321  →  203.0.113.1:54321  → 142.250.80.1:443  TCP

Return traffic:
  203.0.113.1:54321 ← reverse lookup → 10.0.0.5:54321
```

### DNAT — Destination NAT (Port Forwarding)

```
External request: → 203.0.113.1:80
DNAT rule: dst=203.0.113.1:80 → dst=10.0.0.10:8080

Used for: exposing internal servers, load balancing (pre-routing)
```

```bash
# iptables DNAT (port forward)
iptables -t nat -A PREROUTING \
  -p tcp --dport 80 \
  -j DNAT --to-destination 10.0.0.10:8080

# SNAT / masquerade (outbound NAT)
iptables -t nat -A POSTROUTING \
  -o eth0 \
  -j MASQUERADE
```

### NAT Traversal

Peer-to-peer apps (VoIP, video calls, gaming) need to connect through NATs.

**Techniques:**
- **STUN** (Session Traversal Utilities for NAT): discovers public IP:port
- **TURN** (Traversal Using Relays around NAT): relays traffic if direct P2P fails
- **ICE** (Interactive Connectivity Establishment): tries multiple paths, picks best
- **Hole punching**: both peers send simultaneously to open firewall holes

Used by: WebRTC, Zoom, Discord, online games.

---

## Stateful Firewalls

A stateful firewall tracks the **state of network connections** and allows return traffic automatically.

```
Stateless (packet filter):
  Must explicitly allow BOTH directions:
    ACCEPT: src=internal → dst=external:443 (outbound)
    ACCEPT: src=external:443 → dst=internal (inbound) ← required!

Stateful:
  ACCEPT: src=internal → dst=external:443 (outbound)
  → connection tracked in state table
  → return traffic (established) automatically allowed
  → no explicit inbound rule needed
```

### Connection States (iptables/netfilter)

| State | Meaning |
|-------|---------|
| `NEW` | First packet of a new connection |
| `ESTABLISHED` | Part of an existing bidirectional connection |
| `RELATED` | Related to existing connection (FTP data channel, ICMP error) |
| `INVALID` | Doesn't match any connection |

```bash
# Stateful iptables rules
# Allow established and related (return traffic)
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow new outbound connections from internal
iptables -A OUTPUT -m state --state NEW,ESTABLISHED -j ACCEPT

# Drop invalid
iptables -A INPUT -m state --state INVALID -j DROP
```

---

## VPN — Virtual Private Network

A VPN creates an **encrypted tunnel** that makes remote traffic appear to come from the VPN server's network.

### Site-to-Site VPN

```
Office A Network ──[VPN tunnel]──► Office B Network
10.0.0.0/24        encrypted       10.1.0.0/24

Both networks treat each other as local (internal routing)
Used for: connecting branch offices, cloud to on-premises
```

### Remote Access VPN

```
User laptop (anywhere) ──[VPN]──► Corporate Network
Laptop gets: 10.100.0.5 (VPN IP)
Can access: internal servers, databases, SSH hosts

Options:
  Full tunnel: ALL traffic through VPN (secure but slow)
  Split tunnel: only corporate traffic through VPN (efficient)
```

### VPN Protocols

| Protocol | Port | Security | Performance | Notes |
|----------|------|----------|-------------|-------|
| OpenVPN | UDP 1194 / TCP 443 | TLS-based, strong | Good | Open source, widely compatible |
| WireGuard | UDP 51820 | ChaCha20, excellent | Best (kernel-level) | Modern, minimal code |
| IPSec/IKEv2 | UDP 500, 4500 | Strong | Good | Native on iOS/macOS |
| L2TP/IPSec | UDP 1701 | Moderate | Moderate | Legacy |
| PPTP | TCP 1723 | Weak (broken) | Good | Don't use |

---

## Nginx Security Configuration

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_conn_zone $binary_remote_addr zone=per_ip:10m;

server {
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Content-Security-Policy "default-src 'self'";

    # Hide version
    server_tokens off;

    # Client timeout (Slowloris mitigation)
    client_body_timeout 10s;
    client_header_timeout 10s;
    keepalive_timeout 65;
    send_timeout 10s;

    # Request size limits
    client_max_body_size 10m;

    # Block common attacks
    location ~* \.(git|svn|env|htpasswd|htaccess)$ {
        deny all;
    }

    location /api/ {
        limit_req zone=api burst=20;
        limit_conn per_ip 5;
        proxy_pass http://backend;
    }
}
```

---

## Spring Boot Behind a Reverse Proxy

```java
// Tell Spring to trust X-Forwarded-* headers
// application.yml
server:
  forward-headers-strategy: NATIVE    # Spring Boot 2.2+
  # or: FRAMEWORK for more control

# For Spring Security redirect URIs, HTTPS detection, etc.
# Without this, redirect_uri uses http:// even when behind HTTPS proxy

// Alternatively:
@Bean
ForwardedHeaderFilter forwardedHeaderFilter() {
    return new ForwardedHeaderFilter();
}
```

```nginx
# Send proper forwarding headers
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
```

---

## 🎯 Interview Questions

**Q1. What is the difference between a forward proxy and a reverse proxy?**
> A forward proxy acts on behalf of clients — clients configure it explicitly, and external servers see the proxy's IP. Used for: anonymization, corporate filtering, caching. A reverse proxy acts on behalf of servers — clients connect to it thinking it's the server, and backends see the proxy's IP. Used for: load balancing, TLS termination, caching, path routing. The key difference is whose interests they serve.

**Q2. What is TLS termination at a reverse proxy and what are the trade-offs?**
> TLS termination decrypts HTTPS at the proxy; backends receive plain HTTP. Advantages: backends don't need TLS configuration, proxy handles cert management, can inspect/modify HTTP content, single cert renewal point. Disadvantages: traffic between proxy and backends is unencrypted (mitigated by private network or re-encryption). Re-encryption (proxy terminates client TLS, establishes new TLS to backend) adds overhead but maintains encryption throughout.

**Q3. Explain SNAT and DNAT.**
> SNAT (Source NAT) modifies the source IP of outgoing packets — used to masquerade private IP addresses as a public IP for internet access. DNAT (Destination NAT) modifies the destination IP of incoming packets — used for port forwarding (redirect external port to internal server) and load balancing. Both modify IP headers and maintain state tables to reverse-translate return traffic.

**Q4. What is a stateful firewall and how does it differ from a packet filter?**
> A packet filter (stateless) inspects each packet independently by IP, port, and protocol. It requires explicit rules for both directions of communication. A stateful firewall tracks connection state (TCP handshakes, established sessions) and automatically allows return traffic for established connections. This is more secure (blocks unexpected inbound packets that aren't part of an established connection) and requires fewer rules.

**Q5. What is NAT traversal and why is it needed for P2P applications?**
> P2P applications (VoIP, video calls, gaming) need direct connections between peers, but NAT hides the real internal IPs and only allows connections initiated from inside. NAT traversal techniques (STUN to discover public IP:port, ICE to test connectivity paths, hole punching to open ports simultaneously, TURN as fallback relay) let peers behind NAT establish direct connections. WebRTC uses ICE/STUN/TURN for browser-to-browser calls.

**Q6. What is split tunneling in a VPN?**
> Split tunneling routes only specific traffic (corporate destinations) through the VPN tunnel, while other traffic (internet browsing) goes directly through the user's ISP. Benefits: faster internet for non-corporate traffic, reduces VPN bandwidth load, lower latency for non-corporate sites. Risks: corporate devices can be infected by malware that bypasses VPN security policies. Full tunneling sends all traffic through VPN — more secure, more restrictive.

**Q7. Why must Spring Boot be configured to trust X-Forwarded headers behind a proxy?**
> When behind a reverse proxy, the application sees the proxy's IP as the client IP, not the real client. The proxy sends `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host` headers with the original values. Without trusting these, Spring Security generates HTTP redirect URIs instead of HTTPS, rate limiting targets the proxy IP (blocking all users), and client IP logging shows the proxy instead of the real client. Use `forward-headers-strategy: NATIVE` — but only trust the immediately upstream proxy.

**Q8. What is the `X-Forwarded-For` header and what are its security considerations?**
> `X-Forwarded-For` contains the chain of IPs a request passed through: `X-Forwarded-For: client, proxy1, proxy2`. Each proxy appends the previous IP. The leftmost IP is the "real" client IP. Security concern: clients can forge this header (`X-Forwarded-For: 127.0.0.1`). Only trust it if your reverse proxy controls it — configure the proxy to replace (not append) the header, or only read the rightmost trusted IP added by your own infrastructure.
