---
id: network-security
title: Network Security
sidebar_label: Network Security
description: Network security fundamentals for software engineers — firewalls, VPNs, network segmentation, DDoS mitigation, DNS security, zero trust networking, and cloud network controls.
tags: [network-security, firewall, vpn, ddos, dns, zero-trust, network-segmentation, waf, cloud-security]
---

# Network Security

---

## Network Segmentation

Divide network into isolated zones. Limit blast radius of a breach.

```
Internet
    │
   [WAF]
    │
  DMZ (Demilitarized Zone)
  ├─ Load Balancers
  ├─ API Gateway
  │
 [Firewall]
  │
 Application Tier (private subnet)
  ├─ App Servers
  ├─ Worker Services
  │
 [Firewall]
  │
 Data Tier (most restricted)
  ├─ Databases (PostgreSQL, Redis)
  ├─ Message Queues
  ├─ Secrets Store (Vault)
```

### Cloud Network (AWS VPC Example)
```yaml
# Terraform — VPC with public/private/data subnets
VPC: 10.0.0.0/16

Public Subnets (Load Balancer, NAT Gateway):
  10.0.1.0/24 (us-east-1a)
  10.0.2.0/24 (us-east-1b)

Private Subnets (Application Tier):
  10.0.10.0/24 (us-east-1a)
  10.0.11.0/24 (us-east-1b)

Data Subnets (Database Tier — no internet route):
  10.0.20.0/24 (us-east-1a)
  10.0.21.0/24 (us-east-1b)
```

---

## Firewalls and Security Groups

### Security Group Rules (AWS Principle: Default Deny)
```
Application Server Security Group:
  Inbound:
    HTTPS (443)  ← from Load Balancer SG only
    HTTP  (80)   ← from Load Balancer SG only
    SSH   (22)   ← from Bastion Host SG only
  Outbound:
    PostgreSQL (5432) → DB Security Group only
    Redis (6379)      → Cache Security Group only
    HTTPS (443)       → 0.0.0.0/0 (for external API calls)

Database Security Group:
  Inbound:
    PostgreSQL (5432) ← from App Server SG only
    NO internet access
  Outbound:
    NONE by default
```

---

## TLS/HTTPS Enforcement

```yaml
# Spring Boot — redirect HTTP to HTTPS
server:
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2  # Disable TLS 1.0, 1.1

# HSTS — tell browsers to always use HTTPS
# max-age=31536000 (1 year), includeSubDomains, preload
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### TLS Certificate Management
```yaml
# Let's Encrypt with auto-renewal (cert-manager in Kubernetes)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-tls
spec:
  secretName: api-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.example.com
  renewBefore: 360h  # Renew 15 days before expiry
```

---

## Web Application Firewall (WAF)

Sits in front of your app. Filters malicious HTTP traffic.

### What WAF Blocks
- SQL injection attempts
- XSS payloads
- Known attack signatures (CVEs, exploit kits)
- Bot traffic, scrapers
- Geographic IP blocking
- Rate limiting by IP

```
Internet → CloudFront (CDN) → WAF Rules → Load Balancer → App
```

```yaml
# AWS WAF managed rules (via Terraform)
resource "aws_wafv2_web_acl" "main" {
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
  }
  rule {
    name     = "RateLimit"
    priority = 2
    action { block {} }
    statement {
      rate_based_statement {
        limit              = 2000  # 2000 req/5min per IP
        aggregate_key_type = "IP"
      }
    }
  }
}
```

---

## DDoS Mitigation

### Types of DDoS Attacks
| Layer | Attack Type | Example |
|---|---|---|
| L3/L4 (Network) | Volumetric | UDP flood, ICMP flood, SYN flood |
| L4 (Transport) | Protocol | SYN flood exhausts TCP connection table |
| L7 (Application) | Slow HTTP | Slowloris, keeps connections open |
| L7 (Application) | HTTP flood | Overwhelms with legitimate-looking requests |

### Defense Layers
```
1. Upstream scrubbing (Cloudflare, AWS Shield Advanced, Akamai)
   → Absorbs volumetric attacks at network edge
   → 99% of DDoS stopped here

2. Rate limiting per IP at CDN/WAF
   → HTTP flood mitigation

