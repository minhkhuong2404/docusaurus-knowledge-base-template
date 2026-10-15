---
id: networking-overview
title: Networking Knowledge Base
description: A comprehensive reference covering OSI/TCP-IP models, TCP/UDP, HTTP/HTTPS, DNS, CDN, security, sockets, REST, gRPC, WebSockets, QUIC, and more — with interview questions.
tags: [networking, overview]
sidebar_position: 1
---

import NetworkIndexOverviewDiagram from '@site/src/components/NetworkIndexOverviewDiagram';
import NetworkPacketEncapsulationDiagram from '@site/src/components/NetworkPacketEncapsulationDiagram';



# 🌐 Networking Knowledge Base

<NetworkIndexOverviewDiagram />

<NetworkPacketEncapsulationDiagram />

---


A structured guide covering everything you need to know about computer networking — from low-level protocols to distributed API design — with Java/Spring examples and interview questions throughout.

## Topics Covered

| # | Topic | Description |
|---|-------|-------------|
| 1 | [OSI & TCP/IP Models](./osi-tcpip-models.md) | Layered models, encapsulation, ARP, ICMP, request journey, middlebox placement |
| 2 | [MAC Addressing & Layer 2 Forwarding](./mac-address-and-layer-2.md) | EUI-48 MAC anatomy, CAM switch tables, ARP state machine, GARP failover, VXLAN |
| 3 | [IP Addressing & Routing](./ip-addressing-routing.md) | IPv4/IPv6, CIDR subnetting math, BGP, OSPF, DHCP DORA, NAT translation tables |
| 4 | [TCP, UDP & Transport Layer](./tcp-udp-transport-layer.md) | Handshake, flow/congestion control, TCP state machine & leak diagnosis, PMTUD, Nagle |
| 5 | [QUIC & Modern Transport](./quic-modern-transport.md) | 0-RTT resumption, stream multiplexing without HOL blocking, 3x anti-amplification, Stateless Reset, UDP GSO |
| 6 | [HTTP & HTTPS](./http-https-application-layer.md) | HTTP/1.1–3 evolution, TLS handshake, headers, caching, CORS |
| 7 | [DNS Resolution](./dns-resolution.md) | Root to authoritative resolution, record types, negative caching, K8s ndots:5 trap, Happy Eyeballs |
| 8 | [CDN & Load Balancing](../system-design/load-balancing-reliability.md) | CDN architecture, LB algorithms, health checks, Anycast |
| 9 | [Proxies, Firewalls, NAT & VPNs](./proxies-nat-firewalls.md) | Forward/reverse/SOCKS5 proxies, Netfilter conntrack, WireGuard vs IPsec, MSS clamping |
| 10 | [Tor, Onion Routing & Privacy Networks](./tor-and-privacy-networks.md) | 3-hop circuit telescoping, onion peeling cryptography, V3 rendezvous services, traffic analysis |
| 11 | [Network Security](./network-security.md) | PKI trust chains, OCSP Stapling, TLS 1.3 anti-replay, RPKI BGP validation, SYN cookies, IPsec NAT-T |
| 12 | [API Authentication & Authorization](./api-authentication-security.md) | Constant-time API keys, OAuth 2.0 PKCE, DPoP (RFC 9449), SPIFFE/SPIRE zero-trust mTLS |
| 13 | [Socket Programming & I/O Models](./socket-programming-io-models.md) | 5 Linux I/O models, epoll ET vs LT, SO_REUSEPORT, zero-copy sendfile, Virtual Thread carrier pinning |
| 14 | [REST & gRPC API Design](../system-design/api-design.md) | REST, gRPC/protobuf, GraphQL, versioning, OpenAPI |
| 15 | [WebSockets & Real-Time](../system-design/real-time-updates.md) | WS protocol, SSE, long polling, Spring WebSocket |
| 16 | [Network Performance & Optimization](./network-performance-optimization.md) | Speed of light latency hierarchy, NIC ring buffers, SoftIRQ drops, FQ-CoDel bufferbloat, BBR vs CUBIC, kTLS |
| 17 | [Service Mesh & Microservices Networking](../system-design/microservices-patterns.md) | Istio, Envoy, circuit breaker, service discovery, K8s |
| 18 | [Network Troubleshooting Tools](./network-troubleshooting-tools.md) | tcpdump, Wireshark, curl, openssl, dig, nmap, ss |
| 19 | [Application Protocols Reference](./application-protocols-reference.md) | SMTP, FTP, SSH, SNMP, NTP, MQTT, WebRTC |
| 20 | [Interview Questions — Master List](./networking-interview-questions.md) | Top questions across all topics, conntrack table exhaustion, eBPF/XDP, MTU black hole |

:::tip[Java / Spring Focus]
Java NIO, Netty, Spring WebFlux, Spring WebSocket, gRPC-Java, WebClient, Spring Security OAuth2, and Resilience4j examples are included throughout.
:::
