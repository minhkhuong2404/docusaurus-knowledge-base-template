---
sidebar_position: 8
title: "Chapter 7: Error Handling"
description: Writing error handling that is robust, clean, and doesn't obscure your business logic.
---

# Chapter 7: Error Handling

## Error Handling Is Important — But It Shouldn't Dominate

Error handling is one of the things that can scatter across an entire codebase, burying the actual business logic in a maze of checks and conditions. Clean error handling keeps errors as **first-class concerns** while keeping business logic visible and readable.

---

## Use Exceptions Rather Than Return Codes

In older code (pre-exceptions), methods returned error codes:

```java
// Old style — caller must check return code after every call
public class DeviceController {
    public void sendShutDown() {
        DeviceHandle handle = getHandle(DEV1);
        if (handle != DeviceHandle.INVALID) {
            retrieveDeviceRecord(handle);
            if (record.getStatus() != DEVICE_SUSPENDED) {
                pauseDevice(handle);
                clearDeviceWorkQueue(handle);
                closeDevice(handle);
            } else {
                logger.log("Device suspended. Unable to shut down");
            }
        } else {
            logger.log("Invalid handle for: " + DEV1.toString());
        }
    }
}
```

This forces the caller to handle errors **immediately and everywhere**, cluttering the logic. The happy path is buried in else branches.

```java
// Clean — exceptions separate the happy path from error handling
public class DeviceController {
    public void sendShutDown() {
        try {
            tryToShutDown();
        } catch (DeviceShutDownError e) {
            logger.log(e);
        }
    }

    private void tryToShutDown() throws DeviceShutDownError {
        DeviceHandle handle = getHandle(DEV1);
        DeviceRecord record = retrieveDeviceRecord(handle);
        pauseDevice(handle);
        clearDeviceWorkQueue(handle);
        closeDevice(handle);
    }

    private DeviceHandle getHandle(DeviceID id) {
        // ...
        throw new DeviceShutDownError("Invalid handle for: " + id.toString());
    }
}
```

Now the business logic (shut down the device) is clearly separate from the error handling.

---

## Write Your Try-Catch-Finally First

When writing code that could throw exceptions, **start with the try-catch-finally block**. This defines the transaction boundary first — what the scope of a failure is.

The `try` block is like a transaction: if something goes wrong, the catch restores invariants to a consistent state.

This is also a useful TDD technique: write a test that forces an exception, write the try-catch structure, then fill in the logic.

---

## Use Unchecked Exceptions

Java's checked exceptions were once thought to be a great idea. Martin argues they are a **design mistake** at scale.

**The problem:** Checked exceptions violate the Open/Closed Principle. If a low-level method declares `throws SQLException`, every method in the call chain must either handle it or declare it. A change to a low-level exception ripples all the way up the call stack.

```java
// Bad — every caller in the call chain must handle or declare this
public void processOrder() throws DatabaseException { ... }
public void handleRequest() throws DatabaseException { ... }
public void dispatchRequest() throws DatabaseException { ... }
```

For most applications, the benefit of checked exceptions (explicit documentation of exceptions) does not outweigh the cost (tight coupling through the call stack).

**Use unchecked exceptions** (subclasses of `RuntimeException`) for the general case. Reserve checked exceptions for truly recoverable situations where you want to force the caller to deal with it.

---

## Provide Context with Exceptions

Always create informative error messages that explain what operation failed and why:

```java
// Bad — no context
throw new FileNotFoundException();

// Good — full context
throw new FileNotFoundException(
    "Could not open config file: " + configPath + 
    " (required for application startup)"
);
```

Log the full stack trace in your catch block so you can reconstruct what happened.

---

## Define Exception Classes in Terms of the Caller's Needs

Often the best exception classification is based on **how the caller will handle it** — not on where it originates.

Example: wrapping a third-party API's exceptions into one unified type:

