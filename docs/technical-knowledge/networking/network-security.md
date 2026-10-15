---
id: network-security
title: Network Security
description: TLS deep dive, common network attacks, DDoS mitigation, zero trust networking, certificate management, and security best practices.
tags: [networking, security, tls, ddos, zero-trust, attack, firewall, mitm, csrf, xss]
sidebar_position: 8
---

import NetworkSecurityProtocolsDiagram from '@site/src/components/NetworkSecurityProtocolsDiagram';
import DdosMitigationDiagram from '@site/src/components/DdosMitigationDiagram';

# Network Security

<NetworkSecurityProtocolsDiagram />

<DdosMitigationDiagram />

---

## TLS Certificate Management & Public Key Infrastructure (PKI)

### 1. The PKI Trust Chain
A server certificate is not verified in isolation; the client builds and cryptographically validates a **Certificate Trust Chain**:
1. **Root CA**: Pre-installed in the operating system / JVM trust store (`cacerts`). Self-signed, air-gapped, highly protected.
2. **Intermediate CA**: Signed by the Root CA. Signs leaf certificates so the root private key remains offline.
3. **Leaf (End-Entity) Certificate**: Contains the server's public key and Subject Alternative Name (`SAN: api.example.com`).

```
[ Root CA (In OS Trust Store) ]
              │ (Signs with Root Private Key)
              ▼
    [ Intermediate CA ]
              │ (Signs with Intermediate Private Key)
              ▼
[ Leaf Server Certificate (Presented during TLS Handshake) ]
```

### 2. Certificate Revocation: CRL vs OCSP vs OCSP Stapling

| Revocation Mechanism | Architecture | Production Failure Mode |
|---|---|---|
| **Certificate Revocation List (CRL)** | Client periodically downloads a monolithic file containing all revoked serial numbers. | **Scalability Disaster**: CRL files grow to hundreds of megabytes. Clients skip verification on timeout (fail-open). |
| **OCSP (Online Certificate Status Protocol)** | Client sends synchronous HTTP query to CA's OCSP responder during TLS handshake. | **Privacy Leak & Latency Spike**: CA tracks every website the user visits. Adds $100\text{–}300\text{ ms}$ to TLS handshake; fails open if CA is down. |
| **OCSP Stapling (RFC 6066 — Industry Standard)** | **The web server** periodically queries the CA's OCSP responder, caches the cryptographically timestamped response, and **"staples" it to the TLS Handshake**. | **Zero Latency & 100% Privacy**: Client validates CA signature directly from the stapled response without contacting external CAs. |

```nginx
# Nginx: Enable OCSP Stapling in production
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/ssl/certs/fullchain.pem;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;
```

---

## Network Layer Attacks & Mitigation

### 1. Man-in-the-Middle (MITM) & SSL Stripping
An attacker intercepting traffic (via ARP spoofing, rogue Wi-Fi, or DNS cache poisoning) strips HTTPS, redirecting the victim's browser to plain HTTP while establishing an encrypted connection to the upstream server on the victim's behalf.

