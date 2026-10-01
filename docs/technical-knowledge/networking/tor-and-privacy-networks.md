---
id: tor-and-privacy-networks
title: Tor, Onion Routing & Privacy Networks
description: Senior deep dive into Tor onion routing, 3-hop circuit telescoping, cell peeling cryptography, V3 hidden services, traffic correlation attacks, and Tor vs VPN vs Proxy comparison.
tags: [networking, tor, onion-routing, privacy, cryptography, security, proxy, vpn]
sidebar_position: 6
---

import TorCircuitDiagram from '@site/src/components/TorCircuitDiagram';

# Tor, Onion Routing & Privacy Networks

In traditional networking, internet traffic is routed hop-by-hop based on destination IP addresses visible in packet headers. While TLS encrypts application payloads, **metadata** (who you communicate with, when, packet sizes, and transmission frequency) remains exposed to intermediate Autonomous Systems (ASes), ISPs, and state-level surveillance.

Single-hop solutions (such as commercial VPNs or forward proxies) merely shift trust: the VPN provider has complete visibility into all ingress and egress connections, representing a single point of failure and subpoena vulnerability.

**Tor (The Onion Router)** solves this by distributing trust across a decentralized, multi-hop overlay network using **layered telescoping cryptography**.

---

## Interactive Tor Circuit & Onion Peeling Visualizer

Explore how 3-hop circuits are constructed, simulate step-by-step onion encryption peeling across relays, and inspect V3 Rendezvous Hidden Services:

<TorCircuitDiagram />

---

## 1. The Onion Routing Principle & 3-Hop Circuits

The foundational premise of Onion Routing (developed by the US Naval Research Laboratory and refined by the Tor Project) is:

> **No single node in the circuit should ever know both the Source IP address (the client) and the Destination IP address (the server).**

```
+──────────────+         TLS Tunnel 1         +──────────────+         TLS Tunnel 2         +──────────────+         TLS Tunnel 3         +──────────────+          Plaintext or TLS          +──────────────+
|  Tor Client  | ───────────────────────────> |  Guard Node  | ───────────────────────────> | Middle Relay | ───────────────────────────> |  Exit Node   | ─────────────────────────────────> | Target Server|
| (198.51.100.5)|  Payload: E_G(E_M(E_E(P)))   | (Entry Gate) |     Payload: E_M(E_E(P))     | (Transit)    |       Payload: E_E(P)        | (Egress Gate)|       Payload: P (or TLS App)     | (93.184.216.34)
+──────────────+                              +──────────────+                              +──────────────+                              +──────────────+                                  +──────────────+
  Sees: Guard IP                                Sees: Client IP                               Sees: Guard IP                                Sees: Middle IP                                   Sees: Exit Node IP
  Knows: Dest                                   Sees: Middle IP                               Sees: Exit IP                                 Sees: Dest IP                                     Blind to: Client IP
                                                Blind to: Dest                                Blind to: Client & Dest                       Blind to: Client IP
```

### Why Exactly Three Hops?

Tor mandates a minimum of **three relays** for clearweb internet traffic:
1. **Guard / Entry Relay**: Directly connects to the client. Sees the client's real public IP, but has no knowledge of the final destination or application data.
2. **Middle Relay**: Sits between Guard and Exit. Knows only that it received traffic from Relay 1 and forwards it to Relay 2. It is completely blind to both the origin client and the target server.
3. **Exit Relay**: Connects to the destination web server. Sees the target IP and sends requests on behalf of the client. It knows what site is being visited, but is completely blind to who visited it.

#### Why Not 2 Hops?
With 2 hops (Guard $\to$ Exit), if the Guard and Exit collude or are operated by the same malicious actor (e.g. an AS or cloud provider), they can instantly correlate connection timestamps and packet volumes to deanonymize the client.

#### Why Not 4+ Hops?
Adding a fourth or fifth relay provides negligible cryptographic entropy improvement against end-to-end timing correlation while dramatically degrading throughput and multiplying TCP round-trip latency ($\text{RTT}_{\text{total}} = \sum_{i=1}^N \text{RTT}_i$). Three hops is the mathematically optimal trade-off between anonymity and usability.

---

## 2. Telescoping Circuit Cryptography (ntor Handshake)

A Tor circuit is not created in a single broadcast. Doing so would expose the entire circuit path to every relay. Instead, Tor uses **telescoping circuit extension**: the client negotiates ephemeral session keys with each relay one-by-one through the already-encrypted tunnel.

