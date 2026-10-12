---
id: mac-address-and-layer-2
title: MAC Addressing, ARP & Layer 2 Forwarding
description: Senior deep dive into EUI-48 MAC architecture, ARP protocol state machine, CAM table forwarding, Gratuitous ARP failover, ARP spoofing defenses, and Cloud VPC VXLAN virtualization.
tags: [networking, mac-address, arp, layer2, vrrp, switch, vxlan, cloud-networking]
sidebar_position: 2
---

import MacAddressArpDiagram from '@site/src/components/MacAddressArpDiagram';

# MAC Addressing, ARP & Layer 2 Forwarding

While IP addresses provide logical end-to-end addressing across heterogeneous routed networks (Layer 3), physical delivery over local broadcast domains relies entirely on **Media Access Control (MAC) addresses** and **Address Resolution Protocol (ARP)** at Layer 2.

In modern cloud, container, and virtualization infrastructure, understanding the physical reality of Layer 2 framing is critical: from switch CAM table memory limits and VRRP Virtual IP failover to how hypervisors drop broadcast domains entirely using VXLAN overlays.

---

## Interactive Layer 2 Architecture Visualizer

Inspect the 48-bit EUI-48 bit breakdown, step through the kernel ARP resolution state machine, and simulate high-availability Gratuitous ARP (GARP) failovers:

<MacAddressArpDiagram />

---

## 1. 48-Bit MAC Address (EUI-48) Architecture

A MAC address (Ethernet hardware address) is a 48-bit (6-octet) identifier burned into the Network Interface Card (NIC) firmware or assigned virtually by a hypervisor or container runtime.

$$\text{Format: } \underbrace{\text{XX : XX : XX}}_{\text{Organizationally Unique Identifier (24 bits)}} : \underbrace{\text{XX : XX : XX}}_{\text{NIC Specific Identifier (24 bits)}}$$

### Bit Significance in the First Octet

The physical behavior of an Ethernet frame on the wire is dictated by **two special bits in the very first byte** (Octet 0):

```
Octet 0 Byte Layout:
┌───┬───┬───┬───┬───┬───┬───────┬───────┐
│ b7│ b6│ b5│ b4│ b3│ b2│  b1   │  b0   │
└───┴───┴───┴───┴───┴───┴───────┴───────┘
                          │       │
                          │       └── Bit 0: I/G (Individual / Group)
                          │                  0 = Unicast
                          │                  1 = Multicast / Broadcast
                          │
                          └────────── Bit 1: U/L (Universal / Local)
                                             0 = Universally Administered (OUI OEM)
                                             1 = Locally Administered (Virtual / VM)
```

1. **Bit 0: I/G Bit (Individual vs Group Address)**
   - `0` (**Unicast / Individual**): Frame is targeted to a single physical or virtual NIC.
   - `1` (**Multicast / Group**): Frame is targeted to a multicast group or broadcast.
     - **Broadcast MAC**: `FF:FF:FF:FF:FF:FF` (all 48 bits set to 1). Switches flood this frame out all ports in the VLAN.
     - **IPv4 Multicast Range (RFC 1112)**: `01:00:5E:00:00:00` through `01:00:5E:7F:FF:FF` (the lower 23 bits of the IPv4 multicast address are directly mapped into the MAC address).
     - **IPv6 Multicast Range (RFC 2464)**: `33:33:xx:xx:xx:xx`.

2. **Bit 1: U/L Bit (Universal vs Locally Administered)**
   - `0` (**Universally Administered**): Burned-in Address (BIA) assigned by IEEE registration authority to vendors (Cisco, Apple, Intel).
   - `1` (**Locally Administered**): Software-assigned virtual MAC address that bypasses IEEE vendor registration.
     - **Container Runtimes**: Docker and Kubernetes CNIs create virtual ethernet pairs (`veth`) with locally administered MACs starting with `02:42:ac:...` (Docker default bridge `172.17.0.0/16`).
     - **Mobile MAC Randomization**: Modern iOS and Android devices randomize Wi-Fi MAC addresses per SSID to prevent physical tracking; the generated MACs always set the U/L bit to 1 (e.g. `x2:xx:xx...`, `x6:xx:xx...`, `xA:xx:xx...`, `xE:xx:xx...`).

---

### EUI-64 Expansion in IPv6 Stateless Autoconfiguration (SLAAC)

In IPv6 Stateless Address Autoconfiguration (RFC 4862), a host generates its 64-bit Interface Identifier from its 48-bit MAC address using the Modified EUI-64 format:
1. Split the 48-bit MAC into two 24-bit halves: `00:1A:2B` and `3C:4D:5E`.
2. Insert the fixed 16-bit pattern `FF:FE` in the middle: `00:1A:2B:FF:FE:3C:4D:5E`.
3. Invert the Universal/Local bit (Bit 1 of Octet 0): `00` (`00000000_2`) becomes `02` (`00000010_2`).
4. Resulting Interface ID: `021A:2BFF:FE3C:4D5E`.

