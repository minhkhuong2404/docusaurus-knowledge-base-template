---
id: application-protocols-reference
title: Network & Application Protocols Reference — The Complete Protocol Guide
sidebar_label: Application Protocols
description: Comprehensive reference for all essential network and application protocols — TCP/IP, UDP, DNS, DHCP, HTTP/HTTPS, QUIC, WebSocket, SSH, FTP/SFTP, SMTP/IMAP, TLS 1.3, BGP, MQTT, and AMQP.
tags: [networking, protocols, tcp, udp, dns, dhcp, http, https, quic, websocket, ssh, ftp, sftp, smtp, tls, bgp, mqtt, amqp]
sidebar_position: 15
---

import ApplicationProtocolsDiagram from '@site/src/components/ApplicationProtocolsDiagram';
import GrpcVsRestDiagram from '@site/src/components/GrpcVsRestDiagram';

# Network & Application Protocols Reference

<ApplicationProtocolsDiagram />

---

## 1. Transport Layer Foundations: TCP vs UDP

At the transport layer (L4), all internet communication relies on two fundamental protocols with contrasting design philosophies:

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│ TCP (Transmission Control Protocol)   │ UDP (User Datagram Protocol)          │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • Connection-oriented (3-way handshake)│ • Connectionless (Zero handshake)     │
│ • Guaranteed ordered delivery (seq/ack)│ • Unordered, best-effort datagrams    │
│ • Flow control (Sliding Window)       │ • No flow control (fire-and-forget)   │
│ • Congestion control (CUBIC, BBR)     │ • No congestion control               │
│ • Heavy 20–60 byte header             │ • Lightweight 8-byte fixed header     │
│ • Use: Web, Email, Database, SSH      │ • Use: DNS, DHCP, VoIP, Gaming, QUIC  │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

### TCP (RFC 793 / 9293)
- **The 3-Way Handshake**:
  1. Client $\to$ Server: `SYN` (Sequence number $= X$)
  2. Server $\to$ Client: `SYN-ACK` (Sequence number $= Y$, Acknowledgment $= X + 1$)
  3. Client $\to$ Server: `ACK` (Acknowledgment $= Y + 1$) $\to$ Connection **ESTABLISHED**.
- **Sliding Window Flow Control**: Receiver advertises a `Receive Window (rwnd)` in every ACK packet indicating available buffer capacity, preventing the sender from overflowing receiver memory.
- **Connection Teardown (4-Way Handshake)**: `FIN` $\to$ `ACK` $\to$ `FIN` $\to$ `ACK`. The closing party remains in `TIME_WAIT` state for $2 \times \text{MSL}$ (Maximum Segment Lifetime, typically 60–120s) to guarantee lingering duplicate packets do not corrupt future connections.

### UDP (RFC 768)
- **Zero Overhead**: Contains only 4 header fields (Source Port, Destination Port, Length, Checksum = 8 bytes total).
- **Packet Sizing & MTU**: If a UDP datagram exceeds the Maximum Transmission Unit (MTU, typically 1500 bytes for Ethernet), the IP layer fragments the packet. If a single IP fragment is dropped, the entire UDP datagram is lost. Safe payload size is $< 1280$ bytes (IPv6 minimum MTU).

---

## 2. Address & Network Discovery: DNS & DHCP

### DNS — Domain Name System (UDP/TCP Port 53, RFC 1034/1035)

DNS is the globally distributed hierarchical naming directory that translates human-readable hostnames (e.g., `api.example.com`) into routable IP addresses (`93.184.216.34`).

```
Recursive DNS Resolution Hierarchy:
[ Client Browser ]
        │ 1. Query: "api.example.com"
        ▼
[ Recursive Resolver (e.g., 8.8.8.8, ISP) ]
   ├── 2. Query Root Server (.)          ──► Returns .com TLD Nameserver
   ├── 3. Query TLD Server (.com)         ──► Returns example.com Authoritative Nameserver
   └── 4. Query Authoritative Nameserver  ──► Returns A Record: 93.184.216.34 (TTL: 300s)
        │ 5. Returns IP to Client
        ▼
[ Client Browser Connects to 93.184.216.34 ]
```

