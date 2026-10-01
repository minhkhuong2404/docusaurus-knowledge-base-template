---
id: proxies-nat-firewalls
title: Proxies, Firewalls, NAT & VPNs
description: Deep dive into network middleboxes, forward and reverse proxies, Linux Netfilter hooks, conntrack state machine, WireGuard vs IPsec VPN encapsulation, and MSS clamping.
tags: [networking, proxy, reverse-proxy, firewall, iptables, nftables, vpn, wireguard, ipsec, conntrack]
sidebar_position: 9
---

import ProxiesNatFirewallsDiagram from '@site/src/components/ProxiesNatFirewallsDiagram';
import NatTraversalDiagram from '@site/src/components/NatTraversalDiagram';

# Proxies, Firewalls, NAT & VPNs

In modern distributed cloud infrastructure, traffic rarely flows point-to-point without encountering middleboxes. Between the client device and the backend container runtime, packets traverse **reverse proxies** (Envoy, NGINX), **stateful firewalls** (Linux Netfilter/conntrack, eBPF XDP), **NAT gateways** (AWS NAT Gateway, Linux iptables MASQUERADE), and **encrypted overlay tunnels** (WireGuard, IPsec).

Understanding the physical mechanics of connection decoupling, packet mangling, kernel state tracking, and encapsulation overhead is vital for preventing production outages like MTU blackholes, conntrack table exhaustion, and proxy IP spoofing.

---

## Interactive Middlebox & Packet Traversal Visualizer

Explore proxy connection decoupling, Linux Netfilter hook packet processing, and VPN TUN encapsulation with MSS clamping:

<ProxiesNatFirewallsDiagram />

---

## 1. Proxies: Forward, Reverse, Transparent & SOCKS5

At the transport and application layers, a proxy terminates an inbound network connection and establishes an independent outbound network connection on behalf of a participant.

```
+---------------+        Connection 1 (FD #4)       +-------------------+        Connection 2 (FD #9)       +-------------------+
|    Client     | --------------------------------> |   Proxy Engine    | --------------------------------> |    Destination    |
| (192.168.1.5) |  SYN, ACK, TLS Handshake, HTTP    | (Envoy / Squid)   |  Independent TCP Handshake, HTTP  | (203.0.113.50)    |
+---------------+                                   +-------------------+                                   +-------------------+
```

### Connection Decoupling Mechanics

Unlike a router or switch that forwards packets hop-by-hop at Layer 2 or Layer 3, an application proxy operates as **two independent user-space TCP sockets**:
1. **Client-Facing Socket (`client_fd`)**: The proxy accepts the client's TCP handshake and terminates the client's TLS session.
2. **Upstream-Facing Socket (`upstream_fd`)**: The proxy maintains a connection pool of pre-warmed, keep-alive TCP/TLS connections to backend microservices.
3. **Event Loop (`epoll` / `kqueue`)**: When `client_fd` becomes readable (`EPOLLIN`), the proxy reads the payload into userspace memory buffers (`sk_buff` $\to$ userspace), inspects/modifies headers (e.g. injecting tracing IDs or stripping hop-by-hop headers), and writes the modified payload to `upstream_fd` (`EPOLLOUT`).

This physical socket decoupling isolates backends from slow client links (mitigating Slowloris DDoS attacks) and enables protocol translation (e.g. HTTP/2 or HTTP/3 multiplexing on the frontend translated to HTTP/1.1 or gRPC over persistent HTTP/2 on the backend).

---

### Proxy Topologies Compared