---

## 2. Switch CAM Tables & Frame Forwarding Logic

Layer 2 switches do not route packets based on IP addresses. Instead, they inspect the Ethernet frame header and forward frames using an in-memory **Content-Addressable Memory (CAM)** table (or MAC address table).

```
Ethernet Frame:
┌───────────────────────┬───────────────────────┬────────────┬────────────────────┬───────┐
│ Destination MAC (6B)  │   Source MAC (6B)     │ EtherType  │   Payload (IP)     │  FCS  │
│  00:BB:55:66:77:88    │  00:AA:11:22:33:44    │  0x0800    │ (46 - 1500 bytes)  │  4B   │
└───────────────────────┴───────────────────────┴────────────┴────────────────────┴───────┘
```

### The Forwarding Algorithm

For every incoming frame arriving on a physical port:

```
                          [ Frame Arrives on Port X ]
                                       │
                                       ▼
                     [ Learn: Record Source MAC -> Port X ]
                          (Update CAM Table & Refresh Aging Timer)
                                       │
                                       ▼
                       [ Check Destination MAC in CAM ]
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
             [ Entry Exists? ]                     [ Unknown or Broadcast? ]
                    │                                     │
           YES ─────┴───── NO                             ▼
            │               │                    [ FLOOD Frame Out All ]
            ▼               ▼                    [ Ports Except Port X ]
  [ Dest Port == Port X? ]  [ Unknown Unicast Flooding ]
      ╱            ╲
   YES              NO
    ▼                ▼
[ FILTER / DROP ]  [ FORWARD out Specific Port ]
```

1. **Source Address Learning**: The switch extracts the **Source MAC** and records the mapping `(VLAN, Source MAC) -> Ingress Port` in its CAM table, resetting an aging timer (default: 300 seconds).
2. **Destination Lookup**:
   - **Known Unicast**: If Destination MAC exists in CAM and points to Port Y (where $Y \neq X$), the switch forwards the frame directly to Port Y.
   - **Filter / Drop**: If Destination MAC resides on the same port ($Y = X$), the frame is discarded (already on the local collision domain).
   - **Unknown Unicast Flooding**: If Destination MAC is not in CAM, the switch floods the frame out all ports in that VLAN except the ingress port $X$.
   - **Broadcast / Multicast Flooding**: Broadcast frames (`FF:FF:FF:FF:FF:FF`) are always flooded out all active ports in the VLAN.

---

### Production Vulnerability: CAM Table Overflow & MAC Flooding

Physical switches have hardware limits on CAM table capacity (typically 8,000 to 128,000 MAC entries).

#### The Attack Mechanism (`macof`)
An attacker on the local network generates hundreds of thousands of bogus Ethernet frames per second with randomized source MAC addresses.
1. The switch CAM table fills to capacity within milliseconds.
2. When legitimate frames arrive, the switch cannot learn new entries and fails open.
3. The switch falls back to **fail-open hub behavior**: it floods **all** unicast frames out every port!
4. The attacker's network sniffer receives sensitive traffic destined for other machines.

#### Mitigation: Port Security & 802.1X
```cisco
! Cisco IOS Port Security Configuration
interface GigabitEthernet0/1
 switchport mode access
 switchport port-security
 switchport port-security maximum 2              ! Limit to 2 MACs per port
 switchport port-security violation restrict     ! Drop unauthorized frames and alert SNMP
 switchport port-security mac-address sticky     ! Automatically bind first learned MAC
```

---

## 3. Address Resolution Protocol (ARP - RFC 826)

IP addresses are logical end-to-end abstractions; network interfaces only listen for frames matching their own MAC address, multicast groups, or broadcast.

When Host A (`192.168.1.10`) wants to send an IP packet to Host B (`192.168.1.20`) on the same subnet, it must resolve: **"What is the MAC address for 192.168.1.20?"**

### ARP Frame Anatomy

ARP packets are encapsulated directly inside Ethernet frames (`EtherType = 0x0806`), bypassing IP/TCP:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Hardware Type (1=Ethernet) |     Protocol Type (0x0800=IPv4) |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Hardware Size (6) | Proto Size (4) |       Opcode (1=Req, 2=Reply)   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Sender Hardware Address (MAC)             |
|                               +-------------------------------+
|                               |     Sender Protocol IP        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Sender Protocol IP      |    Target Hardware Address (MAC)  |
+-------------------------------+                               |
|                               |                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Target Protocol IP                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