#### Core DNS Record Types
- **`A`**: Maps hostname to IPv4 address (`example.com` $\to$ `93.184.216.34`).
- **`AAAA`**: Maps hostname to 128-bit IPv6 address (`example.com` $\to$ `2606:2800:220:1:248:1893:25c8:1946`).
- **`CNAME`**: Canonical Name alias pointing to another domain name (`www.example.com` $\to$ `example.com`). *Cannot exist at zone apex (`@`).*
- **`MX`**: Mail Exchanger specifying mail delivery servers with priority weights.
- **`TXT`**: Arbitrary text used for domain verification, **SPF** (Sender Policy Framework), and **DKIM** public keys.
- **`PTR`**: Reverse DNS lookup mapping IP addresses back to domain names.

:::warning[Production DNS Gotcha: JVM Caching]
By default, the Java Virtual Machine (`InetAddress`) caches successful DNS lookups **indefinitely** (forever) if a security manager is active, or for 30 seconds. During cloud IP migrations, Java apps will continue routing traffic to obsolete IPs. Always set `networkaddress.cache.ttl=60` in `$JAVA_HOME/conf/security/java.security`.
:::

### DHCP — Dynamic Host Configuration Protocol (UDP Ports 67 & 68, RFC 2131)

DHCP automatically configures client network interfaces on local subnets without requiring manual static IP assignment.

```
The DHCP DORA Process:
Client (0.0.0.0:68)                             DHCP Server (Port 67)
       │                                                 │
       │─── 1. DISCOVER (Broadcast: 255.255.255.255) ───►│ (Find available servers)
       │                                                 │
       │◄── 2. OFFER (Broadcast/Unicast: 192.168.1.105) ─│ (Server reserves IP from pool)
       │                                                 │
       │─── 3. REQUEST (Broadcast: "I choose .105") ────►│ (Client formally accepts)
       │                                                 │
       │◄── 4. ACKNOWLEDGE (IP, Subnet, Gateway, DNS) ───│ (Binding committed to lease table)
```

- **Lease Renewal Timers**:
  - **$T_1$ (50% of lease)**: Client attempts unicast `DHCPREQUEST` to the original server to renew the lease.
  - **$T_2$ (87.5% of lease)**: If original server is unreachable, client broadcasts `DHCPREQUEST` to any available DHCP server.
- **APIPA Fallback (169.254.0.0/16)**: If no DHCP server responds, OS self-assigns an Automatic Private IP Address (APIPA) in the `169.254.x.x` subnet (link-local, non-routable over internet).

---

## 3. Web & Real-Time Protocols: HTTP, WebSocket & QUIC

### HTTP/1.1 vs HTTP/2 vs HTTP/3

| Protocol Dimension | HTTP/1.1 (1997) | HTTP/2 (2015) | HTTP/3 (2022) |
|---|---|---|---|
| **Underlying Transport** | TCP (Port 80/443) | TCP (Port 443) | **QUIC over UDP** (Port 443) |
| **Connection Model** | 1 request per TCP socket (or 6 parallel connections) | Single TCP socket with concurrent multiplexed streams | Single UDP socket with independent multiplexed streams |
| **Framing** | ASCII plaintext | Binary framing (Frames & Streams) | Binary framing |
| **Header Compression** | None (redundant headers sent repeatedly) | **HPACK** (static/dynamic Huffman tables) | **QPACK** (out-of-order header compression) |
| **Head-of-Line Blocking** | **Application Level**: Request 1 blocks Request 2 | **TCP Level**: 1 dropped packet blocks all multiplexed streams | **Zero**: Dropped packet on Stream 1 does NOT affect Stream 2 |
| **Connection Setup** | 1 RTT (TCP) + 1–2 RTT (TLS) = 2–3 RTTs | 1 RTT (TCP) + 1 RTT (TLS 1.3) = 2 RTTs | **1 RTT** (Combined Transport + TLS 1.3) / **0-RTT** resumption |
| **Connection Migration** | Broken on IP change (Wi-Fi $\to$ 5G drops socket) | Broken on IP change | **Native**: 64-bit Connection ID survives IP/port network changes |

### WebSocket Protocol (RFC 6455)

WebSocket provides a persistent, full-duplex, bidirectional communication channel over a single long-lived TCP socket.

