---
id: quic-modern-transport
title: QUIC & Modern Transport Protocols
description: QUIC protocol internals, HTTP/3, connection migration, 0-RTT, multiplexing without HOL blocking, and comparison with TCP+TLS.
tags: [networking, quic, http3, transport, multiplexing, 0-rtt, connection-migration, tls]
sidebar_position: 18
---

# QUIC & Modern Transport Protocols

## Why QUIC Was Built

TCP + TLS has served the internet well but has fundamental limitations:

| Problem | TCP + TLS | QUIC |
|---------|-----------|------|
| **Connection setup** | 1.5 RTT (TCP) + 1–2 RTT (TLS 1.2) = 2.5–3.5 RTT | 1 RTT first time; **0-RTT** on reconnect |
| **Head-of-line blocking** | All streams stalled by one lost packet | Each stream independent — loss only stalls that stream |
| **Mobility / roaming** | Connection tied to IP:port (reconnect on IP change) | Connection migrates to new IP automatically |
| **Protocol ossification** | TCP in kernel — hard to update (middleboxes, NAT) | QUIC runs over UDP in userspace — updatable |
| **Encryption** | TLS optional, add-on | TLS 1.3 **mandatory**, built-in to protocol |

---

## What is QUIC?

QUIC is a **multiplexed, low-latency transport protocol** built on top of UDP, with TLS 1.3 baked in. Originally developed by Google (2012), standardized by IETF as RFC 9000 (2021).

```
HTTP/1.1, HTTP/2      HTTP/3
      │                  │
    TCP                QUIC  ← userspace, updatable
      │                  │
    IP                  UDP
      │                  │
 Physical            Physical
```

---

## QUIC Connection Establishment

### First Connection — 1 RTT

```
Client                              Server
  │                                    │
  │  Initial (CRYPTO: ClientHello)     │
  │ ─────────────────────────────────► │
  │                                    │  process TLS + derive keys
  │  ◄── Initial (CRYPTO: ServerHello) │
  │  ◄── Handshake (TLS params)        │
  │  ◄── Short Header (app data)       │  server can send data already!
  │                                    │
  │  Handshake (TLS Finished)          │
  │  Short Header (app data)           │
  │ ─────────────────────────────────► │
  │                                    │
  Total: 1 RTT before client can send app data
```

### Reconnection — 0-RTT

On reconnect to a known server, the client uses a **session resumption ticket** from the previous connection to send data in the **very first packet**:

```
Client                              Server
  │                                    │
  │  Initial (0-RTT app data!)         │  ← sends data WITH the hello
  │ ─────────────────────────────────► │
  │  ◄── Short Header (response)       │
  │                                    │
  Total: 0 RTT for data (request is sent immediately!)
```

:::caution 0-RTT Replay Risk
0-RTT data can be **replayed** by an attacker who intercepts and re-sends the initial packet. Only use for **idempotent, non-sensitive** operations (e.g., GET requests). Never for payments, state-changing operations, or auth.
:::

---

## Multiplexing Without Head-of-Line Blocking

### HTTP/2 Problem

HTTP/2 multiplexes over a **single TCP connection** — but TCP treats the connection as a single byte stream. One lost packet stalls **all streams**:

```
HTTP/2 over TCP:
Stream A: [data1] [data2] [  LOST  ] [data4]  ← all streams wait!
Stream B: [data1] [          WAIT          ]
Stream C: [data1] [          WAIT          ]
```

### QUIC Solution

Each QUIC stream is **independent**. A lost packet only stalls the stream it belongs to:

```
QUIC streams:
Stream A: [data1] [data2] [  LOST  ] [data4]  ← only stream A waits
Stream B: [data1] [data2] [data3] [data4]  ✓ continues unaffected
Stream C: [data1] [data2] [data3]           ✓ continues unaffected
```

**QUIC stream types:**
- **Bidirectional streams** — both sides can send (like HTTP request/response)
- **Unidirectional streams** — one direction only (like HTTP/3 QPACK headers)

---

## Connection Migration

TCP connections are identified by **4-tuple**: `(src IP, src port, dst IP, dst port)`. If your IP changes (phone switches from Wi-Fi to 4G), the TCP connection breaks.

QUIC uses a **Connection ID** — an opaque identifier exchanged during handshake. When the client's IP changes, it sends a PATH_CHALLENGE/RESPONSE to prove ownership of the new path, then **migrates** the connection:

```
Phone on Wi-Fi:  QUIC conn-id=X over 192.168.1.10 → server
                                ↕
Phone on 4G:     QUIC conn-id=X over 10.0.0.55 → server   ← same connection!
(no TCP reset, no TLS renegotiation, no request restart)
```

---

## QUIC Packet Types

