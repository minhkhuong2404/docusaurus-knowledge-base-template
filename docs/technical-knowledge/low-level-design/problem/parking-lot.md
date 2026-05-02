---
id: parking-lot
title: "Problem: Parking Lot"
sidebar_label: 🚗 Parking Lot
---

# Parking Lot

> **Difficulty:** Medium | **Frequency:** Very High | **Patterns:** Strategy, Factory, Observer

---

## Interview Expectation

The Parking Lot is the "Hello World" of LLD interviews. Interviewers use it to assess OOP fundamentals. What they want to see:

| Expectation | Details |
|------------|---------|
| Clear entity identification | Vehicle, Spot, Level, Ticket, ParkingLot |
| Correct spot matching logic | Motorcycle → Small, Car → Medium/Small, Truck → Large |
| Thread-safe spot allocation | Multiple cars entering simultaneously |
| Flexible pricing (Strategy) | Hourly, flat, weekend pricing |
| No hardcoded spot counts | Use configuration / Builder |

---

## Step 1: Clarify Requirements (5 min)

Ask the interviewer these questions before touching the keyboard:

- **Multiple entrances/exits?** → yes, single for simplicity
- **Multiple levels?** → yes
- **Vehicle types?** → Motorcycle, Car, Truck/Bus
- **Spot types?** → Small, Medium, Large
- **Pricing model?** → Hourly rate, different per spot type
- **Is it always one spot per vehicle?** → yes
- **Display board needed?** → nice-to-have, implement if time

---

## Step 2: Core Entities

```
ParkingLot        ← entry point, has multiple Levels
  Level           ← has rows of ParkingSpot
    ParkingSpot   ← knows its type and current Vehicle
      Vehicle     ← Motorcycle | Car | Truck
Ticket            ← issued on entry, calculated on exit
PricingStrategy   ← calculates fee given duration + spot type
```

---

## Step 3: Class Design

```java
// ── Enums ──────────────────────────────────────────────────
public enum VehicleType  { MOTORCYCLE, CAR, TRUCK }
public enum SpotType     { SMALL, MEDIUM, LARGE }
public enum TicketStatus { ACTIVE, PAID }

// ── Vehicle hierarchy ──────────────────────────────────────
public abstract class Vehicle {
    private final String licensePlate;
    private final VehicleType type;

    protected Vehicle(String licensePlate, VehicleType type) {
        this.licensePlate = Objects.requireNonNull(licensePlate);
        this.type = type;
    }

    public String getLicensePlate() { return licensePlate; }
    public VehicleType getType() { return type; }
    public abstract List<SpotType> getCompatibleSpots();
}

public class Motorcycle extends Vehicle {
    public Motorcycle(String plate) { super(plate, VehicleType.MOTORCYCLE); }

    @Override
    public List<SpotType> getCompatibleSpots() {
        return List.of(SpotType.SMALL, SpotType.MEDIUM, SpotType.LARGE);
    }
}

public class Car extends Vehicle {
    public Car(String plate) { super(plate, VehicleType.CAR); }

    @Override
    public List<SpotType> getCompatibleSpots() {
        return List.of(SpotType.MEDIUM, SpotType.LARGE);
    }
}

public class Truck extends Vehicle {
    public Truck(String plate) { super(plate, VehicleType.TRUCK); }

    @Override
    public List<SpotType> getCompatibleSpots() {
        return List.of(SpotType.LARGE);
    }
}

// ── ParkingSpot ────────────────────────────────────────────
public class ParkingSpot {
    private final String id;
    private final SpotType type;
    private final int level;
    private volatile Vehicle occupant;  // volatile for visibility

    public ParkingSpot(String id, SpotType type, int level) {
        this.id    = id;
        this.type  = type;
        this.level = level;
    }

    public boolean isCompatible(Vehicle vehicle) {
        return vehicle.getCompatibleSpots().contains(this.type);
    }

    // Synchronized: check-and-assign must be atomic
    public synchronized boolean tryPark(Vehicle vehicle) {
        if (occupant != null) return false;
        if (!isCompatible(vehicle)) return false;
        occupant = vehicle;
        return true;
    }

    public synchronized void release() {
        occupant = null;
    }

    public boolean isAvailable() { return occupant == null; }
    public String getId()        { return id; }
    public SpotType getType()    { return type; }
    public int getLevel()        { return level; }
}
```

