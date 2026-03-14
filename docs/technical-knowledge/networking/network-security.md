---
id: network-security
title: Network Security
description: TLS deep dive, common network attacks, DDoS mitigation, zero trust networking, certificate management, and security best practices.
tags: [networking, security, tls, ddos, zero-trust, attack, firewall, mitm, csrf, xss]
sidebar_position: 8
---

# Network Security

## TLS Certificate Management

### Certificate Lifecycle

```
1. Generate private key + CSR (Certificate Signing Request)
2. Submit CSR to CA (Certificate Authority)
3. CA validates domain ownership (DNS or HTTP challenge)
4. CA signs certificate → contains public key + domain + expiry
5. Install cert + private key on server
6. Renew before expiry (typically 90 days for Let's Encrypt, 1-2 years for commercial)
```

```bash
# Generate self-signed cert (dev only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Generate CSR for production
openssl genrsa -out private.key 2048
openssl req -new -key private.key -out request.csr

# Inspect certificate
openssl x509 -in cert.pem -text -noout
openssl s_client -connect api.example.com:443 -servername api.example.com

# Let's Encrypt (automated)
certbot certonly --dns-cloudflare -d api.example.com -d "*.example.com"
```

### Mutual TLS (mTLS)

Standard TLS: only server presents a certificate (client authenticates via application credentials).

mTLS: **both** client and server present certificates.

```
Client Certificate  ←──── Client Auth ────►  Server Certificate
                         (both verified)

Use cases:
- Service-to-service auth in microservices (zero trust)
- API access for automated clients / IoT devices
- Internal network segments
```

```java
// Spring Boot mTLS server config
server:
  ssl:
    client-auth: need         # require client cert
    trust-store: classpath:truststore.p12
    trust-store-password: ${TRUST_STORE_PASSWORD}
    trust-store-type: PKCS12

// Spring WebClient mTLS client
SslContext sslContext = SslContextBuilder.forClient()
    .keyManager(privateKey, clientCert)       // client cert
    .trustManager(caCert)                     // trust server cert
    .build();
```

---

## Common Network Attacks

### Man-in-the-Middle (MitM)

Attacker intercepts communication between client and server.

```
Client ──► [Attacker] ──► Server
           Reads, modifies, relays traffic
```

**Mitigations:**
- TLS with certificate validation (never skip cert verification!)
- HSTS (prevents SSL stripping)
- Certificate Pinning (app hardcodes expected cert)
- mTLS (both sides authenticated)

```java
// ❌ NEVER in production — disables cert validation
.trustManager(InsecureTrustManagerFactory.INSTANCE)

// ✅ Validate server cert
SslContext ssl = SslContextBuilder.forClient()
    .trustManager(caCertPath.toFile())  // specific CA
    .build();
```

### SSL Stripping

Attacker downgrades HTTPS to HTTP by intercepting the initial HTTP request.

```
Client ──HTTP──► [Attacker] ──HTTPS──► Server
                 Reads plaintext HTTP
```

**Mitigation**: HSTS (`Strict-Transport-Security: max-age=31536000`) — browser always uses HTTPS. HSTS preload list for maximum protection.

### SYN Flood (DDoS)

Attacker sends thousands of SYN packets, exhausting server's SYN backlog.

**Mitigations:**
- SYN cookies (Linux default)
- Rate limiting SYNs per IP
- Firewall rules
- CDN/DDoS scrubbing services

### IP Spoofing

Attacker forges source IP in packets to impersonate another host or hide identity.

**Mitigations:**
- BCP38 (network ingress filtering by ISPs)
- Hard to exploit for TCP (3-way handshake requires receiving replies)
- Used in UDP-based amplification attacks

### DNS Spoofing / Cache Poisoning

Attacker injects false DNS records into resolver cache.

**Mitigations:**
- DNSSEC
- DNS-over-HTTPS (DoH) / DNS-over-TLS (DoT)
- Source port randomization (Kaminsky attack mitigation)

### BGP Hijacking

Attacker announces more-specific routes to steal traffic destined for another AS.

