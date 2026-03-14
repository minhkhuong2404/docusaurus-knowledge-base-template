---
id: application-protocols-reference
title: Application Protocols Reference
description: SSH, SMTP, FTP, MQTT, AMQP, LDAP, NTP and other essential application-layer protocols — how they work and when to use them.
tags: [networking, ssh, smtp, ftp, mqtt, amqp, protocols, reference, application-layer]
sidebar_position: 15
---

# Application Protocols Reference

## SSH — Secure Shell (Port 22)

SSH provides **encrypted remote shell access**, file transfer, and tunneling.

### How SSH Works

```
Client → Server:
  1. TCP connection on port 22
  2. Protocol version exchange
  3. Key exchange (Diffie-Hellman): establish session keys
  4. Server authenticates itself (host key — prevents MitM on first connect)
  5. Client authenticates: password or public key

Key-based authentication:
  Client has: private key (~/.ssh/id_rsa)
  Server has: public key (~/.ssh/authorized_keys)
  Client proves it has the private key → no password needed
```

### SSH Features

```bash
# Remote shell
ssh user@server.com
ssh -p 2222 user@server.com   # custom port
ssh -i ~/.ssh/mykey user@server.com  # specify key

# Copy files
scp file.txt user@server.com:/home/user/
scp -r dir/ user@server.com:/home/user/
sftp user@server.com          # interactive file transfer

# Port forwarding (tunneling)
# Local: forward local port to remote service
ssh -L 5432:localhost:5432 user@server.com  # access remote PostgreSQL locally
# → connect to localhost:5432, traffic tunneled to remote server's port 5432

# Remote: expose local service via remote server
ssh -R 8080:localhost:8080 user@server.com
# → requests to server:8080 forward to your localhost:8080

# Dynamic: SOCKS proxy
ssh -D 1080 user@server.com
# → configure browser to use SOCKS5 localhost:1080 → browse from server's perspective

# Jump host / ProxyJump
ssh -J bastion.example.com internal-server.internal
```

### SSH Configuration

```
# ~/.ssh/config
Host bastion
    HostName bastion.example.com
    User ec2-user
    IdentityFile ~/.ssh/mykey.pem

Host internal
    HostName 10.0.0.100
    User ubuntu
    ProxyJump bastion
    IdentityFile ~/.ssh/mykey.pem
    StrictHostKeyChecking yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

---

## SMTP — Simple Mail Transfer Protocol (Port 25 / 587 / 465)

Used for **sending email** between mail servers and from clients to servers.

```
Port 25:  SMTP server-to-server (MTA relay)
Port 587: Submission (client to server, STARTTLS required)
Port 465: SMTPS (SMTP over TLS, deprecated but widely used)

SMTP Session:
Client → EHLO myserver.com              (introduce myself)
Server → 250 Hello, capabilities list
Client → AUTH LOGIN or PLAIN ...        (authenticate)
Client → MAIL FROM:<sender@example.com>
Client → RCPT TO:<recipient@example.com>
Client → DATA
Client → Subject: Hello
         From: sender@example.com
         To: recipient@example.com
         
         Message body here
         .                              (single dot = end of message)
Server → 250 OK: queued as abc123
Client → QUIT
```

### Email Delivery Verification (Anti-Spam)

| Record | Purpose | Example |
|--------|---------|---------|
| **SPF** | Authorized sending servers | `v=spf1 include:sendgrid.net -all` |
| **DKIM** | Cryptographic signature on emails | Key in DNS TXT record |
| **DMARC** | Policy for SPF/DKIM failures | `v=DMARC1; p=reject; rua=...` |

```java
// Spring Boot email with JavaMailSender
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");

        helper.setTo(to);
        helper.setFrom("noreply@example.com");
        helper.setSubject(subject);
        helper.setText(body, true);   // true = HTML

        mailSender.send(msg);
    }
}
```

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_USER}
    password: ${GMAIL_APP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

---

## FTP / SFTP / FTPS (Port 21)

FTP transfers files but has major problems:
- ❌ No encryption (credentials in plaintext)
- ❌ Active mode requires server to initiate connections back to client (NAT/firewall issues)
- ❌ Separate control (21) and data (20 or ephemeral) connections

```
FTP Modes:
  Active:  client sends PORT command → server connects back to client
           → blocked by most firewalls/NAT
  Passive: client sends PASV → server opens a data port → client connects
           → works through NAT (client initiates both connections)
```

**Use instead:**
- **SFTP** (SSH File Transfer Protocol over SSH port 22) — not FTP with TLS
- **FTPS** (FTP over TLS) — FTP with encryption (still has NAT issues)
- **rsync over SSH** for synchronization
- **HTTPS** upload for web-based file transfer

---

## MQTT — Message Queue Telemetry Transport (Port 1883 / 8883 TLS)

Lightweight pub/sub protocol designed for **IoT and constrained devices**.

```
Architecture:
  Publisher ──message──► [Broker] ──message──► Subscriber(s)
  Device publishes to topic; subscribers receive if interested

Publish:
  topic: "sensors/room1/temperature"
  payload: {"value": 23.5, "unit": "celsius", "timestamp": 1710000000}
  QoS: 1 (at least once)

Subscribe:
  "sensors/+/temperature"   → + wildcard matches one level
  "sensors/#"               → # wildcard matches multiple levels
