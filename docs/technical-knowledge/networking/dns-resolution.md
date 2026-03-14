---
id: dns-resolution
title: DNS Resolution
description: How DNS works end-to-end — resolution chain, record types, caching, TTL, DNSSEC, and common DNS patterns.
tags: [networking, dns, resolution, records, caching, dnssec, nameserver]
sidebar_position: 6
---

# DNS Resolution

## What is DNS?

DNS (Domain Name System) translates **human-readable domain names** into **IP addresses** (and vice versa). It is the internet's distributed phone book.

```
"api.example.com"  →  DNS  →  "93.184.216.34"
```

DNS is a **distributed, hierarchical, cached** system — no single server knows everything; the answer is assembled through a chain of queries.

---

## DNS Hierarchy

```
                    . (root)
                   / | \
               com  org  net  io  ...  (TLDs — Top Level Domains)
              / | \
         google example amazon       (SLDs — Second Level Domains)
           /
       api  www  mail               (Subdomains)
```

### DNS Server Types

| Type | Role | Example |
|------|------|---------|
| **DNS Resolver** (Recursive) | Queries on behalf of clients | 8.8.8.8 (Google), 1.1.1.1 (Cloudflare) |
| **Root Nameserver** | Knows TLD nameserver addresses | 13 root server clusters (a–m.root-servers.net) |
| **TLD Nameserver** | Knows authoritative NS for domains | Verisign (for .com), ICANN |
| **Authoritative Nameserver** | Has the actual records for a domain | Route 53, Cloudflare, your own NS |

---

## DNS Resolution Process

```
Browser → OS → Resolver → Root → TLD → Authoritative

User types: api.example.com

1. Browser cache: api.example.com → ?  (miss)
2. OS cache / /etc/hosts: ?           (miss)
3. OS → Resolver (e.g., 8.8.8.8):
   "What is api.example.com?"

4. Resolver → Root NS:
   "Who handles .com?"
   Root NS: "Ask a.gtld-servers.net"

5. Resolver → TLD NS (a.gtld-servers.net):
   "Who handles example.com?"
   TLD NS: "Ask ns1.example.com"

6. Resolver → Authoritative NS (ns1.example.com):
   "What is api.example.com?"
   Auth NS: "93.184.216.34, TTL 300"

7. Resolver caches: api.example.com → 93.184.216.34 (for 300s)
8. Resolver → Client: 93.184.216.34
9. Client caches result
10. Browser connects to 93.184.216.34:443
```

**Full resolution typically takes 50–200ms; cached responses are < 1ms.**

---

## DNS Record Types

| Type | Name | Value | Use |
|------|------|-------|-----|
| `A` | IPv4 Address | `93.184.216.34` | Map hostname → IPv4 |
| `AAAA` | IPv6 Address | `2606:2800:220:1::...` | Map hostname → IPv6 |
| `CNAME` | Canonical Name | `example.com` | Alias → another hostname |
| `MX` | Mail Exchanger | `10 mail.example.com` | Email routing (with priority) |
| `TXT` | Text | `"v=spf1 include:..."` | SPF, DKIM, domain verification |
| `NS` | Name Server | `ns1.example.com` | Authoritative NS for zone |
| `SOA` | Start of Authority | admin + serial + refresh | Zone metadata |
| `PTR` | Pointer | `example.com` | Reverse DNS (IP → hostname) |
| `SRV` | Service | `10 20 443 api.example.com` | Service location (gRPC, SIP) |
| `CAA` | CA Authorization | `0 issue "letsencrypt.org"` | Which CAs may issue SSL certs |

### CNAME Chains

```
api.example.com  →  CNAME  →  api-lb.cdn.example.com
api-lb.cdn.example.com  →  A  →  203.0.113.50

Restriction: CNAME cannot coexist with other records at the same name
→ Cannot put CNAME at zone apex (example.com itself) — use ALIAS/ANAME
```

### MX Records and Priority