1. **ARP Request**: Host A sends a broadcast frame (`Dst MAC = FF:FF:FF:FF:FF:FF`, `Opcode = 1`) asking: *"Who has 192.168.1.20? Tell 192.168.1.10"*. Target MAC in payload is set to `00:00:00:00:00:00`.
2. **ARP Reply**: Host B recognizes its own IP, caches Host A's MAC, and sends a **unicast frame** (`Dst MAC = Host A's MAC`, `Opcode = 2`): *"192.168.1.20 is at 00:BB:55:66:77:88"*.

---

### The Linux Kernel ARP Cache State Machine (RFC 4861)

The Linux kernel does not keep static ARP entries; it runs a probabilistic neighbor state machine managed via `ip neigh`:

```
                 [ Packet to send, no neighbor entry ]
                                   │
                                   ▼
                            ┌──────────────┐
                 ┌─────────>│  INCOMPLETE  │ (Sending ARP Requests, max 3)
                 │          └──────┬───────┘
                 │                 │
                 │                 ▼ [ ARP Reply Received ]
                 │          ┌──────────────┐
                 │          │  REACHABLE   │ (Entry valid, timer running ~30s)
                 │          └──────┬───────┘
                 │                 │
                 │                 ▼ [ gc_stale_time expired ]
                 │          ┌──────────────┐
                 │          │    STALE     │ (No traffic recently, entry kept)
                 │          └──────┬───────┘
                 │                 │
                 │                 ▼ [ Outbound packet triggers confirmation ]
                 │          ┌──────────────┐
                 │          │    DELAY     │ (Waits delay_first_probe_time ~5s)
                 │          └──────┬───────┘
                 │                 │
                 │                 ▼ [ No upper-layer ACK ]
                 │          ┌──────────────┐
                 │          │    PROBE     │ (Sends unicast ARP probes)
                 │          └──────┬───────┘
                 │                 │
                 │      ┌──────────┴──────────┐
                 │      ▼                     ▼
          [ Probe Succeeded ]          [ Max Retries Failed ]
                 │                            │
                 ▼                            ▼
          [ Back to REACHABLE ]        ┌──────────────┐
                                       │    FAILED    │ (Entry dropped)
                                       └──────────────┘
```

#### Production Inspection:
```bash
# View kernel neighbor table with states:
ip neigh show

# Output:
# 192.168.1.1 dev eth0 lladdr 00:11:22:33:44:01 REACHABLE
# 192.168.1.50 dev eth0 lladdr 00:aa:bb:cc:dd:ee STALE
# 192.168.1.99 dev eth0 FAILED

# Kernel tuning for large subnets (/etc/sysctl.d/99-arp.conf):
# Prevents ARP table overflow ("neighbor table overflow!") on K8s nodes:
net.ipv4.neigh.default.gc_thresh1 = 2048
net.ipv4.neigh.default.gc_thresh2 = 4098
net.ipv4.neigh.default.gc_thresh3 = 8192
```

---

### ARP Spoofing / Poisoning & Dynamic ARP Inspection (DAI)

Because the original ARP protocol in RFC 826 has **zero authentication**, any host can send unsolicited ARP replies.

#### The Man-in-the-Middle (MITM) Vector
An attacker sends poisoned ARP packets:
- To Target Machine: *"192.168.1.1 (Gateway) is at ATTACKER_MAC"*
- To Gateway Router: *"192.168.1.100 (Target) is at ATTACKER_MAC"*

Both victims overwrite their ARP caches with the attacker's MAC address. All bidirectional internet traffic routes through the attacker's machine.

#### Defense: Dynamic ARP Inspection (DAI)
Enterprise switches intercept all ARP packets on untrusted access ports and validate them against a trusted **DHCP Snooping Binding Database**:
1. When a client leases an IP via DHCP, the switch records `(MAC, IP, VLAN, Port)`.
2. If an untrusted host sends an ARP reply claiming an IP that does not match its DHCP snooping record, the switch **drops the packet immediately** and increments a security violation counter.

---

## 4. Gratuitous ARP (GARP) & High-Availability Failover

A **Gratuitous ARP (GARP)** is an ARP Request or Reply sent by a host where:
$$\text{Sender IP Address} == \text{Target IP Address}$$

```
+─────────────────────────────────────────────────────────────+
|                     Gratuitous ARP Payload                  |
+─────────────────────────────────────────────────────────────+
| Opcode:            1 (Request) or 2 (Reply)                 |
| Sender MAC:        00:11:22:33:44:02 (New Server MAC)       |
| Sender IP:         192.168.1.1 (Virtual IP)                 |
| Target MAC:        FF:FF:FF:FF:FF:FF (Broadcast)            |
| Target IP:         192.168.1.1 (Virtual IP)                 |
+─────────────────────────────────────────────────────────────+
```

### High-Availability Keepalived / VRRP Failover

In redundant clusters (Keepalived, Corosync/Pacemaker), a single **Virtual IP (VIP)** e.g. `192.168.1.1` is shared between Master and Backup nodes.

```
          [ Physical Switch (CAM: 192.168.1.1 -> Port 1) ]
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │ Node A (Master) │           │ Node B (Backup) │
       │ 00:11:22:33:44:01│           │ 00:11:22:33:44:02│
       │ VIP: 192.168.1.1│           │ VIP: (Standby)  │
       └────────┬────────┘           └────────┬────────┘
                │                             │
          [ CRASHES! ]                        │
                │                             │
                └────── VRRP Heartbeat Stops ─┘
                               │
                               ▼
                    [ Node B Promotes Self ]
                               │
            [ Sends Unsolicited Broadcast GARP! ]
        "192.168.1.1 is now at 00:11:22:33:44:02"
                               │
                               ▼
       [ Switch updates CAM Table: Port 1 -> Port 2 in <1ms! ]
       [ All network clients flush ARP cache to Node B MAC!  ]
