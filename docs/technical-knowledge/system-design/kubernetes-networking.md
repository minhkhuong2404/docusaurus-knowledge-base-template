---
id: kubernetes-networking
title: Kubernetes Networking
sidebar_label: K8s Networking
description: Comprehensive guide to Kubernetes networking concepts, including Container Network Interface (CNI), Service Types, Kube-proxy, and Ingress.
tags: [system-design, microservices, networking, kubernetes, cni]
---

# Kubernetes Networking

Kubernetes imposes a flat, software-defined network model where every Pod (the basic runtime unit) gets its own unique IP address. This eliminates port conflicts and allows pods across different virtual machines to communicate directly without translating ports.

---

## The Four Kubernetes Networking Problems

Kubernetes breaks down networking into four distinct routing categories:

```text
               ┌────────────────────────────────────────────────────────┐
               │              Ingress (Outside to Cluster)              │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │             Service VIP (Cluster-Internal)             │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ Pod-to-Pod Routing (Cross-Node CNI tunnel)                               │
  │                                                                          │
  │     [ Pod A (10.244.1.5) ]                           [ Pod B (10.244.2.8) ]│
  │             │                                                ▲           │
  │             ▼                                                │           │
  │       [ Node 1 VM ] ══════════ Overlay Network ════════► [ Node 2 VM ]   │
  └──────────────────────────────────────────────────────────────────────────┘
```

1. **Container-to-Container**: Containers inside the same Pod share the same network namespace and communicate via `localhost`.
2. **Pod-to-Pod**: Every Pod has an IP. Pods communicate directly across nodes without Network Address Translation (NAT) via the **CNI (Container Network Interface)** plugin.
3. **Pod-to-Service**: Exposes a group of Pods behind a stable virtual IP (VIP) called a **Service**.
4. **External-to-Service**: Exposes services to clients outside the cluster (via **Ingress** controllers or Cloud Load Balancers).

---

## Service Types Explained

| Service Type | Scope | How It Works | Use Case |
| :--- | :--- | :--- | :--- |
| **ClusterIP** | Internal Only | Assigns a stable virtual IP (VIP) inside the cluster. | Exposing backend database or helper microservices to frontends. |
| **NodePort** | External | Opens a static port (range 30000-32767) on every node IP. | Testing or local setups where cloud load balancers aren't available. |
| **LoadBalancer** | External | Provisions a physical Cloud Load Balancer (AWS ELB/GCP NLB). | Standard way to expose APIs to the public internet in cloud providers. |
| **ExternalName** | Outbound | Maps a service to a DNS name outside the cluster (e.g., RDS DNS). | Integrating third-party external services. |

---

## Under the Hood: Kube-Proxy and IPTables

A Kubernetes Service IP (ClusterIP) is not bound to any physical network interface. Instead, a service run by Kubernetes on every worker node called **kube-proxy** coordinates these virtual connections:

```text
Request to Service IP (10.96.0.10:80)
                │
                ▼
      Kernel Space (iptables rules programmed by kube-proxy)
                │
                ├─ (Rule matches VIP -> DNAT to Pod 1) ────► 10.244.1.5:8080 (Pod IP)
                └─ (Rule matches VIP -> DNAT to Pod 2) ────► 10.244.2.8:8080 (Pod IP)
```

- Kube-proxy watches the Kubernetes API Server for new Services and Endpoints.
- It dynamically updates Linux kernel tables (**iptables** or **IPVS**) on the host VM.
- When a packet hits a Service IP, the kernel intercepts it, translates the destination IP to a healthy Pod IP (**DNAT**), and forwards the packet directly. No extra network hop is added.

---

## CNI Plugins (Overlay Networks)

Because Pod IPs must be reachable across different hosts, a **CNI (Container Network Interface)** plugin must build and coordinate the flat virtual network. Popular CNIs include:
- **Flannel**: Extremely simple, uses VXLAN overlay tunnels to encapsulate packets.
- **Calico**: Uses Border Gateway Protocol (BGP) routing tables directly, avoiding overlay encapsulation overhead. Includes strong network security policies.
- **Cilium**: Uses modern Linux **eBPF (Extended Berkeley Packet Filter)** directly inside the kernel, providing superior performance and built-in service routing without iptables rules.

---

## Ingress Controllers (L7 Routing)

An **Ingress** resource is a set of rules that allow inbound connections to reach cluster services:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80
      - path: /catalog
        pathType: Prefix
        backend:
          service:
            name: catalog-service
            port:
              number: 80
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Flat Address Space**: Simplifies service calls; no need to translate port mappings. | **High Complexity**: Tracking route paths through overlays, iptables, and services is extremely difficult. |
| **Declarative Scaling**: Adding new replicas automatically updates the Service endpoint pool. | **Kernel Overhead**: Massive clusters with thousands of services generate huge iptables sets, slowing down packet routing. |
| **Separation of Infrastructure**: Routing rules, TLS termination, and hostnames are configured outside the application artifact. | **CNI Troubleshooting**: If the CNI controller daemon sets crash, all inter-pod communications fail instantly. |

---

## Common Gotchas & Anti-Patterns

1. **Massive IPTables latency**: In clusters with > 5,000 services, kube-proxy iptables matching runs sequentially, causing high CPU consumption.
   - *Solution*: Enable **IPVS** mode or migrate to a CNI like **Cilium** that bypasses iptables.
2. **Missing Readiness Probes**: If a pod boots up but does not define a readiness probe, Kubernetes will immediately add the pod's IP to the Service pool. If the application takes 20 seconds to boot, clients will receive 502/503 errors during releases.
3. **Hardcoding DNS Searches**: Using long DNS names when simple ones work. Prefer relative names (`order-service`) when communicating within the same namespace.
