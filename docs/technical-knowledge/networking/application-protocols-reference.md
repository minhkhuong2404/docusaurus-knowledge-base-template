---
id: application-protocols-reference
title: Application Protocols Reference
description: SSH, SMTP, FTP, MQTT, AMQP, LDAP, NTP and other essential application-layer protocols — how they work and when to use them.
tags: [networking, ssh, smtp, ftp, mqtt, amqp, protocols, reference, application-layer]
sidebar_position: 15
---

import ApplicationProtocolsDiagram from '@site/src/components/ApplicationProtocolsDiagram';
import GrpcVsRestDiagram from '@site/src/components/GrpcVsRestDiagram';

# Application Protocols Reference

<ApplicationProtocolsDiagram />

<GrpcVsRestDiagram />

---

## SSH — Secure Shell (Port 22)

SSH provides **encrypted remote shell access**, file transfer, and tunneling.

### How SSH Works

### Quality of Service (QoS)

| QoS | Guarantee | Messages | Use |
|-----|-----------|---------|-----|
| 0 | At most once | Fire and forget | Non-critical telemetry |
| 1 | At least once | May duplicate | Status updates |
| 2 | Exactly once | No duplicates | Billing, commands |

### MQTT Features

- Tiny overhead: 2-byte fixed header
- **Retained messages**: broker stores last message; new subscribers get it immediately
- **Last Will**: message sent if client disconnects unexpectedly
- **Persistent sessions**: broker queues messages for offline clients

Used by: AWS IoT, Azure IoT Hub, Facebook Messenger, home automation (Home Assistant).

---

## AMQP — Advanced Message Queuing Protocol (Port 5672 / 5671 TLS)

Enterprise messaging protocol. Implemented by **RabbitMQ**.

Used for: Active Directory (Microsoft), OpenLDAP, SSO (single sign-on).

```java
// Spring Security LDAP authentication
spring:
  ldap:
    urls: ldaps://ldap.example.com:636
    base: dc=example,dc=com
    username: cn=serviceaccount,dc=example,dc=com
    password: ${LDAP_PASSWORD}

security:
  user:
    dn-patterns: uid={0},ou=users
    search-filter: (uid={0})
```

---

## NTP — Network Time Protocol (UDP Port 123)

Synchronizes clocks across networked computers.

```
Stratum levels:
  Stratum 0: atomic clocks, GPS receivers (reference clocks)
  Stratum 1: NTP servers directly connected to Stratum 0
  Stratum 2: sync from Stratum 1 (e.g., pool.ntp.org)
  Stratum 3: your server syncing from Stratum 2

Accuracy:
  Stratum 2: ±1-10ms on LAN
  AWS Time Sync Service: ±microseconds (for EC2)

Clock drift matters for:
  - JWT token expiry (iat + exp validation)
  - Distributed transaction ordering
  - Log correlation across services
  - TLS certificate validity
```

```bash
# Check NTP status
timedatectl status
ntpq -p        # show NTP peers and stratum

# chrony (modern NTP client)
chronyc tracking
chronyc sources -v
```

---

## WebRTC — Web Real-Time Communication

Browser-to-browser direct communication (video/audio/data channels).

```
Signaling (out-of-band via WebSocket/HTTP):
  Browser A and B exchange SDP (Session Description Protocol)
  SDP contains media capabilities, codecs, ICE candidates

ICE (Interactive Connectivity Establishment):
  Try direct connection (if no NAT)
  STUN: discover public IP:port
  TURN: relay if direct fails

Media transport: SRTP over UDP (not TCP — latency critical)
Data channels: SCTP over DTLS (reliable or unreliable, ordered or not)
```

---

## Protocol Quick Reference

