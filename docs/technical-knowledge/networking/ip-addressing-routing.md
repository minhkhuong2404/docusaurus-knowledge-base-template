---
id: ip-addressing-routing
title: IP Addressing & Routing
description: IPv4 and IPv6 addressing, subnetting, CIDR notation, NAT, routing protocols, and how packets find their way across the internet.
tags: [networking, ip, ipv4, ipv6, subnet, cidr, routing, bgp, ospf]
sidebar_position: 3
---

# IP Addressing & Routing

## IPv4 Addressing

An IPv4 address is a **32-bit number**, usually written as four octets in dotted-decimal notation.

```
192  .  168  .   1  .  100
│         │       │      │
8 bits   8 bits  8 bits  8 bits  =  32 bits total
= 4,294,967,296 total addresses (~4.3 billion)
```

### IPv4 Address Classes (Historical)

| Class | Range | Default Mask | Usage |
|-------|-------|-------------|-------|
| A | 1.0.0.0 – 126.255.255.255 | /8 (255.0.0.0) | Large organizations |
| B | 128.0.0.0 – 191.255.255.255 | /16 (255.255.0.0) | Medium organizations |
| C | 192.0.0.0 – 223.255.255.255 | /24 (255.255.255.0) | Small networks |
| D | 224.0.0.0 – 239.255.255.255 | — | Multicast |
| E | 240.0.0.0 – 255.255.255.255 | — | Reserved/experimental |

Classes are obsolete — replaced by **CIDR** (Classless Inter-Domain Routing).

---

## CIDR Notation

CIDR expresses an IP address and its **subnet mask** together.

```
192.168.1.0/24

192.168.1.0  = network address
/24          = 24 bits are the network part → 8 bits remain for hosts

Subnet mask: 11111111.11111111.11111111.00000000 = 255.255.255.0
Hosts:       2^8 - 2 = 254 usable host addresses
             (.0 = network address, .255 = broadcast)
```

### CIDR Quick Reference

| CIDR | Subnet Mask | Hosts | Usage |
|------|-------------|-------|-------|
| /8 | 255.0.0.0 | 16,777,214 | Very large |
| /16 | 255.255.0.0 | 65,534 | Large |
| /24 | 255.255.255.0 | 254 | Typical LAN |
| /25 | 255.255.255.128 | 126 | Half subnet |
| /26 | 255.255.255.192 | 62 | Quarter subnet |
| /27 | 255.255.255.224 | 30 | Small segment |
| /28 | 255.255.255.240 | 14 | Very small |
| /30 | 255.255.255.252 | 2 | Point-to-point link |
| /32 | 255.255.255.255 | 1 | Host route |

### Subnetting Example

Divide `192.168.10.0/24` into 4 equal subnets:

```
Need 4 subnets → borrow 2 bits → /26 (2² = 4 subnets, 62 hosts each)

Subnet 1: 192.168.10.0/26    → hosts: .1 – .62,   broadcast: .63
Subnet 2: 192.168.10.64/26   → hosts: .65 – .126,  broadcast: .127
Subnet 3: 192.168.10.128/26  → hosts: .129 – .190, broadcast: .191
Subnet 4: 192.168.10.192/26  → hosts: .193 – .254, broadcast: .255
```

---

## Special IP Address Ranges

| Range | Purpose |
|-------|---------|
| `10.0.0.0/8` | Private (RFC 1918) |
| `172.16.0.0/12` | Private (RFC 1918) |
| `192.168.0.0/16` | Private (RFC 1918) |
| `127.0.0.0/8` | Loopback (localhost) |
| `169.254.0.0/16` | Link-local (APIPA — no DHCP) |
| `0.0.0.0/0` | Default route (all destinations) |
| `255.255.255.255` | Limited broadcast |
| `224.0.0.0/4` | Multicast |

---

## IPv6

IPv6 uses **128-bit addresses** to solve IPv4 exhaustion.

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334

