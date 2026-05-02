---
id: inventory-management
title: "Problem: Inventory Management"
sidebar_label: 📊 Inventory Management
---

# Inventory Management

> **Difficulty:** Medium | **Frequency:** Medium | **Patterns:** Observer, Strategy, Command

---

## Interview Expectation

Inventory management tests your ability to model a transactional system with stock levels, reservations, and notifications.

| Expectation | Details |
|------------|---------|
| Thread-safe stock operations | Multiple orders can't oversell the same item |
| Reservation vs deduction | Hold stock during checkout, deduct on payment |
| Low-stock alerts | Observer pattern for threshold notifications |
| Restock handling | Trigger reorder when stock drops below threshold |
| Audit trail | Command pattern for every stock change |

---

## Step 1: Clarify Requirements

- **Operations?** → add stock, reserve (hold), confirm deduction, release hold, check availability
- **Multiple warehouses?** → yes, aggregate across locations
- **Low-stock alert?** → yes, threshold-based notifications
- **Audit log?** → yes, every change tracked with timestamp and reason
- **Concurrent orders?** → yes — must not oversell

---

## Step 2: Core Classes

```java
// ── Enums ──────────────────────────────────────────────────
public enum StockChangeType { RESTOCK, SALE, RESERVATION, RELEASE, ADJUSTMENT, WRITE_OFF }

// ── Product ───────────────────────────────────────────────
public class Product {
    private final String sku;
    private final String name;
    private final String category;
    private final double unitPrice;

    public Product(String sku, String name, String category, double unitPrice) {
        this.sku       = sku;
        this.name      = name;
        this.category  = category;
        this.unitPrice = unitPrice;
    }

    public String getSku()      { return sku; }
    public String getName()     { return name; }
    public double getUnitPrice() { return unitPrice; }
}

// ── StockEntry — tracks stock for one SKU at one warehouse ─
public class StockEntry {
    private final String sku;
    private final String warehouseId;
    private int totalQuantity;
    private int reservedQuantity;   // held for pending orders

    private final int lowStockThreshold;
    private final List<StockAuditRecord> auditLog = new ArrayList<>();
    private final List<StockObserver> observers   = new CopyOnWriteArrayList<>();

    private final Object lock = new Object();

    public StockEntry(String sku, String warehouseId, int initialQty, int lowStockThreshold) {
        this.sku               = sku;
        this.warehouseId       = warehouseId;
        this.totalQuantity     = initialQty;
        this.reservedQuantity  = 0;
        this.lowStockThreshold = lowStockThreshold;
    }

    /** Available = total - reserved */
    public int getAvailableQuantity() {
        synchronized (lock) {
            return totalQuantity - reservedQuantity;
        }
    }

    /**
     * Reserve stock for a pending order.
     * @return true if reservation succeeded
     */
    public boolean reserve(int quantity, String orderId) {
        synchronized (lock) {
            if (getAvailableQuantity() < quantity) return false;

            reservedQuantity += quantity;
            audit(StockChangeType.RESERVATION, quantity, "Reserved for order: " + orderId);
            return true;
        }
    }

    /**
     * Confirm sale: deduct from total (reservation already existed).
     */
    public boolean confirmSale(int quantity, String orderId) {
        synchronized (lock) {
            if (reservedQuantity < quantity) return false;

            reservedQuantity -= quantity;
            totalQuantity    -= quantity;
            audit(StockChangeType.SALE, -quantity, "Confirmed sale for order: " + orderId);

            checkLowStock();
            return true;
        }
    }

    /**
     * Release a reservation without selling (order cancelled).
     */
    public void releaseReservation(int quantity, String orderId) {
        synchronized (lock) {
            reservedQuantity = Math.max(0, reservedQuantity - quantity);
            audit(StockChangeType.RELEASE, quantity, "Released reservation for order: " + orderId);
        }
    }

    /**
     * Add stock (restock or adjustment).
     */
    public void addStock(int quantity, String reason) {
        synchronized (lock) {
            totalQuantity += quantity;
            audit(StockChangeType.RESTOCK, quantity, reason);
            notifyObservers(new StockEvent(sku, warehouseId, totalQuantity, reservedQuantity));
        }
    }

    private void checkLowStock() {
        if (getAvailableQuantity() <= lowStockThreshold) {
            notifyObservers(new LowStockEvent(sku, warehouseId, getAvailableQuantity(), lowStockThreshold));
        }
    }

    private void audit(StockChangeType type, int delta, String reason) {
        auditLog.add(new StockAuditRecord(
            sku, warehouseId, type, delta,
            totalQuantity, reservedQuantity,
            Instant.now(), reason
        ));
    }

    private void notifyObservers(Object event) {
        observers.forEach(o -> o.onStockEvent(event));
    }

    public void addObserver(StockObserver observer)    { observers.add(observer); }
    public void removeObserver(StockObserver observer) { observers.remove(observer); }

    public List<StockAuditRecord> getAuditLog() { return Collections.unmodifiableList(auditLog); }
    public int getTotalQuantity()    { return totalQuantity; }
    public int getReservedQuantity() { return reservedQuantity; }
}
```