```
WebSocket HTTP Upgrade Handshake:
Client                                           Server
  │                                                │
  │─── GET /chat HTTP/1.1 ────────────────────────►│
  │    Host: server.example.com                    │
  │    Upgrade: websocket                          │
  │    Connection: Upgrade                         │
  │    Sec-WebSocket-Key: dGhlIHNhbXBsZQ==         │
  │    Sec-WebSocket-Version: 13                   │
  │                                                │
  │◄── HTTP/1.1 101 Switching Protocols ───────────│
  │    Upgrade: websocket                          │
  │    Connection: Upgrade                         │
  │    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYG...   │
  │                                                │
  │════════════════════════════════════════════════│
  │  Full-Duplex Bidirectional Framing (2–10 bytes)│
  │◄──────────────────────────────────────────────►│
```

- **Framing Efficiency**: Unlike HTTP where every request sends 500–1000 bytes of headers, WebSocket frames have an overhead of only **2 to 10 bytes**.
- **Heartbeat Control Frames**: `0x9` (Ping) and `0xA` (Pong) frames keep NAT state tables alive across intermediate firewalls and load balancers.

---

## 4. Cryptographic Security: TLS 1.3 & SSL

Transport Layer Security (TLS) operates above L4 transport, securing application protocols (HTTPS, SMTPS, WSS, LDAPS).

```
TLS 1.3 Handshake (1-RTT Full Setup):
Client                                                      Server
  │                                                           │
  │─── ClientHello ──────────────────────────────────────────►│
  │    KeyShare: Client ECDHE Public Key                      │
  │    Supported Ciphers: AES-256-GCM, CHACHA20-POLY1305      │
  │    Server Name Indication (SNI): "api.example.com"        │
  │                                                           │
  │◄── ServerHello ───────────────────────────────────────────│
  │    KeyShare: Server ECDHE Public Key                      │
  │    { EncryptedExtensions }                                │
  │    { Certificate: X.509 Chain }                           │
  │    { CertificateVerify: Signature over handshake }        │
  │    { Finished }                                           │
  │                                                           │
  │─── { Finished } ─────────────────────────────────────────►│
  │    { Encrypted Application Data (HTTP GET /) }            │
  │                                                           │
  │◄── { Encrypted Application Data (HTTP 200 OK) } ──────────│
```

- **Asymmetric vs Symmetric Cryptography**:
  - **Asymmetric (ECDHE / RSA)**: High CPU cost; used exclusively during handshake to mutually authenticate and securely compute a shared session key without transmitting it over the wire.
  - **Symmetric (AES-256-GCM / ChaCha20)**: Hardware-accelerated (AES-NI instructions); used for high-speed wire payload encryption.
- **TLS 1.3 Improvements Over TLS 1.2**:
  - Handshake latency reduced from 2 RTTs down to **1 RTT** (and **0-RTT** Pre-Shared Key resumption).
  - Obsolete and vulnerable ciphers removed (MD5, SHA-1, RC4, DES, CBC mode, static RSA key exchange).
  - Perfect Forward Secrecy (PFS) is mandatory: compromising the server's private key in the future cannot decrypt recorded past traffic.

---

## 5. Remote Shell & Secure File Transfers: SSH & FTP

### SSH — Secure Shell (TCP Port 22, RFC 4251)

SSH replaces insecure plaintext protocols (`telnet`, `rlogin`) with strong public-key cryptography.

#### How Public-Key Authentication Works
1. Client generates key pair: private key (`~/.ssh/id_ed25519`) and public key (`~/.ssh/id_ed25519.pub`).
2. Public key is appended to the server's `~/.ssh/authorized_keys`.
3. During login, the server generates a random challenge string, encrypts it with the client's public key (or signs session data), and sends it to the client.
4. The client uses its local private key to decrypt/sign and responds. The server validates the response, authenticating the client **without the private key ever leaving the client machine**.

