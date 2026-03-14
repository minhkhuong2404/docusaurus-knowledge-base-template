---
id: tcp-udp-transport-layer
title: TCP, UDP & Transport Layer
description: TCP's three-way handshake, flow control, congestion control, connection termination, and UDP — when to use each and how they work.
tags: [networking, tcp, udp, transport, handshake, flow-control, congestion, socket]
sidebar_position: 4
---

# TCP, UDP & Transport Layer

## Transport Layer Role

The transport layer provides **process-to-process** communication using **port numbers**. While IP routes packets between hosts, the transport layer routes data between specific applications on those hosts.

```
Host A (IP: 10.0.0.1)                   Host B (IP: 10.0.0.2)
┌──────────────────────┐                 ┌──────────────────────┐
│ Chrome   → port 54321│                 │ nginx    ← port 443  │
│ Slack    → port 54322│ ──── TCP/UDP ──►│ postgres ← port 5432 │
│ Zoom     → port 54323│                 │ redis    ← port 6379 │
└──────────────────────┘                 └──────────────────────┘
```

**Port ranges:**
- `0–1023`: Well-known ports (HTTP: 80, HTTPS: 443, SSH: 22, DNS: 53)
- `1024–49151`: Registered ports (PostgreSQL: 5432, MySQL: 3306)
- `49152–65535`: Ephemeral (dynamic) — assigned by OS for outgoing connections

---

## TCP — Transmission Control Protocol

TCP provides **reliable, ordered, connection-oriented** delivery.

**Key features:**
- Connection establishment / teardown (stateful)
- Guaranteed delivery (acknowledgments + retransmission)
- Ordered delivery (sequence numbers)
- Error detection (checksum)
- Flow control (receiver window)
- Congestion control (sender limits)

---

## TCP Three-Way Handshake

```
Client                        Server
  │                              │
  │──── SYN (seq=x) ────────────►│  "I want to connect, my ISN is x"
  │                              │
  │◄─── SYN-ACK (seq=y,ack=x+1)─│  "OK, my ISN is y, I got your x"
  │                              │
  │──── ACK (ack=y+1) ──────────►│  "Got it, connection established"
  │                              │
  │════════ DATA TRANSFER ═══════│
```

**ISN (Initial Sequence Number)**: random starting point for sequence numbering — prevents old duplicate packets from being accepted.

**States involved**: `CLOSED → SYN_SENT → ESTABLISHED` (client); `LISTEN → SYN_RECEIVED → ESTABLISHED` (server)

```java
// Java: TCP connection is implicit in socket creation
Socket socket = new Socket("google.com", 443);
// → triggers 3-way handshake automatically

// Server side
ServerSocket server = new ServerSocket(8080);
Socket client = server.accept();  // blocks until client connects
```

---

## TCP Segment Structure

```
 0      7 8     15 16    23 24    31
┌─────────────────┬─────────────────┐
│   Source Port   │ Destination Port │  ← 32 bits
├─────────────────┴─────────────────┤
│           Sequence Number          │  ← byte offset of first data byte
├───────────────────────────────────┤
│         Acknowledgment Number      │  ← next expected byte from sender
├──────┬──┬──┬──┬──┬──┬─────────────┤
│ Data │  │U │A │P │R │S │F│  Window │
│ Off  │  │R │C │S │S │Y │I│  Size   │
│      │  │G │K │H │T │N │N│         │
├──────┴──┴──┴──┴──┴──┴──┴──────────┤
│     Checksum     │  Urgent Pointer  │
└───────────────────────────────────┘
```

**Key flags:**
- `SYN`: synchronize sequence numbers (connection request)
- `ACK`: acknowledgment field is valid
- `FIN`: sender finished sending
- `RST`: reset / abort connection
- `PSH`: push buffered data to application immediately
- `URG`: urgent data present

---

## TCP Connection Termination — 4-Way Handshake

TCP termination is **asymmetric** — each side closes independently.

```
Client                        Server
  │                              │
  │──── FIN (seq=u) ────────────►│  "I'm done sending"
  │◄─── ACK (ack=u+1) ──────────│  "Got it"
  │                              │  ← Server may still send data (half-close)
  │◄─── FIN (seq=v) ────────────│  "I'm done sending"
  │──── ACK (ack=v+1) ──────────►│
  │                              │
  │  [TIME_WAIT: 2×MSL = ~60s]  │
```

**TIME_WAIT state**: the active closer waits `2 × MSL` (Maximum Segment Lifetime, ~30s) before closing the socket. Why?
- Ensures the last ACK reaches the server (if lost, server retransmits FIN)
- Lets duplicate packets from the old connection expire

:::tip Java/Spring Note
`TIME_WAIT` on a server with many short connections causes port exhaustion. Solutions: enable `SO_REUSEADDR`, use connection pools (HikariCP), use `keep-alive`, or tune `tcp_tw_reuse` on Linux.
:::