**Defense Architecture**:
- **HSTS (`Strict-Transport-Security`)**:
  ```http
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
  Forces modern browsers to refuse unencrypted HTTP connections permanently, even on the very first visit if submitted to the **HSTS Preload List** (`hstspreload.org`).
- **Certificate Transparency (CT Logs - RFC 6962)**: CAs must append all issued certificates to public, tamper-evident cryptographic Merkle tree audit logs. Browsers reject certificates that do not include valid Signed Certificate Timestamps (SCTs).

### 2. TLS 1.3 0-RTT Anti-Replay Architecture (RFC 8446 §8)

While TLS 1.3 0-RTT enables instant data transmission on reconnection, early data is vulnerable to **Replay Attacks**: an attacker eavesdropping on the network can record the 0-RTT packet and replay it to the server. If the payload is a money transfer or state-changing mutation, the server executes it twice!

**Mitigations**:
1. **Application-Level Enforcement**: Only allow idempotent, safe HTTP methods (GET, HEAD) in 0-RTT early data. Reject POST/PUT/DELETE requests with `425 Too Early` (RFC 8470), prompting the client to retry after the 1-RTT handshake completes.
2. **Server-Side Strike Registers**: The server maintains a distributed in-memory cache of recently accepted `ClientHello` identifiers within a 10-second validity window. Any duplicate ClientHello inside this window is rejected immediately.
3. **Single-Use Session Tickets**: Mark session resumption tickets as consumed in a distributed Redis store upon first read.

### 3. BGP Hijacking & RPKI ROA Validation

The Border Gateway Protocol (BGP) historically trusts route advertisements without cryptographic proof. In a **BGP Hijack**, an adversarial AS announces a more specific prefix (e.g. `203.0.113.0/25` over a legitimate `203.0.113.0/24`), diverting global internet traffic through the attacker's network.

**RPKI (Resource Public Key Infrastructure)** provides cryptographic route authorization:
1. The prefix owner generates a cryptographically signed **Route Origin Authorization (ROA)** binding their IP prefix and maximum prefix length to their authorized Autonomous System Number (ASN).
2. Internet Service Providers run RPKI-validating routers (RTR protocol).
3. The router evaluates BGP route advertisements into three states:
   - **Valid**: Matches a signed ROA.
   - **Invalid**: ASN or prefix length conflicts with a signed ROA $\implies$ **Router drops the route advertisement automatically**.
   - **NotFound**: No ROA published yet.

---

## IPsec Architecture: AH vs ESP and NAT-T

IPsec secures IP traffic at Layer 3 using two core protocols:

| Dimension | Authentication Header (AH - Protocol 51) | Encapsulating Security Payload (ESP - Protocol 50) |
|---|---|---|
| **Confidentiality (Encryption)** | ❌ None (plaintext payload) | ✅ Full AES-GCM / ChaCha20 encryption |
| **Integrity & Authentication** | ✅ Cryptographically signs **entire IP packet**, including outer IP headers | ✅ Authenticates payload and ESP header (not outer IP header) |
| **NAT Traversal Compatibility** | ❌ **Completely Broken by NAT** (NAT rewrites IP addresses, invalidating AH hash!) | ⚠️ Requires **NAT-T (UDP Port 4500 Encapsulation)** |

```
Standard ESP Packet (Blocked by non-NAT-aware routers):
[ Outer IP Header (Protocol 50) ] [ ESP Header ] [ Encrypted Payload ] [ ESP Auth Trailer ]

NAT-T Encapsulated ESP (RFC 3948):
[ Outer IP Header ] [ UDP Header (Port 4500) ] [ ESP Header ] [ Encrypted Payload ] [ ESP Auth ]
(Allows intermediate stateful NAT devices to track source/dest ports in conntrack tables)
```

---

## DDoS — Distributed Denial of Service

Goal: overwhelm target's resources (bandwidth, CPU, connections) to deny service.

### Attack Types

| Type | Layer | How |
|------|-------|-----|
| **Volumetric** | L3/L4 | Flood bandwidth (UDP floods, ICMP floods) |
| **Protocol** | L4 | Exhaust state tables (SYN flood, fragmentation) |
| **Application** | L7 | Expensive requests (HTTP floods, Slowloris) |
| **Amplification** | L3/L4 | Spoof IP, small request → large response (DNS, NTP, SSDP) |

### DNS Amplification Attack

```
Attacker → DNS query (ANY) with spoofed src=victim IP → DNS server
DNS server → 3000 byte response → victim IP
Amplification factor: up to 100x (50 byte query → 5000 byte response)
```

**Mitigation**: disable ANY responses, enforce Response Rate Limiting (RRL) on authoritative nameservers, configure BCP38 (ISP source address validation).

### Slowloris & R-U-Dead-Yet (RUDY) L7 Connection Starvation

Unlike volumetric floods that saturate bandwidth, Slowloris and RUDY exploit thread-per-connection architectures (like classical Apache or blocking Java servlets):
- **Slowloris**: Opens thousands of TCP connections, sending incomplete HTTP headers at a trickle (e.g. `X-Custom-Header: value\r\n` every 15 seconds) but **never sending the terminating `\r\n\r\n`**. The server keeps a worker thread allocated waiting for the request to finish until all thread pool threads are exhausted!
- **RUDY**: Sends a valid `POST` request with `Content-Length: 10000000`, then transmits 1 byte of the body every 10 seconds.

**Mitigation Architecture**:
1. **Reverse Proxy Buffering (Nginx / Envoy)**: Deploy an event-driven reverse proxy in front of backend application servers. Nginx uses non-blocking `epoll` to buffer complete request headers and bodies before handing off to upstream worker threads.
2. **Aggressive Header & Body Timeouts**:
   ```nginx
   # Drop slow headers and slow body transmissions
   client_header_timeout 10s;
   client_body_timeout 10s;
   send_timeout 10s;
   client_max_body_size 10m;
   ```

### Kernel SYN Cookies: Bitwise State Encoding

When an attacker launches a SYN flood, the kernel's SYN backlog (`tcp_max_syn_backlog`) fills in milliseconds. Once full, the server drops all legitimate connection attempts.

**SYN Cookies (`net.ipv4.tcp_syncookies = 1`)**:
Instead of storing half-open connection state in memory, the kernel computes the **Initial Sequence Number (ISN)** cryptographically:
$$\text{ISN} = \text{Top 5 bits: } t \pmod{32} \parallel \text{Next 3 bits: MSS index } \parallel \text{Bottom 24 bits: } \text{HMAC}(\text{src\_ip}, \text{dst\_ip}, \text{src\_port}, \text{dst\_port}, t, \text{secret})$$
- The kernel discards all local connection state and transmits the `SYN-ACK` containing this generated ISN.
- When a legitimate client sends back the final `ACK` (`ack = \text{ISN} + 1`), the kernel subtracts 1 to recover the ISN, re-computes the HMAC, verifies that $t$ is within 4 minutes, and extracts the MSS index.
- If the HMAC matches, the kernel allocates the socket data structure in the accept queue. If the client was a spoofed bot that never returned the `ACK`, **zero server memory was ever wasted!**

### DDoS Mitigation Strategies

```
1. CDN / Scrubbing Centers
   Cloudflare, Akamai Prolexic → absorb volumetric attacks at PoPs