```
Client                                  Guard (Relay 1)            Middle (Relay 2)           Exit (Relay 3)
  │                                           │                          │                          │
  │─── 1. CREATE2 (ntor ephemeral Curve25519) ─>│                          │                          │
  │<── 2. CREATED2 (Session Key K_Guard) ─────│                          │                          │
  │                                           │                          │                          │
  │════ Encrypted with K_Guard ═══════════════│                          │                          │
  │─── 3. RELAY_EXTEND2 (to Middle) ─────────>│─── CREATE2 (ntor) ──────>│                          │
  │<── 4. RELAY_EXTENDED2 (Key K_Middle) ─────│<── CREATED2 ─────────────│                          │
  │                                           │                          │                          │
  │════ Encrypted with K_Guard + K_Middle ═══════════════════════════════│                          │
  │─── 5. RELAY_EXTEND2 (to Exit) ───────────>│─────────────────────────>│─── CREATE2 (ntor) ──────>│
  │<── 6. RELAY_EXTENDED2 (Key K_Exit) ───────│<─────────────────────────│<── CREATED2 ─────────────│
  │                                                                                                 │
  │  Circuit Established! Client holds: K_Guard, K_Middle, K_Exit                                   │
```

### The ntor Handshake

The modern Tor key exchange uses the **ntor protocol** based on Curve25519, HKDF-SHA256, and HMAC:
1. The client looks up Relay 1's long-term identity key $B$ and onion key $Y$ from the consensus document published by Directory Authorities.
2. The client generates an ephemeral Curve25519 keypair $(x, X = x \cdot G)$.
3. The client sends a `CREATE2` cell containing $X$ and identity fingerprint $B$.
4. The relay generates an ephemeral keypair $(y, Y = y \cdot G)$ and computes shared secrets using Diffie-Hellman operations:
   $$K = \text{HKDF}(\text{DH}(x, Y) \parallel \text{DH}(x, B))$$
5. The relay responds with a `CREATED2` cell containing $Y$ and an authentication tag.
6. Both parties derive forward-secure symmetric session keys ($K_{\text{forward}}, K_{\text{backward}}$) using AES-128-CTR or ChaCha20-Poly1305.

### Layered Symmetric Onion Encryption

When sending data payload $P$ to the web:
1. Client encrypts with Exit Key: $C_3 = E_{K_{\text{Exit}}}(P)$
2. Client encrypts with Middle Key: $C_2 = E_{K_{\text{Middle}}}(C_3)$
3. Client encrypts with Guard Key: $C_1 = E_{K_{\text{Guard}}}(C_2)$
4. Client sends $C_1$ to the Guard over physical TLS.

**Peeling in Transit:**
- Guard receives $C_1$, decrypts with $K_{\text{Guard}}$, recovers $C_2$, and forwards to Middle.
- Middle receives $C_2$, decrypts with $K_{\text{Middle}}$, recovers $C_3$, and forwards to Exit.
- Exit receives $C_3$, decrypts with $K_{\text{Exit}}$, recovers the inner plaintext payload $P$, and transmits it to the destination web server.

---

### Fixed 514-Byte Cells & Padding

A key defense against passive traffic analysis is cell uniformity. All communication within Tor circuits is fragmented or padded into fixed-length **514-byte cells**:

```
+──────────────────┬─────────────────┬─────────────────┬──────────────────┬───────────────────────+
| Circuit ID (4B)  |   Command (1B)  | Stream ID (2B)  |  Length (2B)     |   Payload (505 Bytes) |
+──────────────────┴─────────────────┴─────────────────┴──────────────────┴───────────────────────+
```

If an HTTP request is only 150 bytes, Tor pads the remaining 355 bytes with zeroes before encrypting. A wire observer outside the network sees uniform 514-byte frames, preventing packet-size fingerprinting (e.g. distinguishing a Google search request from a Wikipedia lookup based on byte counts).

---

## 3. Guard Pinning (Anti-Sybil Defense)

One might intuitively assume that picking a random Guard relay for every connection increases privacy. In reality, **random entry rotation guarantees deanonymization**.

### The Predecessor Attack Mathematics

Suppose an adversary (e.g. an intelligence agency or ISP coalition) controls $C = 10\%$ of all Tor relays.
If a client chooses a new random Guard and Exit relay for every circuit, the probability that the adversary controls *both* the Guard and the Exit for a given circuit is:

$$P(\text{collusion}) = \left(\frac{C_{\text{guard}}}{N_{\text{guard}}}\right) \times \left(\frac{C_{\text{exit}}}{N_{\text{exit}}}\right) = 0.10 \times 0.10 = 0.01 \text{ (1\%)}$$

While a 1% risk per circuit sounds small, if a user opens 50 circuits per day over a year ($N = 18,250\text{ circuits}$):