---

## Step 3: Observer for Low-Stock Alerts

```java
public interface StockObserver {
    void onStockEvent(Object event);
}

public record StockEvent(String sku, String warehouseId, int total, int reserved) {}
public record LowStockEvent(String sku, String warehouseId, int available, int threshold) {}

// Reorder observer — triggers purchase order when stock is low
public class AutoReorderObserver implements StockObserver {
    private final PurchaseOrderService purchaseOrderService;
    private final int reorderQuantity;

    public AutoReorderObserver(PurchaseOrderService pos, int reorderQuantity) {
        this.purchaseOrderService = pos;
        this.reorderQuantity      = reorderQuantity;
    }

    @Override
    public void onStockEvent(Object event) {
        if (event instanceof LowStockEvent low) {
            System.out.printf("⚠️ Low stock: %s at %s (%d available). Triggering reorder...%n",
                low.sku(), low.warehouseId(), low.available());
            purchaseOrderService.createPurchaseOrder(low.sku(), reorderQuantity);
        }
    }
}

// Dashboard observer — updates real-time UI
public class InventoryDashboard implements StockObserver {
    @Override
    public void onStockEvent(Object event) {
        if (event instanceof StockEvent s) {
            System.out.printf("📊 Dashboard update: %s — total: %d, reserved: %d%n",
                s.sku(), s.total(), s.reserved());
        }
    }
}

// Audit observer — persists all events to DB
public class AuditObserver implements StockObserver {
    private final AuditRepository auditRepo;

    @Override
    public void onStockEvent(Object event) {
        auditRepo.record(event, Instant.now());
    }
}
```

---

## Step 4: Inventory Service (Aggregate)

