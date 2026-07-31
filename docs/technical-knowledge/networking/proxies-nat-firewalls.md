---
id: proxies-nat-firewalls
title: Proxies, NAT & Firewalls
description: Forward and reverse proxies, NAT traversal, stateful firewalls, iptables, VPNs, and how traffic flows through network boundaries.
tags: [networking, proxy, reverse-proxy, nat, firewall, iptables, vpn, nginx]
sidebar_position: 9
---

import ProxiesNatFirewallsDiagram from '@site/src/components/ProxiesNatFirewallsDiagram';
import NatTraversalDiagram from '@site/src/components/NatTraversalDiagram';

# Proxies, NAT & Firewalls

<ProxiesNatFirewallsDiagram />

<NatTraversalDiagram />

---

## Forward Proxy

A forward proxy sits between **clients and the internet**, acting on behalf of clients.

**Use cases:**
- Corporate networks: enforce web filtering, cache content, log requests
- Anonymization: hide client's real IP
- Content filtering: block prohibited sites
- Caching: reduce bandwidth (Squid proxy)
- Bypassing geo-restrictions: clients appear to be in the proxy's location

---

## Reverse Proxy

:::tip[Comparative Architecture]
To see how a reverse proxy differs from a load balancer and an API gateway, and how they coexist in production, check out the [Reverse Proxy vs. Load Balancer vs. API Gateway Guide](../system-design/reverse-proxy-load-balancer-api-gateway.md).
:::

A reverse proxy sits between **the internet and backend servers**, acting on behalf of servers.

**Use cases:**
- Load balancing (distribute to multiple backends)
- TLS termination (proxy handles HTTPS, backends get HTTP)
- Caching (cache responses near users)
- Compression (gzip responses before sending to client)
- DDoS protection (absorb attacks before backends)
- Path-based routing (nginx routes `/api` to one service, `/static` to another)
- Authentication gateway

### Remote Access VPN

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

## Interview Questions

### Q1. What is the difference between a forward proxy and a reverse proxy?
> A forward proxy acts on behalf of clients — clients configure it explicitly, and external servers see the proxy's IP. Used for: anonymization, corporate filtering, caching. A reverse proxy acts on behalf of servers — clients connect to it thinking it's the server, and backends see the proxy's IP. Used for: load balancing, TLS termination, caching, path routing. The key difference is whose interests they serve.

### Q2. What is TLS termination at a reverse proxy and what are the trade-offs?
> TLS termination decrypts HTTPS at the proxy; backends receive plain HTTP. Advantages: backends don't need TLS configuration, proxy handles cert management, can inspect/modify HTTP content, single cert renewal point. Disadvantages: traffic between proxy and backends is unencrypted (mitigated by private network or re-encryption). Re-encryption (proxy terminates client TLS, establishes new TLS to backend) adds overhead but maintains encryption throughout.

### Q3. Explain SNAT and DNAT.
> SNAT (Source NAT) modifies the source IP of outgoing packets — used to masquerade private IP addresses as a public IP for internet access. DNAT (Destination NAT) modifies the destination IP of incoming packets — used for port forwarding (redirect external port to internal server) and load balancing. Both modify IP headers and maintain state tables to reverse-translate return traffic.

### Q4. What is a stateful firewall and how does it differ from a packet filter?
> A packet filter (stateless) inspects each packet independently by IP, port, and protocol. It requires explicit rules for both directions of communication. A stateful firewall tracks connection state (TCP handshakes, established sessions) and automatically allows return traffic for established connections. This is more secure (blocks unexpected inbound packets that aren't part of an established connection) and requires fewer rules.

### Q5. What is NAT traversal and why is it needed for P2P applications?
> P2P applications (VoIP, video calls, gaming) need direct connections between peers, but NAT hides the real internal IPs and only allows connections initiated from inside. NAT traversal techniques (STUN to discover public IP:port, ICE to test connectivity paths, hole punching to open ports simultaneously, TURN as fallback relay) let peers behind NAT establish direct connections. WebRTC uses ICE/STUN/TURN for browser-to-browser calls.

### Q6. What is split tunneling in a VPN?
> Split tunneling routes only specific traffic (corporate destinations) through the VPN tunnel, while other traffic (internet browsing) goes directly through the user's ISP. Benefits: faster internet for non-corporate traffic, reduces VPN bandwidth load, lower latency for non-corporate sites. Risks: corporate devices can be infected by malware that bypasses VPN security policies. Full tunneling sends all traffic through VPN — more secure, more restrictive.

### Q7. Why must Spring Boot be configured to trust X-Forwarded headers behind a proxy?
> When behind a reverse proxy, the application sees the proxy's IP as the client IP, not the real client. The proxy sends `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host` headers with the original values. Without trusting these, Spring Security generates HTTP redirect URIs instead of HTTPS, rate limiting targets the proxy IP (blocking all users), and client IP logging shows the proxy instead of the real client. Use `forward-headers-strategy: NATIVE` — but only trust the immediately upstream proxy.

### Q8. What is the `X-Forwarded-For` header and what are its security considerations?
> `X-Forwarded-For` contains the chain of IPs a request passed through: `X-Forwarded-For: client, proxy1, proxy2`. Each proxy appends the previous IP. The leftmost IP is the "real" client IP. Security concern: clients can forge this header (`X-Forwarded-For: 127.0.0.1`). Only trust it if your reverse proxy controls it — configure the proxy to replace (not append) the header, or only read the rightmost trusted IP added by your own infrastructure.