---

## Step 4: Pricing Strategy (Strategy Pattern)

```java
// Strategy interface
@FunctionalInterface
public interface PricingStrategy {
    double calculateFee(ParkingTicket ticket);
}

// Hourly pricing — default
public class HourlyPricingStrategy implements PricingStrategy {
    private static final Map<SpotType, Double> HOURLY_RATES = Map.of(
        SpotType.SMALL,  2.0,
        SpotType.MEDIUM, 3.5,
        SpotType.LARGE,  5.0
    );

    @Override
    public double calculateFee(ParkingTicket ticket) {
        long minutes = ChronoUnit.MINUTES.between(ticket.getEntryTime(), LocalDateTime.now());
        double hours = Math.ceil(minutes / 60.0);  // round up to nearest hour
        double rate  = HOURLY_RATES.get(ticket.getSpotType());
        return hours * rate;
    }
}

// Flat rate — e.g., for events
public class FlatRatePricingStrategy implements PricingStrategy {
    private final double rate;
    public FlatRatePricingStrategy(double rate) { this.rate = rate; }

    @Override
    public double calculateFee(ParkingTicket ticket) { return rate; }
}

// Composite: peak hours are more expensive
public class PeakHourPricingStrategy implements PricingStrategy {
    private final PricingStrategy base;
    private final double peakMultiplier = 1.5;
    private static final int PEAK_START = 8, PEAK_END = 18;

    public PeakHourPricingStrategy(PricingStrategy base) { this.base = base; }

    @Override
    public double calculateFee(ParkingTicket ticket) {
        double fee = base.calculateFee(ticket);
        int hour = LocalDateTime.now().getHour();
        return (hour >= PEAK_START && hour < PEAK_END) ? fee * peakMultiplier : fee;
    }
}
```

---

## Step 5: Ticket & Level

```java
public class ParkingTicket {
    private final String ticketId;
    private final Vehicle vehicle;
    private final ParkingSpot spot;
    private final LocalDateTime entryTime;
    private TicketStatus status;
    private double fee;

    public ParkingTicket(Vehicle vehicle, ParkingSpot spot) {
        this.ticketId  = UUID.randomUUID().toString();
        this.vehicle   = vehicle;
        this.spot      = spot;
        this.entryTime = LocalDateTime.now();
        this.status    = TicketStatus.ACTIVE;
    }

    public void markPaid(double fee) {
        this.fee    = fee;
        this.status = TicketStatus.PAID;
    }

    public SpotType getSpotType() { return spot.getType(); }
    public LocalDateTime getEntryTime() { return entryTime; }
    public ParkingSpot getSpot() { return spot; }
    // ... other getters
}

public class Level {
    private final int levelNumber;
    private final List<ParkingSpot> spots;

    public Level(int levelNumber, Map<SpotType, Integer> spotCounts) {
        this.levelNumber = levelNumber;
        this.spots = new ArrayList<>();
        int spotNum = 1;
        for (var entry : spotCounts.entrySet()) {
            for (int i = 0; i < entry.getValue(); i++) {
                spots.add(new ParkingSpot(levelNumber + "-" + spotNum++, entry.getKey(), levelNumber));
            }
        }
    }

    // Find first compatible available spot
    public Optional<ParkingSpot> findAndPark(Vehicle vehicle) {
        return spots.stream()
            .filter(ParkingSpot::isAvailable)
            .filter(s -> s.isCompatible(vehicle))
            .filter(s -> s.tryPark(vehicle))  // atomic attempt
            .findFirst();
    }

    public long countAvailable(SpotType type) {
        return spots.stream()
            .filter(s -> s.getType() == type && s.isAvailable())
            .count();
    }
}
```

---

## Step 6: ParkingLot (Facade + Entry Point)

