---
id: elevator
title: "Problem: Elevator System"
sidebar_label: 🛗 Elevator System
---

# Elevator System

> **Difficulty:** Hard | **Frequency:** High | **Patterns:** State, Observer, Strategy

---

## Interview Expectation

The Elevator problem is famous for the **scheduling algorithm** discussion. Interviewers want to see:

| Expectation | Details |
|------------|---------|
| Elevator state machine | IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN |
| Request handling | Internal (button inside car) + External (hall call) |
| Scheduling strategy | FCFS, SCAN (elevator algorithm), LOOK |
| Multi-elevator | Dispatch logic — which elevator handles which request |
| Thread safety | Elevator state modified from request threads |

---

## Step 1: Clarify Requirements

- **How many elevators?** → configurable (start with 1, extend to N)
- **How many floors?** → configurable
- **Request types?** → External: floor + direction. Internal: destination floor
- **Scheduling algorithm?** → SCAN (elevator algorithm) — mention options
- **Emergency/priority?** → out of scope for interview

---

## Step 2: State Machine

```
IDLE → request arrives → MOVING_UP or MOVING_DOWN
MOVING_UP → reaches destination → DOOR_OPEN
DOOR_OPEN → door timer expires → IDLE or MOVING (if more requests)
MOVING_UP → emergency stop → IDLE
```

---

## Step 3: Core Classes

```java
public enum Direction    { UP, DOWN }
public enum ElevatorState { IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN }

// Request types
public record ExternalRequest(int floor, Direction direction) {}
public record InternalRequest(int destinationFloor) {}

// ── Elevator ───────────────────────────────────────────────
public class Elevator {
    private final int id;
    private int currentFloor;
    private ElevatorState state;
    private final TreeSet<Integer> upRequests   = new TreeSet<>(); // destinations going up
    private final TreeSet<Integer> downRequests = new TreeSet<>(Collections.reverseOrder()); // going down

    private final Object lock = new Object();

    public Elevator(int id, int initialFloor) {
        this.id           = id;
        this.currentFloor = initialFloor;
        this.state        = ElevatorState.IDLE;
    }

    public void addRequest(int floor) {
        synchronized (lock) {
            if (floor > currentFloor || state == ElevatorState.MOVING_UP) {
                upRequests.add(floor);
            } else {
                downRequests.add(floor);
            }
            if (state == ElevatorState.IDLE) {
                processNext();
            }
        }
    }

    // SCAN algorithm: serve all up requests, then all down requests
    private void processNext() {
        if (!upRequests.isEmpty()) {
            int destination = upRequests.first();
            moveToFloor(destination, Direction.UP);
        } else if (!downRequests.isEmpty()) {
            int destination = downRequests.first();
            moveToFloor(destination, Direction.DOWN);
        } else {
            state = ElevatorState.IDLE;
        }
    }

    private void moveToFloor(int destination, Direction direction) {
        state = direction == Direction.UP ? ElevatorState.MOVING_UP : ElevatorState.MOVING_DOWN;
        System.out.printf("Elevator %d moving %s from floor %d to floor %d%n",
            id, direction, currentFloor, destination);

        // Simulate movement (in real system, this would be event-driven)
        currentFloor = destination;

        if (direction == Direction.UP) upRequests.remove(destination);
        else downRequests.remove(destination);

        state = ElevatorState.DOOR_OPEN;
        System.out.printf("Elevator %d: doors open at floor %d%n", id, currentFloor);

        // Simulate door close
        state = ElevatorState.IDLE;
        processNext(); // continue to next request
    }

    public int getCurrentFloor() { synchronized (lock) { return currentFloor; } }
    public ElevatorState getState() { synchronized (lock) { return state; } }
    public int getId() { return id; }
}

// ── Dispatcher ────────────────────────────────────────────
public class ElevatorDispatcher {
    private final List<Elevator> elevators;

    public ElevatorDispatcher(int numElevators, int numFloors) {
        this.elevators = new ArrayList<>();
        for (int i = 1; i <= numElevators; i++) {
            elevators.add(new Elevator(i, 1)); // all start at floor 1
        }
    }

    // Assign the request to the nearest idle or same-direction elevator
    public void dispatch(ExternalRequest request) {
        Elevator best = elevators.stream()
            .min(Comparator.comparingInt(e -> cost(e, request)))
            .orElseThrow();
        best.addRequest(request.floor());
        System.out.printf("Dispatching floor %d request to Elevator %d%n",
            request.floor(), best.getId());
    }

    // Cost function: distance + penalty for wrong direction
    private int cost(Elevator elevator, ExternalRequest request) {
        int distance = Math.abs(elevator.getCurrentFloor() - request.floor());
        boolean sameDirection = (elevator.getState() == ElevatorState.MOVING_UP
                                  && request.direction() == Direction.UP)
                             || (elevator.getState() == ElevatorState.MOVING_DOWN
                                  && request.direction() == Direction.DOWN);
        return distance + (elevator.getState() == ElevatorState.IDLE || sameDirection ? 0 : 10);
    }
}
```

---

## Scheduling Algorithm Comparison

| Algorithm | Description | Pros | Cons |
|-----------|-------------|------|------|
| **FCFS** | First-come, first-served | Simple | High travel distance |
| **SCAN** | Go up serving all, then down | Low avg wait | Last floor in direction waits |
| **LOOK** | Like SCAN but reverses at last request, not top/bottom | More efficient than SCAN | Slightly complex |
| **C-SCAN** | Circular: always goes up, jumps to bottom | Uniform wait times | Longer travel |

:::note Senior Deep Dive 🔴
Real elevators use **LOOK** (a variant of SCAN) because it avoids traveling to the top/bottom floor when there are no requests there. The key insight: reverse direction at the last pending request, not at the physical boundary.
:::

---

## Interview Checklist

- [ ] ElevatorState enum covers all states (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN)
- [ ] Separate up/down request queues (TreeSet for sorted order)
- [ ] SCAN algorithm implemented correctly
- [ ] Dispatcher assigns based on cost function (distance + direction match)
- [ ] Synchronized access to elevator state
- [ ] Discussed multiple scheduling algorithms and trade-offs