| Dimension | Forward Proxy | Reverse Proxy | SOCKS5 Proxy (RFC 1928) |
|---|---|---|---|
| **Whose Interests It Serves** | **Clients** (egress control) | **Servers** (ingress gateway) | **Client / Application** (circuit relay) |
| **Client Awareness** | Explicitly configured (or transparent intercept) | Client believes proxy is the origin | Explicitly configured in client app |
| **OSI Layer** | Layer 7 (HTTP/HTTPS) | Layer 7 (HTTP/gRPC/WebSocket) | Layer 5 (Session / Transport Relay) |
| **Destination Visibility** | Destination is public internet | Destination is private backend cluster | Destination can be IP or FQDN |
| **DNS Resolution Site** | Proxy resolves target DNS (HTTP CONNECT) | Public DNS resolves to Proxy VIP | Proxy resolves DNS if SOCKS5a (ATYP `0x03`) |
| **Typical Engines** | Squid, Zscaler, Envoy Egress | Envoy, NGINX, HAProxy, AWS ALB | Shadowsocks, Dante, Tor Onion Proxy |

---

### HTTP CONNECT Tunneling vs Transparent Interception

When a client uses a forward proxy to reach an HTTPS website (`https://api.stripe.com`), the payload is TLS-encrypted. A forward proxy cannot read the HTTP request URI without executing a Man-in-the-Middle (MITM) attack using a custom enterprise Root CA certificate. Instead, it uses **HTTP CONNECT tunneling** (RFC 9110):

```http
// 1. Client initiates TCP connection to proxy (e.g. 10.0.0.1:8080) and sends:
CONNECT api.stripe.com:443 HTTP/1.1
Host: api.stripe.com:443
Proxy-Connection: keep-alive

// 2. Proxy initiates outbound TCP handshake to api.stripe.com:443
// 3. Proxy replies to client:
HTTP/1.1 200 Connection Established

// 4. Client starts TLS ClientHello directly through the proxy.
// The proxy acts as a blind byte-copying conduit between the two sockets.
```

#### Transparent Proxying via Linux TPROXY
In corporate environments or service mesh sidecars (Istio without iptables REDIRECT), traffic is intercepted transparently without client proxy configuration. Instead of rewriting the destination IP to `127.0.0.1` (which loses the original destination), modern proxies use the Linux `IP_TRANSPARENT` socket option (`TPROXY`):

```bash
# Mark packets destined for outside and direct to local proxy without NAT rewriting
iptables -t mangle -A PREROUTING -p tcp -m socket -j ACCEPT
iptables -t mangle -A PREROUTING -p tcp --dport 80 -j TPROXY \
         --tproxy-mark 0x1/0x1 --on-port 15001 --on-ip 127.0.0.1
```

---

### Header Spoofing & Forwarded Header Security

When a reverse proxy forwards an HTTP request to an internal application, the application's TCP socket sees the **proxy's IP address** as `remote_addr`. To communicate the client's original IP, proxies append headers:
- De-facto standard: `X-Forwarded-For: <client>, <proxy1>, <proxy2>`
- RFC 7239 standard: `Forwarded: for=198.51.100.25;proto=https;host=api.example.com`

#### The Leftmost IP Spoofing Vulnerability
A common security flaw occurs when applications or rate-limiters parse the **first (leftmost) IP** in `X-Forwarded-For`:

```http
GET /admin/dashboard HTTP/1.1
Host: example.com
X-Forwarded-For: 127.0.0.1
```

If an attacker injects `X-Forwarded-For: 127.0.0.1`, a naive reverse proxy might append the client's real public IP, resulting in:
```http
X-Forwarded-For: 127.0.0.1, 198.51.100.25
```
If backend authentication bypasses IP checks for `127.0.0.1` by taking `header.split(",")[0]`, the attacker gains unauthorized access!

#### Production Solution: Trusted Proxy Resolution
To securely resolve client IPs, walk the `X-Forwarded-For` chain **from right to left**, stripping off IPs that belong to your trusted proxy CIDR blocks. The first IP that is **not** in your trusted proxy list is the authentic client IP.

```nginx
# NGINX Real IP Module Configuration
set_real_ip_from 10.0.0.0/8;       # Internal AWS ALB / VPC CIDR
set_real_ip_from 172.16.0.0/12;
real_ip_header X-Forwarded-For;
real_ip_recursive on;               # Recursively search from right to left
```