```java
public class ParkingLot {
    private final String name;
    private final List<Level> levels;
    private final PricingStrategy pricingStrategy;
    private final Map<String, ParkingTicket> activeTickets = new ConcurrentHashMap<>();

    private ParkingLot(Builder builder) {
        this.name            = builder.name;
        this.levels          = List.copyOf(builder.levels);
        this.pricingStrategy = builder.pricingStrategy;
    }

    public ParkingTicket park(Vehicle vehicle) {
        for (Level level : levels) {
            Optional<ParkingSpot> spot = level.findAndPark(vehicle);
            if (spot.isPresent()) {
                ParkingTicket ticket = new ParkingTicket(vehicle, spot.get());
                activeTickets.put(ticket.getTicketId(), ticket);
                System.out.println("Parked " + vehicle.getLicensePlate() +
                    " at spot " + spot.get().getId());
                return ticket;
            }
        }
        throw new ParkingLotFullException("No available spot for " + vehicle.getType());
    }

    public double exit(String ticketId) {
        ParkingTicket ticket = activeTickets.remove(ticketId);
        if (ticket == null) throw new InvalidTicketException(ticketId);

        double fee = pricingStrategy.calculateFee(ticket);
        ticket.markPaid(fee);
        ticket.getSpot().release();

        System.out.printf("Vehicle %s exited. Fee: $%.2f%n",
            ticket.getSpot().getId(), fee);
        return fee;
    }

    public Map<SpotType, Long> getAvailability() {
        return Arrays.stream(SpotType.values())
            .collect(Collectors.toMap(
                type -> type,
                type -> levels.stream().mapToLong(l -> l.countAvailable(type)).sum()
            ));
    }

    // ── Builder ────────────────────────────────────────────
    public static class Builder {
        private String name;
        private final List<Level> levels = new ArrayList<>();
        private PricingStrategy pricingStrategy = new HourlyPricingStrategy();

        public Builder name(String name) { this.name = name; return this; }

        public Builder addLevel(int levelNumber, Map<SpotType, Integer> spotCounts) {
            levels.add(new Level(levelNumber, spotCounts));
            return this;
        }

        public Builder pricingStrategy(PricingStrategy strategy) {
            this.pricingStrategy = strategy;
            return this;
        }

        public ParkingLot build() {
            if (levels.isEmpty()) throw new IllegalStateException("At least one level required");
            return new ParkingLot(this);
        }
    }
}
```

---

## Step 7: Wiring It All Together

```java
public class Main {
    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot.Builder()
            .name("Downtown Parking")
            .addLevel(1, Map.of(SpotType.SMALL, 10, SpotType.MEDIUM, 20, SpotType.LARGE, 5))
            .addLevel(2, Map.of(SpotType.SMALL, 5,  SpotType.MEDIUM, 15, SpotType.LARGE, 3))
            .pricingStrategy(new PeakHourPricingStrategy(new HourlyPricingStrategy()))
            .build();

        // Park vehicles
        Car car1 = new Car("ABC-123");
        Motorcycle moto = new Motorcycle("XYZ-789");

        ParkingTicket t1 = lot.park(car1);
        ParkingTicket t2 = lot.park(moto);

        System.out.println("Availability: " + lot.getAvailability());

        // Exit
        double fee = lot.exit(t1.getTicketId());
        System.out.printf("Fee paid: $%.2f%n", fee);
    }
}
```

---

## Senior Deep Dive: What to Add

:::note[Senior Deep Dive 🔴]

**Concurrency:** Spot allocation in `tryPark()` uses `synchronized` per spot. For very high throughput, consider `StampedLock` or CAS-based optimistic locking.

**Spot preference:** Motorcycles should prefer small spots (save large spots for trucks). Implement best-fit allocation: sort spots by size before searching.

**Display board:** Implement `Observer` pattern — `ParkingLot` notifies `DisplayBoard` whenever availability changes.

**Reservations:** Add a `ReservationService` that holds spots for future time windows, using a time-aware availability model.

**Distributed:** In production, spot state would live in Redis. Each entrance node does atomic `SETNX` to claim a spot — optimistic concurrency without distributed locks.
:::

---

## Interview Checklist

- [ ] Defined clear entity hierarchy (Vehicle, Spot, Level, Ticket)
- [ ] Vehicle-spot compatibility (motorcycle fits small/medium/large)
- [ ] Spot allocation is thread-safe (synchronized tryPark)
- [ ] Pricing uses Strategy pattern (swappable)
- [ ] ParkingLot built via Builder (configuration over hardcoding)
- [ ] `ConcurrentHashMap` for active tickets
- [ ] Clean exit flow: calculate fee → mark paid → release spot
- [ ] Discussed what to add for production (reservations, display board)
