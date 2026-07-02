---
id: service-mesh
title: Service Mesh
sidebar_label: Service Mesh
description: Guide to Service Mesh architecture (Control Plane vs Data Plane), mTLS, traffic management, and Istio configuration in production.
tags: [system-design, microservices, service-mesh, kubernetes, istio]
---

# Service Mesh

A **Service Mesh** is a dedicated infrastructure layer added to microservices deployments to handle secure, fast, and reliable service-to-service communication. It shifts network management out of application code into sidecar proxies.

---

## Architecture: Control Plane vs. Data Plane

A service mesh divides its responsibilities into two distinct architectural planes:

```text
                               ┌───────────────────┐
                               │   Control Plane   │
                               │   (e.g., Istiod)  │
                               └─────────┬─────────┘
                    Pushes configuration │ (xDS API)
                                         ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ Data Plane (Pods)                                                      │
 │                                                                        │
 │   ┌─────────────┐       mTLS (Secured)        ┌─────────────┐          │
 │   │ Pod A       │ ──────────────────────────► │ Pod B       │          │
 │   │  ┌───────┐  │                             │  ┌───────┐  │          │
 │   │  │  App  │  │                             │  │  App  │  │          │
 │   │  └───┬───┘  │                             │  └───▲───┘  │          │
 │   │      │ (HTTP)                             │      │ (HTTP)          │
 │   │  ┌───▼───┐  │                             │  ┌───┴───┐  │          │
 │   │  │ Envoy │  │                             │  │ Envoy │  │          │
 │   │  └───────┘  │                             │  └───────┘  │          │
 │   └─────────────┘                             └─────────────┘          │
 └────────────────────────────────────────────────────────────────────────┘
```

1. **Data Plane**: A network of high-performance sidecar proxies (typically **Envoy**) deployed alongside each application instance. These proxies intercept all network traffic, performing routing, TLS encryption, and telemetry collection.
2. **Control Plane**: A centralized component (e.g., **Istiod** in Istio) that manages the mesh configuration, generates security certificates, and translates high-level YAML policies into dynamic configuration scripts pushed to the Envoy sidecar proxies.

---

## Setup & Implementation (Istio)

Rather than writing retry logic or TLS checks in Java/Go, developers define infrastructure policies via Kubernetes Custom Resource Definitions (CRDs).

### 1. Canary Traffic Routing Policy
The manifest below configures routing 90% of traffic to the stable `v1` release and 10% to the new `v2` release of the `order-service`:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service-routing
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: order-service-subsets
spec:
  host: order-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

### 2. Strict Mutual TLS (mTLS) Security Policy
Enforce zero-trust security by instructing sidecar proxies to only accept encrypted TLS requests:

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: prod
spec:
  mtls:
    mode: STRICT # Rejects plain HTTP/TCP traffic completely
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Operational Decoupling**: Application teams focus on code; Platform teams configure mesh routing and security rules. | **High Latency Overhead**: Every service-to-service call goes through two proxy hops, adding sub-millisecond latency. |
| **Out-of-the-box Zero Trust**: Automatic mutual TLS (mTLS) and certificate rotation without changing code. | **Extreme Complexity**: Debugging failed connections requires deep knowledge of iptables, Envoy logs, and Control Plane state. |
| **Fine-Grained Telemetry**: Automatically generates network call logs, latency percentiles, and request traces. | **Resource Utilization**: Sidecar proxies consume non-trivial amounts of RAM and CPU on every single node. |

---

## Common Gotchas & Anti-Patterns

1. **Double Encryption**: Configuring application-level SSL/TLS inside the Docker container while also enabling Istio PeerAuthentication mTLS. The Envoy proxy cannot inspect the encrypted body, breaking path-based routing and headers. Let Envoy handle TLS.
2. **xDS Config Overload**: Having too many VirtualServices, DestinationRules, and endpoints in a massive cluster. The control plane pushes huge config updates to every sidecar, overloading memory. 
   - *Solution*: Use the `Sidecar` resource config in Istio to restrict which services a proxy can discover.
3. **Ignoring Fail-Open Configs**: During deployment, if the sidecar fails to initialize, the application might start accepting requests without any security checks. Set strict initialization rules.