$$P(\text{compromise}) = 1 - (1 - 0.01)^{18250} \approx 1.0 \text{ (100\% Guaranteed)}$$

### The Production Defense: Long-Term Guard Pinning
Tor implements **Guard Pinning** (RFC 8484 / Tor Proposal 271):
- When Tor Browser is first initialized, it selects **1 to 3 vetted Guard nodes** and stores their identity fingerprints permanently on disk.
- It pins these same Guards for **60 to 120 days**.
- **Outcome**: The user either picks safe Guards (in which case 100% of circuits remain private) or picks a malicious Guard (10% chance). Even in the unlucky 10% case, the adversary only sees the client's entry, but still has only a 10% chance of controlling the exit node for any circuit. The user's lifetime probability of total deanonymization is bounded at 1%, rather than approaching 100%.

---

## 4. Exit Node Security & The "Tor + HTTPS" Invariant

A frequent misconception is that using Tor replaces the need for HTTPS.

```
[ Tor Client ] ===(Encrypted)===> [ Guard ] ===(Encrypted)===> [ Middle ] ===(Encrypted)===> [ Exit Node ] ───(PLAINTEXT)───> [ Web Server ]
                                                                                                    │
                                                                                             [ Malicious Operator ]
                                                                                             (Sniffs Passwords & Cookies!)
```

### Rogue Exit Relays
Because anyone in the world can run an Exit Node, malicious actors intentionally operate exit relays:
- **Sniffing Unencrypted Traffic**: If a user logs into an unencrypted `http://` site, the exit relay sees passwords, credit cards, and session cookies in plaintext.
- **SSL Stripping**: Malicious exit relays intercept HTTP requests and strip HTTPS redirect headers (`Location: https://...` or HSTS), maintaining an unencrypted session to the client while speaking HTTPS to the server.
- **Payload Tampering**: Exit nodes can inject cryptomining JavaScript or malware executables into plain HTTP responses.

### The Invariant: Tor + HTTPS
- **Tor protects the Identity**: The origin server cannot see *who* you are (only the exit relay IP).
- **HTTPS protects the Content**: The exit relay cannot see *what* you are saying (only encrypted TLS ciphertext).

---

## 5. V3 Onion Services (Hidden Services `.onion`)

When connecting to public websites, traffic must egress through an exit node. **Onion Services** eliminate exit nodes completely: both client and server remain inside the Tor network, providing bidirectional anonymity.

Modern V3 Onion addresses (e.g. `expyuzz5wqqfdgah56...onion`) are 56-character Base32 strings representing the **Ed25519 public key** of the service.

```
                        ┌──────────────────────────────────────────────┐
                        │ Distributed Hash Table Directory (HSDir)     │
                        └──────────────────────┬───────────────────────┘
                                               ▲ 1. Publish Descriptor
                                               │    (Service Key + Intro Points)
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               │                                                               │
               ▼ 2. Fetch Descriptor                                           ▼
       ┌─────────────────┐                                            ┌─────────────────┐
       │   Tor Client    │                                            │  Onion Service  │
       └────────┬────────┘                                            └────────┬────────┘
                │ 3. Build 3-Hop Circuit                                       │
                │    with Cookie "xyz"                                         │
                ▼                                                              │
       ┌─────────────────┐                                                     │
       │ Rendezvous Point│ <──────────────── 5. Connect 3-Hop Circuit ────────┘
       └────────┬────────┘                      with Cookie "xyz"
                │
                └─────── 6. End-to-End Encrypted Tunnel Joined (6 Hops Total!)
```

### The 6-Step Rendezvous Protocol

1. **Service Initialization**: The hidden service chooses several random relays as **Introduction Points** and advertises its Ed25519 public key and intro points in a signed descriptor to the distributed directory (HSDir).
2. **Client Descriptor Lookup**: The client enters `http://<56-chars>.onion`. It computes the descriptor ID from the `.onion` address and fetches the descriptor from the HSDir.
3. **Rendezvous Point Selection**: The client selects a random relay to act as the **Rendezvous Point (RP)**, builds a 3-hop circuit to it, and gives it a one-time secret cookie.
4. **Introduction Notification**: The client builds a 3-hop circuit to one of the service's **Introduction Points** and sends an encrypted message containing the Rendezvous Point identity and secret cookie.
5. **Service Connects**: The service receives the introduction, builds its own 3-hop circuit to the Rendezvous Point, and presents the secret cookie.
6. **Bridge Establishment**: The Rendezvous Point joins the two circuits. The total circuit length is:
   $$\text{Total Hops} = 3 \text{ (Client to RP)} + 3 \text{ (Service to RP)} = \mathbf{6\text{ Hops}}$$
   Client and service perform an end-to-end Diffie-Hellman handshake through the rendezvous conduit. Even the Rendezvous Point cannot decrypt the payload!