3. Application-level rate limiting (Redis)
   → Per-user, per-endpoint limits

4. Auto-scaling + CDN offload
   → Absorb traffic spikes

5. Circuit breakers on downstream calls
   → Prevent cascade failure under load
```

```java
// Slowloris mitigation — set aggressive timeouts
server:
  tomcat:
    connection-timeout: 5000       # 5s max to receive headers
    keep-alive-timeout: 60000      # 60s keep-alive
    max-connections: 10000         # Max concurrent connections
    accept-count: 100              # Backlog queue
```

---

## DNS Security

### DNS Spoofing / Cache Poisoning
Attacker returns fake IP for a domain.

**Defense:** DNSSEC — cryptographically sign DNS records.

```
Normal DNS:
  Query: api.example.com → 1.2.3.4 (unverified)

DNSSEC:
  Query: api.example.com → 1.2.3.4 + digital signature
  → Client verifies signature against DNSKEY record → tamper detected
```

### DNS over HTTPS (DoH)
Prevents DNS queries being snooped by ISP/attacker.
```
Traditional: DNS query sent in plaintext UDP
DoH: DNS query sent via HTTPS (encrypted, looks like regular web traffic)
```

### DNS Rebinding Attack
```
1. Attacker controls attacker.com → initially resolves to 1.2.3.4
2. Victim visits attacker.com → JavaScript loaded
3. Attacker changes DNS TTL to 0, rebinds to 192.168.1.1 (victim's router)
4. JavaScript can now make requests to 192.168.1.1 using attacker.com origin
→ Bypasses same-origin policy!
```
**Defense:** Validate `Host` header, use HTTPS, bind services to specific IPs.

---

## VPN and Zero Trust Networking

### Traditional VPN Model
```
Employee → VPN → "Inside" network → Access all internal services
Problem: Once inside, lateral movement is easy (breach one, own all)
```

### Zero Trust Network Access (ZTNA)
```
Every access request:
  1. Verified identity (MFA)
  2. Device health check (MDM compliance)
  3. Least-privilege access to specific app only
  4. Continuous verification (not just at login)
  5. All traffic encrypted (even internal)
```

```
Employee Device (verified) → ZTNA Proxy → Identity Check → App A ONLY
                                        → No access to App B, internal DB, etc.
```

---

## mTLS (Mutual TLS) for Service-to-Service

Regular TLS: server proves identity to client.  
mTLS: **both** sides prove identity.

```
Service A ←─ present cert ──→ Service B
             verify each other's cert
             ← encrypted session →
No API keys needed — identity is the certificate
```

```yaml
# Istio mTLS — automatic for all pod-to-pod traffic
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT  # Require mTLS for all services in namespace
```

```java
// Spring Boot mTLS configuration
server:
  ssl:
    client-auth: need     # Require client certificate
    trust-store: classpath:truststore.p12
    trust-store-password: ${TRUST_STORE_PASSWORD}
    key-store: classpath:server-keystore.p12
    key-store-password: ${KEY_STORE_PASSWORD}
```

---

## SSH Security

```bash
# /etc/ssh/sshd_config — hardened SSH config
PermitRootLogin no
PasswordAuthentication no        # Key-based only
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers deploy-user admin-user
Protocol 2                       # SSH v2 only
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
MACs hmac-sha2-512-etm@openssh.com
```

### Bastion Host (Jump Server)
```
Developer → Internet → Bastion Host (hardened, MFA, logged) → Internal Servers
                        (minimal attack surface, only SSH port open)
```

---

## Port Scanning & Attack Surface Minimization

```bash
# What's exposed? Audit with nmap
nmap -sV -p- your-server.com

# Close unused ports
# Every open port is a potential attack vector
# Only open what's absolutely necessary
```

---

## Interview Questions

1. What is network segmentation and why is it important?
2. What is the difference between a WAF and a firewall?
3. How do you defend against a DDoS attack? What layers of defense exist?
4. What is the difference between TLS and mTLS?
5. What is DNS cache poisoning and how does DNSSEC prevent it?
6. What is the Zero Trust security model?
7. What is a Slowloris attack and how do you defend against it?
8. How do security groups differ from network ACLs in AWS?
9. What is a bastion host and when would you use one?
10. What is DNS rebinding and what defenses exist?