#### SSH Port Forwarding / Tunneling
```bash
# 1. Local Port Forwarding (-L): Access remote internal DB from local machine
# Local port 5432 tunnels through bastion to 10.0.1.50:5432
ssh -L 5432:10.0.1.50:5432 user@bastion.example.com

# 2. Remote Port Forwarding (-R): Expose local dev server to remote server
# Remote server port 8080 forwards to local machine port 3000
ssh -R 8080:localhost:3000 user@public-server.com

# 3. Dynamic SOCKS5 Proxy (-D): Route all browser traffic through remote host
ssh -D 1080 -N -C user@bastion.example.com
```

### FTP vs FTPS vs SFTP

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│ Plain FTP (RFC 959)                   │ SFTP (SSH File Transfer Protocol)     │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • Port 21 (Control) + Port 20 (Data)  │ • Port 22 (SSH Subsystem)             │
│ • Cleartext passwords and data        │ • Full SSH-2 cryptographic encryption │
│ • Active mode broken by client NAT    │ • Single port, NAT-friendly           │
│ • Passive mode requires open port range│ • Standardized public key auth        │
│ • Deprecated in production            │ • Industry standard for file exchange │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

:::caution[Why Pure FTP Must Never Be Used]
Standard FTP sends usernames and passwords across the wire in clear ASCII text. Any network sniffer (Wireshark, tcpdump) on the transit path can instantly capture credentials. Always mandate **SFTP** (over SSH) or **FTPS** (FTP over explicit TLS).
:::

---

## 6. Email Infrastructure: SMTP, IMAP & POP3

Email relies on distinct protocols for **sending (push)** and **retrieving (sync)**:

```
End-to-End Email Architecture:
[ Alice (Mail Client) ]
         │ 1. Submission (SMTP Port 587 + STARTTLS)
         ▼
[ Alice's Mail Server (MTA) ]
         │ 2. Query MX Record: "dig mx companyb.com"
         │ 3. Server-to-Server Relay (SMTP Port 25)
         ▼
[ Bob's Mail Server (MTA) ] ──► Stores in Mailbox Spool
         ▲
         │ 4. Folder Sync & Fetch (IMAP Port 993 + TLS)
[ Bob (Mail Client) ]
```

- **SMTP (Simple Mail Transfer Protocol, Port 25/587)**: Store-and-forward protocol used exclusively to push messages between servers.
- **IMAP (Internet Message Access Protocol, Port 993)**: Bidirectional synchronization protocol. Emails remain stored on the server; changes (read status, folders, deletions) sync across all client devices.
- **POP3 (Post Office Protocol 3, Port 995)**: Downloads emails to local device and deletes them from the server (legacy model; poor for multi-device workflows).

### Anti-Spoofing & Authentication Trio: SPF, DKIM & DMARC
1. **SPF (Sender Policy Framework)**: DNS `TXT` record listing authorized IP addresses permitted to send mail for the domain (`v=spf1 ip4:198.51.100.0/24 -all`).
2. **DKIM (DomainKeys Identified Mail)**: The sending server cryptographically signs the email header with its private key; the receiving server verifies the signature using the sender's public key published in DNS.
3. **DMARC**: Specifies policy actions (`none`, `quarantine`, `reject`) if SPF or DKIM validation fails, and receives aggregate forensic abuse reports.

---

## 7. Global Internet Routing: BGP (Border Gateway Protocol)

**BGP (RFC 4271, TCP Port 179)** is the routing protocol that binds the global internet together. It is often described as the "postal system of the internet."

```
BGP Autonomous System Routing:
[ AS 15169 (Google) ] ◄──BGP Peering──► [ AS 13335 (Cloudflare) ]
          │                                      │
     BGP Peering                            BGP Peering
          ▼                                      ▼
[ AS 701 (Verizon ISP) ] ──────────────► [ AS 20940 (Akamai) ]
```

- **Autonomous Systems (AS)**: The internet consists of over 100,000 independently operated networks (ASNs) owned by ISPs, universities, and tech enterprises (e.g., AS15169 is Google).
- **Path-Vector Routing**: Instead of counting raw router hops, BGP routes packets based on network policies and the **`AS-PATH`** attribute (the sequence of ASNs a packet must traverse).
- **Loop Prevention**: If a BGP router sees its own ASN anywhere inside an advertised `AS-PATH`, it instantly drops the advertisement to prevent routing loops.
- **BGP Route Hijacking**: Occurs when an attacker or misconfigured network advertises a more specific IP prefix (e.g., `/24` instead of `/16`) that it does not own. Mitigated by **RPKI (Resource Public Key Infrastructure)** with cryptographically signed Route Origin Authorizations (ROAs).

