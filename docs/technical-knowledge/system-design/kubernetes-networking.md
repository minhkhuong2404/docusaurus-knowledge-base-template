---
id: kubernetes-networking
title: Kubernetes Networking — CNI Architectures, Kube-Proxy Internals & eBPF
sidebar_label: K8s Networking
description: Comprehensive senior principal engineering guide to Kubernetes networking, detailing Linux netns veth pairs, kube-proxy evolution (iptables vs IPVS vs eBPF), overlay vs underlay CNI plugins, and the ndots:5 CoreDNS storm.
tags: [system-design, microservices, networking, kubernetes, cni, ebpf, cilium, calico]
---

import KubernetesNetworkingDiagram from '@site/src/components/KubernetesNetworkingDiagram';

# Kubernetes Networking — CNI, Kube-Proxy & eBPF

Kubernetes enforces a declarative, flat IP-per-Pod networking model. Every Pod receives its own unique routable IP address, eliminating port conflicts and allowing microservices to communicate across physical worker nodes without Network Address Translation (NAT).

Under the hood, this abstraction is powered by **Linux network namespaces**, **Container Network Interface (CNI) plugins**, **Netfilter kernel pipelines**, and increasingly, **eBPF socket programs**.

---

## 1. The Fundamental Kubernetes Network Model

Kubernetes imposes four foundational networking invariants:

1. **All Pods can communicate with all other Pods** without relying on NAT.
2. **All Nodes can communicate with all Pods** (and vice versa) without NAT.
3. **The IP that a Pod sees itself as** is the exact same IP that all other Pods see it as (no masquerading).
4. **Agents on a node (e.g. kubelet)** can communicate with all Pods on that node.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE FOUR K8S NETWORKING COMMUNICATION TIERS                     │
│                                                                                        │
│   1. Container-to-Container (Within same Pod): Shared network namespace (localhost)   │
│   2. Pod-to-Pod (Across different Nodes): Coordinated by CNI (Flat L3 Routing)         │
│   3. Pod-to-Service: Virtual IP (ClusterIP) translated in-kernel via Kube-Proxy / eBPF │
│   4. External-to-Service: Ingress, Gateway API, or Cloud Load Balancers                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

<KubernetesNetworkingDiagram />

---

## 2. Pod-to-Pod Plumbing: Linux Namespaces & `veth` Pairs