```
Long Header packets (handshake):
├── Initial         ← first packets, ClientHello/ServerHello
├── 0-RTT           ← early data
├── Handshake       ← TLS Finished, remaining handshake messages
└── Retry           ← server asks client to prove IP (anti-amplification)

Short Header packets (application data):
└── 1-RTT           ← all application data after handshake
```

---

## HTTP/3 Over QUIC

HTTP/3 is HTTP semantics (methods, headers, status codes) over QUIC instead of TCP.

```
HTTP/3 layer:
├── QPACK           ← header compression (replaces HPACK, avoids HOL blocking)
├── HTTP/3 framing  ← maps HTTP semantics to QUIC streams
└── QUIC streams    ← one stream per request/response

Each HTTP request = one QUIC bidirectional stream
```

### Key Differences from HTTP/2

| Feature | HTTP/2 | HTTP/3 |
|---------|--------|--------|
| Transport | TCP | QUIC (UDP) |
| Header compression | HPACK | QPACK |
| HOL blocking | Yes (TCP level) | No (stream-level) |
| Connection migration | No | Yes |
| 0-RTT | No | Yes |
| Setup latency | 2–3 RTT | 1 RTT (0 RTT resumption) |

---

## Alt-Svc Header — HTTP/3 Upgrade

Servers advertise HTTP/3 support via:

```http
HTTP/1.1 200 OK
Alt-Svc: h3=":443"; ma=86400

# h3 = HTTP/3 protocol token
# :443 = same host, port 443
# ma=86400 = max age (cache for 24 hours)
```

On next visit, the browser connects via QUIC/HTTP/3 to port 443.

---

## QUIC Congestion Control

QUIC doesn't use TCP's congestion control — it implements its own in userspace, enabling rapid iteration:

- **CUBIC** (default in most TCP implementations) — aggressive growth
- **BBR (Bottleneck Bandwidth and RTT)** — Google's model-based CC, better on high-latency links and networks with shallow buffers
- QUIC allows using **different CC per connection** — no kernel patch needed

```
BBR vs CUBIC:
- CUBIC: fill pipe until packet loss occurs (reactive)
- BBR: model bandwidth and RTT to find optimal operating point (proactive)
- BBR excels on long-distance / satellite links (where CUBIC is too aggressive)
```

---

## QUIC Flow Control