```yaml
# Spring Boot application.yml
server:
  forward-headers-strategy: NATIVE  # Uses RFC 7239 / Tomcat RemoteIpValve
  tomcat:
    remoteip:
      internal-proxies: "10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}"
```

---

## 2. Stateful Firewalls & Linux Netfilter / Conntrack

A packet filter inspects packets in isolation (stateless). A **stateful firewall** maintains an in-memory session table (`conntrack`) tracking the full lifecycle of Layer 4 connections.

### Netfilter 5-Hook Architecture

The Linux kernel processes all network packets through five deterministic Netfilter hooks:

```
                          [ Incoming Packet from NIC ]
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   PREROUTING    │  (raw, conntrack, DNAT, mangle)
                              └────────┬────────┘
                                       │
                              [ Routing Decision ]
                                ╱               ╲
     Destination = Local IP    ╱                 ╲   Destination = External IP
                              ▼                   ▼
                     ┌─────────────────┐ ┌─────────────────┐
                     │      INPUT      │ │     FORWARD     │  (mangle, filter)
                     └────────┬────────┘ └────────┬────────┘
                              │                   │
                     [ Local Process ]            │
                              │                   │
                              ▼                   │
                     ┌─────────────────┐          │
                     │     OUTPUT      │          │  (raw, conntrack, mangle, DNAT, filter)
                     └────────┬────────┘          │
                              │                   │
                              └────────┬──────────┘
                                       │
                              [ Routing Decision ]
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   POSTROUTING   │  (mangle, SNAT / MASQUERADE)
                              └────────┬────────┘
                                       │
                          [ Outgoing Packet to NIC ]
```

### Table Priority Order
Inside each hook, tables execute in strict numerical priority order:
1. **`raw` (Priority -300)**: Used exclusively for setting the `NOTRACK` flag to bypass connection tracking.
2. **`mangle` (Priority -150)**: Modifies IP header fields (TOS, TTL, TCP MSS clamping).
3. **`nat` (DNAT, Priority -100)**: Rewrites destination IP/port before routing (e.g. K8s Service NodePort).
4. **`filter` (Priority 0)**: Decides whether to `ACCEPT`, `DROP`, or `REJECT` packets.
5. **`security` (Priority 50)**: Used for SELinux / AppArmor socket labeling.
6. **`nat` (SNAT, Priority 100)**: Rewrites source IP/port after routing (e.g. MASQUERADE).

---

### The `conntrack` Subsystem

The connection tracking subsystem (`nf_conntrack`) maintains a hash table in kernel memory storing `struct nf_conn` entries indexed by a 5-tuple:
$$\text{Tuple} = (\text{Src IP}, \text{Src Port}, \text{Dst IP}, \text{Dst Port}, \text{Protocol})$$

```
+---------------------------------------------------------------------------------------+
|                               struct nf_conn (Kernel Entry)                           |
+---------------------------------------------------------------------------------------+
|  ORIGINAL Tuple: 192.168.1.50:52410 -> 203.0.113.10:443 (TCP)                         |
|  REPLY Tuple:    203.0.113.10:443   -> 192.168.1.50:52410 (TCP)                       |
|  State:          TCP_CONNTRACK_ESTABLISHED                                            |
|  Timeout:        431998 seconds (~5 days)                                             |
|  NAT Mappings:   SNAT to 198.51.100.4:12891                                           |
+---------------------------------------------------------------------------------------+
```

#### Connection Tracking States
- **`NEW`**: A packet initiating a connection (e.g. TCP SYN with no matching tuple in table).
- **`ESTABLISHED`**: Two-way traffic observed (TCP SYN-ACK received and ACK returned). Return traffic matching this tuple is automatically permitted without explicit ingress rules.
- **`RELATED`**: A secondary connection associated with an established flow (e.g. FTP active mode data channels on port 20, SIP audio streams, or ICMP "Port Unreachable" error packets referencing an existing UDP flow).
- **`INVALID`**: Packets that do not conform to expected TCP sequence numbers, out-of-window segments, or malformed headers. Dropped immediately.