How does a packet physically travel from Container A on Node 1 to Container B on Node 2?

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        POD NETWORK NAMESPACE & VETH WIRING                             │
│                                                                                        │
│   NODE 1 (Worker VM)                                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────┐       │
│   │ POD NETWORK NAMESPACE (netns: pod-1)                                       │       │
│   │ IP: 10.244.1.5/24                                                          │       │
│   │ [ eth0 ] ──────────────────────────────────────────────┐                   │       │
│   └────────────────────────────────────────────────────────┼───────────────────┘       │
│                                                            │ (Virtual Ethernet Cable)  │
│   HOST ROOT NAMESPACE (netns: default)                     │                           │
│   ┌────────────────────────────────────────────────────────┼───────────────────┐       │
│   │ [ veth-pod1 ] <────────────────────────────────────────┘                   │       │
│   │      │                                                                     │       │
│   │      ▼                                                                     │       │
│   │ [ cbr0 / cni0 Linux Bridge ] ──> [ iptables / IPVS ] ──> [ Physical eth0 ] │       │
│   └───────────────────────────────────────────────────────────────┬────────────┘       │
│                                                                   │                    │
│                                              Physical Network     │ 192.168.1.100      │
│                                              (VXLAN / Direct L3)  ▼                    │
│                                                              [ Physical Network Wire ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Virtual Ethernet Pair (`veth`)**:
   - When a Pod starts, the CNI plugin creates a `veth` pair (acting like a bidirectional virtual ethernet pipe).
   - One end is placed inside the Pod's isolated network namespace (`netns`) and renamed `eth0`.
   - The other end remains in the host's root network namespace (e.g. `vethb8f72a`).
2. **Bridge / Routing**:
   - Packets leave the Pod via `eth0`, travel through the `veth` pair, and enter the host root namespace.
   - The host Linux kernel inspects the destination IP against its routing table and forwards the packet out the physical network interface (`eth0`).

---

## 3. The Evolution of Kube-Proxy: Userspace to eBPF

A Kubernetes **Service IP (ClusterIP)** is not bound to any physical network interface or container. It is a **virtual IP (VIP)** that exists purely as routing rules inside the Linux kernel. 

The node agent responsible for programming these virtual rules is **`kube-proxy`**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KUBE-PROXY ROUTING MODES EVOLUTION                              │
│                                                                                        │
│  1. Userspace Mode (Historic)                                                          │
│     Packet -> Kernel Netfilter -> Userspace Kube-Proxy -> Kernel -> Pod                │
│     Catastrophic context switching overhead (Ring 3 <-> Ring 0).                       │
│                                                                                        │
│  2. iptables Mode (Default in Legacy Clusters)                                         │
│     Packet -> Kernel Netfilter -> Sequential Rule Scan -> DNAT to Pod IP               │
│     O(N) sequential search; rule updates lock kernel memory at scale.                  │
│                                                                                        │
│  3. IPVS Mode (High-Scale Production)                                                  │
│     Packet -> Kernel IP Virtual Server Hash Table -> O(1) Lookup -> DNAT to Pod IP     │
│     Fast hash tables; supports weighted round-robin and least-connections.             │
│                                                                                        │
│  4. eBPF Mode (Cilium / Modern Cloud-Native)                                           │
│     Packet -> eBPF Hook at Socket / XDP Layer -> Directly rewrites packet to Pod      │
│     Completely bypasses iptables, conntrack, and kube-proxy; maximum line rate.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 The iptables $O(N)$ Scalability Wall
In `iptables` mode, `kube-proxy` generates deterministic Netfilter chains (`KUBE-SERVICES`, `KUBE-SVC-XXX`, `KUBE-SEP-XXX`):
- When a packet hits a ClusterIP, the kernel traverses the rules sequentially.
- **The Bottleneck**: In a large cluster with $5,000$ Services and $40,000$ Pod endpoints, iptables contains over **`50,000 rules`**.
- Adding or terminating a single Pod forces `kube-proxy` to rewrite the entire iptables rule blob and commit it via `iptables-restore`. During heavy scaling events, this causes massive CPU spikes and increases packet latency by hundreds of milliseconds.

### 3.2 The eBPF Revolution (Cilium)
Modern high-performance clusters replace `kube-proxy` entirely with **eBPF (Extended Berkeley Packet Filter)**:
- eBPF programs attach directly to network driver hooks (**XDP - eXpress Data Path**) and traffic control (**tc**).
- When a packet arrives, eBPF inspects memory maps in kernel space in $O(1)$ time, performs destination address translation (DNAT), and forwards the packet directly to the target `veth` interface.
- Bypasses Linux Netfilter and `conntrack` tables entirely, reducing network latency by up to **`40%`**.

---

## 4. CNI Plugin Architectures: Overlay vs. Flat Routing

The **Container Network Interface (CNI)** plugin is responsible for assigning Pod IP addresses and managing cross-node packet delivery.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        OVERLAY (VXLAN) VS. UNDERLAY (FLAT L3)                          │
│                                                                                        │
│  APPROACH A: OVERLAY NETWORK (VXLAN / Geneve - e.g. Flannel, Calico VXLAN)             │
│  ┌────────────────────────────────────────────────────────────────────────────┐        │
│  │ Outer Ethernet Header | Outer IP (Host) | UDP (Port 4789) | Inner Pod IP   │        │
│  └────────────────────────────────────────────────────────────────────────────┘        │
│  • Envelopes original Pod packet inside an outer UDP tunnel packet.                    │
│  • Pros: Works on any cloud or on-prem datacenter without network coordination.        │
│  • Cons: 50-byte MTU overhead (must lower MTU to 1450); CPU overhead for encap/decap.  │
│                                                                                        │
│  APPROACH B: DIRECT L3 FLAT ROUTING (e.g. AWS VPC CNI, Azure CNI, Calico BGP)          │
│  ┌────────────────────────────────────────────────────────────────────────────┐        │
│  │ Standard Ethernet Header | Native Routable Pod IP (VPC Subnet)             │        │
│  └────────────────────────────────────────────────────────────────────────────┘        │
│  • Every Pod receives a real, routable IP directly from the underlying VPC subnet.     │
│  • Pros: Zero encapsulation overhead; hardware line-rate throughput; native VPC ACLs.  │
│  • Cons: Exhausts VPC IP space (CIDR exhaustion); bound to cloud ENI adapter limits.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. CoreDNS Performance & The `ndots:5` Resolution Storm

A notoriously common production failure mode in Kubernetes is high DNS latency and CoreDNS CPU throttling caused by Linux resolver semantics:

### The `ndots:5` Trap
By default, the Kubernetes kubelet injects the following configuration into every container's `/etc/resolv.conf`:
```text
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```
- **The Rule**: If a domain name contains fewer dots (`.`) than the `ndots` threshold (default `5`), the resolver appends all local search domains sequentially **before** attempting to resolve the bare domain name.
- **The Impact**: When your application queries `api.stripe.com` (which contains 2 dots, $2 < 5$), the resolver makes **four sequential DNS requests**:
  1. `api.stripe.com.default.svc.cluster.local` $\to$ NXDOMAIN
  2. `api.stripe.com.svc.cluster.local` $\to$ NXDOMAIN
  3. `api.stripe.com.cluster.local` $\to$ NXDOMAIN
  4. `api.stripe.com` $\to$ SUCCESS!
- This causes an explosive **4x DNS query amplification** for every external API call, overwhelming CoreDNS pods and triggering latency timeouts.

#### Production Mitigations:
1. **Append a Trailing Dot**: Query `api.stripe.com.` directly in application configuration to indicate an absolute domain, bypassing search expansion.
2. **Deploy `NodeLocal DNSCache`**: Runs an in-memory caching DNS daemonset on every worker node, serving queries locally via loopback.
3. **Override Pod Spec**: Set `ndots:2` in the Pod's `dnsConfig`.

---

## 6. Service Types & Ingress Evolution

| Mechanism | Operating Layer | Traffic Scope | Architectural Trade-Off |
|---|---|---|---|
| **ClusterIP** | L4 (Virtual IP) | Internal cluster only | Default service type; stable virtual IP across pod churn |
| **NodePort** | L4 (Static Port) | Cluster Node IP + Port | Binds static port ($30000\text{–}32767$) across all nodes; insecure for production |
| **LoadBalancer** | L4 (Cloud NLB/ALB)| External ingress | Provisions external cloud load balancer; expensive at scale (\$18/mo per service) |
| **Ingress** | L7 (HTTP/HTTPS) | External ingress | Single IP routes multiple services via path/host; brittle vendor annotations |
| **Gateway API** | L4 / L7 (Next-Gen) | External & internal mesh | Role-oriented decoupling (`GatewayClass`, `Gateway`, `HTTPRoute`); native canary splits |

---

## Related Documentation

- [Envoy Proxy Architecture & Dynamic xDS Routing](./envoy-proxy.md)
- [Service Decomposition & DDD Bounded Contexts](./service-decomposition.md)
- [Advanced Consensus Protocols & BFT](./advanced-consensus-bft.md)
- [Consumer-Driven Contract Testing in Microservices](./contract-testing.md)
- [Split-Brain & Multi-Leader Divergence in Distributed Databases](./split-brain-multi-leader-divergence.md)