```java
public class InventoryService {
    // sku → warehouseId → StockEntry
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, StockEntry>> stock
        = new ConcurrentHashMap<>();

    public void addWarehouseStock(String sku, String warehouseId,
                                   int quantity, int lowStockThreshold) {
        stock.computeIfAbsent(sku, k -> new ConcurrentHashMap<>())
             .computeIfAbsent(warehouseId, wid -> {
                 StockEntry entry = new StockEntry(sku, wid, quantity, lowStockThreshold);
                 entry.addObserver(new AutoReorderObserver(purchaseOrderService, quantity));
                 entry.addObserver(new InventoryDashboard());
                 return entry;
             });
    }

    public int getTotalAvailable(String sku) {
        var warehouseMap = stock.get(sku);
        if (warehouseMap == null) return 0;
        return warehouseMap.values().stream()
            .mapToInt(StockEntry::getAvailableQuantity)
            .sum();
    }

    /**
     * Reserve stock across warehouses for an order.
     * Uses first-fit strategy across warehouses.
     */
    public boolean reserveStock(String sku, int quantity, String orderId) {
        var warehouseMap = stock.get(sku);
        if (warehouseMap == null) return false;

        // Try to fulfill from one warehouse first (avoids split shipments)
        for (StockEntry entry : warehouseMap.values()) {
            if (entry.reserve(quantity, orderId)) {
                return true;
            }
        }

        // TODO: Split fulfillment across warehouses (complex — discuss with interviewer)
        return false;
    }

    public boolean confirmSale(String sku, String warehouseId, int qty, String orderId) {
        StockEntry entry = getEntry(sku, warehouseId);
        return entry != null && entry.confirmSale(qty, orderId);
    }

    public void releaseReservation(String sku, String warehouseId, int qty, String orderId) {
        StockEntry entry = getEntry(sku, warehouseId);
        if (entry != null) entry.releaseReservation(qty, orderId);
    }

    public void restock(String sku, String warehouseId, int qty, String reason) {
        StockEntry entry = getEntry(sku, warehouseId);
        if (entry != null) entry.addStock(qty, reason);
    }

    private StockEntry getEntry(String sku, String warehouseId) {
        var warehouseMap = stock.get(sku);
        return warehouseMap != null ? warehouseMap.get(warehouseId) : null;
    }
}
```

---

## Step 5: Audit Record

```java
public record StockAuditRecord(
    String sku,
    String warehouseId,
    StockChangeType changeType,
    int delta,
    int totalAfter,
    int reservedAfter,
    Instant timestamp,
    String reason
) {}
```

---

## Step 6: Usage Example

```java
InventoryService inventory = new InventoryService();

// Setup
inventory.addWarehouseStock("SKU-001", "WH-EAST", 100, 20);
inventory.addWarehouseStock("SKU-001", "WH-WEST", 50, 10);

System.out.println("Total available: " + inventory.getTotalAvailable("SKU-001")); // 150

// Order flow
String orderId = "ORD-999";
boolean reserved = inventory.reserveStock("SKU-001", 30, orderId);
System.out.println("Reserved: " + reserved); // true

System.out.println("After reserve: " + inventory.getTotalAvailable("SKU-001")); // 120

// Payment successful → confirm sale
inventory.confirmSale("SKU-001", "WH-EAST", 30, orderId);
System.out.println("After sale: " + inventory.getTotalAvailable("SKU-001")); // 120

// If payment failed → release reservation
// inventory.releaseReservation("SKU-001", "WH-EAST", 30, orderId);

// Restock
inventory.restock("SKU-001", "WH-EAST", 50, "Monthly replenishment");
System.out.println("After restock: " + inventory.getTotalAvailable("SKU-001")); // 170
```

---

## Senior Deep Dive

:::note[Senior Deep Dive 🔴]
**Optimistic concurrency at DB level:** Use a `version` column on stock rows. CAS update: `UPDATE stock SET quantity = ?, version = version+1 WHERE sku = ? AND version = ?`. If 0 rows updated → retry.

**Split fulfillment:** When one warehouse can't fulfill the entire quantity, split across warehouses. This requires distributed transaction semantics — either 2PC or saga pattern (reserve in WH-EAST, then WH-WEST; if second fails, compensate by releasing first).

**Event sourcing:** Instead of storing current stock level, store every stock event. Current level = replay of all events. Perfect audit trail, time-travel queries, no update conflicts.
:::

---

## Interview Checklist

- [ ] Separated `totalQuantity` from `reservedQuantity` (available = total - reserved)
- [ ] `reserve()` and `confirmSale()` are synchronized — no overselling
- [ ] Observer pattern for low-stock alerts and dashboard updates
- [ ] Auto-reorder triggered when stock drops below threshold
- [ ] Audit log records every stock mutation with reason and timestamp
- [ ] `ConcurrentHashMap` for multi-warehouse storage
- [ ] First-fit warehouse selection for reservations
- [ ] Discussed optimistic locking and event sourcing for production