```

#### Why GARP is Essential
Without GARP:
1. Physical switches would continue forwarding frames for `192.168.1.1` to the dead Port 1 until their 300-second CAM aging timer expired!
2. All neighboring hosts and gateways would keep transmitting to Node A's old MAC address until their ARP cache entries moved to `STALE` and failed (~30 to 60 seconds).
3. **With GARP**: Failover completes in **sub-millisecond time**, preserving live TCP sessions without dropped connections.

---

## 5. Layer 2 in Cloud VPCs & Container Networks

Engineers accustomed to on-premise physical networking frequently encounter severe surprises when deploying clusters in AWS VPC, Google Cloud VPC, or Azure VNet:

### The Cloud VPC Reality: Broadcast is Dead

In public cloud VPCs (AWS Nitro, GCP Andromeda):
- **There is no physical Ethernet broadcast domain.**
- ARP broadcast packets (`FF:FF:FF:FF:FF:FF`) are **intercepted and dropped by the hypervisor**.
- GARP packets for IP takeover **do not update cloud routing tables**.

#### How Cloud Hypervisor Proxy ARP Works
When an EC2 instance emits an ARP request for its gateway:
1. The hypervisor intercepts the packet at the virtual interface boundary.
2. The hypervisor responds directly with a synthetic, fixed MAC address (e.g. `12:34:56:78:9a:bc`).
3. Routing is performed entirely via hypervisor software-defined routing tables (OpenFlow/Geneve/OVS pipelines), not physical switch CAM learning.
4. **HA Failover in Cloud**: You cannot use Keepalived GARP to move a VIP between instances! Instead, you must call cloud APIs (`aws ec2 assign-private-ip-addresses`) or use an AWS Application Load Balancer / Network Load Balancer.

---

### VXLAN Overlay Networks (RFC 7348)

To provide multi-tenant Layer 2 networks on top of routed Layer 3 physical networks without VLAN scaling limits (802.1Q VLANs are limited to 4,096 IDs), modern datacenters and Kubernetes CNIs use **Virtual Extensible LAN (VXLAN)**.

```
Standard VXLAN Encapsulated Packet:
┌──────────────┬────────────┬─────────────┬──────────────┬────────────────────────────┐
│ Outer Eth    │ Outer IPv4 │ Outer UDP   │ VXLAN Header │ Inner L2 Ethernet Frame    │
│ (Fabric MAC) │ (Host IP)  │ (Port 4789) │ (24-bit VNI) │ (Pod MAC -> Pod MAC)       │
│    14B       │    20B     │     8B      │      8B      │  14B Eth + IP + TCP...     │
└──────────────┴────────────┴─────────────┴──────────────┴────────────────────────────┘
```

1. **24-bit VXLAN Network Identifier (VNI)**: Supports up to **16 million** isolated virtual Layer 2 networks.
2. **Encapsulation Overhead**: The VXLAN wrapper adds **50 bytes** of overhead (14B Outer Eth + 20B IPv4 + 8B UDP + 8B VXLAN).
3. **Production MTU Trap**: Physical underlay interfaces must support **Jumbo Frames (MTU 9000)** or virtual interfaces (`flannel.1`, `calico.1`) must have their MTU clamped to $1500 - 50 = 1450\text{ bytes}$ to avoid fragmentation!

---

## 6. Senior Architect Diagnostic Commands

```bash
# 1. Inspect interface MAC address and link state:
ip link show eth0
# Look for: link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff

# 2. Trace live ARP resolution requests on the wire:
tcpdump -nn -e -i eth0 arp

# 3. Manually broadcast a Gratuitous ARP announcement (arping):
# Broadcasts 3 GARP update packets for 192.168.1.1 on eth0:
arping -U -c 3 -I eth0 192.168.1.1

# 4. View switch CAM table (Cisco IOS):
# show mac address-table dynamic
```