---

### Production Gotcha: `nf_conntrack: table full, dropping packet`

Under high concurrency (e.g. 50,000 requests/second on a Kubernetes node or during a SYN flood DDoS attack), the conntrack table fills up. When the number of active entries exceeds `nf_conntrack_max`, the kernel executes:

```text
[72419.124102] nf_conntrack: table full, dropping packet
```

Every new connection is dropped silently at the driver level, causing catastrophic cluster-wide timeouts even when CPU and memory are at 10% utilization!

#### Mathematical Sizing & Tuning

```bash
# Calculate ideal hash size and max entries
# Formula: nf_conntrack_max = hashsize * 8
# Memory cost per entry: ~320 bytes

# View current usage and limit:
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max

# Tune via sysctl (/etc/sysctl.d/99-conntrack.conf):
net.netfilter.nf_conntrack_max = 1048576
net.netfilter.nf_conntrack_buckets = 262144
net.netfilter.nf_conntrack_tcp_timeout_established = 86400  # Lower from 5 days to 24h
net.netfilter.nf_conntrack_tcp_timeout_close_wait = 60
```

#### High-Performance Bypass: NOTRACK & eBPF XDP
For load balancers or edge nodes serving stateless high-throughput traffic, bypass conntrack entirely:

```bash
# Raw table bypass:
iptables -t raw -A PREROUTING -p tcp --dport 80 -j NOTRACK
iptables -t raw -A PREROUTING -p tcp --dport 443 -j NOTRACK
```

Or deploy an **eBPF XDP** (eXpress Data Path) program attached to the network driver. XDP runs before the kernel allocates the socket buffer `sk_buff` or invokes Netfilter, enabling packet filtering at wire rate (>20 million packets/sec).

---

## 3. Virtual Private Networks (VPNs): Architecture & Internals

A VPN securely extends a private network across a public network by **encapsulating** inner packets inside outer encrypted transport packets.

### TUN vs TAP Virtual Devices

Linux provides virtual network devices via the `/dev/net/tun` kernel driver:
- **TUN (Network TUNnel - Layer 3)**: Operates on raw IP packets. It does not carry Ethernet frame headers (no MAC addresses, no ARP, no 802.1Q VLAN tags). WireGuard and OpenVPN standard tunnels use TUN interfaces (`tun0`, `wg0`). Lower overhead and optimal for IP routing.
- **TAP (Network TAP - Layer 2)**: Operates on Ethernet frames (includes 14-byte MAC header and ARP packets). Used when bridged networking is required (e.g. running non-IP protocols, bridging VM virtual switches, or joining two physical LANs into a single broadcast domain).

```
Userspace VPN Process (OpenVPN / WireGuard Tools)
        │                             ▲
 write(tun_fd, enc_packet)    read(tun_fd, plain_packet)
        │                             │
════════╪═════════════════════════════╪═════════════ Kernel Boundary
        ▼                             │
+-------------------+         +-------------------+
|  Physical NIC     |         |  Virtual TUN      |
|  (eth0 - 1500B)   |         |  (tun0 - 1420B)   |
+-------------------+         +-------------------+
```

---

### Protocol Comparison: WireGuard vs IPsec vs OpenVPN