---

## 8. Enterprise & IoT Protocols: MQTT & AMQP

<GrpcVsRestDiagram />

### MQTT — Message Queuing Telemetry Transport (TCP Port 1883 / 8883 TLS)
- **Extreme Efficiency**: 2-byte fixed header; engineered for constrained IoT sensor devices operating over high-latency cellular or satellite links.
- **Publish / Subscribe**: Devices publish telemetry to hierarchical topics (`sensors/factory_1/temp`); consumers subscribe using wildcards (`sensors/+/temp`).
- **Quality of Service (QoS)**:
  - **QoS 0**: At most once (fire-and-forget, zero persistence).
  - **QoS 1**: At least once (acknowledged delivery, duplicate risk).
  - **QoS 2**: Exactly once (4-step handshake, zero duplicates).
- **Last Will and Testament (LWT)**: Broker automatically publishes a pre-configured status message (e.g. `{"status": "offline"}`) if the client disconnects ungracefully.

### AMQP — Advanced Message Queuing Protocol (Port 5672 / 5671 TLS)
- Enterprise programmable routing implemented by **RabbitMQ**.
- Decouples message ingestion from queue storage via **Exchanges** (Direct, Fanout, Topic, Headers) and **Bindings**.

---

## 9. Comprehensive Protocol Architectural Comparison Matrix

| Protocol | OSI Layer | Default Port | Transport | Connection Model | Security | Handshake RTT | Primary Use Case |
|---|:---:|:---:|:---:|---|:---:|:---:|---|
| **TCP** | L4 | Any | IP | Connection-oriented | None | 1 RTT | Reliable byte stream, Web, DB |
| **UDP** | L4 | Any | IP | Connectionless | None | **0 RTT** | Real-time media, DNS, DHCP |
| **DNS** | L7 | 53 | UDP (TCP fallback) | Request-Response | DNSSEC / DoH | 0 RTT (UDP) | Hostname-to-IP resolution |
| **DHCP** | L7 | 67/68 | UDP Broadcast | 4-step DORA | DHCP Snooping | 0 RTT (UDP) | Dynamic network IP leasing |
| **HTTP/1.1** | L7 | 80 | TCP | Request-Response | None | 1 RTT + App | Legacy web APIs |
| **HTTPS (HTTP/2)**| L7 | 443 | TCP | Multiplexed Streams | TLS 1.2/1.3 | 2 RTTs | Modern web APIs, gRPC |
| **HTTP/3 (QUIC)** | L7/L4 | 443 | **UDP** | Multiplexed Streams | Built-in TLS 1.3 | **1 RTT / 0 RTT** | High-performance mobile web |
| **WebSocket** | L7 | 80/443 | TCP | Full-Duplex Persistent| TLS (WSS) | 2 RTTs | Real-time chat, trading feeds |
| **SSH** | L7 | 22 | TCP | Interactive Session | Built-in Crypto | 2 RTTs | Secure remote shell & tunneling |
| **SFTP** | L7 | 22 | TCP | Stream File Transfer| SSH-2 Crypto | 2 RTTs | Secure batch file transfer |
| **SMTP** | L7 | 25/587 | TCP | Store-and-Forward | STARTTLS | 1 RTT + TLS | Email transmission / relay |
| **TLS 1.3** | L5/L7 | — | TCP | Session Security | Asymmetric+AES | **1 RTT / 0 RTT** | Cryptographic wire security |
| **BGP** | L7/L3 | 179 | TCP | Peer-to-Peer Routing| MD5 / RPKI | 1 RTT + BGP | Global internet AS routing |
| **MQTT** | L7 | 1883/8883 | TCP | Pub/Sub Broker | TLS | 1 RTT + App | Low-power IoT telemetry |

---

## 10. Principal Engineering Interview Questions & Answers

