---
id: network-security
title: Network Security
sidebar_label: Network Security
description: Network security fundamentals for software engineers — firewalls, VPNs, network segmentation, DDoS mitigation, DNS security, zero trust networking, mTLS, and cloud network controls.
tags: [network-security, firewall, vpn, ddos, dns, zero-trust, network-segmentation, waf, cloud-security, mtls]
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

### Cloud Network (AWS VPC)

```yaml
VPC: 10.0.0.0/16

Public Subnets (Load Balancer, NAT Gateway):
  10.0.1.0/24 (us-east-1a)
  10.0.2.0/24 (us-east-1b)

Private Subnets (Application Tier):
  10.0.10.0/24 (us-east-1a)
  10.0.11.0/24 (us-east-1b)

Data Subnets (no internet route):
  10.0.20.0/24 (us-east-1a)
  10.0.21.0/24 (us-east-1b)
```

---

## Security Groups (Default Deny)

```
Application Server:
  Inbound:
    HTTPS (443) ← Load Balancer SG only
    SSH   (22)  ← Bastion Host SG only
  Outbound:
    PostgreSQL (5432) → DB Security Group only
    Redis (6379)      → Cache Security Group only
    HTTPS (443)       → 0.0.0.0/0 (external API calls)

Database:
  Inbound:
    PostgreSQL (5432) ← App Server SG only
  Outbound: NONE
```

---

## TLS Enforcement

```yaml
server:
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2
    ciphers:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

```
# HSTS header — browsers always use HTTPS
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Web Application Firewall (WAF)

Sits in front of your app. Filters malicious HTTP traffic before it reaches application code.

**What WAF blocks:**
- SQL injection and XSS payloads
- Known exploit signatures (CVEs, exploit kits)
- Bot traffic and scrapers
- Geographic IP blocking
- Rate limiting by IP

```
Internet → CloudFront (CDN) → WAF Rules → Load Balancer → App
```

```yaml
# AWS WAF Terraform
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
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
  }
}
```

**WAF vs Firewall:**
- **Firewall** — operates at L3/L4 (IP, port, protocol). Allows/blocks connections.
- **WAF** — operates at L7 (HTTP). Inspects HTTP content, headers, and body for attacks.

---

## DDoS Mitigation

| Layer | Attack Type | Example |
|---|---|---|
| L3/L4 | Volumetric | UDP flood, ICMP flood |
| L4 | Protocol | SYN flood exhausts TCP table |
| L7 | Slow HTTP | Slowloris holds connections open |
| L7 | HTTP flood | Overwhelms with HTTP requests |

### Defense Layers

```
1. Upstream scrubbing (Cloudflare, AWS Shield) → absorbs volumetric attacks at edge
2. Rate limiting per IP at CDN/WAF → HTTP flood mitigation
3. Application-level rate limiting (Redis) → per-user, per-endpoint
4. Auto-scaling + CDN offload → absorb traffic spikes
5. Circuit breakers on downstream calls → prevent cascade failure
```

```yaml
# Slowloris defense — aggressive timeouts
server:
  tomcat:
    connection-timeout: 5000   # 5s max to receive headers
    keep-alive-timeout: 60000
    max-connections: 10000
    accept-count: 100
```

---

## DNS Security

### DNSSEC — Prevent Cache Poisoning

```
Normal DNS:  api.example.com → 1.2.3.4  (unverified)
DNSSEC:      api.example.com → 1.2.3.4 + digital signature
             → Client verifies signature → tampering detected
```

### DNS Rebinding Attack

```
1. Attacker controls attacker.com → resolves to 1.2.3.4
2. Victim visits attacker.com → JavaScript loaded
3. Attacker changes DNS TTL to 0, rebinds to 192.168.1.1 (victim's router)
4. JavaScript makes requests to 192.168.1.1 using attacker.com origin
→ Bypasses same-origin policy!
```

**Defense:** Validate `Host` header, use HTTPS, bind services to specific IPs.

---

## Zero Trust Networking

### Traditional VPN Model
```
Employee → VPN → "Inside" network → Access ALL internal services
Problem: Once inside, lateral movement is trivial
```

### Zero Trust Network Access (ZTNA)
```
Every access request:
  1. Verified identity (MFA required)
  2. Device health check (MDM compliance)
  3. Least-privilege access to SPECIFIC app only
  4. Continuous verification (not just at login)
  5. All traffic encrypted — even internal
```

---

## mTLS — Mutual TLS

Regular TLS: **server** proves identity to client.
mTLS: **both sides** prove identity via certificates.

```
Service A ←─ present cert ──→ Service B
             verify each other
             ← encrypted session →
No API keys needed — the certificate IS the identity
```

```yaml
# Istio — automatic mTLS for all pods
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
spec:
  mtls:
    mode: STRICT
```

```yaml
# Spring Boot mTLS
server:
  ssl:
    client-auth: need
    trust-store: classpath:truststore.p12
    trust-store-password: ${TRUST_STORE_PASSWORD}
    key-store: classpath:server-keystore.p12
    key-store-password: ${KEY_STORE_PASSWORD}
```

---

## SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no     # Key-based only
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
Protocol 2
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
```

### Bastion Host

```
Developer → Internet → Bastion Host (hardened, MFA, all sessions logged)
                             ↓
                      Internal Servers (not directly accessible)
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