| Architecture Property | WireGuard | IPsec (IKEv2 / ESP) | OpenVPN |
|---|---|---|---|
| **Kernel Implementation** | In-kernel (`drivers/net/wireguard`) | In-kernel (Linux XFRM / Netkey) | Userspace daemon + `tun` device |
| **Lines of Code** | ~4,000 lines (easily auditable) | >400,000 lines (strongSwan / kernel) | >100,000 lines |
| **Cryptography** | Modern, fixed suite: Curve25519, ChaCha20-Poly1305, BLAKE2s | Negotiable: AES-GCM, SHA-256, DH groups | Negotiable: OpenSSL cipher suites |
| **Key Agreement Protocol** | Noise Protocol Framework (`Noise_IKpsk2`) | Internet Key Exchange (IKEv2) | TLS Handshake (SSL/TLS) |
| **Transport Port** | Single UDP port (default 51820) | UDP 500 (IKE), UDP 4500 (NAT-T), IP proto 50 (ESP) | UDP 1194 or TCP 443 |
| **Stealth / Port Scannability** | **Silent Mode**: Drops unauthenticated packets without reply (nmap sees "closed/filtered") | IKE responds with cookie notification | TLS responds with handshake alerts |
| **Roaming & Handover** | Seamless (updates endpoint IP on verified authenticated packet) | MOBIKE extension required (RFC 4555) | Re-handshake required |

---

### WireGuard Cryptokey Routing Internals

WireGuard replaces complex firewall access lists with **Cryptokey Routing**:
Every peer is identified by an asymmetric Curve25519 public key. In the WireGuard interface table, each public key is mapped to a list of allowed IP subnets:

```ini
# /etc/wireguard/wg0.conf on Gateway (10.8.0.1)
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = aaaaaa...

[Peer]
# Developer Laptop A
PublicKey = bbbbbb...
AllowedIPs = 10.8.0.2/32

[Peer]
# Branch Office Gateway
PublicKey = cccccc...
AllowedIPs = 10.8.0.10/32, 192.168.10.0/24
```

#### Inbound Packet Security Check
When an encrypted UDP packet arrives on port 51820:
1. WireGuard decrypts and authenticates the packet using the sender's public key (via ChaCha20-Poly1305).
2. WireGuard extracts the **inner plain IP header**.
3. **Cryptokey Verification**: WireGuard checks if the inner Source IP matches the `AllowedIPs` list for that public key. If Peer A (public key `bbbbbb...`) sends a packet with inner source `10.8.0.99`, **it is silently dropped**. This completely eliminates IP spoofing inside the tunnel!

---

### The Path MTU Blackhole & TCP MSS Clamping

The single most common operational failure in VPN and overlay network deployments is the **Path MTU (PMTU) Blackhole**.

#### The Encapsulation Overhead Problem
Standard Ethernet has a Maximum Transmission Unit (MTU) of **1500 bytes**.
When an inner IP packet is encapsulated inside a WireGuard or IPsec tunnel, the outer wrapper adds headers:

$$\text{WireGuard Overhead} = 20\text{ bytes (Outer IPv4)} + 8\text{ bytes (UDP)} + 32\text{ bytes (WireGuard Header)} = 60\text{ bytes}$$

If using IPv6 outer headers, overhead increases to $40 + 8 + 32 = 80\text{ bytes}$.
For IPsec ESP tunnel mode with NAT-Traversal, overhead can reach **76 to 92 bytes**.

Therefore, the virtual `wg0` or `tun0` interface must have a reduced MTU:
$$\text{TUN MTU} = 1500 - 60 = 1420\text{ bytes}$$

```
+─────────────────────────────────────────────────────────────+ 1500 Bytes Wire MTU
│ Outer IPv4 (20B) │ UDP (8B) │ WG Header (32B) │             │
+───────────────────────────────────────────────┤             │
                                                ▼             │
                        +─────────────────────────────────────┤
                        │ Inner Encrypted IP Packet (<=1420B) │
                        +─────────────────────────────────────+
```

