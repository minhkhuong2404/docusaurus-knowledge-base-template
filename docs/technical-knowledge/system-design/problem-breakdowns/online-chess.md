---
id: online-chess
title: Design a Real-Time Multiplayer Chess Platform Like Chess.com
sidebar_label: 30. Online Chess
description: Staff-level system design breakdown for a real-time multiplayer chess platform with Elo matchmaking, move validation, and lag-compensated clocks.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time Multiplayer Chess Platform Like Chess.com

An online multiplayer chess platform (e.g., Chess.com, Lichess) enables millions of players worldwide to find opponents of similar skill levels, play fast-paced real-time games (Bullet 1m, Blitz 3m, Rapid 10m), synchronize game moves over WebSockets with sub-50ms latency, maintain millisecond-accurate synchronized chess clocks with lag compensation, and spectate live grandmaster matches.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Real-Time Matchmaking**: Match two players with similar Elo/Glicko-2 ratings (e.g. $\pm 50$ points) and identical time control preferences within 5 seconds.
2. **Move Validation & State Synchronization**: Validate legal chess moves on the server and broadcast moves to both players in real-time.
3. **High-Precision Chess Clocks**: Track remaining player time with millisecond precision, applying network lag compensation.
4. **Game Termination & Rating Update**: Handle checkmate, resignation, draw, and timeout flags; calculate and update Glicko-2 player ratings immediately.
5. **Spectator Broadcasting**: Allow thousands of spectators to watch high-profile grandmaster games simultaneously.
6. **Disconnect & Reconnect Grace Period**: Allow a disconnected player 30 seconds to resume an active game before forfeiting on time.

### Non-Functional Requirements
- **Ultra-Low Latency**: Move transmission and clock sync in `< 50ms` (P95).
- **Zero Client Trust (Authoritative Server)**: Clients never validate game rules or declare game outcomes; all moves are strictly validated by the server engine.
- **Fairness & Lag Compensation**: Players on slower mobile connections should not lose valuable seconds from their chess clock due to network transit latency.
- **High Concurrency**: Support up to **1 Million concurrent active games** and 500,000 live spectators.

### Capacity Estimations & Sizing
- **Daily Active Players (DAU)**: 10 Million players.
- **Concurrent Active Games**: 1 Million games at peak.
- **Move Ingress Throughput**:
  - In Blitz/Bullet games, players make an average of 1 move every 2 seconds:
    $\text{Ingress Move QPS} = 1,000,000\text{ games} / 2\text{s} = \mathbf{500,000\text{ moves/sec peak}}$.
- **Spectator Broadcast Fan-Out**:
  - For top grandmaster matches (e.g. World Championship), 200,000 spectators watch a single game board.
- **Storage Calculation (5 Years)**:
  - 10 Million games played/day $\times$ 365 days $\times$ 5 years $\approx$ **18 Billion games**.
  - Average game length $\approx$ 40 moves.
  - Storing game in compact PGN format (Portable Game Notation) $\approx$ 500 bytes.
  - 18 Billion $\times$ 500 bytes $\approx$ **9 Terabytes (TB)** stored in document or relational storage.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                         PLAYER                         │
├──────────────────┬──────────────┬──────────────────────┤
│ player_id        │ UUID         │ PRIMARY KEY          │
│ username         │ VARCHAR(30)  │ UNIQUE, NOT NULL     │
│ blitz_rating     │ INT          │ Glicko-2 Rating      │
│ bullet_rating    │ INT          │ Glicko-2 Rating      │
│ rapid_rating     │ INT          │ Glicko-2 Rating      │
│ rating_deviation │ FLOAT        │ Glicko-2 RD          │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       CHESS_GAME                       │
├──────────────────┬──────────────┬──────────────────────┤
│ game_id          │ UUID         │ PRIMARY KEY          │
│ white_player_id  │ UUID         │ INDEX, FK            │
│ black_player_id  │ UUID         │ INDEX, FK            │
│ time_control     │ VARCHAR(16)  │ "180+2" (3m + 2s inc)│
│ fen_state        │ VARCHAR(100) │ Current FEN board    │
│ status           │ VARCHAR(16)  │ IN_PROGRESS / RESIGN │
│                  │              │ CHECKMATE / TIMEOUT  │
│ winner_id        │ UUID         │ NULLABLE, FK         │
│ pgn_moves        │ TEXT         │ "1. e4 e5 2. Nf3..." │
│ started_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API / WebSocket Wire Protocol

#### 1. Submit Move Packet (Client $\to$ Server)
```json
{
  "type": "MAKE_MOVE",
  "game_id": "gm_88192a01",
  "move": "e2e4",
  "client_send_time_ms": 1774301980120
}
```

