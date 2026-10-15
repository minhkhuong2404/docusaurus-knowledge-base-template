---
id: tcp-udp-transport-layer
title: TCP, UDP & Transport Layer
description: TCP's three-way handshake, flow control, congestion control, connection termination, and UDP — when to use each and how they work.
tags: [networking, tcp, udp, transport, handshake, flow-control, congestion, socket]
sidebar_position: 4
---

import TransportLayerPortsDiagram from '@site/src/components/TransportLayerPortsDiagram';
import TcpHandshakesDiagram from '@site/src/components/TcpHandshakesDiagram';
import TcpSegmentAnatomyDiagram from '@site/src/components/TcpSegmentAnatomyDiagram';
import TcpFlowControlDiagram from '@site/src/components/TcpFlowControlDiagram';
import TcpCongestionControlDiagram from '@site/src/components/TcpCongestionControlDiagram';
import UdpAnatomyDiagram from '@site/src/components/UdpAnatomyDiagram';
import NetworkPacketHeaderVisualizerDiagram from '@site/src/components/NetworkPacketHeaderVisualizerDiagram';

# TCP, UDP & Transport Layer

## Transport Layer Role

The Transport Layer provides **process-to-process** communication across network hosts using **Port Numbers** (16-bit integers ranging from 0 to 65535). While Layer 3 (IP) routes packets between host IP addresses, Layer 4 (TCP/UDP) multiplexes traffic between specific application processes executing on those hosts.

<TransportLayerPortsDiagram />

---

## Bitwise TCP & IPv4 Header Architecture

<NetworkPacketHeaderVisualizerDiagram />

---

### Port Number Allocations
- **Well-Known Ports (0–1023)**: Reserved for core system services (HTTP: 80, HTTPS: 443, SSH: 22, DNS: 53).
- **Registered Ports (1024–49151)**: Reserved for application databases and services (PostgreSQL: 5432, MySQL: 3306, Redis: 6379, Kafka: 9092).
- **Ephemeral / Dynamic Ports (49152–65535)**: Assigned temporarily by the OS kernel for client-initiated outgoing connections.

---

## TCP — Transmission Control Protocol

TCP provides **reliable, ordered, stateful, connection-oriented** byte-stream delivery.

<TcpSegmentAnatomyDiagram />

### Key Features
- **3-Way Handshake Connection Establishment** (`SYN` $\to$ `SYN-ACK` $\to$ `ACK`).
- **Guaranteed Ordered Delivery**: Sequence Numbers (`seq`) and Acknowledgement Numbers (`ack`).
- **Flow Control**: Sliding Receive Window (`win`) preventing receiver buffer overrun.
- **Congestion Control**: Sender Congestion Window (`cwnd`) preventing network intermediate router queue drops.

---

## TCP 3-Way Handshake & Connection Teardown

<TcpHandshakesDiagram />

### 3-Way Handshake Sequence
1. **Client $\to$ Server (`SYN`)**: Client selects a random Initial Sequence Number (ISN $= x$) and sends a `SYN` segment (`seq=x`). Client enters `SYN_SENT`.
2. **Server $\to$ Client (`SYN-ACK`)**: Server allocates TCB (Transmission Control Block), selects its own ISN ($y$), and responds with `SYN-ACK` (`seq=y, ack=x+1`). Server enters `SYN_RECEIVED`.
3. **Client $\to$ Server (`ACK`)**: Client acknowledges with `ACK` (`seq=x+1, ack=y+1`). Both sides enter `ESTABLISHED`.

---

## TCP Flow Control (Sliding Window) vs Congestion Control

<TcpFlowControlDiagram />

<TcpCongestionControlDiagram />

- **Flow Control**: Governed by the receiver's **Advertised Window Size** (`rwnd`), preventing a fast sender from flooding a slow receiver's socket buffer.
- **Congestion Control**: Governed by the sender's **Congestion Window** (`cwnd`), probing network link capacity using algorithms like **Slow Start**, **Congestion Avoidance (AIMD)**, **CUBIC**, and **Google BBR**.

---

## UDP — User Datagram Protocol

<UdpAnatomyDiagram />

UDP provides **connectionless, unreliable, low-latency, datagram** delivery.

- **8-Byte Fixed Header**: Contains Source Port, Destination Port, Length, and Checksum.
- **No Handshake / No Retransmissions**: Minimal overhead, supporting broadcast and multicast.

---

## TCP vs UDP: Choosing and Where WebSockets Fit