2. Anycast
   Traffic distributed across many PoPs → no single target

3. Rate Limiting
   Per-IP: nginx limit_req_zone, AWS WAF
   Per-endpoint: token bucket, sliding window

4. IP Reputation / Block Lists
   Block known bad ASNs, Tor exit nodes, etc.

5. Challenge Pages (CAPTCHA)
   Prove you're human before accessing resource

6. Geo-blocking
   Block traffic from countries with no legitimate users

7. TCP SYN cookies (kernel level)
   Stateless SYN handling
```

```nginx
# nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_conn_zone $binary_remote_addr zone=conn:10m;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_conn conn 10;               # max 10 concurrent connections per IP
    }
}
```

```java
// Spring: rate limiting with Bucket4j + Redis
@RateLimiter(name = "api", fallbackMethod = "rateLimitFallback")
@GetMapping("/api/products")
public List<Product> getProducts() { ... }

// Or manual:
BandwidthLimiter limiter = Bucket4j.builder()
    .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
    .build();
if (!limiter.tryConsume(1)) throw new TooManyRequestsException();
```

---

## Zero Trust Networking

Traditional model: trust everything inside the perimeter (VPN + firewall).
Zero Trust: **never trust, always verify** — regardless of network location.

```
Traditional:
  VPN → inside network → implicit trust → access everything

Zero Trust:
  Any request (internal or external) → Verify identity + device + context → Authorize per-resource
```

### Zero Trust Principles

1. **Verify explicitly**: authenticate and authorize every request (identity, device, location, time)
2. **Least privilege access**: grant minimum needed access
3. **Assume breach**: assume adversary is already inside; minimize blast radius

### Implementation

```
Identity Provider (IdP): Okta, Azure AD, Google Workspace
  → Issues short-lived tokens (JWT, OIDC)
  → Device posture checks (is device managed? patched? MDM enrolled?)

