---
id: movie-ticket
title: "Problem: Movie Ticket Booking"
sidebar_label: 🎬 Movie Ticket Booking
---

# Movie Ticket Booking

> **Difficulty:** Hard | **Frequency:** High | **Patterns:** Observer, Command, Strategy, State

---

## Interview Expectation

This problem is deceptively complex due to the **seat hold / concurrency** requirements. Interviewers expect:

| Expectation | Details |
|------------|---------|
| Correct entity model | Movie, Show, Screen, Seat, Booking, Payment |
| Seat hold mechanism | Temporary reservation before payment |
| Concurrency | Two users can't book the same seat |
| State management | AVAILABLE → HELD → BOOKED (or AVAILABLE again on hold expiry) |
| Pricing flexibility | Different prices per seat type |

---

## Step 1: Clarify Requirements

- **Multiple theaters / screens?** → yes
- **Seat hold duration?** → 10 minutes to complete payment
- **Seat types?** → Regular, Premium, VIP
- **Partial booking?** → yes, can book some seats in a show
- **Cancellation?** → yes, before show time

---

## Step 2: Entity Map

```
Theater     → has many Screens
Screen      → has a seating layout (rows × seats)
Movie       → catalog entry (title, duration, genre)
Show        → Movie at a Screen at a DateTime; has a SeatMatrix
Seat        → physical position in screen; has SeatType
SeatStatus  → AVAILABLE, HELD, BOOKED
Booking     → User + Show + List<Seat> + Payment; has BookingStatus
```

---

## Step 3: Core Classes

```java
// ── Enums ──────────────────────────────────────────────────
public enum SeatType   { REGULAR, PREMIUM, VIP }
public enum SeatStatus { AVAILABLE, HELD, BOOKED }
public enum BookingStatus { PENDING, CONFIRMED, CANCELLED }

// ── Seat (the physical seat in a Screen) ───────────────────
public class Seat {
    private final String id;       // e.g., "A1", "B12"
    private final SeatType type;
    private final int row;
    private final int column;

    public Seat(String id, SeatType type, int row, int col) {
        this.id  = id;
        this.type = type;
        this.row  = row;
        this.column = col;
    }

    public String getId()    { return id; }
    public SeatType getType() { return type; }
}

// ── ShowSeat — seat status within a particular show ────────
public class ShowSeat {
    private final Seat seat;
    private volatile SeatStatus status;
    private String heldByUserId;
    private Instant holdExpiresAt;

    private final Object lock = new Object();

    public ShowSeat(Seat seat) {
        this.seat   = seat;
        this.status = SeatStatus.AVAILABLE;
    }

    /**
     * Atomically try to place a hold for the given user.
     * Returns true only if the seat was AVAILABLE and we successfully held it.
     */
    public boolean tryHold(String userId, Duration holdDuration) {
        synchronized (lock) {
            if (status == SeatStatus.AVAILABLE || isHoldExpired()) {
                status         = SeatStatus.HELD;
                heldByUserId   = userId;
                holdExpiresAt  = Instant.now().plus(holdDuration);
                return true;
            }
            return false;
        }
    }

    public boolean confirmBooking(String userId) {
        synchronized (lock) {
            if (status == SeatStatus.HELD && userId.equals(heldByUserId) && !isHoldExpired()) {
                status = SeatStatus.BOOKED;
                return true;
            }
            return false;
        }
    }

    public void release() {
        synchronized (lock) {
            status       = SeatStatus.AVAILABLE;
            heldByUserId = null;
            holdExpiresAt = null;
        }
    }

    private boolean isHoldExpired() {
        return holdExpiresAt != null && Instant.now().isAfter(holdExpiresAt);
    }

    public synchronized SeatStatus getStatus() {
        if (status == SeatStatus.HELD && isHoldExpired()) {
            release();
        }
        return status;
    }

    public Seat getSeat() { return seat; }
}

// ── Show ──────────────────────────────────────────────────
public class Show {
    private final String id;
    private final Movie movie;
    private final Screen screen;
    private final LocalDateTime startTime;
    private final Map<String, ShowSeat> showSeats;  // seatId → ShowSeat

    public Show(String id, Movie movie, Screen screen, LocalDateTime startTime) {
        this.id        = id;
        this.movie     = movie;
        this.screen    = screen;
        this.startTime = startTime;
        this.showSeats = screen.getSeats().stream()
            .collect(Collectors.toMap(Seat::getId, ShowSeat::new));
    }

    public List<ShowSeat> holdSeats(String userId, List<String> seatIds, Duration holdDuration) {
        List<ShowSeat> held = new ArrayList<>();
        List<ShowSeat> toRelease = new ArrayList<>();

        for (String seatId : seatIds) {
            ShowSeat showSeat = showSeats.get(seatId);
            if (showSeat == null) throw new InvalidSeatException(seatId);

            if (showSeat.tryHold(userId, holdDuration)) {
                held.add(showSeat);
            } else {
                toRelease.forEach(ShowSeat::release); // release already-held seats
                throw new SeatNotAvailableException("Seat " + seatId + " is not available");
            }
            toRelease.add(showSeat);
        }
        return held;
    }

    public List<ShowSeat> getAvailableSeats() {
        return showSeats.values().stream()
            .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
            .collect(Collectors.toList());
    }

    public String getId() { return id; }
    public Movie getMovie() { return movie; }
    public LocalDateTime getStartTime() { return startTime; }
}
```