| Need | TCP | UDP |
|---|---|---|
| Delivery | Reliable, ordered | Best effort, may drop or reorder |
| Setup cost | 3-way handshake (1 RTT) | None |
| Overhead | 20+ byte header, state per connection | 8 byte header, stateless |
| Typical use | Web, APIs, databases, file transfer | DNS, DHCP, VoIP, live video, games, QUIC |
| Failure behaviour | Retransmits, so latency spikes on loss (head-of-line blocking) | Application decides: ignore or retry |

- Use **UDP** when a late packet is worthless (a voice sample), or when you build your own reliability. **QUIC** does exactly this, so HTTP/3 avoids TCP head-of-line blocking.
- **WebSocket** is not a separate transport. It starts as an HTTP request with `Upgrade: websocket`, the server answers `101 Switching Protocols`, and the same TCP connection then carries full-duplex frames. It gives the server a push channel without repeated HTTP polling.
- Stateful long-lived connections change operations: load balancers need idle timeouts above your heartbeat interval, deploys need connection draining, and each server has a file-descriptor and memory limit per connection.
- A connection is identified by the 4-tuple (source IP, source port, destination IP, destination port). A client can open about 28k to 64k connections to one destination IP:port before exhausting its ephemeral ports.

---

## TCP State Machine and Connection-Leak Diagnosis

| State | Meaning | Production signal |
|---|---|---|
| `LISTEN` | Server socket waiting for SYN | Check `Recv-Q` with `ss -lnt`: it is the accept queue depth |
| `SYN_RECV` | Got SYN, sent SYN-ACK | Many of these means a SYN flood or a slow client network |
| `ESTABLISHED` | Data flows | Normal |
| `FIN_WAIT_1/2` | We sent FIN and wait for the peer's ACK/FIN | `FIN_WAIT_2` orphans are reaped after `tcp_fin_timeout` (60 s) |
| `CLOSE_WAIT` | Peer sent FIN, **our app has not called `close()`** | Growing count is an application **socket leak**, not a kernel problem |
| `LAST_ACK` | We closed after the peer and wait for the final ACK | Transient |
| `TIME_WAIT` | We closed first and wait 2 x MSL | Normal. It sits on the **active closer**, usually the client or the proxy |

Rule: thousands of `TIME_WAIT` usually means short-lived connections (fix with keep-alive or pooling). Thousands of `CLOSE_WAIT` means a leak (fix the code that forgot to close).

```bash
ss -tan state close-wait | wc -l          # leak suspects
ss -tnp state close-wait | head           # which process owns them
ss -lnt                                    # Recv-Q/Send-Q on LISTEN = accept queue depth / limit
```

---

## How TCP Achieves Reliability

- **Sequence numbers count bytes**, and ACKs are **cumulative** (`ack=N` means every byte before N arrived).
- **Retransmission timeout (RTO)** is derived from smoothed RTT: `RTO = SRTT + 4 x RTTVAR`, with a Linux floor of 200 ms and **exponential backoff** (doubling per retry). A lost tail packet can therefore stall a request for hundreds of milliseconds.
- **Fast retransmit:** 3 duplicate ACKs trigger a resend without waiting for the RTO. **SACK** tells the sender exactly which ranges arrived, so only the holes are resent.
- **Head-of-line blocking:** TCP delivers bytes in order, so one lost segment holds back everything after it, even data that already arrived. This is why HTTP/2 over a lossy link suffers and why QUIC uses independent streams.
- Each loss event also cuts `cwnd` (multiplicatively in CUBIC, model-based in BBR), so loss costs both a delay and throughput.

---

## MTU, MSS and Path MTU Discovery