```

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

```
Concepts:
  Exchange  → routing (direct, fanout, topic, headers)
  Queue     → message buffer
  Binding   → exchange → queue routing rules

Message flow:
  Producer → Exchange → [routing] → Queue → Consumer

Exchange types:
  Direct:  route by exact routing key
  Fanout:  broadcast to all bound queues (pub/sub)
  Topic:   route by routing key pattern (*.error, logs.#)
  Headers: route by message header attributes
```

```java
// Spring AMQP (RabbitMQ)
@Configuration
public class RabbitConfig {
    @Bean
    TopicExchange ordersExchange() { return new TopicExchange("orders"); }

    @Bean
    Queue orderCreatedQueue() { return QueueBuilder.durable("order.created").build(); }

    @Bean
    Binding binding(Queue q, TopicExchange ex) {
        return BindingBuilder.bind(q).to(ex).with("order.created.*");
    }
}

// Publisher
rabbitTemplate.convertAndSend("orders", "order.created.US", orderEvent);

// Consumer
@RabbitListener(queues = "order.created")
public void handleOrderCreated(OrderCreatedEvent event) {
    inventoryService.reserve(event.getItems());
}
```

---

## LDAP — Lightweight Directory Access Protocol (Port 389 / 636 TLS)

Protocol for accessing **directory services** (user accounts, groups, permissions).

```
LDAP Directory Tree:
dc=example,dc=com
  └── ou=users
        ├── cn=alice,ou=users,dc=example,dc=com
        └── cn=bob,ou=users,dc=example,dc=com
  └── ou=groups
        └── cn=developers,ou=groups,dc=example,dc=com

Operations:
  Bind:    authenticate
  Search:  query directory (most common)
  Modify:  update entry
  Add/Del: create/delete entries
```

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

## 🎯 Interview Questions

**Q1. How does SSH key-based authentication work?**
> The client generates a key pair (public + private). The public key is added to `~/.ssh/authorized_keys` on the server. During login, the server sends a challenge encrypted with the client's public key. Only the client with the matching private key can decrypt it and respond correctly — proving possession of the private key without ever transmitting it. More secure than passwords (no brute force risk, no phishing).

**Q2. What is MQTT and why is it suited for IoT?**
> MQTT is a lightweight pub/sub protocol with a 2-byte header. Suited for IoT because: tiny overhead (critical for constrained devices with limited power/bandwidth), works over unstable connections (QoS levels, persistent sessions for offline devices), last will messages detect device disconnection. The broker handles routing — devices publish to topics and subscribers receive — decoupling publishers from subscribers.

**Q3. What is the difference between SFTP and FTPS?**
> SFTP (SSH File Transfer Protocol) runs over SSH (port 22) — entirely different protocol from FTP, just named similarly. Secure, works through NAT, uses SSH authentication. FTPS (FTP Secure) is original FTP with TLS added. Still has FTP's NAT problems (active/passive modes). SFTP is generally preferred — simpler firewall rules (only port 22) and uses existing SSH infrastructure.

**Q4. What is SPF, DKIM, and DMARC?**
> SPF (Sender Policy Framework): DNS TXT record listing authorized mail servers for a domain — receiving servers reject mail claiming to be from your domain if it didn't come from an authorized server. DKIM (DomainKeys Identified Mail): cryptographic signature added to email headers — receiving server verifies signature against public key in DNS. DMARC: policy that specifies what to do when SPF/DKIM fail (none, quarantine, reject) and where to send reports.

**Q5. Why does NTP matter for distributed systems?**
> Many distributed system assumptions rely on clock synchronization: JWT token expiry (iat/exp), distributed transaction ordering (event timestamps), TLS certificate validity (cert expired checks), log correlation across services, and database replication (some use timestamps for conflict resolution). Without NTP, clocks drift apart — a 1-second drift can cause valid tokens to appear expired or events to appear out of order. Use NTP + `ntpd`/`chrony` on all servers.

**Q6. What is the difference between AMQP and MQTT?**
> MQTT is lightweight pub/sub for IoT — minimal overhead, designed for constrained devices and unreliable networks. AMQP is enterprise messaging — rich routing (exchanges, queues, bindings), message acknowledgment, transactions, dead letter queues, intended for reliable enterprise integration. RabbitMQ implements AMQP (and also supports MQTT via plugin). Use MQTT for IoT/embedded; AMQP/RabbitMQ for service-to-service messaging in backend systems.

**Q7. What is SSH tunneling and give a practical use case?**
> SSH tunneling (port forwarding) creates an encrypted tunnel through SSH to reach otherwise inaccessible hosts. Local forwarding: `ssh -L 5432:db.internal:5432 bastion.example.com` — your local port 5432 tunnels through the bastion to an internal database. Use case: a DBA needs to run database tools from their laptop against a production DB that's only accessible from within the VPC. The bastion server is the only externally accessible SSH endpoint.

**Q8. What are LDAP and Active Directory, and how do they relate to application authentication?**
> LDAP is a protocol for querying and modifying directory services. Active Directory (AD) is Microsoft's directory service that implements LDAP (and Kerberos). Applications use LDAP/AD for: centralized authentication (users log in with corporate credentials), group-based authorization (is user in `developers` group?), single sign-on (users authenticate once for all corporate apps). Spring Security supports LDAP authentication natively. Many enterprises require AD integration for internal tools.