Service Mesh mTLS:
  Every service-to-service call authenticated via cert
  Policies: service A may call B on GET /api/* only

BeyondCorp / Google IAP:
  Application proxy checks identity before forwarding
  No VPN needed — identity is the perimeter
```

---

## Firewall Types

| Type | Works At | Inspection |
|------|----------|-----------|
| **Packet filter** | L3/L4 | IP, port, protocol (stateless) |
| **Stateful firewall** | L4 | Tracks TCP connections; blocks unsolicited responses |
| **Application firewall** | L7 | HTTP content, SQL injection, XSS |
| **WAF** (Web App Firewall) | L7 | HTTP-specific rules (OWASP Top 10) |
| **NGFW** (Next-Gen) | L7+ | Deep packet inspection, IDS/IPS, SSL inspection |

### iptables (Linux)

```bash
# Block specific IP
iptables -A INPUT -s 203.0.113.100 -j DROP

# Allow only SSH, HTTP, HTTPS
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP  # drop everything else

# Rate limit new connections
iptables -A INPUT -p tcp --dport 80 --syn -m limit --limit 25/s -j ACCEPT
iptables -A INPUT -p tcp --dport 80 --syn -j DROP
```

---

## Security Headers Checklist

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

```java
// Spring Security headers
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true).maxAgeInSeconds(31536000))
            .contentSecurityPolicy(csp ->
                csp.policyDirectives("default-src 'self'"))
            .frameOptions(frame -> frame.deny())
            .xssProtection(xss -> xss.enable())
        );
        return http.build();
    }
}
```

---

## Interview Questions

### Q1. What is a man-in-the-middle attack and how does TLS prevent it?
> MitM: attacker positions themselves between client and server, intercepting and potentially modifying traffic. TLS prevents it by: (1) authenticating the server via a certificate signed by a trusted CA — attacker can't forge a valid cert for a domain they don't control; (2) using ECDHE key exchange — even if the private key is later compromised, past sessions can't be decrypted (forward secrecy); (3) message authentication codes (MAC) detect tampering.

### Q2. What is a DDoS amplification attack and how does it work?
> The attacker spoofs the victim's IP as the source and sends small requests to servers that generate large responses (DNS, NTP, memcached). The large responses flood the victim. Amplification factor can be 100x+. Mitigation: BCP38 (ISPs filter spoofed source IPs), rate-limit DNS ANY queries, disable open resolvers, use scrubbing centers to absorb traffic.

### Q3. What is Zero Trust and how does it differ from perimeter security?
> Perimeter security trusts everything inside the network (after VPN). Zero Trust trusts nothing by default — every request must be authenticated and authorized regardless of network location. Key principles: verify explicitly (identity + device + context), least privilege, assume breach. Implemented via identity providers, mTLS service meshes, per-resource authorization policies, and short-lived credentials.

### Q4. What is the difference between a WAF and a traditional firewall?
> A traditional firewall operates at L3/L4 — filtering by IP address, port, and protocol. A WAF (Web Application Firewall) operates at L7, understanding HTTP content. It can detect and block SQL injection, XSS, CSRF, path traversal, OWASP Top 10 attacks by inspecting request/response bodies, headers, and URLs. WAFs are complementary — both are typically deployed together.

### Q5. What is SSL stripping and how does HSTS prevent it?
> SSL stripping: attacker intercepts the user's initial HTTP request (before the HTTPS redirect), serving HTTP to the user while maintaining HTTPS to the server — the user sees HTTP content unknowingly. HSTS prevents this by instructing browsers to always connect via HTTPS for a domain, even if the user types `http://`. The first visit is still vulnerable — HSTS preload lists (built into browsers) eliminate even the first-visit risk.

### Q6. Explain mTLS and when you would use it.
> In standard TLS, only the server is authenticated via certificate. mTLS requires both parties to present certificates. Use cases: service-to-service authentication in microservices (proves service identity without API keys); IoT device authentication; API access for automated clients. In a service mesh (Istio), mTLS is automatically provisioned for all inter-service calls — no code changes needed.

### Q7. What is BGP hijacking and why is it hard to prevent?
> BGP hijacking occurs when an AS announces more-specific routes for IP prefixes it doesn't own, causing traffic to be misrouted through the attacker. The internet's BGP trust model is based on mutual agreement — routers accept route announcements without cryptographic verification. Hard to prevent because BGP was designed for trust between cooperative peers. RPKI (Resource Public Key Infrastructure) allows route origin validation cryptographically, but adoption is incomplete.

### Q8. What HTTP security headers should every API set?
> HSTS (always use HTTPS), `X-Content-Type-Options: nosniff` (prevent MIME sniffing), `X-Frame-Options: DENY` (prevent clickjacking), `Content-Security-Policy` (restrict resource origins), `Referrer-Policy: strict-origin-when-cross-origin` (don't leak URLs to external sites). For APIs: `Cache-Control: no-store` on sensitive responses, `X-Request-ID` for tracing. Validate with securityheaders.com.
