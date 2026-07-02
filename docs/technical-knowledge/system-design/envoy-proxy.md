---
id: envoy-proxy
title: Envoy Proxy
sidebar_label: Envoy Proxy
description: Complete guide to Envoy Proxy, its architecture, dynamic configuration via xDS API, static setups, and system-design benefits.
tags: [system-design, microservices, networking, proxy, envoy]
---

# Envoy Proxy

**Envoy** is a high-performance L4 and L7 proxy designed specifically for cloud-native microservices environments. It serves as the standard "data plane" proxy in popular service meshes (such as Istio and AWS App Mesh) due to its minimal memory footprint, fast processing speeds, and advanced dynamic configuration capabilities.

---

## Architecture: Dynamic Config and the xDS API

Unlike traditional proxies (like Nginx) that require manual configuration rewrites and process reloads to pick up changes, Envoy is built to configure itself dynamically at runtime. It implements a set of streaming gRPC APIs called the **xDS APIs**:

```text
┌────────────────────────────────────────────────────────┐
│                      Control Plane                     │
│                      (e.g. Istio)                      │
└──────────────────────────┬─────────────────────────────┘
                           │ Dynamic Updates (gRPC Streaming)
                           ▼ xDS APIs
┌────────────────────────────────────────────────────────┐
│                    Envoy Data Plane                    │
│                                                        │
│   ┌───────────────┐     ┌──────────────┐     ┌─────┐   │
│  Incoming ───────►│  Listeners    │ ───►│  Filters     │ ───►│Clust│ ──► Out
│   Traffic         │ (Port Binding)│     │  (TLS/HTTP)  │     │(IPs)│
│                   └───────────────┘     └──────────────┘     └─────┘   │
└────────────────────────────────────────────────────────┘
```

- **LDS (Listener Discovery Service)**: Configures ports and addresses Envoy binds to for incoming traffic.
- **RDS (Route Discovery Service)**: Configures HTTP header matching, paths, redirects, and virtual hosts.
- **CDS (Cluster Discovery Service)**: Configures backend groups (e.g., matching "payment-service" to backend definitions).
- **EDS (Endpoint Discovery Service)**: Configures the dynamic IPs of individual containers/pods belonging to a cluster.

---

## Setup & Implementation

Below is a standard Envoy configuration yaml acting as a static reverse proxy that terminates TLS on port 10000 and forwards calls to a backend cluster:

```yaml
# envoy.yaml
static_resources:
  listeners:
  - name: ingress_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 10000
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: backend_routing
              domains: ["*"]
              routes:
              - match:
                  prefix: "/api"
                route:
                  cluster: backend_springboot_cluster
          http_filters:
          - name: envoy.filters.http.router
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
  - name: backend_springboot_cluster
    connect_timeout: 0.25s
    type: LOGICAL_DNS
    dns_lookup_family: V4_ONLY
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: backend_springboot_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: springboot-app.prod.svc.cluster.local
                port_value: 8080
```

---

## Core Capabilities of Envoy

1. **HTTP/2 and gRPC Native**: Envoy acts as a bridge, translating public HTTP/1.1 requests into internal, highly multiplexed HTTP/2 or gRPC streams.
2. **Advanced Load Balancing**: Supports ring hash, least request, and random routing alongside standard round-robin.
3. **Out-of-the-box Observability**: Automatically generates StatsD metrics, Prometheus counters, and trace span propagation headers (`traceparent`) for incoming requests.
4. **Fault Injection**: Can intentionally introduce network delays or inject HTTP error codes (e.g., returning 500 errors to 10% of requests) to test application resilience.

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **High Performance**: Extremely fast C++ runtime with minimal memory requirements compared to JVM-based proxies. | **Configuration Complexity**: Static configuration YAML syntax is highly nested, verbose, and difficult to write by hand. |
| **No Downtime Reloads**: Dynamic updates mean routing policies change in milliseconds without killing active TCP sockets. | **Learning Curve**: Requires understanding core concepts (Listeners, Filters, Clusters, Endpoints) to debug. |
| **Extensible Filter Chain**: Highly customizable using WebAssembly (Wasm) or Lua scripts. | **Tooling Dependency**: Realizing its full power requires hosting a control plane (like Istio) to drive xDS APIs. |

---

## Common Gotchas & Anti-Patterns

1. **Incorrect Route Ordering**: Ordering wildcard prefix matches (`/`) above specific matches (`/api/v1/orders`). Envoy matches routes in the order they are defined; placing wildcards first will steal all traffic.
2. **Missing Router Filter**: Forgetting to add `envoy.filters.http.router` at the end of the http_filters array. Without this filter, Envoy will process the connection but fail to forward the packet, resulting in empty responses.
3. **Connection Pooling Pitfalls**: Re-opening TCP connections on every call. Ensure that connection limits, keep-alive parameters, and HTTP/2 max concurrent streams are tuned to avoid resource exhaustion under load.