### Q1. Why does DNS prefer UDP port 53 for standard queries, and when does it fall back to TCP?
> Standard DNS queries are lightweight request-response exchanges that comfortably fit within a single packet. UDP avoids the 1-RTT connection setup overhead of a TCP 3-way handshake, doubling resolution throughput. DNS falls back to TCP port 53 in two scenarios: (1) **Payloads Exceeding UDP Buffer Size**: When DNS responses exceed 512 bytes (or EDNS0 negotiated limits) — indicated by the server setting the Truncation bit (`TC=1`), prompting the client to retry over TCP; and (2) **DNS Zone Transfers (`AXFR`/`IXFR`)**: Where authoritative secondary nameservers replicate entire zone files requiring reliable, ordered TCP byte-stream delivery.

### Q2. How does HTTP/3 (QUIC) solve the Head-of-Line (HoL) blocking issue present in HTTP/2?
> HTTP/2 introduced multiplexing, allowing dozens of concurrent requests to share a single TCP connection. However, TCP is fundamentally a single sequential byte stream. If a single TCP packet is dropped on the wire, the receiver's TCP stack halts delivery of **all** multiplexed HTTP/2 streams while waiting for retransmission (TCP-level Head-of-Line blocking). QUIC solves this by running over **UDP**. QUIC implements its own stream framing where each multiplexed stream maintains independent packet sequence and offset numbers. A dropped packet on Stream 3 causes packet loss recovery only for Stream 3, while Streams 1, 2, and 4 continue processing immediately without delay.

### Q3. Explain the DORA lifecycle in DHCP and why UDP broadcast is strictly necessary.
> The DHCP lifecycle comprises four steps: **Discover**, **Offer**, **Request**, and **Acknowledge**. UDP broadcast is mandatory during the initial exchange because a newly connected client does not yet possess an IP address, does not know the network subnet mask, and has no knowledge of the DHCP server's IP. The client broadcasts `DHCPDISCOVER` from source IP `0.0.0.0:68` to destination `255.255.255.255:67`. The DHCP server reserves an IP from its pool and broadcasts `DHCPOFFER`. The client broadcasts `DHCPREQUEST` to announce its acceptance (which simultaneously notifies other DHCP servers on the subnet to release their tentative offers). Finally, the server confirms with `DHCPACK`, binding the lease.

### Q4. What is BGP Route Hijacking and how does RPKI mitigate it?
> BGP relies on trust: routers advertise IP address prefixes with their Autonomous System Number (`AS-PATH`) via TCP port 179. Routers worldwide favor the most specific route (longest prefix match, e.g., `/24` over `/16`) or the shortest `AS-PATH`. In a **BGP Hijack**, an unauthorized or misconfigured AS advertises a prefix it does not own. Surrounding networks accept the advertisement and redirect legitimate traffic to the rogue AS, causing massive outages or interception. **RPKI (Resource Public Key Infrastructure)** prevents this by creating cryptographically signed certificates called **Route Origin Authorizations (ROAs)** through Regional Internet Registries (RIRs). Border routers check ROA cryptographic validity before accepting BGP routes, rejecting invalid unauthorized origin announcements.

### Q5. What is the difference between WebSocket, Server-Sent Events (SSE), and HTTP Long Polling?
> - **HTTP Long Polling**: Client sends an HTTP request; server holds it open until data is ready, responds, and closes. High HTTP header overhead ($>500$ bytes per event) and high connection churn.
> - **Server-Sent Events (SSE)**: Unidirectional (server-to-client only) streaming over a standard persistent HTTP connection (`text/event-stream`). Built-in reconnection and event IDs; ideal for live stock prices or notifications.
> - **WebSocket**: True full-duplex, bidirectional communication over an upgraded TCP socket. Ultra-low framing overhead (2 bytes); ideal for multiplayer gaming, collaborative editors, and bidirectional low-latency financial trading platforms.

---

## Related Pages

- [OSI vs TCP/IP 5-Layer Model](./osi-tcpip-models.md)
- [TCP & UDP Transport Layer Deep Dive](./tcp-udp-transport-layer.md)
- [HTTP/1.1, HTTP/2 & HTTP/3 Application Layer](./http-https-application-layer.md)
- [QUIC & Modern Transport](./quic-modern-transport.md)
- [DNS Architecture & Resolution](./dns-resolution.md)
- [IP Addressing & BGP Routing](./ip-addressing-routing.md)
