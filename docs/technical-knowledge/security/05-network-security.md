---
id: network-security
title: Network Security
sidebar_label: Network Security
description: Network security fundamentals for software engineers — firewalls, VPNs, network segmentation, DDoS mitigation, DNS security, zero trust networking, mTLS, and cloud network controls.
tags: [network-security, firewall, vpn, ddos, dns, zero-trust, network-segmentation, waf, cloud-security, mtls]
---

# Network Security

import NetworkSegmentationDiagram from '@site/src/components/NetworkSegmentationDiagram';
import SecurityGroupsDiagram from '@site/src/components/SecurityGroupsDiagram';
import WafDiagram from '@site/src/components/WafDiagram';
import DdosMitigationDiagram from '@site/src/components/DdosMitigationDiagram';
import DnsSecurityDiagram from '@site/src/components/DnsSecurityDiagram';
import ZeroTrustDiagram from '@site/src/components/ZeroTrustDiagram';
import MtlsDiagram from '@site/src/components/MtlsDiagram';
import SshHardeningDiagram from '@site/src/components/SshHardeningDiagram';


---

## Network Segmentation

Divide network into isolated zones. Limit blast radius of a breach.

<NetworkSegmentationDiagram />

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

<SecurityGroupsDiagram />

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

<WafDiagram />

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

<DdosMitigationDiagram />

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

<DnsSecurityDiagram />

**Defense:** Validate `Host` header, use HTTPS, bind services to specific IPs.

---

## Zero Trust Networking

<ZeroTrustDiagram />

---

## mTLS — Mutual TLS

Regular TLS: **server** proves identity to client.
mTLS: **both sides** prove identity via certificates.

<MtlsDiagram />

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

### SSH Bastion Access

<SshHardeningDiagram />

---

## Interview Questions

**Q1: What is network segmentation and why is it important?**

> **Network Segmentation** is the practice of splitting a network into smaller, isolated subnetworks (zones) using firewalls, VLANs, and security groups.
> **Why it is important:** It prevents lateral movement. If an attacker compromises a public-facing web server in the DMZ, network segmentation rules prevent them from directly connecting to database servers or internal active directory clusters, limiting the blast radius of a breach.

---

**Q2: What is the difference between a WAF and a firewall?**

> * **Traditional Firewall (Network Layer):** Operates at Layers 3 and 4 of the OSI model. It filters traffic based on source/destination IP addresses, protocols, and port numbers (e.g. block port 22, allow port 443).
> * **WAF (Web Application Firewall):** Operates at Layer 7 (Application Layer). It inspects the actual content of HTTP requests (headers, cookies, query parameters, POST bodies) to identify and block application attacks like SQL Injection, XSS, CSRF, and bot traffic.

---

**Q3: How do you defend against a DDoS attack? What layers of defense exist?**

> A robust DDoS defense requires a multi-layered approach:
> 1. **Edge Mitigation (Cloudflare, AWS Shield):** Absorbs high-volume Layer 3/4 flood attacks (SYN flood, UDP reflection) before they reach your network infrastructure.
> 2. **Rate Limiting & WAF:** Mitigates Layer 7 attacks (HTTP floods) by rate-limiting client IPs or identifying malicious user-agent signatures.
> 3. **Anycast Routing:** Spreads traffic loads across a globally distributed network of servers.
> 4. **Auto-scaling:** Ensures application clusters automatically scale out to absorb traffic spikes without collapsing.

---

**Q4: What is the difference between TLS and mTLS?**

> * **One-way TLS:** Only the **client verifies the server's identity**. The server presents its public certificate, the client verifies it, and an encrypted channel is established. (e.g. standard HTTPS browsing).
> * **mTLS (Mutual TLS):** **Both parties verify each other's identity**. The server requests the client's certificate, and the client presents it. Both verify the signatures against trusted CAs. If validation fails on either side, the connection terminates. mTLS is commonly used for secure service-to-service communication in microservices and zero-trust API architectures.

---

**Q5: What is DNS cache poisoning and how does DNSSEC prevent it?**

> **DNS Cache Poisoning:** An attacker injects fraudulent DNS records into a caching resolver's memory (e.g. mapping `bank.com` to the attacker's IP). Subsequent queries route victims to the fake site.
> **DNSSEC Prevention:** DNSSEC adds digital signatures to DNS records using public-key cryptography. Resolvers verify the cryptographic signatures against trust chains starting at the root domain, ensuring records are authentic and have not been tampered with.

---

**Q6: What is the Zero Trust security model?**

> Zero Trust is a security framework based on the principle: **"Never trust, always verify."**
> Traditional models assume anything inside the network boundary is safe. Zero Trust treats all network segments as hostile. It requires:
> 1. Strict identity validation for every user and device (MFA, health checks).
> 2. Micro-segmentation (limiting network visibility between services).
> 3. Continuous authorization (validating permissions on every transaction, not just at login).

---

**Q7: What is a Slowloris attack and how do you defend against it?**

> A Slowloris attack is a Layer 7 DDoS attack where an attacker opens many connections to a web server and holds them open by sending incomplete HTTP headers at a very slow rate. This consumes the server's maximum thread/connection pool, denying service to legitimate users.
> **Defense:**
> 1. Use reverse proxies (Nginx, HAProxy) which buffer incoming connections and headers completely before passing them to backend app servers.
> 2. Configure aggressive connection and read timeouts on the web server.
> 3. Restrict the maximum connections allowed per client IP.

---

**Q8: How do security groups differ from network ACLs in AWS?**

> * **Security Groups (Stateful):** Act as a firewall for resource instances (e.g., EC2, RDS). Rules operate at the instance level. They are stateful: if you allow inbound traffic on port 443, outbound response traffic is automatically allowed.
> * **Network ACLs (Stateless):** Act as a firewall at the subnet level. They are stateless: if you allow inbound traffic, you must explicitly configure a rule to allow the corresponding outbound response traffic. Rules are processed in numerical order.

---

**Q9: What is a bastion host and when would you use one?**

> A bastion host is a highly secure, public-facing server used to proxy administrative access to servers sitting inside a private subnet (no public IP).
> **When to use:** When system administrators need to connect via SSH or RDP to internal databases or compute nodes. All traffic must go through the bastion host, which enforces MFA, restricts source IPs, and records audit logs of all sessions.

---

**Q10: What is DNS rebinding and what defenses exist?**

> DNS rebinding is an attack where a malicious script in a victim's browser bypasses the Same-Origin Policy (SOP). The attacker registers a domain name and maps it to a malicious IP with a tiny TTL. Once the script loads, the domain is rebound to a local private IP (e.g. `127.0.0.1` or internal router). The browser script can now make requests to local network resources.
> **Defenses:**
> 1. Validate the `Host` header on the server side; reject requests matching arbitrary or unexpected host headers.
> 2. Enforce authentication on all local APIs/devices.
> 3. Configure DNS resolvers to block responses containing private IP ranges.
