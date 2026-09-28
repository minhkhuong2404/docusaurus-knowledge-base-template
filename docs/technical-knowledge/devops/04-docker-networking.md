---
id: docker-networking
title: Docker Networking Under the Hood
sidebar_label: Docker Networking
description: Complete guide to Docker networking — veth pairs, docker0 bridge mechanics, iptables SNAT/DNAT port forwarding, user-defined bridge DNS resolution, and network drivers.
tags: [docker, networking, bridge, veth, iptables, nat, dns, port-mapping, intermediate, senior]
---

import DockerArchitectureDiagram from '@site/src/components/DockerArchitectureDiagram';

# Docker Networking Under the Hood

> **The Core Reality:** Docker does not invent networking. It orchestrates existing Linux kernel networking primitives: **Network Namespaces (`netns`)**, **Virtual Ethernet Pairs (`veth`)**, **Software Bridges (`bridge`)**, and **`iptables` packet filtering / NAT rules**.

<DockerArchitectureDiagram initialTab="network" />

---

## 1. How the Default Bridge (`docker0`) Actually Works

When Docker daemon starts on a Linux host, it creates a virtual software bridge called **`docker0`** and assigns it a private subnet (typically `172.17.0.1/16`).

```
Docker Bridge Architecture:
┌────────────────────────────────────────────────────────────────────────┐
│ Linux Host Operating System (Root Network Namespace)                   │
│                                                                        │
│  Physical NIC (eth0: 192.168.1.50) ◄──► iptables (SNAT / DNAT)         │
│                               ▲                                        │
│                               │ IP Forwarding                          │
│                               ▼                                        │
│                    [ docker0 Bridge (172.17.0.1/16) ]                  │
│                        ▲                    ▲                          │
│                        │                    │                          │
│                   veth7a1b9c           veth3d4e5f                      │
└────────────────────────┼────────────────────┼──────────────────────────┘
             (Virtual Cable)              (Virtual Cable)
                         ▼                    ▼
┌────────────────────────┼──────────┐ ┌───────┼──────────────────────────┐
│ Container A (netns 1)  │          │ │ Container B (netns 2)            │
│ eth0 (172.17.0.2)      │          │ │ eth0 (172.17.0.3)                │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

### Step-by-Step Container Network Initialization
When you run `docker run -d --name web nginx`:
1. **Network Namespace**: The kernel creates a private network namespace (`netns`) for the container with its own loopback (`lo`), routing table, and firewall rules.
2. **Virtual Ethernet Pair (`veth`)**: Docker creates a pair of connected virtual network interfaces (like a virtual Ethernet cable).
   - One end stays in the host root namespace and is attached to the `docker0` bridge (named `vethXXXX`).
   - The other end is pushed into the container's network namespace and renamed to **`eth0`**.
3. **IP Allocation**: Docker allocates an IP from the `docker0` pool (e.g., `172.17.0.2`) and assigns `172.17.0.1` as the container's default gateway.

---

## 2. Packet Flow: How Traffic Actually Travels

### Scenario A: Inter-Container Communication (Same Bridge)
When Container A (`172.17.0.2`) sends a packet to Container B (`172.17.0.3`):
1. Container A checks its local routing table; `172.17.0.3` is on the same `/16` subnet.
2. Container A broadcasts an **ARP request** asking for the MAC address of `172.17.0.3`.
3. The ARP packet travels out `eth0`, through the `veth` pair, into the `docker0` bridge.
4. `docker0` functions like a Layer 2 hardware switch: it floods the ARP request to all attached `veth` interfaces.
5. Container B answers with its virtual MAC address.
6. Container A sends IP packets directly to Container B via Layer 2 switching on `docker0` without ever touching physical interfaces.

### Scenario B: Outbound Traffic to Internet (SNAT / IP Masquerading)
When a container calls an external API (`curl https://api.stripe.com`):
1. The destination IP is outside `172.17.0.0/16`, so the container routes the packet to its default gateway: `172.17.0.1` (`docker0`).
2. Linux kernel packet forwarding (`net.ipv4.ip_forward=1`) routes the packet from `docker0` toward the host's physical network card (`eth0`).
3. **Source NAT (SNAT)**: The private IP `172.17.0.2` is not routable on the public internet. Before the packet leaves `eth0`, the kernel's `iptables` NAT table applies the **MASQUERADE** rule:

```bash
# Docker's automatic iptables SNAT rule:
iptables -t nat -A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE
```

4. The host rewrites the source IP from `172.17.0.2` to the host's public/LAN IP (`192.168.1.50`). When Stripe responds, the host unwinds the NAT table and forwards the reply back to the container.

### Scenario C: Inbound Traffic & Port Publishing (DNAT)
When you run `docker run -d -p 8080:80 nginx`:
1. External client sends traffic to host port: `192.168.1.50:8080`.
2. **Destination NAT (DNAT)**: The host kernel intercepts the packet in the `PREROUTING` chain and forwards it into the custom `DOCKER` iptables chain:

```bash
# Docker's automatic iptables DNAT rule:
iptables -t nat -A DOCKER -p tcp --dport 8080 -j DNAT --to-destination 172.17.0.2:80
```

3. The packet destination IP is rewritten from `192.168.1.50:8080` to `172.17.0.2:80`.
4. The kernel routes the packet across `docker0` to the container's `eth0`.

---

## 3. User-Defined Bridge vs Default Bridge (DNS Resolution)

```bash
# Create an isolated user-defined bridge network:
docker network create my-app-net
```

| Networking Capability | Default `bridge` (`docker0`) | User-Defined Bridge (`my-app-net`) |
|---|---|---|
| **Automatic DNS Resolution** | ❌ **No**: Must link via legacy `--link` or connect by raw IP | ✅ **Yes**: Automatic container name & alias DNS resolution |
| **Embedded DNS Server** | ❌ None (uses host `/etc/resolv.conf`) | ✅ Dedicated DNS server running on **`127.0.0.11`** |
| **Network Isolation** | ❌ All unassigned containers share `docker0` | ✅ Complete network segment isolation |
| **Hot-Plug NICs** | ❌ Must recreate container to connect | ✅ `docker network connect/disconnect` on live containers |

```
Embedded DNS Resolution Flow (User-Defined Network):
Container "api"                                    Docker Daemon DNS
      │                                                   │
      │─── 1. DNS Query: "A db" ─────────────────────────►│ (UDP 127.0.0.11:53)
      │                                                   │
      │◄── 2. DNS Answer: "db -> 172.18.0.3" ─────────────│ (Resolved via container name)
      │                                                   │
      │─── 3. TCP Connect: 172.18.0.3:5432 ───────────────► Container "db"
```

---

## 4. Docker Network Drivers

| Driver | Scope | Architecture & Behavior | Best Used For |
|---|---|---|---|
| **`bridge`** | Single Host | Default software bridge + `veth` pairs + `iptables` NAT. | Standard microservices running on a single host. |
| **`host`** | Single Host | Bypasses `veth` and `docker0`. Container shares the host network namespace directly. Zero NAT overhead. | Ultra-low latency workloads (e.g. trading, high-volume streaming). |
| **`none`** | Single Host | Disables all network interfaces except `lo` (127.0.0.1). Completely air-gapped. | Secure batch compute, isolated cryptographic token generation. |
| **`macvlan`** | Single Host | Assigns a physical MAC address to container `eth0`. Container appears as a distinct physical machine on physical LAN. | Legacy enterprise apps expecting direct Layer 2 switch presence. |
| **`overlay`** | Multi-Host | Uses VXLAN (UDP port 4789) encapsulation to connect containers across multiple Docker Swarm host nodes. | Multi-host Docker Swarm clusters (superseded by Kubernetes CNI). |

---

## 5. Practical Production Diagnostics

```bash
# 1. Inspect container IP, gateway, and MAC address:
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} (Gateway: {{.Gateway}}){{end}}' my-container

# 2. Inspect active Docker iptables rules:
sudo iptables -t nat -L DOCKER -n -v

# 3. Check veth interfaces attached to docker0 bridge:
brctl show docker0
# or with modern iproute2:
ip link show master docker0

# 4. Test embedded DNS resolution from inside a container:
docker run --rm --network my-app-net busybox nslookup db
```

---

## Interview Questions & Answers

### Q1. How does Docker isolate container network stacks on the same physical host?
> Docker utilizes **Linux Network Namespaces (`netns`)**. When a container starts, the kernel creates an independent network namespace containing its own routing table, loopback interface, iptables chains, and socket port space. Docker creates a **virtual ethernet pair (`veth`)**: one end attaches to the host bridge `docker0` as `vethXXXX`, while the peer end is placed inside the container namespace and renamed `eth0`.

### Q2. What happens under the hood when you publish a port with `-p 8080:80`?
> Docker sets up a **Destination NAT (DNAT)** rule in the Linux kernel `iptables` NAT table under the `DOCKER` chain:
> `iptables -t nat -A DOCKER -p tcp --dport 8080 -j DNAT --to-destination <container_ip>:80`
> When an incoming TCP packet arrives on host port 8080, netfilter rewrites the destination IP from the host's IP to the container's private IP (`172.17.0.X:80`) and forwards it across the `docker0` bridge.

### Q3. Why can containers resolve each other by name on a custom bridge but not on the default `docker0` bridge?
> On the default `docker0` bridge, Docker does not provide internal DNS for backwards compatibility; containers inherit the host's `/etc/resolv.conf` and can only communicate via IP or deprecated `--link` flags. When you create a **user-defined bridge**, Docker automatically spins up an internal DNS server listening on **`127.0.0.11:53`** inside each container's namespace, dynamically mapping container names and network aliases to their current IP addresses.

---

## Related Pages

- [Docker Fundamentals](./01-docker-fundamentals.md)
- [VMs vs Docker vs Kubernetes](./00a-vm-docker-k8s-explained.md)
- [Docker Compose Multi-Container Orchestration](./06-docker-compose.md)
- [Kubernetes Networking & CNI](./10-kubernetes-networking.md)