```
example.com  MX  10  mail1.example.com  (lowest priority = preferred)
example.com  MX  20  mail2.example.com  (backup)
example.com  MX  30  mail3.example.com  (last resort)
```

---

## DNS TTL (Time To Live)

TTL controls how long DNS answers are **cached** by resolvers and clients.

```
api.example.com  A  93.184.216.34  TTL=300   ← cached for 5 minutes

Low TTL (30–60s):
  ✅ Fast propagation when IP changes (failover, deployments)
  ❌ More DNS queries → higher load on nameservers

High TTL (3600–86400s):
  ✅ Less DNS lookup overhead, fewer queries
  ❌ Slow to update on IP changes
```

**Deployment strategy:**
1. Lower TTL to 60s a few hours before a change
2. Make the DNS change
3. After TTL passes, raise TTL back to normal

---

## DNS Caching Layers

```
1. Browser DNS cache     (chrome://net-internals/#dns)
2. OS DNS cache          (nscd, systemd-resolved)
3. Router/modem cache
4. ISP resolver cache    (your ISP's recursive resolver)
5. Public resolver cache (8.8.8.8, 1.1.1.1)
6. Authoritative server  (source of truth)
```

```bash
# Flush OS DNS cache
# Linux (systemd-resolved)
sudo systemd-resolve --flush-caches

# macOS
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Query DNS directly
nslookup api.example.com 8.8.8.8
dig api.example.com @8.8.8.8
dig +trace api.example.com         # full resolution chain
dig -x 93.184.216.34               # reverse DNS lookup
```

---

## DNS Load Balancing

DNS can distribute traffic without a dedicated load balancer.

### Round-Robin DNS

```
api.example.com  A  10.0.0.1
api.example.com  A  10.0.0.2
api.example.com  A  10.0.0.3

Resolver rotates the order each query:
  Query 1: [10.0.0.1, 10.0.0.2, 10.0.0.3]  → client picks first
  Query 2: [10.0.0.2, 10.0.0.3, 10.0.0.1]  → client picks first
```

Limitations: no health checking — if one server dies, DNS still returns it.

### GeoDNS / Latency-Based Routing

Serve different IPs based on the client's geographic location:
```
Client in US → api-us.example.com → 203.0.113.10 (US servers)
Client in EU → api-eu.example.com → 198.51.100.20 (EU servers)
```

Used by: Route 53 latency-based routing, Cloudflare GeoDNS.

---

## DNSSEC

DNSSEC adds **cryptographic signatures** to DNS responses to prevent spoofing.

```
Without DNSSEC:
  Attacker intercepts DNS response → returns malicious IP → cache poisoning

With DNSSEC:
  Zone signs records with private key → DS record in parent zone
  Resolver validates signature chain back to root (IANA)
  Tampered responses fail signature check → rejected
```

```bash
# Verify DNSSEC
dig DNSKEY example.com
dig +dnssec A example.com  # check AD (Authenticated Data) flag
```

---

## Common DNS Issues & Diagnostics

### DNS Propagation

After changing DNS records, old records may be cached globally for the duration of the TTL. "Propagation" is just waiting for caches to expire.

```bash
# Check from multiple global DNS resolvers
# whatsmydns.net — visual global propagation check
dig @8.8.8.8 example.com A         # Google
dig @1.1.1.1 example.com A         # Cloudflare
dig @9.9.9.9 example.com A         # Quad9
```

### Split-Horizon DNS

Different DNS answers for internal vs external clients:

```
Internal client: api.example.com → 10.0.0.5 (private IP)
External client: api.example.com → 203.0.113.5 (public IP/load balancer)
```

Used for: routing internal traffic through private network, keeping internal structure private.

---

## Java DNS Configuration

