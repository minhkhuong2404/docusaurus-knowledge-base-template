---
id: amazon-locker
title: "Problem: Amazon Locker"
sidebar_label: 📦 Amazon Locker
---

# Amazon Locker

> **Difficulty:** Medium | **Frequency:** Medium | **Patterns:** Strategy, Observer, Factory

---

## Interview Expectation

Amazon Locker tests your ability to model a real-world package delivery system with size constraints, expiry, and concurrent access.

| Expectation | Details |
|------------|---------|
| Size matching | Package must fit in a locker of equal or larger size |
| Code generation | Unique pickup code issued per delivery |
| Expiry handling | Packages expire after N days; locker released |
| Thread safety | Two delivery drivers can't claim the same locker |
| Multiple locations | LockerSystem manages many LockerStations |

---

## Step 1: Clarify Requirements

- **Locker sizes?** → Small, Medium, Large
- **Package-locker matching?** → Package fits in smallest available locker that fits it
- **Pickup code?** → 6-digit code sent to customer
- **Expiry?** → 3 days; after that, package returned, locker freed
- **Multiple stations?** → yes, find nearest with availability

---

## Step 2: Core Classes

```java
// ── Enums ──────────────────────────────────────────────────
public enum LockerSize   { SMALL, MEDIUM, LARGE }
public enum LockerStatus { AVAILABLE, OCCUPIED }

// ── Package ───────────────────────────────────────────────
public class Package {
    private final String packageId;
    private final String orderId;
    private final LockerSize requiredSize;  // minimum locker size needed
    private final String customerEmail;

    public Package(String packageId, String orderId, LockerSize requiredSize, String customerEmail) {
        this.packageId     = packageId;
        this.orderId       = orderId;
        this.requiredSize  = requiredSize;
        this.customerEmail = customerEmail;
    }

    public String getPackageId()    { return packageId; }
    public LockerSize getRequiredSize() { return requiredSize; }
    public String getCustomerEmail() { return customerEmail; }
}

// ── Locker ────────────────────────────────────────────────
public class Locker {
    private final String lockerId;
    private final LockerSize size;
    private volatile LockerStatus status;
    private Package storedPackage;
    private String pickupCode;
    private LocalDateTime storedAt;

    private final Object lock = new Object();

    public Locker(String lockerId, LockerSize size) {
        this.lockerId = lockerId;
        this.size     = size;
        this.status   = LockerStatus.AVAILABLE;
    }

    public boolean canFit(Package pkg) {
        return this.size.ordinal() >= pkg.getRequiredSize().ordinal();
    }

    // Atomic: check availability and store in one synchronized block
    public boolean tryStore(Package pkg, String code) {
        synchronized (lock) {
            if (status != LockerStatus.AVAILABLE) return false;

            this.storedPackage = pkg;
            this.pickupCode    = code;
            this.storedAt      = LocalDateTime.now();
            this.status        = LockerStatus.OCCUPIED;
            return true;
        }
    }

    public boolean tryPickup(String code) {
        synchronized (lock) {
            if (status != LockerStatus.OCCUPIED) return false;
            if (!this.pickupCode.equals(code)) return false;

            release();
            return true;
        }
    }

    public void release() {
        synchronized (lock) {
            this.storedPackage = null;
            this.pickupCode    = null;
            this.storedAt      = null;
            this.status        = LockerStatus.AVAILABLE;
        }
    }

    public boolean isExpired(int expiryDays) {
        synchronized (lock) {
            return status == LockerStatus.OCCUPIED &&
                storedAt != null &&
                storedAt.plusDays(expiryDays).isBefore(LocalDateTime.now());
        }
    }

    public String getLockerId()     { return lockerId; }
    public LockerSize getSize()     { return size; }
    public LockerStatus getStatus() { return status; }
    public Package getPackage()     { return storedPackage; }
}

// ── LockerStation ─────────────────────────────────────────
public class LockerStation {
    private final String stationId;
    private final String address;
    private final List<Locker> lockers;

    // packageId → Locker (for quick lookup on pickup)
    private final ConcurrentHashMap<String, Locker> packageLockerMap = new ConcurrentHashMap<>();

    public LockerStation(String stationId, String address, Map<LockerSize, Integer> lockerCounts) {
        this.stationId = stationId;
        this.address   = address;
        this.lockers   = new ArrayList<>();

        lockerCounts.forEach((size, count) -> {
            for (int i = 1; i <= count; i++) {
                lockers.add(new Locker(stationId + "-" + size.name() + "-" + i, size));
            }
        });
    }

    /**
     * Find the best-fit locker (smallest that fits), store package atomically.
     * Returns the pickup code, or empty if no suitable locker available.
     */
    public Optional<String> storePackage(Package pkg) {
        // Sort by size ascending — prefer smallest fit (best-fit strategy)
        return lockers.stream()
            .filter(l -> l.getStatus() == LockerStatus.AVAILABLE && l.canFit(pkg))
            .sorted(Comparator.comparingInt(l -> l.getSize().ordinal()))
            .filter(locker -> {
                String code = generateCode();
                return locker.tryStore(pkg, code);  // atomic attempt
            })
            .findFirst()
            .map(locker -> {
                packageLockerMap.put(pkg.getPackageId(), locker);
                return locker.getLockerId(); // return locker ID as proxy for code
            });
    }

    public boolean pickupPackage(String packageId, String pickupCode) {
        Locker locker = packageLockerMap.get(packageId);
        if (locker == null) return false;

        boolean success = locker.tryPickup(pickupCode);
        if (success) packageLockerMap.remove(packageId);
        return success;
    }

    public void expireOldPackages(int expiryDays) {
        lockers.stream()
            .filter(l -> l.isExpired(expiryDays))
            .forEach(locker -> {
                System.out.println("Expiring package in locker: " + locker.getLockerId());
                if (locker.getPackage() != null) {
                    packageLockerMap.remove(locker.getPackage().getPackageId());
                }
                locker.release();
            });
    }

    public Map<LockerSize, Long> getAvailability() {
        return lockers.stream()
            .filter(l -> l.getStatus() == LockerStatus.AVAILABLE)
            .collect(Collectors.groupingBy(Locker::getSize, Collectors.counting()));
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(1_000_000));
    }

    public String getStationId() { return stationId; }
    public String getAddress()   { return address; }
}
```