- Ethernet MTU is 1500 bytes. The TCP **MSS** is MTU minus 40 bytes of IPv4 + TCP headers, so 1460 bytes. It is negotiated in the SYN options.
- **PMTUD:** senders set the DF (Don't Fragment) bit. A router that cannot forward the packet returns ICMP "Fragmentation Needed", and the sender lowers its segment size.
- **PMTU blackhole:** if a firewall drops all ICMP, the large packets vanish silently. Symptom: the TCP handshake and small requests work, but large responses or uploads hang. Fix: allow ICMP type 3 code 4 (and ICMPv6 Packet Too Big), or **clamp MSS** on the tunnel or gateway.
- Overlays shrink the usable MTU (VXLAN about 1450, WireGuard about 1420, IPsec varies), so set the pod or interface MTU accordingly. See [Troubleshooting Tools](./network-troubleshooting-tools.md) for the `ping -M do -s` test.

---

## Latency Traps: Nagle, Delayed ACK and Keepalive

- **Nagle's algorithm** holds small writes until the previous data is ACKed. Combined with the receiver's **delayed ACK** (up to about 40 ms), a write-write-read pattern can stall about 40 ms per request. For request/response protocols, set `TCP_NODELAY` and batch your own writes.
- **Keepalive** defaults on Linux are very slow: first probe after 7200 s idle, then every 75 s, 9 times. Load balancers and NAT devices drop idle flows much sooner (for example an AWS ALB idle timeout is 60 s by default). Set application heartbeats or keepalive **below** the shortest idle timeout on the path.
- **RST vs FIN:** FIN is a graceful half-close. An RST aborts immediately and discards buffered data. Java's `Connection reset` means an RST arrived, typically because the peer or a middlebox dropped the connection (idle timeout, closed port, crash).
- **Listen backlog:** an incomplete handshake sits in the SYN queue (`tcp_max_syn_backlog`), and a completed one waits in the accept queue (`min(backlog, somaxconn)`). If the app accepts too slowly, the accept queue overflows and connections are dropped or retried. Watch `ss -lnt` and `nstat -az TcpExtListenOverflows`.

```java
import java.io.*;
import java.net.*;

public final class TunedClient {
    public static void main(String[] args) throws IOException {
        try (Socket s = new Socket()) {
            s.setTcpNoDelay(true);        // disable Nagle for request/response traffic
            s.setKeepAlive(true);         // lets the OS probe dead peers
            s.connect(new InetSocketAddress("example.com", 443), 3_000); // connect timeout
            s.setSoTimeout(5_000);        // read timeout, never block forever
            try (OutputStream out = s.getOutputStream()) {
                out.write("ping".getBytes());
                out.flush();
            }
        }
    }
}
```

> [!WARNING]
> A socket with no connect or read timeout can hang a thread forever when the peer disappears without sending FIN or RST (for example a cable pull or a dropped NAT entry). This is a classic cause of exhausted thread pools.

---

## UDP Production Notes

- Maximum UDP payload is 65,507 bytes over IPv4, but anything above the path MTU (about 1472 bytes of payload) gets IP-fragmented, and one lost fragment loses the whole datagram. Keep datagrams below about 1200 bytes to be safe (the QUIC minimum).
- UDP has **no congestion control**, so high-rate senders must implement their own or they can starve TCP flows and be dropped by the network.
- **Amplification attacks:** a small spoofed-source query (DNS, NTP, memcached) triggers a large reply to the victim. Mitigate with response rate limiting, BCP 38 ingress filtering, and never exposing UDP services publicly without need.
- Packet loss is invisible to the sender, so measure it with sequence numbers at the application layer.

---

## Interview Questions

### Q1. Describe the step-by-step mechanics of the TCP 3-Way Handshake.
> The client sends a `SYN` segment containing a random Initial Sequence Number (ISN $= x$). The server receives the `SYN`, allocates connection state buffers, and responds with `SYN-ACK` containing its own ISN ($y$) and acknowledgement number $x+1$. The client finishes by sending an `ACK` segment with acknowledgement number $y+1$. Both sides enter the `ESTABLISHED` state, synchronizing sequence numbers for ordered, reliable byte-stream transmission.

### Q2. What is the fundamental difference between TCP Flow Control and TCP Congestion Control?
> **Flow Control** prevents a fast sender from overwhelming a slow **receiver's application buffer**. The receiver advertises its remaining free buffer capacity (Receive Window `rwnd`) in every ACK header. **Congestion Control** prevents a sender from overwhelming the **intermediate network infrastructure** (routers, switches). The sender dynamically adjusts its Congestion Window (`cwnd`) based on network loss or RTT latency feedback.

### Q3. Why does TCP require a `TIME_WAIT` state during connection termination?
> When a TCP connection is closed gracefully by initiating a `FIN`, the closer enters `TIME_WAIT` for $2 \times \text{MSL}$ (Maximum Segment Lifetime, typically $60\text{ seconds}$). This guarantees that: (1) The final `ACK` sent to the peer is delivered (or re-sent if lost); (2) Any lingering duplicate packets from the old connection expire in the network before a new connection reuses the same 4-tuple (`Source IP`, `Source Port`, `Dest IP`, `Dest Port`).

### Q4. What is a SYN Flood attack and how do SYN Cookies mitigate it?
> A SYN Flood is a Denial-of-Service attack where an attacker sends thousands of `SYN` requests with spoofed IP addresses without completing the final `ACK`. This exhausts the server's SYN Backlog Queue. **SYN Cookies** eliminate the attack by removing server-side memory allocations for half-open connections: the server encodes state into the initial sequence number (`seq=y`) returned in the `SYN-ACK`. Memory is allocated only when the client returns a valid `ACK`.

---

## See Also

- [HTTP & HTTPS Application Layer](./http-https-application-layer.md)
- [QUIC & Modern Transport Protocols](./quic-modern-transport.md)
- [OSI & TCP/IP Reference Models](./osi-tcpip-models.md)