---

## Step 4: Pricing Strategy

```java
@FunctionalInterface
public interface PricingStrategy {
    double calculatePrice(SeatType seatType, Show show);
}

public class StandardPricing implements PricingStrategy {
    private static final Map<SeatType, Double> BASE_PRICES = Map.of(
        SeatType.REGULAR, 10.0,
        SeatType.PREMIUM, 15.0,
        SeatType.VIP,     25.0
    );

    @Override
    public double calculatePrice(SeatType seatType, Show show) {
        return BASE_PRICES.get(seatType);
    }
}

public class WeekendPricing implements PricingStrategy {
    private final PricingStrategy base;
    private static final double WEEKEND_MULTIPLIER = 1.25;

    public WeekendPricing(PricingStrategy base) { this.base = base; }

    @Override
    public double calculatePrice(SeatType seatType, Show show) {
        DayOfWeek day = show.getStartTime().getDayOfWeek();
        double price  = base.calculatePrice(seatType, show);
        return (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY)
            ? price * WEEKEND_MULTIPLIER
            : price;
    }
}
```

---

## Step 5: Booking Service

```java
public class BookingService {
    private static final Duration HOLD_DURATION = Duration.ofMinutes(10);

    private final ShowRepository showRepo;
    private final BookingRepository bookingRepo;
    private final PricingStrategy pricingStrategy;
    private final PaymentService paymentService;
    private final NotificationService notifier;

    // In-memory bookings (in prod: backed by DB)
    private final ConcurrentHashMap<String, Booking> bookings = new ConcurrentHashMap<>();

    public BookingService(ShowRepository showRepo, BookingRepository bookingRepo,
                          PricingStrategy pricingStrategy, PaymentService paymentService,
                          NotificationService notifier) {
        this.showRepo        = showRepo;
        this.bookingRepo     = bookingRepo;
        this.pricingStrategy = pricingStrategy;
        this.paymentService  = paymentService;
        this.notifier        = notifier;
    }

    /**
     * Step 1: Hold seats (temporary reservation)
     */
    public Booking initiateBooking(String userId, String showId, List<String> seatIds) {
        Show show = showRepo.findById(showId)
            .orElseThrow(() -> new ShowNotFoundException(showId));

        // Hold all requested seats atomically
        List<ShowSeat> heldSeats = show.holdSeats(userId, seatIds, HOLD_DURATION);

        // Calculate total price
        double totalPrice = heldSeats.stream()
            .mapToDouble(s -> pricingStrategy.calculatePrice(s.getSeat().getType(), show))
            .sum();

        Booking booking = new Booking(
            UUID.randomUUID().toString(),
            userId, show, heldSeats, totalPrice,
            BookingStatus.PENDING
        );
        bookings.put(booking.getId(), booking);

        // Schedule hold expiry
        scheduleHoldExpiry(booking);

        return booking;
    }

    /**
     * Step 2: Confirm booking after payment
     */
    public Booking confirmBooking(String bookingId, PaymentDetails payment) {
        Booking booking = bookings.get(bookingId);
        if (booking == null) throw new BookingNotFoundException(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStateException("Booking is not in PENDING state");
        }

        // Process payment
        PaymentResult paymentResult = paymentService.charge(payment, booking.getTotalPrice());
        if (!paymentResult.isSuccess()) {
            cancelBooking(bookingId);
            throw new PaymentFailedException(paymentResult.getErrorMessage());
        }

        // Confirm all held seats
        boolean allConfirmed = booking.getShowSeats().stream()
            .allMatch(s -> s.confirmBooking(booking.getUserId()));

        if (!allConfirmed) {
            // Hold expired between payment and confirmation
            paymentService.refund(paymentResult.getTransactionId());
            throw new SeatHoldExpiredException("Seat hold expired during payment");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepo.save(booking);

        notifier.send(booking.getUserId(), "Booking confirmed! Show: " +
            booking.getShow().getMovie().getTitle() +
            " at " + booking.getShow().getStartTime());

        return booking;
    }

    public void cancelBooking(String bookingId) {
        Booking booking = bookings.get(bookingId);
        if (booking == null) return;

        booking.getShowSeats().forEach(ShowSeat::release);
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepo.save(booking);
    }

    private void scheduleHoldExpiry(Booking booking) {
        // Use ScheduledExecutorService in production
        CompletableFuture.delayedExecutor(10, TimeUnit.MINUTES)
            .execute(() -> {
                if (booking.getStatus() == BookingStatus.PENDING) {
                    System.out.println("Hold expired for booking: " + booking.getId());
                    cancelBooking(booking.getId());
                }
            });
    }
}
```