---

## TCP Sequence Numbers & Acknowledgments

```
Sender sends bytes 1–1000 (MSS=500):

Segment 1: seq=1,   data=[1..500]
Segment 2: seq=501, data=[501..1000]

Receiver:
  → ACK 501  (got bytes 1-500, expecting 501 next)
  → ACK 1001 (got bytes 501-1000, expecting 1001 next)

If Segment 1 lost:
  → Receiver gets seq=501, buffers it, but still sends ACK 1
  → Sender sees duplicate ACKs or timeout → retransmits seq=1
```

---

## TCP Flow Control — Sliding Window

Prevents a **fast sender from overwhelming a slow receiver**.

```
Receiver advertises: Window Size = 65535 bytes (how much buffer space available)
Sender must not have more than this many unacknowledged bytes in flight

[  Sent & ACKed  |  Sent, not ACKed  |  Can send  |  Cannot send yet  ]
                   ◄── in-flight ───►  ◄── window ─►
```

```
If receiver buffer fills up:
  → Receiver sends Window Size = 0 → "stop sending"
  → Sender pauses, sends zero-window probes periodically
  → Receiver sends Window Update when buffer drains
```

---

## TCP Congestion Control

Prevents a **sender from overwhelming the network** (not just the receiver).

### Phases

**1. Slow Start**
```
cwnd = 1 MSS (congestion window starts small)
cwnd doubles every RTT (exponential growth)
Until: cwnd reaches ssthresh (slow start threshold) OR packet loss
```

**2. Congestion Avoidance**
```
After slow start threshold:
  cwnd += 1 MSS per RTT (linear growth)
  "Additive Increase"
```

**3. Congestion Detection & Reaction**
```
Packet loss (timeout):
  ssthresh = cwnd / 2
  cwnd = 1 MSS → restart Slow Start

3 duplicate ACKs (fast retransmit):
  ssthresh = cwnd / 2
  cwnd = ssthresh → skip slow start, enter Congestion Avoidance
  "Multiplicative Decrease"
```

This is **AIMD (Additive Increase, Multiplicative Decrease)**.

### Modern Algorithms

| Algorithm | Key Innovation | Use Case |
|-----------|---------------|----------|
| **Reno** | Classic AIMD | Legacy |
| **CUBIC** | Cubic growth function | Linux default (LAN/WAN) |
| **BBR** | Bandwidth + RTT based (not loss-based) | High-BDP paths, satellite |
| **QUIC** | UDP-based, built into HTTP/3 | Modern web |

---

## TCP Options & Tuning

```
# Linux TCP tuning
# Increase socket buffer sizes for high-bandwidth links
sysctl -w net.core.rmem_max=134217728
sysctl -w net.core.wmem_max=134217728
sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# Enable TCP window scaling (default on modern kernels)
sysctl -w net.ipv4.tcp_window_scaling=1

# Selective Acknowledgment (SACK) — retransmit only lost segments
sysctl -w net.ipv4.tcp_sack=1

# Enable BBR congestion control
sysctl -w net.ipv4.tcp_congestion_control=bbr
```

---

## UDP — User Datagram Protocol

UDP provides **connectionless, unreliable, fast** delivery.

**What UDP doesn't have (vs TCP):**
- No connection setup/teardown
- No guaranteed delivery
- No ordering
- No congestion control or flow control

**What UDP has:**
- Very low overhead (8-byte header vs 20+ for TCP)
- No round trips before sending
- No retransmission delays
- Supports broadcast and multicast

```
UDP Header (8 bytes only):
┌─────────────────┬─────────────────┐
│   Source Port   │ Destination Port │
├─────────────────┼─────────────────┤
│     Length      │    Checksum     │
└─────────────────┴─────────────────┘
[  Data payload  ]
```

---