Simplified (omit leading zeros + collapse consecutive zero groups):
2001:db8:85a3::8a2e:370:7334
```

**Total addresses**: 2¹²⁸ ≈ 340 undecillion (3.4 × 10³⁸) — effectively unlimited.

### IPv6 Address Types

| Type | Prefix | Description |
|------|--------|-------------|
| Global Unicast | `2000::/3` | Internet-routable (like public IPv4) |
| Link-Local | `fe80::/10` | Local segment only, auto-assigned |
| Loopback | `::1/128` | Like 127.0.0.1 |
| Multicast | `ff00::/8` | One-to-many |
| Unique Local | `fc00::/7` | Like private IPv4 (RFC 1918) |

### IPv6 vs IPv4 Key Differences

| | IPv4 | IPv6 |
|--|------|------|
| Address size | 32-bit | 128-bit |
| NAT required | Yes (address exhaustion) | No (enough addresses) |
| Header | Variable length, checksum | Fixed 40 bytes, no checksum |
| ARP | ARP protocol | Neighbor Discovery Protocol (NDP) |
| Configuration | DHCP or manual | SLAAC (stateless auto) or DHCPv6 |
| IPSec | Optional | Mandatory support |
| Broadcast | Yes | No (uses multicast) |
| Fragmentation | At routers | Source host only |

---

## Routing

Routing determines the **path** an IP packet takes from source to destination.

### Routing Table

Every router and host has a routing table:

```
Destination       Gateway         Interface  Metric
0.0.0.0/0         192.168.1.1     eth0       100    ← default route
192.168.1.0/24    0.0.0.0         eth0       0      ← directly connected
10.0.0.0/8        192.168.1.254   eth0       50     ← static route
172.16.0.0/12     192.168.1.254   eth0       50
127.0.0.0/8       127.0.0.1       lo         0      ← loopback
```

**Longest prefix match**: the most specific matching route wins.
- Packet to `192.168.1.50` → matches both `0.0.0.0/0` and `192.168.1.0/24` → uses `/24` (more specific).

```bash
# Linux routing table
ip route show
route -n

# Add static route
ip route add 10.0.0.0/8 via 192.168.1.254 dev eth0

# Default gateway
ip route add default via 192.168.1.1
```

---

## Routing Protocols

### Distance Vector — RIP

- Each router advertises its routing table to neighbors
- Metric: hop count (max 15 — limits scale)
- Slow convergence (Bellman-Ford algorithm)
- **Legacy** — not used in modern networks

### Link State — OSPF

Used within a single AS (Autonomous System — e.g., a company network):

```
Each router:
  1. Discovers neighbors via Hello packets
  2. Floods Link State Advertisements (LSAs) to all routers
  3. Builds complete topology map (LSDB)
  4. Runs Dijkstra's algorithm for shortest path
  5. Installs best routes in routing table
```

- Fast convergence (triggered updates, not periodic)
- Metric: cost based on interface bandwidth
- Scales with **areas** (Area 0 = backbone)

### Path Vector — BGP (Border Gateway Protocol)

The routing protocol of the **internet** — connects Autonomous Systems (AS).

```
AS65001 (ISP 1) ←── BGP ──► AS65002 (Google)
                ←── BGP ──► AS65003 (ISP 2)
```

- Each AS has a unique **AS Number (ASN)**
- BGP advertises **IP prefixes** with **path attributes** (AS path, MED, local pref)
- Path selection: prefer shortest AS path, then policy attributes
- Very slow convergence by design (stability over speed)
- Used by: ISPs, cloud providers, large enterprises

```
BGP path: 192.0.2.0/24 via AS65001 → AS65002 → AS65003
Path attributes:
  AS_PATH: [65001, 65002, 65003]
  NEXT_HOP: 203.0.113.1
  LOCAL_PREF: 100
```

---

## DHCP — Dynamic Host Configuration Protocol

Automatically assigns IP addresses to hosts.

```
Client           Server
  │──DISCOVER──────►│  broadcast: "I need an IP"
  │◄─OFFER──────────│  "Here's 192.168.1.100/24, GW=.1, DNS=8.8.8.8"
  │──REQUEST────────►│  "I'll take 192.168.1.100"
  │◄─ACK────────────│  "Confirmed, lease for 24 hours"