```java
// Java caches DNS results internally — configure TTL
// Default: 30s positive, 10s negative

// Set in jvm options or security properties
// $JAVA_HOME/conf/security/java.security
networkaddress.cache.ttl=30        // successful lookups
networkaddress.cache.negative.ttl=10  // failed lookups

// Or programmatically:
Security.setProperty("networkaddress.cache.ttl", "30");

// Spring Boot: use DNS-aware connection pool
// HttpClient automatically re-resolves on new connections
WebClient client = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create()
            .resolver(DefaultAddressResolverGroup.INSTANCE)))  // DNS-aware
    .baseUrl("https://api.example.com")
    .build();
```

---

## 🎯 Interview Questions

**Q1. Describe the full DNS resolution process for `api.example.com`.**
> Client checks browser cache → OS cache → if miss, asks local resolver. Resolver checks its cache → if miss, queries root NS for `.com` TLD NS → queries TLD NS for `example.com` authoritative NS → queries authoritative NS for `api.example.com` → gets A record (IP + TTL). Resolver caches result and returns to client. Full chain: ~4 queries, 50–200ms. Cached: < 1ms.

**Q2. What is a CNAME record and when can't you use it?**
> A CNAME aliases one hostname to another (the canonical name). The resolver follows the CNAME and looks up the final A/AAAA record. You cannot use CNAME at the zone apex (naked domain: `example.com`) because RFC 1034 forbids other records coexisting with a CNAME, and zones must have SOA/NS records. Use ALIAS or ANAME (Route 53, Cloudflare) for apex aliases — they resolve to A records.

**Q3. What is DNS TTL and how does it affect deployments?**
> TTL is how long resolvers and clients cache a DNS answer. Low TTL (60s) allows fast IP changes but increases query load. Before changing IPs (failover, deployment), lower TTL to 60s and wait for the current TTL to expire globally. Then make the change. After traffic shifts, raise TTL again. Ignoring TTL is why "DNS propagation takes 24-48 hours" — high TTLs of existing records.

**Q4. What is DNS cache poisoning and how does DNSSEC prevent it?**
> Cache poisoning: an attacker convinces a resolver to cache a fraudulent DNS mapping (e.g., `bank.com → attacker's IP`). Classically exploited via Kaminsky attack by guessing the transaction ID. DNSSEC prevents this by signing zone data with cryptographic keys — the resolver validates the signature chain from the root. A tampered response has an invalid signature and is rejected.

**Q5. What is the difference between a recursive resolver and an authoritative nameserver?**
> Recursive resolver (e.g., 8.8.8.8): accepts DNS queries from clients, does the work of traversing the hierarchy, caches results. It knows how to find answers but doesn't own any zones. Authoritative nameserver: owns the actual DNS records for a zone (`example.com`). It is the final source of truth and doesn't recurse — it just answers questions about its own zones.

**Q6. What are SRV records and when are they used?**
> SRV (Service) records specify the hostname and port for a service: `_service._proto.name TTL class SRV priority weight port target`. Used by gRPC (for load balancing and discovery), SIP/VoIP, XMPP, and Kubernetes internal DNS. Example: `_grpc._tcp.api.example.com SRV 10 20 443 api-grpc.example.com`. Allows clients to discover service endpoints from DNS.

**Q7. What is split-horizon DNS?**
> Split-horizon DNS returns different answers based on the requester's source IP. Internal clients get private IP addresses (routing traffic over the internal network), external clients get public IPs. Uses: keeping internal topology hidden, routing internal traffic without external NAT traversal, geographic load balancing. Implemented via DNS views in BIND or separate internal/external zones in cloud DNS.

**Q8. Why might a Java application not respect a DNS TTL change immediately?**
> Java's JVM has its own DNS cache separate from the OS. By default it caches successful lookups indefinitely (`networkaddress.cache.ttl=-1` in some older versions) or for 30 seconds. When DNS TTL expires, the OS and resolver update, but the JVM still serves the old cached IP. Fix: set `networkaddress.cache.ttl` in `java.security` or via `Security.setProperty()`. HTTP connection pools may also cache connections to specific IPs beyond the DNS TTL.