## TCP vs UDP Comparison

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Stateful (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery | Best-effort |
| Ordering | Guaranteed | Not guaranteed |
| Speed | Slower (overhead) | Faster |
| Header size | 20–60 bytes | 8 bytes |
| Flow control | Yes | No |
| Congestion control | Yes | No |
| Broadcast/Multicast | No | Yes |
| Use cases | HTTP, SSH, DB, email | DNS, video, VoIP, games |

---

## When to Use UDP

| Use Case | Why UDP |
|----------|---------|
| **DNS queries** | Single request/response; retransmit at app layer if needed |
| **Video/audio streaming** | Slightly stale frame better than delayed one |
| **VoIP / Video calls** | Real-time; packet loss tolerable, latency is not |
| **Online gaming** | Low latency critical; game state syncs frequently |
| **DHCP** | Bootstrapping; no existing connection |
| **SNMP** | Simple polling; app handles reliability |
| **QUIC / HTTP/3** | Reliability implemented in QUIC above UDP |

---

## Java Socket Programming

```java
// TCP Client
try (Socket socket = new Socket("localhost", 8080)) {
    PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
    BufferedReader in = new BufferedReader(
        new InputStreamReader(socket.getInputStream()));

    out.println("Hello, server!");
    String response = in.readLine();
    System.out.println("Server: " + response);
}

// TCP Server
try (ServerSocket server = new ServerSocket(8080)) {
    System.out.println("Listening on port 8080");
    while (true) {
        Socket client = server.accept();
        new Thread(() -> handleClient(client)).start();
    }
}

// UDP Client
try (DatagramSocket socket = new DatagramSocket()) {
    byte[] data = "Hello UDP".getBytes();
    InetAddress addr = InetAddress.getByName("localhost");
    DatagramPacket packet = new DatagramPacket(data, data.length, addr, 9090);
    socket.send(packet);

    byte[] buf = new byte[1024];
    DatagramPacket response = new DatagramPacket(buf, buf.length);
    socket.receive(response);
}
```

---

## TCP Keep-Alive

Detects broken connections when no data flows.

```bash
# Linux kernel keep-alive settings
net.ipv4.tcp_keepalive_time    = 7200   # idle before probes (seconds)
net.ipv4.tcp_keepalive_intvl   = 75     # probe interval
net.ipv4.tcp_keepalive_probes  = 9      # probes before declaring dead
```

```java
// Java socket keep-alive
socket.setKeepAlive(true);

// Spring WebClient / RestTemplate connection pool keep-alive
// (handled by HttpClient connection pool settings)
```

---

## 🎯 Interview Questions

**Q1. Describe the TCP three-way handshake.**
> Client sends SYN with its Initial Sequence Number (ISN). Server responds with SYN-ACK — acknowledging the client's ISN and sending its own ISN. Client sends ACK — acknowledging the server's ISN. After this, the connection is established and both sides have synchronized sequence numbers for reliable, ordered data transfer.

**Q2. What is the purpose of sequence numbers in TCP?**
> Sequence numbers serve three purposes: (1) ordering — the receiver can reorder out-of-order segments; (2) duplicate detection — old or retransmitted segments with already-ACKed sequence numbers are discarded; (3) reliable delivery — the sender knows which data has been received via ACK numbers, and retransmits unacknowledged data.

**Q3. What is TCP flow control vs congestion control?**
> Flow control prevents the sender from overwhelming the **receiver**'s buffer — the receiver advertises its available window size in each ACK, and the sender limits in-flight data accordingly. Congestion control prevents the sender from overwhelming the **network** — it uses algorithms (slow start, AIMD) to probe for available bandwidth without causing queue overflow at routers.

**Q4. Why does TCP have a TIME_WAIT state and what problems can it cause?**
> TIME_WAIT ensures: (1) the final ACK reaches the server (if lost, server retransmits FIN within the wait window); (2) duplicate packets from the old connection expire before a new connection on the same port pair is allowed. Problem: high-throughput servers with many short-lived connections can exhaust ephemeral ports and see `address already in use` errors. Solutions: `SO_REUSEADDR`, connection pooling, or `tcp_tw_reuse`.

**Q5. When would you choose UDP over TCP?**
> Choose UDP when: low latency is more important than perfect reliability (VoIP, gaming, real-time video); the application handles its own reliability (QUIC, DNS); data is time-sensitive and retransmission would be useless (live streaming — a retransmitted old frame arrives after newer frames); or multicast/broadcast is needed (DHCP, mDNS).

**Q6. What is TCP slow start and why does it exist?**
> Slow start is TCP's initial congestion probing phase. It starts with a small congestion window (1 MSS) and doubles it each RTT until a threshold or loss is detected. This prevents a new connection from immediately blasting traffic onto a congested network. Despite the name, exponential growth is actually fast — a 10 Gbps link can be fully utilized within a few RTTs.

**Q7. What is a SYN flood attack and how is it mitigated?**
> A SYN flood sends many SYN packets without completing the handshake, filling the server's SYN queue (half-open connections). The server allocates state for each SYN, exhausting resources. Mitigation: SYN cookies — the server encodes connection state in the ISN instead of allocating resources; validates the client with the ACK's sequence number. Also: firewall rate limiting on SYNs, shorter SYN timeout.

**Q8. What is the difference between a TCP RST and FIN?**
> FIN is a graceful close — the sender has finished sending data but the connection stays half-open; the other side can still send. RST is an abrupt abort — the connection is immediately terminated, all buffered data is discarded. RST occurs when: connecting to a closed port, a firewall drops the connection, or the application calls `socket.close()` with pending data (as opposed to `socket.shutdownOutput()` for graceful close).