```

DHCP provides: IP address, subnet mask, default gateway, DNS servers, lease duration.

```bash
# Linux: request DHCP lease
dhclient eth0
# or
systemctl restart NetworkManager
```

---

## NAT — Network Address Translation

Maps **private IP addresses** to one or more **public IP addresses**, enabling private networks to reach the internet.

```
Internal Host    NAT Router          Internet Server
10.0.0.5:54321 ──► [NAT Table] ──► 203.0.113.1:54321
                   private:port     public:port
                   maps to each other
```

```
NAT Translation Table:
Internal IP     Internal Port  External IP    External Port  Destination
10.0.0.5        54321         203.0.113.1    54321         142.250.80.46:443
10.0.0.7        49152         203.0.113.1    49153         142.250.80.46:443
```

**Types:**
- **SNAT (Source NAT)**: changes source IP (outbound traffic) — most common
- **DNAT (Destination NAT)**: changes destination IP (port forwarding, load balancing)
- **PAT (Port Address Translation)**: SNAT with port remapping — allows many hosts on one public IP

---

## 🎯 Interview Questions

**Q1. What is CIDR and why was it introduced?**
> CIDR (Classless Inter-Domain Routing) replaces the rigid class-based system with flexible prefix lengths (e.g., /24, /22). It was introduced to: (1) slow IPv4 exhaustion by allowing networks of any size; (2) reduce routing table size through route aggregation (supernetting) — multiple subnets summarized as one prefix.

**Q2. How does a router determine the next hop for a packet?**
> The router looks up the packet's destination IP in its routing table using **longest prefix match** — the most specific matching route wins. If a packet matches both `10.0.0.0/8` and `10.1.0.0/16`, the `/16` is used. If no specific route matches, the default route (`0.0.0.0/0`) is used. If no default route, the packet is dropped and ICMP unreachable is sent.

**Q3. What is the difference between OSPF and BGP?**
> OSPF is an interior gateway protocol (IGP) used within a single organization's network. It uses link-state flooding and Dijkstra's algorithm for fast convergence and cost-based path selection. BGP is an exterior gateway protocol (EGP) used between autonomous systems on the internet. It uses path-vector routing with rich policy attributes, prioritizing stability over speed.

**Q4. What is a private IP address and why is it not routable on the internet?**
> Private IP ranges (10/8, 172.16/12, 192.168/16) are defined in RFC 1918 for use within private networks. Internet routers are configured to drop packets destined for these addresses because they're not globally unique — millions of networks use the same 192.168.1.x ranges. NAT translates private IPs to a public IP before packets reach the internet.

**Q5. Explain NAT and its trade-offs.**
> NAT translates private IP:port pairs to public IP:port pairs, allowing multiple devices to share one public IP. Trade-offs: breaks end-to-end connectivity (peers can't initiate connections inward without port forwarding), complicates protocols that embed IP addresses (FTP, SIP), requires stateful tracking, adds latency. IPv6 eliminates the need for NAT by providing sufficient addresses.

**Q6. What is a subnet mask and how does it work?**
> A subnet mask is a 32-bit number where network bits are 1s and host bits are 0s. ANDing an IP address with its subnet mask extracts the network address. Example: `192.168.1.100` AND `255.255.255.0` = `192.168.1.0` (network). All hosts in the same subnet share this network address and can communicate without a router.

**Q7. What is the difference between unicast, broadcast, and multicast?**
> Unicast: one sender, one receiver (one-to-one) — most internet traffic. Broadcast: one sender, all devices on a LAN segment receive (one-to-all) — e.g., DHCP Discover, ARP. Multicast: one sender, multiple subscribed receivers (one-to-many) — e.g., IPTV, routing protocols; more efficient than broadcast because non-subscribers ignore the traffic.

**Q8. What happens when your computer gets a 169.254.x.x IP address?**
> This is an APIPA (Automatic Private IP Addressing) / link-local address, assigned when DHCP fails. The OS sends DHCP Discover broadcasts and if no DHCP server responds, it auto-assigns an address from `169.254.0.0/16`. These are only valid on the local link — no internet access, no routing. It indicates a DHCP configuration problem.