---

## Step 6: Booking Entity

```java
public class Booking {
    private final String id;
    private final String userId;
    private final Show show;
    private final List<ShowSeat> showSeats;
    private final double totalPrice;
    private volatile BookingStatus status;
    private final Instant createdAt;

    public Booking(String id, String userId, Show show,
                   List<ShowSeat> showSeats, double totalPrice,
                   BookingStatus status) {
        this.id          = id;
        this.userId      = userId;
        this.show        = show;
        this.showSeats   = Collections.unmodifiableList(showSeats);
        this.totalPrice  = totalPrice;
        this.status      = status;
        this.createdAt   = Instant.now();
    }

    public synchronized void setStatus(BookingStatus status) {
        this.status = status;
    }

    // Getters...
    public String getId()          { return id; }
    public String getUserId()      { return userId; }
    public Show getShow()          { return show; }
    public List<ShowSeat> getShowSeats() { return showSeats; }
    public double getTotalPrice()  { return totalPrice; }
    public BookingStatus getStatus() { return status; }
}
```

---

## Concurrency Correctness

The key challenge: **two users try to book the same seat at the same time**.

```
User A                          User B
  |                               |
  | holdSeats(["A1","A2"])        | holdSeats(["A2","A3"])
  |                               |
  | -- tryHold("A1") → true       |
  | -- tryHold("A2") → true       | -- tryHold("A2") → false ← synchronized!
  |                               |    throws SeatNotAvailableException
  |                               |    User B must choose different seats
```

The `tryHold()` method uses a per-`ShowSeat` lock — fine-grained locking for high concurrency.

---

## Senior Deep Dive

:::note[Senior Deep Dive 🔴]
**Optimistic Locking (DB-level):**
```sql
UPDATE show_seats
SET status = 'HELD', held_by = ?, hold_expires = ?
WHERE seat_id = ? AND show_id = ? AND status = 'AVAILABLE'
-- If 0 rows affected → someone else got it first
```

**Hold Expiry at Scale:** Use a Redis ZSET with score = expiry timestamp. A background worker does `ZRANGEBYSCORE` to find expired holds and releases them. Much more reliable than Java's `ScheduledExecutorService` across restarts.

**Distributed Locks:** For multi-instance deployments, use Redisson's `RLock` or optimistic DB locking instead of Java `synchronized` — in-process locks don't protect across JVM instances.
:::

---

## Interview Checklist

- [ ] Identified all entities: Theater, Screen, Movie, Show, Seat, ShowSeat, Booking
- [ ] Separated `Seat` (physical) from `ShowSeat` (availability per show)
- [ ] `tryHold()` is synchronized — no TOCTOU race
- [ ] All-or-nothing seat hold (release partial if one fails)
- [ ] Strategy pattern for pricing (standard, weekend, VIP)
- [ ] Hold expiry mechanism (scheduler / delayed executor)
- [ ] Booking flow: hold → pay → confirm (with rollback on failure)
- [ ] Discussed distributed alternatives (Redis, optimistic DB locks)