#### Why PMTU Discovery Fails (The Black Hole)
1. A client initiates a TCP connection and sends packets with the `DF` (Don't Fragment) bit set.
2. An application transfers a 1460-byte payload. With 20B IPv4 + 20B TCP headers, the packet size is 1500 bytes.
3. The VPN gateway attempts to encapsulate the 1500-byte packet. The total size becomes $1500 + 60 = 1560\text{ bytes}$, which exceeds the physical 1500-byte wire MTU.
4. Because `DF=1`, the gateway drops the packet and generates an **ICMP Type 3, Code 4** message ("Destination Unreachable, Fragmentation Needed, MTU=1420").
5. **The Trap**: Intermediate firewalls or cloud providers often block all incoming ICMP messages for security.
6. The client never receives the ICMP notification. It continues to retransmit the 1500-byte packet until connection timeout.
7. **Symptom**: `curl` small URLs works, SSH logins succeed, but `git pull`, `scp`, or opening web pages hangs indefinitely!

#### The Production Fix: TCP MSS Clamping
Instead of relying on fragile ICMP PMTUD across the internet, the VPN router dynamically intercepts TCP `SYN` packets and rewrites the **Maximum Segment Size (MSS)** option field in the TCP header:

$$\text{Clamped MSS} = \text{Tunnel MTU} (1420) - 20\text{ (Inner IPv4)} - 20\text{ (TCP)} = 1380\text{ bytes}$$

```bash
# iptables MSS Clamping Rule on VPN Gateway:
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
         -j TCPMSS --clamp-mss-to-pmtu

# Explicit fixed MSS clamp (e.g. 1360 for high-overhead IPsec):
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
         -j TCPMSS --set-mss 1360
```

---

### Split Tunneling & DNS Leak Prevention

When deploying client VPNs, two routing models exist:

1. **Full Tunnel (`AllowedIPs = 0.0.0.0/0, ::/0`)**:
   - All network traffic (corporate intranet and public internet) routes through the encrypted VPN tunnel.
   - Ensures strict corporate compliance and egress monitoring.
   - **Cost**: High bandwidth load on VPN gateways and elevated latency for public media/CDNs.

2. **Split Tunnel (`AllowedIPs = 10.0.0.0/8, 172.16.0.0/12`)**:
   - Only corporate IP ranges route through the VPN. Public internet traffic routes directly through the local ISP.
   - Optimizes bandwidth and lowers latency.

#### DNS Leaks and WebRTC STUN Leak Risks
In split-tunneling configurations, two severe privacy/security leaks frequently occur:
- **DNS Leak**: The OS sends domain lookups to the local ISP's DNS server rather than the internal corporate DNS server. On Linux, `systemd-resolved` may query both interfaces simultaneously. Fix by binding DNS strictly to the VPN interface using `resolvectl domain wg0 ~.` or WireGuard's `DNS = 10.8.0.1` directive.
- **WebRTC STUN Leak**: Even when a full VPN tunnel is active, modern web browsers executing WebRTC JavaScript can issue STUN UDP binding requests outside the default routing table to discover local LAN and ISP public IPs. Browser policies must set `media.peerconnection.ice.default_address_only = true` to force STUN traffic through the tunnel.

---

## 4. NAT Traversal & Carrier-Grade NAT (CGNAT)

Network Address Translation (NAT) modifies IP header addresses in transit. While SNAT allows private subnets to share a single public IPv4 address, it breaks peer-to-peer (P2P) protocols (WebRTC, VoIP SIP, gaming).

<NatTraversalDiagram />

### The 4 Classic NAT Types (RFC 3489)

1. **Full Cone NAT (One-to-One)**: Once an internal IP:Port ($A:a$) is mapped to external IP:Port ($E:e$), *any* external host can send packets to $E:e$, which will be forwarded to $A:a$. (Easiest to traverse).
2. **Restricted Cone NAT**: External host $B$ can send packets to $E:e$ *only if* internal host $A:a$ has previously sent a packet to IP $B$.
3. **Port-Restricted Cone NAT**: External host $B:b$ can send to $E:e$ *only if* internal host $A:a$ has previously sent a packet to the exact address $B:b$.
4. **Symmetric NAT**: The NAT device allocates a **unique external port** for every distinct destination IP:Port that the internal host connects to. Port hole punching between two Symmetric NATs is mathematically impossible without an external relay!

### ICE / STUN / TURN Protocol Flow

When two client devices behind NATs need to communicate (e.g. WebRTC video call):
1. **STUN (Session Traversal Utilities for NAT - RFC 5389)**: The client contacts a public STUN server (`stun.l.google.com:19302`). The STUN server reflects back the client's public reflexive IP and port ($E:e$) observed on the public internet.
2. **Hole Punching**: Both peers exchange their reflexive IP:Port via a signaling server and simultaneously transmit UDP packets to each other. These outbound packets create matching state entries in their respective NAT firewalls, opening the bidirectional channel.
3. **TURN (Traversal Using Relays around NAT - RFC 5766)**: If either peer is behind Symmetric NAT or enterprise firewalls that block UDP hole punching, direct connection fails. Traffic falls back to a TURN server, which acts as an authenticated relay proxy forwarding encrypted media streams.
4. **ICE (Interactive Connectivity Establishment - RFC 8445)**: Orchestrates the candidates (Local Host, Server Reflexive STUN, Relayed TURN) in priority order, testing connectivity checks (STUN binding requests) to establish the lowest-latency path.

---

## 5. Architectural Trade-Off Matrix

| Technology | Latency Overhead | Throughput Impact | Security Boundary | Primary Production Risk |
|---|---|---|---|---|
| **Reverse Proxy (Envoy / NGINX)** | Moderate (+1–3ms socket decoupling & TLS re-encryption) | High (optimized epoll, keepalive pools) | Layer 7 (Terminates TLS, validates HTTP semantics) | Slow client buffer exhaustion; Header spoofing (`X-Forwarded-For`). |
| **Stateful Firewall (Netfilter/iptables)** | Low (+50–200μs linear rule lookup) | Medium (drops sharply at >1,000 rules) | Layer 3/4 (5-tuple packet header filtering) | Conntrack table exhaustion (`nf_conntrack: table full`) under SYN flood. |
| **High-Speed Filter (eBPF XDP)** | Ultra-Low (&lt; 5μs driver hook) | Maximum (&gt; 20M pps line rate) | Layer 2/3/4 (Stateless or eBPF BPF-map state) | Kernel verifier complexity; driver compatibility. |
| **WireGuard VPN** | Ultra-Low (&lt; 100μs in-kernel ChaCha20) | Very High (line rate on modern multi-core) | Layer 3 Overlay (Cryptokey routing) | Path MTU Blackhole (lack of MSS clamping); dynamic IP endpoint updates. |
| **IPsec (IKEv2 / ESP)** | Low–Medium (hardware AES-NI offload) | High | Layer 3 Overlay (SA / SPI security associations) | Protocol complexity (UDP 500/4500 + ESP 50); NAT traversal fragility. |

---

## 6. Senior Engineering Troubleshooting Runbook

### Diagnosing MTU / MSS Issues
```bash
# 1. Test ping with Don't Fragment (DF) bit set to determine exact MTU:
# macOS:
ping -D -s 1472 example.com
# Linux:
ping -M do -s 1472 example.com
# If 1472 fails but 1392 succeeds, Path MTU is 1392 + 28 (IP+ICMP) = 1420 bytes!

# 2. Inspect active TCP connection MSS using ss:
ss -ti '( dport = :443 or sport = :443 )'
# Look for: mss:1380 rcvmss:1380 advmss:1460

# 3. Capture TCP SYN handshake to verify MSS negotiation:
tcpdump -nn -i any "tcp[tcpflags] & (tcp-syn) != 0" -v
```

### Diagnosing Conntrack Table Depletion
```bash
# 1. Check current vs maximum table utilization:
sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max

# 2. Find top connection talkers in conntrack table:
conntrack -L | awk '{print $4}' | cut -d= -f2 | sort | uniq -c | sort -nr | head -n 10

# 3. View dropped packet counters:
cat /proc/net/stat/nf_conntrack
```