---

## Step 3: Locker System (Top-Level Facade)

```java
public class LockerSystem {
    private final List<LockerStation> stations;
    private final NotificationService notifier;
    private static final int EXPIRY_DAYS = 3;

    // packageId → pickup code (stored separately for security)
    private final ConcurrentHashMap<String, String> pickupCodes = new ConcurrentHashMap<>();

    public LockerSystem(List<LockerStation> stations, NotificationService notifier) {
        this.stations = stations;
        this.notifier = notifier;
        startExpiryJob();
    }

    /**
     * Assign a package to the nearest station with availability.
     */
    public DeliveryResult assignLocker(Package pkg, String preferredStationId) {
        // Try preferred station first
        Optional<LockerStation> preferred = stations.stream()
            .filter(s -> s.getStationId().equals(preferredStationId))
            .findFirst();

        return preferred
            .flatMap(s -> attemptStore(s, pkg))
            .or(() -> stations.stream()   // fall back to any station
                .filter(s -> !s.getStationId().equals(preferredStationId))
                .flatMap(s -> attemptStore(s, pkg).stream())
                .findFirst())
            .orElse(DeliveryResult.noLockerAvailable());
    }

    private Optional<DeliveryResult> attemptStore(LockerStation station, Package pkg) {
        String code = generateSecureCode();
        // We need to pass the code into storePackage — refactor Locker to accept it
        return station.storePackage(pkg)
            .map(lockerId -> {
                pickupCodes.put(pkg.getPackageId(), code);
                notifier.send(
                    pkg.getCustomerEmail(),
                    "Your package is ready at " + station.getAddress() +
                    ". Pickup code: " + code
                );
                return DeliveryResult.success(station.getStationId(), lockerId, code);
            });
    }

    public PickupResult pickup(String stationId, String packageId, String code) {
        String expectedCode = pickupCodes.get(packageId);
        if (expectedCode == null || !expectedCode.equals(code)) {
            return PickupResult.invalidCode();
        }

        return stations.stream()
            .filter(s -> s.getStationId().equals(stationId))
            .findFirst()
            .map(s -> s.pickupPackage(packageId, code)
                ? PickupResult.success()
                : PickupResult.packageNotFound())
            .orElse(PickupResult.stationNotFound());
    }

    private void startExpiryJob() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            stations.forEach(s -> s.expireOldPackages(EXPIRY_DAYS));
        }, 1, 1, TimeUnit.HOURS);
    }

    private String generateSecureCode() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }
}

// Result types
public record DeliveryResult(boolean success, String stationId, String lockerId, String code, String error) {
    public static DeliveryResult success(String sid, String lid, String code) {
        return new DeliveryResult(true, sid, lid, code, null);
    }
    public static DeliveryResult noLockerAvailable() {
        return new DeliveryResult(false, null, null, null, "No locker available");
    }
}

public record PickupResult(boolean success, String error) {
    public static PickupResult success()          { return new PickupResult(true, null); }
    public static PickupResult invalidCode()      { return new PickupResult(false, "Invalid code"); }
    public static PickupResult packageNotFound()  { return new PickupResult(false, "Package not found"); }
    public static PickupResult stationNotFound()  { return new PickupResult(false, "Station not found"); }
}
```

---

## Step 4: Wiring It Together

```java
public class Main {
    public static void main(String[] args) {
        LockerStation downtown = new LockerStation(
            "STATION-001", "123 Main St",
            Map.of(LockerSize.SMALL, 10, LockerSize.MEDIUM, 5, LockerSize.LARGE, 2)
        );

        LockerSystem system = new LockerSystem(
            List.of(downtown),
            new EmailNotificationService()
        );

        Package pkg = new Package("PKG-001", "ORDER-999", LockerSize.SMALL, "alice@example.com");
        DeliveryResult result = system.assignLocker(pkg, "STATION-001");

        if (result.success()) {
            System.out.println("Package stored! Pickup code: " + result.code());

            // Customer picks up
            PickupResult pickup = system.pickup("STATION-001", "PKG-001", result.code());
            System.out.println("Pickup: " + (pickup.success() ? "Success!" : pickup.error()));
        }
    }
}
```

---

## Interview Checklist

- [ ] Package size vs locker size comparison (ordinal-based)
- [ ] Best-fit locker selection (smallest locker that fits)
- [ ] `tryStore()` is synchronized — no TOCTOU race
- [ ] Unique pickup code generated and sent to customer
- [ ] Expiry job runs periodically to free abandoned lockers
- [ ] `ConcurrentHashMap` for package→locker mapping
- [ ] Discussed nearest-station selection (Haversine distance in production)
- [ ] Result objects instead of exceptions for expected failure cases