```java
// Bad — three different exceptions for the same error scenario
try {
    port.open();
} catch (DeviceResponseException e) {
    reportPortError(e);
    logger.log("Device response exception", e);
} catch (ATM1212UnlockedException e) {
    reportPortError(e);
    logger.log("Unlock exception", e);
} catch (GMXError e) {
    reportPortError(e);
    logger.log("Device response exception", e);
}

// Good — wrap the third-party API in a thin LocalPort class
public class LocalPort {
    private ACMEPort innerPort;

    public void open() {
        try {
            innerPort.open();
        } catch (DeviceResponseException | ATM1212UnlockedException | GMXError e) {
            throw new PortDeviceFailure(e); // our own exception
        }
    }
}

// Now the caller only sees one exception type
try {
    localPort.open();
} catch (PortDeviceFailure e) {
    reportError(e);
    logger.log(e.getMessage(), e);
}
```

This also insulates you from third-party API changes and makes the code easier to test.

---

## Define the Normal Flow: Special Case Pattern

Sometimes you don't want to throw an exception at all — the "error" case is actually a normal, expected case.

```java
// Bad — exception-driven control flow for a legitimate business case
try {
    MealExpenses expenses = expenseReportDAO.getMeals(employee.getId());
    m_total += expenses.getTotal();
} catch (MealExpensesNotFound e) {
    m_total += getMealPerDiem(); // no expenses = use default per diem
}
```

The exception is being used for control flow. Instead, use the **Special Case Pattern** — return an object that handles the "no data" case:

```java
// Good — the DAO never throws; it returns a special case object
MealExpenses expenses = expenseReportDAO.getMeals(employee.getId());
m_total += expenses.getTotal(); // "per diem" MealExpenses returns per diem in getTotal()

// In the DAO:
public MealExpenses getMeals(int employeeId) {
    MealExpenses expenses = findByEmployee(employeeId);
    return expenses != null ? expenses : new PerDiemMealExpenses();
}
```

`PerDiemMealExpenses` implements `MealExpenses` and returns the per diem amount for `getTotal()`. No exception needed.

---

## Don't Return Null

Returning `null` forces every caller to check for it. Eventually someone forgets, and you get a `NullPointerException` in production.

```java
// Bad — every caller must null-check
List<Employee> employees = getEmployees();
if (employees != null) {
    for (Employee e : employees) {
        totalPay += e.getPay();
    }
}

// Good — return an empty list instead of null
List<Employee> employees = getEmployees();
for (Employee e : employees) {
    totalPay += e.getPay();
}

// In the method:
public List<Employee> getEmployees() {
    if (noEmployees())
        return Collections.emptyList(); // never null
    return findAllEmployees();
}
```

:::tip
If you're using Java, consider `Optional<T>` for values that might be absent. It makes the "might be empty" contract explicit in the type system.
:::

---

## Don't Pass Null

Returning null is bad. **Passing null is worse.** A method that receives null has no good way to handle it.

```java
// Caller passes null accidentally or intentionally
calculator.xProjection(null, new Point(12, 13)); // boom

// Method has to guard against it — ugly
public double xProjection(Point p1, Point p2) {
    if (p1 == null || p2 == null)
        throw new InvalidArgumentException("Invalid argument for MetricsCalculator.xProjection");
    return (p2.x - p1.x) * 1.5;
}
```

In most systems, banning null arguments at API boundaries is the right default. Use assertions, `Objects.requireNonNull()`, or annotations like `@NonNull`.

---

## Key Takeaways

| Practice | Why |
|----------|-----|
| Use exceptions over return codes | Separates happy path from error path |
| Write try-catch-finally first | Defines the transaction boundary up front |
| Prefer unchecked exceptions | Avoids coupling through the call stack |
| Include context in exceptions | Easier debugging and diagnosis |
| Wrap third-party APIs | Insulation from external changes |
| Use Special Case Pattern | Avoids exception-driven control flow |
| Return empty collections, not null | Eliminates null checks at every call site |
| Don't pass null | Eliminates defensive null checks inside methods |