```
AS65001 owns 203.0.113.0/24
Attacker announces 203.0.113.0/25 (more specific → wins)
Traffic for 203.0.113.0/25 routed to attacker
```

**Mitigations:**
- RPKI (Resource Public Key Infrastructure) — cryptographically validates route origins
- BGP route filtering
- Monitoring services (BGPmon)

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

**Mitigation**: disable ANY responses, rate-limit DNS, BCP38 (ISP ingress filtering).

### Slowloris Attack (Application Layer)

Opens many HTTP connections, sends partial requests slowly — keeps connections open, exhausts server connection pool.

**Mitigation**: connection timeouts, `request_timeout` in nginx, limit connections per IP.

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

## 🎯 Interview Questions

**Q1. What is a man-in-the-middle attack and how does TLS prevent it?**
> MitM: attacker positions themselves between client and server, intercepting and potentially modifying traffic. TLS prevents it by: (1) authenticating the server via a certificate signed by a trusted CA — attacker can't forge a valid cert for a domain they don't control; (2) using ECDHE key exchange — even if the private key is later compromised, past sessions can't be decrypted (forward secrecy); (3) message authentication codes (MAC) detect tampering.

**Q2. What is a DDoS amplification attack and how does it work?**
> The attacker spoofs the victim's IP as the source and sends small requests to servers that generate large responses (DNS, NTP, memcached). The large responses flood the victim. Amplification factor can be 100x+. Mitigation: BCP38 (ISPs filter spoofed source IPs), rate-limit DNS ANY queries, disable open resolvers, use scrubbing centers to absorb traffic.

**Q3. What is Zero Trust and how does it differ from perimeter security?**
> Perimeter security trusts everything inside the network (after VPN). Zero Trust trusts nothing by default — every request must be authenticated and authorized regardless of network location. Key principles: verify explicitly (identity + device + context), least privilege, assume breach. Implemented via identity providers, mTLS service meshes, per-resource authorization policies, and short-lived credentials.

**Q4. What is the difference between a WAF and a traditional firewall?**
> A traditional firewall operates at L3/L4 — filtering by IP address, port, and protocol. A WAF (Web Application Firewall) operates at L7, understanding HTTP content. It can detect and block SQL injection, XSS, CSRF, path traversal, OWASP Top 10 attacks by inspecting request/response bodies, headers, and URLs. WAFs are complementary — both are typically deployed together.

**Q5. What is SSL stripping and how does HSTS prevent it?**
> SSL stripping: attacker intercepts the user's initial HTTP request (before the HTTPS redirect), serving HTTP to the user while maintaining HTTPS to the server — the user sees HTTP content unknowingly. HSTS prevents this by instructing browsers to always connect via HTTPS for a domain, even if the user types `http://`. The first visit is still vulnerable — HSTS preload lists (built into browsers) eliminate even the first-visit risk.

**Q6. Explain mTLS and when you would use it.**
> In standard TLS, only the server is authenticated via certificate. mTLS requires both parties to present certificates. Use cases: service-to-service authentication in microservices (proves service identity without API keys); IoT device authentication; API access for automated clients. In a service mesh (Istio), mTLS is automatically provisioned for all inter-service calls — no code changes needed.

**Q7. What is BGP hijacking and why is it hard to prevent?**
> BGP hijacking occurs when an AS announces more-specific routes for IP prefixes it doesn't own, causing traffic to be misrouted through the attacker. The internet's BGP trust model is based on mutual agreement — routers accept route announcements without cryptographic verification. Hard to prevent because BGP was designed for trust between cooperative peers. RPKI (Resource Public Key Infrastructure) allows route origin validation cryptographically, but adoption is incomplete.

**Q8. What HTTP security headers should every API set?**
> HSTS (always use HTTPS), `X-Content-Type-Options: nosniff` (prevent MIME sniffing), `X-Frame-Options: DENY` (prevent clickjacking), `Content-Security-Policy` (restrict resource origins), `Referrer-Policy: strict-origin-when-cross-origin` (don't leak URLs to external sites). For APIs: `Cache-Control: no-store` on sensitive responses, `X-Request-ID` for tracing. Validate with securityheaders.com.