| Protocol | Port(s) | Transport | Encrypted | Use |
|----------|---------|-----------|-----------|-----|
| HTTP | 80 | TCP | No | Web |
| HTTPS | 443 | TCP/QUIC | TLS | Web secure |
| SSH | 22 | TCP | Yes | Remote shell |
| SFTP | 22 | TCP | Yes | File transfer |
| FTP | 21/20 | TCP | No | File transfer (avoid) |
| SMTP | 25/587 | TCP | STARTTLS | Email |
| DNS | 53 | UDP/TCP | No (DoH/DoT) | Name resolution |
| NTP | 123 | UDP | No | Time sync |
| MQTT | 1883/8883 | TCP | TLS | IoT messaging |
| AMQP | 5672/5671 | TCP | TLS | Message queuing |
| LDAP | 389/636 | TCP | TLS | Directory |
| Redis | 6379 | TCP | TLS | Cache/pub-sub |
| PostgreSQL | 5432 | TCP | TLS | Database |
| MySQL | 3306 | TCP | TLS | Database |
| gRPC | 443/50051 | TCP (HTTP/2) | TLS | RPC |
| WebSocket | 80/443 | TCP (HTTP upgrade) | TLS | Real-time |

---

## Interview Questions

### Q1. How does SSH key-based authentication work?
> The client generates a key pair (public + private). The public key is added to `~/.ssh/authorized_keys` on the server. During login, the server sends a challenge encrypted with the client's public key. Only the client with the matching private key can decrypt it and respond correctly — proving possession of the private key without ever transmitting it. More secure than passwords (no brute force risk, no phishing).

### Q2. What is MQTT and why is it suited for IoT?
> MQTT is a lightweight pub/sub protocol with a 2-byte header. Suited for IoT because: tiny overhead (critical for constrained devices with limited power/bandwidth), works over unstable connections (QoS levels, persistent sessions for offline devices), last will messages detect device disconnection. The broker handles routing — devices publish to topics and subscribers receive — decoupling publishers from subscribers.

### Q3. What is the difference between SFTP and FTPS?
> SFTP (SSH File Transfer Protocol) runs over SSH (port 22) — entirely different protocol from FTP, just named similarly. Secure, works through NAT, uses SSH authentication. FTPS (FTP Secure) is original FTP with TLS added. Still has FTP's NAT problems (active/passive modes). SFTP is generally preferred — simpler firewall rules (only port 22) and uses existing SSH infrastructure.

### Q4. What is SPF, DKIM, and DMARC?
> SPF (Sender Policy Framework): DNS TXT record listing authorized mail servers for a domain — receiving servers reject mail claiming to be from your domain if it didn't come from an authorized server. DKIM (DomainKeys Identified Mail): cryptographic signature added to email headers — receiving server verifies signature against public key in DNS. DMARC: policy that specifies what to do when SPF/DKIM fail (none, quarantine, reject) and where to send reports.

### Q5. Why does NTP matter for distributed systems?
> Many distributed system assumptions rely on clock synchronization: JWT token expiry (iat/exp), distributed transaction ordering (event timestamps), TLS certificate validity (cert expired checks), log correlation across services, and database replication (some use timestamps for conflict resolution). Without NTP, clocks drift apart — a 1-second drift can cause valid tokens to appear expired or events to appear out of order. Use NTP + `ntpd`/`chrony` on all servers.

### Q6. What is the difference between AMQP and MQTT?
> MQTT is lightweight pub/sub for IoT — minimal overhead, designed for constrained devices and unreliable networks. AMQP is enterprise messaging — rich routing (exchanges, queues, bindings), message acknowledgment, transactions, dead letter queues, intended for reliable enterprise integration. RabbitMQ implements AMQP (and also supports MQTT via plugin). Use MQTT for IoT/embedded; AMQP/RabbitMQ for service-to-service messaging in backend systems.

### Q7. What is SSH tunneling and give a practical use case?
> SSH tunneling (port forwarding) creates an encrypted tunnel through SSH to reach otherwise inaccessible hosts. Local forwarding: `ssh -L 5432:db.internal:5432 bastion.example.com` — your local port 5432 tunnels through the bastion to an internal database. Use case: a DBA needs to run database tools from their laptop against a production DB that's only accessible from within the VPC. The bastion server is the only externally accessible SSH endpoint.

### Q8. What are LDAP and Active Directory, and how do they relate to application authentication?
> LDAP is a protocol for querying and modifying directory services. Active Directory (AD) is Microsoft's directory service that implements LDAP (and Kerberos). Applications use LDAP/AD for: centralized authentication (users log in with corporate credentials), group-based authorization (is user in `developers` group?), single sign-on (users authenticate once for all corporate apps). Spring Security supports LDAP authentication natively. Many enterprises require AD integration for internal tools.