#### 2. Move Acknowledgment & Clock Broadcast (Server $\to$ Clients)
```json
{
  "type": "MOVE_MADE",
  "game_id": "gm_88192a01",
  "move": "e2e4",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "white_time_left_ms": 178240,
  "black_time_left_ms": 180000,
  "turn": "BLACK",
  "server_time_ms": 1774301980145
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="realtime-chat" title="Chess.com Matchmaking, Move Engine & Clock Sync Topology" />

### Core Subsystems & Game Lifecycle

#### 1. Elo / Glicko-2 Matchmaking Queue
1. Player taps "Play 3-minute Blitz" $\implies$ enters **Matchmaking Queue (Redis Sorted Sets)**.
2. Players are partitioned into pools by `time_control` and sorted by `rating`.
3. A **Matchmaker Worker**:
   - Searches for an opponent within $\Delta \text{Rating} \le 50$.
   - If no match is found within 2 seconds, widens the search window by $\pm 25$ points every 2 seconds.
4. When a match is found:
   - Assigns random colors (White/Black), balancing players' recent color histories.
   - Instantiates a new game session on a **Game Session Server**.
   - Sends a WebSocket `MATCH_FOUND` notification to both players.

#### 2. Game Session Server (Authoritative Engine)
1. Both players establish persistent WebSocket connections to the designated **Game Session Server** (routed by `game_id`).
2. The server holds the active board state in RAM:
   - Lightweight C++ / Rust / Java chess engine (e.g. Stockfish / custom bitboard library).
   - High-precision synchronized timer threads.
3. Player makes a move:
   - Server validates move legality against current board state in `< 0.1ms`.
   - Computes network latency compensation.
   - Decrements player's clock, adds time increment (e.g. +2 seconds).
   - Updates FEN board state.
   - Broadcasts move and updated clocks to both players and spectator relays.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Network Lag Compensation for Chess Clocks
If Player A has a 150ms network ping and makes a move with only 0.2 seconds left on their clock, will they lose on time before the packet reaches the server?

```
Without Lag Compensation:
Player has 0.5s on clock.
Player clicks move at t = 0ms.
Packet travels over network for 150ms.
Server receives packet at t = 150ms ➔ Deducts 0.15s for network delay!
Player loses on time purely due to network latency! (UNFAIR)

With Lag Compensation (The RTT Half-Trip Algorithm):
1. Client and server continuously measure Round-Trip Time (RTT) via periodic ping/pong frames:
   Estimated One-Way Latency (OWL) = RTT / 2.
2. When Player A submits move at client timestamp Tc:
   Server Time Arrived = Ts.
   Transit Latency = Ts - (Tc + clock_offset).
3. Server credits back the transit latency (capped at a maximum of 250ms to prevent lag switch exploits):
   Clock Deducted = Actual Thinking Time ONLY.
➔ Fair play guaranteed regardless of network quality!
```

### Deep Dive 2: Move Validation: Bitboard Engine Performance
How does a single game server host 10,000 concurrent active chess games without burning out CPU cores?

- **Bitboards (64-bit Integer Representation)**:
  - The 64 squares of a chessboard map perfectly to a single 64-bit integer (`uint64_t`).
  - White pawns, black knights, occupied squares, and attack maps are represented as individual 64-bit integers.
  - Legal move generation and validation use **bitwise CPU operations** (`AND`, `OR`, `XOR`, bit shifts, population counts):
    `attack_mask = knight_attacks[square] & ~friendly_pieces`.
  - Move validation executes in **less than 1 microsecond (0.000001s)**!
  - A modern multi-core server easily validates hundreds of thousands of moves per second with near-zero CPU overhead.

### Deep Dive 3: Grandmaster Spectator Mode (Scaling to 200,000 Viewers)
When Magnus Carlsen plays Hikaru Nakamura, 200,000 spectators watch the board live. If the game server pushes move frames directly to 200,000 sockets, it will crash and disconnect the actual players!

- **Hierarchical Spectator Distribution Tree**:
  1. The **Authoritative Game Server** only talks to the 2 active players.
  2. For spectators, the game server emits each verified move to a **Redis Pub/Sub / Kafka Topic**: `game:stream:{game_id}`.
  3. Regional **Spectator WebSocket Relays** subscribe to the topic.
  4. Each spectator relay broadcasts the move to its local connected audience of 5,000 spectators.
  5. The actual game server CPU remains at `< 1%`, completely insulated from spectator socket storms.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Move Validation** | Client-Side with Optimistic Trust | Server-Side Authoritative Engine | **Authoritative Server**: Zero client trust. Client-side validation allows hacked clients to make illegal moves or alter clocks. |
| **Clock Synchronization** | Client Clock Authority | Server Clock with Lag Compensation | **Server Clock with Lag Compensation**: Prevents client clock tampering while fairly compensating for genuine network transit delay. |
| **Spectator Fan-Out** | Direct from Game Session Server | Hierarchical Relay Tree (Pub/Sub) | **Hierarchical Relay**: Insulates the primary game server from 200K+ spectator socket loads, guaranteeing zero lag for the players. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands why persistent WebSockets are required for two-player game synchronization.
- Designs schemas for Players, Games, and Moves.
- Implements basic Elo matchmaking queues.
- Proposes server-side move validation to prevent cheating.

### Senior (L5 / IC5)
- Details the **Network Lag Compensation** algorithm to ensure chess clock fairness.
- Explains **Bitboard** data structures for sub-microsecond move generation.
- Solves grandmaster spectator scaling using a decoupled hierarchical Pub/Sub relay tree.
- Implements disconnect grace periods and automated timeout forfeits.

### Staff+ (L6 / Principal)
- Designs automated anti-cheating detection pipelines: Using Bayesian inference to compare move sequences and move timing variance against Stockfish/Leela chess engine depth evaluations.
- Architects multi-region game session placement: Selecting a game server geographically equidistant between both players to minimize ping disparity.
- Details game persistence and PGN compression: Storing billions of historical games with fast move-tree indexing for opening explorer queries.