---

## 6. Traffic Analysis Attacks & DNS Leak Vectors

Despite strong onion cryptography, Tor is vulnerable to **statistical traffic analysis**:

### End-to-End Timing Correlation (Flow Watermarking)
Tor is a low-latency network (not a store-and-forward mixnet). If a powerful adversary observes traffic at *both* the client's local ISP and the destination website's datacenter:
- When the client transmits a burst of 1,200 bytes followed by a 400ms pause and an 800-byte burst, the exact same burst pattern emerges at the destination server 150ms later.
- By cross-correlating transmission timestamps and packet cadence using machine learning, the adversary can link the client to the server with >95% confidence without breaking any encryption!

### The SOCKS5a Remote DNS Mandate
A catastrophic mistake when integrating applications with Tor is letting the local operating system resolve DNS:

```bash
# VULNERABLE: Local DNS resolves domain first, leaking query to ISP!
curl --socks5 127.0.0.1:9050 https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion
# Error: Could not resolve host (ISP now knows you are visiting that .onion!)

# SECURE: SOCKS5a (with 'h' flag) delegates domain resolution to Tor proxy:
curl --socks5-hostname 127.0.0.1:9050 https://duckduckgo.com
```

In the SOCKS5 protocol (RFC 1928), setting `ATYP = 0x03` forces the Tor client daemon to transmit the Fully Qualified Domain Name (FQDN) through the encrypted circuit, resolving the IP address at the exit relay.

---

## 7. Privacy Architecture Comparison: Tor vs VPN vs Proxy vs I2P

| Architectural Dimension | Forward Proxy | Commercial VPN | Tor Network | I2P (Invisible Internet) |
|---|---|---|---|---|
| **Trust Model** | Centralized (Proxy operator sees all) | Centralized (VPN provider sees all metadata) | **Decentralized (No single node knows both endpoints)** | **Decentralized (Peer-to-peer garlic routing)** |
| **Number of Hops** | 1 Hop | 1 Hop | **3 Hops (6 for Onion Services)** | **Dynamic (typically 3–4 outbound, 3–4 inbound)** |
| **Encrypted Layers** | None (unless TLS upstream) | 1 Layer (Tunnel to VPN gateway) | **3 Layers (Onion encrypted)** | **Multiple Layers (Garlic message bundling)** |
| **Clearweb Access** | Yes (Primary purpose) | Yes (Primary purpose) | Yes (via Exit Relays) | Poor (Designed primarily for internal hidden darknet) |
| **Resistance to Subpoena** | Zero | Low (subject to server seizure/logging) | **Extremely High (relays maintain no persistent logs)** | **Maximum (P2P mesh architecture)** |
| **Latency Penalty** | Low (+5–20ms) | Low (+10–30ms) | **High (+200–800ms)** | **High (+300–1000ms)** |
| **Transport Protocol** | TCP | UDP / TCP | TCP (cells mapped over TLS) | UDP (SSU2 peer-to-peer) |
| **Optimal Use Case** | Corporate content filtering | Bypassing geo-blocks; securing public Wi-Fi | **Whistleblowing, censorship circumvention, anonymous browsing** | **Internal P2P file-sharing, decentralized messaging** |

---

## 8. Senior Engineering Integration Runbook

### Running Tor as a Headless Daemon in Microservices
```bash
# 1. Install and start Tor daemon (Debian/Ubuntu):
sudo apt install tor
sudo systemctl enable --now tor

# Tor listens on 127.0.0.1:9050 as a SOCKS5 proxy

# 2. Verify external IP through Tor circuit:
curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip
# Returns: {"IsTor":true,"IP":"185.220.101.5"}

# 3. Configure Java Spring Boot WebClient with Tor SOCKS5 Proxy:
```

```java
import io.netty.channel.ChannelOption;
import io.netty.handler.proxy.Socks5ProxyHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.net.InetSocketAddress;

@Configuration
public class TorWebClientConfig {

    @Bean
    public WebClient torWebClient() {
        HttpClient httpClient = HttpClient.create()
            .tcpConfiguration(tcpClient -> tcpClient.proxy(proxy -> proxy
                .type(reactor.netty.transport.ProxyProvider.Proxy.SOCKS5)
                .address(new InetSocketAddress("127.0.0.1", 9050))
            ))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 15000);

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
```
