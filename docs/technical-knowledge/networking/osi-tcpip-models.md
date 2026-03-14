---
id: osi-tcpip-models
title: OSI & TCP/IP Models
description: The OSI 7-layer model and TCP/IP 4-layer model — each layer's role, protocols, and how data encapsulation works end-to-end.
tags: [networking, osi, tcpip, layers, encapsulation, protocols]
sidebar_position: 2
---

# OSI & TCP/IP Models

## Why Layered Models?

Layered models divide the complex problem of network communication into **independent, well-defined responsibilities**. Each layer:
- Provides services to the layer above
- Consumes services from the layer below
- Communicates with its peer layer on the remote host via a **protocol**

Benefits: modular design, interoperability, easier troubleshooting.

---

## The OSI Model (7 Layers)

```
Host A                                           Host B
┌─────────────────────┐                 ┌─────────────────────┐
│ 7 │ Application     │◄── HTTP, DNS ──►│ 7 │ Application     │
│ 6 │ Presentation    │◄── TLS, MIME ──►│ 6 │ Presentation    │
│ 5 │ Session         │◄── TLS session ►│ 5 │ Session         │
│ 4 │ Transport       │◄── TCP/UDP ─────►│ 4 │ Transport       │
│ 3 │ Network         │◄── IP, ICMP ────►│ 3 │ Network         │
│ 2 │ Data Link       │◄── Ethernet ────►│ 2 │ Data Link       │
│ 1 │ Physical        │◄── Bits/wire ───►│ 1 │ Physical        │
└─────────────────────┘                 └─────────────────────┘
```

### Layer 1 — Physical

Raw bit transmission over a physical medium.

- **What it does**: converts digital bits to electrical signals, light pulses, or radio waves
- **Examples**: Ethernet cable (Cat6), fiber optic, Wi-Fi radio, USB
- **Devices**: hubs, repeaters, network interface cards (NIC)
- **Units**: bits

### Layer 2 — Data Link

Reliable node-to-node delivery on the **same network segment**.

- **What it does**: framing, MAC addressing, error detection (CRC), flow control on a LAN
- **Sublayers**: LLC (Logical Link Control), MAC (Media Access Control)
- **Protocols**: Ethernet (IEEE 802.3), Wi-Fi (IEEE 802.11), PPP, ARP
- **Devices**: switches, bridges
- **Units**: frames
- **Address type**: MAC address (48-bit hardware address, e.g. `00:1A:2B:3C:4D:5E`)

### Layer 3 — Network

End-to-end delivery across **multiple networks** (routing).

- **What it does**: logical addressing (IP), routing, fragmentation, path determination
- **Protocols**: IPv4, IPv6, ICMP, OSPF, BGP, IGMP
- **Devices**: routers, layer-3 switches
- **Units**: packets
- **Address type**: IP address

### Layer 4 — Transport

**End-to-end** communication between processes on hosts.

- **What it does**: segmentation, reassembly, port addressing, error recovery (TCP), multiplexing
- **Protocols**: TCP (reliable), UDP (unreliable), SCTP
- **Units**: segments (TCP) / datagrams (UDP)
- **Address type**: port numbers (0–65535)

### Layer 5 — Session

Manages **sessions** (dialogues) between applications.

- **What it does**: establishes, maintains, and terminates sessions; checkpointing; synchronization
- **Protocols**: RPC, NetBIOS, PPTP
- **Often merged with Layer 6/7 in practice**

### Layer 6 — Presentation

Data **translation, encryption, and compression**.

- **What it does**: converts data formats (encoding), handles encryption/decryption, compression
- **Examples**: TLS/SSL encryption, JPEG, ASCII↔Unicode, gzip
- **Often handled at the application layer in TCP/IP model**

### Layer 7 — Application

**User-facing protocols** and services.

- **What it does**: provides network services to end-user applications
- **Protocols**: HTTP/HTTPS, DNS, FTP, SMTP, SSH, WebSocket, gRPC
- **Units**: messages / data

---

## TCP/IP Model (4 Layers)

The practical model used on the actual internet:

```
TCP/IP Layer         OSI Equivalent       Protocols
──────────────────── ──────────────────── ──────────────────────────────
Application          5 + 6 + 7            HTTP, HTTPS, DNS, FTP, SMTP, SSH
Transport            4                    TCP, UDP, SCTP
Internet             3                    IP (v4/v6), ICMP, ARP
Network Access       1 + 2                Ethernet, Wi-Fi, PPP
```

---

## Data Encapsulation

As data travels **down** the stack (sending), each layer adds its own **header** (and sometimes trailer). This is called **encapsulation**.

```
Application:   [  HTTP Request Data  ]
Transport:     [TCP Header][  HTTP Data  ]               ← segment
Network:       [IP Header][TCP Header][  Data  ]         ← packet
Data Link:     [ETH Header][IP][TCP][Data][ETH Trailer]  ← frame
Physical:      010101001110...                           ← bits
```

On the **receiving** side, each layer **strips** its header and passes data up — called **de-encapsulation**.

---

## PDU Names Per Layer

| Layer | Protocol Data Unit (PDU) |
|-------|--------------------------|
| Application | Message / Data |
| Transport | Segment (TCP) / Datagram (UDP) |
| Network | Packet |
| Data Link | Frame |
| Physical | Bit |

---

## ARP — Address Resolution Protocol

ARP bridges Layer 3 (IP) and Layer 2 (MAC). When a host knows the IP address of the destination but needs its MAC address to send a frame:

```
Host A wants to reach 192.168.1.10:

1. A broadcasts: "Who has 192.168.1.10? Tell 192.168.1.1"
   Destination MAC: FF:FF:FF:FF:FF:FF (broadcast)

2. Host B replies: "192.168.1.10 is at AA:BB:CC:DD:EE:FF"
   (unicast reply)

3. A caches the mapping: 192.168.1.10 → AA:BB:CC:DD:EE:FF
   ARP cache entry (expires after ~20 minutes)
```

```bash
# View ARP cache
arp -a
ip neigh show
```

---

## ICMP — Internet Control Message Protocol

ICMP is a Layer 3 protocol used for **network diagnostics and error reporting** (not data transfer).

| Message Type | Use |
|-------------|-----|
| Echo Request / Reply | `ping` — test reachability |
| Destination Unreachable | Port closed, host unreachable |
| Time Exceeded | TTL expired (used by `traceroute`) |
| Redirect | Better route available |

```bash
# ping: sends ICMP Echo Requests
ping google.com

# traceroute: exploits TTL expiry to map the route
traceroute google.com   # Linux
tracert google.com      # Windows
```

**TTL (Time To Live)**: decremented by 1 at each router hop. When it reaches 0, the router drops the packet and sends back ICMP "Time Exceeded" → prevents infinite routing loops.

---

## Network Devices by Layer

| Device | Layer | Function |
|--------|-------|----------|
| Hub | 1 (Physical) | Broadcasts all traffic to all ports |
| Switch | 2 (Data Link) | Forwards frames based on MAC table |
| Router | 3 (Network) | Routes packets between networks via IP |
| Firewall | 3–7 | Filters traffic by rules |
| Load Balancer | 4–7 | Distributes traffic to backend servers |
| Gateway | All | Protocol translation between networks |

---

## Practical Troubleshooting by Layer

```
Problem: Can't reach website
  ↓
Layer 1: Is cable plugged in? Is Wi-Fi connected?   → ifconfig / ip link
  ↓
Layer 2: Can I reach the default gateway?            → arp -a, ping gateway
  ↓
Layer 3: Can I ping the destination IP?              → ping 8.8.8.8
         Is routing working?                         → traceroute 8.8.8.8
  ↓
Layer 4: Is the port open on the server?             → telnet host 80
                                                       nc -zv host 80
  ↓
Layer 7: Is the HTTP response correct?               → curl -v http://host
         Is DNS resolving correctly?                 → nslookup domain
                                                       dig domain
```

---

## 🎯 Interview Questions

**Q1. What is the OSI model and why does it exist?**
> The OSI (Open Systems Interconnection) model is a conceptual 7-layer framework that standardizes how different systems communicate over a network. It exists to enable interoperability between different vendors' hardware and software by defining clear interfaces between layers. Each layer has a specific responsibility, making design and troubleshooting modular.

**Q2. What is the difference between the OSI model and the TCP/IP model?**
> OSI has 7 layers (Physical, Data Link, Network, Transport, Session, Presentation, Application) and is a theoretical reference model. TCP/IP has 4 layers (Network Access, Internet, Transport, Application) and is the practical model the internet actually uses — it merges OSI's top 3 layers into Application and bottom 2 into Network Access.

**Q3. What happens at each layer when you type `https://google.com` in a browser?**
> Application: browser constructs HTTP GET request, DNS resolves domain to IP. Transport: TCP connection established (3-way handshake), TLS handshake, request sent in segments. Network: IP packets routed from your machine to Google's servers through multiple routers. Data Link: at each hop, Ethernet frames carry the IP packet with new source/destination MACs. Physical: bits are transmitted over the wire/radio at each hop.

**Q4. What is ARP and why is it needed?**
> ARP (Address Resolution Protocol) maps a known IP address to an unknown MAC address on the same LAN. Ethernet frames need a destination MAC address; routers use IP to route between networks but need MAC for the final hop. ARP broadcasts "who has IP X?" on the local segment and the target responds with its MAC. Results are cached in the ARP table.

**Q5. What is the difference between a hub, switch, and router?**
> Hub (Layer 1): dumb repeater — broadcasts every frame to all ports; creates one large collision domain. Switch (Layer 2): learns MAC-to-port mappings and forwards frames only to the correct port; each port is its own collision domain. Router (Layer 3): forwards packets between different IP networks using a routing table; connects LANs to WANs.

**Q6. What is encapsulation in networking?**
> Encapsulation is the process of adding protocol headers (and sometimes trailers) as data passes down the layers of the network stack. At each layer, the current layer's header is prepended, wrapping the upper layer's data. The resulting PDU at each layer has a different name: data → segment → packet → frame → bits. The receiver reverses this by stripping headers as data moves up.

**Q7. What is TTL and what would happen if it didn't exist?**
> TTL (Time To Live) is a field in the IP header decremented by 1 at each router hop. When it reaches 0, the packet is dropped and an ICMP "Time Exceeded" is sent back. Without TTL, misrouted or loops-causing packets would circulate indefinitely, consuming network bandwidth forever. `traceroute` exploits TTL by sending packets with increasing TTL (1, 2, 3...) to map each hop.

**Q8. At which OSI layer do TLS/SSL operate?**
> TLS operates primarily at OSI Layer 6 (Presentation) in terms of its function (encryption/decryption and format translation), but in the TCP/IP model it's considered part of the Application layer and sits between the Application and Transport layers. TLS uses TCP (Layer 4) as its transport and wraps application-layer protocols like HTTP to create HTTPS.