Two levels (unlike TCP's single level):

1. **Stream-level**: each stream has its own flow control window
2. **Connection-level**: total data in flight across all streams

```
Per-stream window:  receiver controls how much sender can send per stream
Connection window:  cap on total unacknowledged data across all streams
```

---

## QUIC Loss Detection & Recovery

QUIC uses **packet numbers** (monotonically increasing, never reused) instead of TCP's ambiguous sequence numbers. This solves the **TCP retransmission ambiguity problem**:

```
TCP problem:
  Send segment seq=100 → lost, retransmit seq=100 (same number)
  ACK 100 received — was it ACK for original or retransmit? Ambiguous RTT measurement!

QUIC fix:
  Send packet #1 → lost
  Retransmit same data in packet #5 (new number)
  ACK #5 → unambiguously new packet, accurate RTT
```

QUIC also uses **RACK** (Recent ACKnowledgement) for fast loss detection, and **ACK delay** reporting to improve RTT estimates.

---

## Practical QUIC Support

### Server Support (Java / Spring Boot)

Spring Boot does not natively support HTTP/3 server-side as of early 2025. Options:

```yaml
# Nginx (as TLS/QUIC termination layer)
server {
    listen 443 quic reuseport;
    listen 443 ssl;
    http2 on;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    add_header Alt-Svc 'h3=":443"; ma=86400';

    location / {
        proxy_pass http://spring-app:8080;
    }
}
```

```java
// Netty-based HTTP/3 (using netty-incubator-codec-http3)
// Still experimental — use nginx as QUIC frontend for Spring apps
```

### Client Support

```java
// OkHttp 5 supports HTTP/3
OkHttpClient client = new OkHttpClient.Builder()
    .protocols(List.of(Protocol.HTTP_3, Protocol.HTTP_2, Protocol.HTTP_1_1))
    .build();

// Spring WebClient via Reactor Netty — HTTP/2 supported, HTTP/3 experimental
WebClient client = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create()
            .protocol(HttpProtocol.HTTP2, HttpProtocol.HTTP11)
    ))
    .build();
```

---

## QUIC Security

- **TLS 1.3 mandatory** — no negotiation to weaker crypto possible
- **All handshake messages encrypted** (except Initial — which is encrypted but not authenticated against a known server key)
- **Connection IDs encrypted** in short-header packets (prevents linkability tracking)
- **Retry mechanism** — server can issue Retry to validate client IP (anti-amplification)
- **Stateless reset** — server can reset connections without full handshake context

---

## SCTP — Stream Control Transmission Protocol

Another modern transport protocol (RFC 4960) often compared to QUIC:

| Feature | TCP | SCTP | QUIC |
|---------|-----|------|------|
| Multi-streaming | No | Yes | Yes |
| Multi-homing | No | Yes | Partial (migration) |
| HOL blocking | Yes | Stream-level | No |
| Userspace | No | No | Yes |
| Adoption | Universal | Telecom (SS7/SIP) | Growing (Web) |

SCTP is used in telecom (Diameter, S1-AP in LTE), WebRTC's data channel (via DTLS-SCTP), and kernel — but didn't achieve broad internet adoption due to middlebox issues.

---

## 🎯 Interview Questions

**Q1. What problem does QUIC solve that HTTP/2 over TCP couldn't?**
> HTTP/2 multiplexes streams over a single TCP connection, but TCP provides one ordered byte stream. A single lost packet stalls ALL HTTP/2 streams until TCP retransmits it — head-of-line (HOL) blocking at the transport layer. QUIC implements multiplexed streams in userspace where each stream is independent: a lost UDP packet only stalls the stream it belongs to. QUIC also reduces connection setup latency (1 RTT vs 2–3 RTT for TCP+TLS) and enables connection migration.

**Q2. How does QUIC achieve 0-RTT connection establishment?**
> On the first connection, QUIC requires 1 RTT. The server sends a session ticket (like TLS session resumption). On reconnect, the client uses the cached ticket to send application data in the very first packet — 0 RTT before data flies. The trade-off: 0-RTT data is replay-vulnerable (an attacker can re-send it). It should only be used for idempotent operations (GET requests), never for mutations, payments, or auth.

**Q3. Why is QUIC built on UDP instead of TCP?**
> QUIC needs to implement its own reliability and ordering per-stream, which conflicts with TCP's single-stream reliability model. UDP provides minimal framing without interfering — QUIC builds what it needs on top. Crucially, UDP runs in userspace applications, so QUIC can be updated rapidly without kernel changes or OS upgrades — solving TCP ossification (NATs and middleboxes blocking TCP extensions for 15+ years).

**Q4. What is connection migration in QUIC and why does TCP not support it?**
> Connection migration allows a QUIC connection to survive a change in the client's IP address or port (e.g., switching from Wi-Fi to 4G). QUIC uses Connection IDs rather than the IP:port 4-tuple to identify connections. When the IP changes, the client proves ownership of the new path via PATH_CHALLENGE/RESPONSE and the connection seamlessly continues. TCP connections are fundamentally tied to their 4-tuple — any IP change breaks the connection.

**Q5. What is head-of-line blocking and at which levels does it occur?**
> HOL blocking: a later message in a queue is blocked waiting for an earlier one. It occurs at: (1) HTTP/1.1: only one request can be in flight per connection (pipelining is broken in practice). (2) HTTP/2 over TCP: one lost TCP segment stalls all HTTP/2 streams. (3) HTTP/3 over QUIC: no HOL blocking — each QUIC stream is independent. HOL blocking is a fundamental limitation of ordering constraints.

**Q6. How does QUIC's loss detection differ from TCP's?**
> TCP uses sequence numbers that are reused on retransmission, creating ambiguity — an ACK could be for the original or the retransmit, making RTT measurement inaccurate (the "retransmission ambiguity" problem). QUIC uses monotonically increasing packet numbers that are never reused — retransmitted data gets a new packet number, so ACKs are unambiguous. This gives QUIC more accurate RTT estimates and faster loss detection.

**Q7. What is the Alt-Svc header and how does HTTP/3 upgrade work?**
> `Alt-Svc` (Alternative Services) tells clients that the same content is available via a different protocol/port. A server sends `Alt-Svc: h3=":443"; ma=86400` in an HTTP/1.1 or HTTP/2 response, advertising HTTP/3 support. The browser caches this for 24 hours. On the next request, the browser attempts QUIC/HTTP/3 to port 443. Since QUIC runs over UDP, the upgrade is transparent — no TCP connection needed. Browsers also race TCP and QUIC connections (Happy Eyeballs for QUIC).

**Q8. What is BBR congestion control and how does it differ from CUBIC?**
> CUBIC (default in Linux TCP) is loss-based: it grows the congestion window aggressively until packet loss occurs, then backs off. It can cause bufferbloat and works poorly on lossy or very high-BDP links. BBR (Bottleneck Bandwidth and RTT) by Google is model-based: it estimates the link's true bottleneck bandwidth and RTT, then operates at the optimal point — sending at the bottleneck rate without overflowing buffers. BBR achieves higher throughput on long-distance and satellite links. Because QUIC is userspace, it can ship BBR or newer algorithms without OS kernel upgrades.
