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
import NetworkMonospaceSchemaInspector from '@site/src/components/NetworkMonospaceSchemaInspector';

# TCP, UDP & Transport Layer

## Transport Layer Role

The Transport Layer provides **process-to-process** communication across network hosts using **Port Numbers** (16-bit integers ranging from 0 to 65535). While Layer 3 (IP) routes packets between host IP addresses, Layer 4 (TCP/UDP) multiplexes traffic between specific application processes executing on those hosts.

<TransportLayerPortsDiagram />

---

## Monospace Schema Inspector: TCP & IPv4 Bitwise Packet Header

<NetworkMonospaceSchemaInspector />

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
