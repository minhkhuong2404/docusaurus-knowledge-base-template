---
id: exception-handling-advanced
title: Advanced Exception Handling
sidebar_label: Exception Handling
description: "Advanced exception handling interview questions focused on propagation, chaining, and layered design."
tags: [java, interview, exception-handling, backend]
---

# Exception Handling Interview Questions - Part 2

This guide explores exception propagation through application layers, chaining, custom exceptions, and production-grade error handling patterns.

## 1. What is Exception Propagation?

Exception propagation is the process where an unhandled exception "bubbles up" the call stack from the method where it occurred to each successive caller until it is caught or reaches the JVM.

### The Flow in a Spring Boot Application
```
Database Driver (SQLException)
    ↓ propagates to
DAO/Repository Layer
    ↓ propagates to
Service Layer
    ↓ propagates to
Controller Layer
    ↓ propagates to
DispatcherServlet → ErrorController → HTTP Response
```

### The Risk
If no layer handles the exception, it propagates to the JVM's default `UncaughtExceptionHandler`, which:
1. Prints the stack trace to `System.err`
2. In a web app: Spring's `BasicErrorController` sends a generic `500 Internal Server Error` with the "Whitelabel Error Page"

**This is a terrible user experience** — the client sees a raw error with no actionable information, and the stack trace may leak sensitive internal details (database schema, file paths, class names).

## 2. Best Practice: Layered Exception Handling

### Layer Responsibilities

| Layer | Responsibility | Example |
|:------|:--------------|:--------|
| **Repository** | Throw data access exceptions | `DataAccessException`, `EntityNotFoundException` |
| **Service** | Catch and translate to business exceptions | `InsufficientBalanceException`, `OrderNotFoundException` |
| **Controller** | Catch and translate to HTTP responses | 400, 404, 409, 500 with structured error body |

### The `@ControllerAdvice` Pattern (Recommended)

Instead of try-catch in every controller method, use a **global exception handler**:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(EntityNotFoundException ex) {
        return new ErrorResponse(
            "RESOURCE_NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage
            ));
        return new ErrorResponse("VALIDATION_FAILED", errors, LocalDateTime.now());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneral(Exception ex) {
        log.error("Unexpected error", ex); // Log full stack trace internally
        return new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred", // Don't expose internals!
            LocalDateTime.now()
        );
    }
}

// Structured error response DTO
public record ErrorResponse(
    String errorCode,
    Object message,
    LocalDateTime timestamp
) {}
```

### Exception Hierarchy Design
```
                  Exception
                     │
          ┌──────────┼──────────────┐
    Checked          │         RuntimeException
  (must catch)       │         (unchecked)
                     │              │
              IOException     ┌─────┼──────────────┐
                              │     │              │
                    BusinessException  │    IllegalArgumentException
                         │            │
              ┌──────────┼──────┐    │
    OrderNotFoundException  InsufficientBalanceException
```

## 3. What are Chained Exceptions?

Chained exceptions allow you to relate one exception to another, preserving the **root cause** for debugging. This is critical in layered architectures where you wrap low-level exceptions in domain-specific ones.

```java
// Service layer: wrap the technical exception in a business exception
public Order processOrder(Long orderId) {
    try {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    } catch (DataAccessException ex) {
        // Chain: business exception wraps the technical cause
        throw new OrderProcessingException(
            "Failed to process order: " + orderId,
            ex  // ← The original cause is preserved
        );
    }
}
```

### Chaining Methods

| Method | Purpose |
|:-------|:--------|
| `new Exception(message, cause)` | Set cause via constructor (preferred) |
| `exception.initCause(cause)` | Set cause after construction (legacy) |
| `exception.getCause()` | Retrieve the chained cause |
| Stack trace print | Shows "Caused by:" chain |

### Stack trace output:
```
com.app.OrderProcessingException: Failed to process order: 42
    at com.app.OrderService.processOrder(OrderService.java:25)
    at com.app.OrderController.getOrder(OrderController.java:18)
    ... 30 more
Caused by: org.springframework.dao.DataAccessException: Connection refused
    at org.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:398)
    ... 15 more
Caused by: java.net.ConnectException: Connection refused (Connection refused)
    at java.base/sun.nio.ch.Net.connect0(Native Method)
    ... 10 more
```

**Rule:** Always include the cause when wrapping exceptions. Without it, the root cause is lost and debugging becomes extremely difficult.

## 4. Why use Custom Exceptions?

Custom exceptions provide several advantages over using generic exceptions:

### Structured Error Information
```java
public class BusinessException extends RuntimeException {
    private final String errorCode;     // Machine-readable code for clients
    private final HttpStatus status;    // HTTP status mapping
    
    public BusinessException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
    
    // Getters
}

// Specific business exceptions
public class InsufficientBalanceException extends BusinessException {
    public InsufficientBalanceException(BigDecimal required, BigDecimal available) {
        super(
            "INSUFFICIENT_BALANCE",
            String.format("Required: %s, Available: %s", required, available),
            HttpStatus.UNPROCESSABLE_ENTITY  // 422
        );
    }
}
```

### Benefits
1. **Selective catching:** `catch (OrderNotFoundException e)` vs. catching a generic `RuntimeException` that could be anything
2. **Error codes:** Machine-readable codes for API consumers to programmatically handle errors
3. **HTTP status mapping:** Each exception type maps to an appropriate HTTP status
4. **Logging categorization:** Custom exceptions can carry severity, context, and metadata

## 5. Checked vs. Unchecked Exceptions: When to use which

| Type | Extends | Must Handle? | Use When |
|:-----|:--------|:-------------|:---------|
| **Checked** | `Exception` | Yes (catch or declare) | Recoverable errors: file not found, network timeout |
| **Unchecked** | `RuntimeException` | No | Programming errors: null pointer, illegal argument |
| **Error** | `Error` | Never catch | JVM failures: `OutOfMemoryError`, `StackOverflowError` |

### Modern best practice
Most modern Java frameworks (Spring, Hibernate) use **unchecked exceptions** exclusively. The reasoning:
- Checked exceptions pollute method signatures up the entire call chain
- Most callers can't meaningfully recover from the exception anyway
- `@Transactional` only rolls back on unchecked exceptions by default

```java
// Spring Data: throws unchecked DataAccessException (not checked SQLException)
// Hibernate: throws unchecked HibernateException (not checked SQLException)
```

## 6. Try-with-Resources (Java 7+)

The modern replacement for `try-finally` resource cleanup:

```java
// OLD: verbose, error-prone (what if close() throws?)
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader("file.txt"));
    return reader.readLine();
} finally {
    if (reader != null) reader.close(); // Can throw, masking original exception!
}

// MODERN: concise, correct
try (BufferedReader reader = new BufferedReader(new FileReader("file.txt"))) {
    return reader.readLine();
} // reader.close() is called automatically, even if readLine() throws
```

### Suppressed Exceptions
If both the `try` block and `close()` throw exceptions, the close exception is **suppressed** (not lost):
```java
try (MyResource res = new MyResource()) {
    throw new IOException("Primary exception");
} // close() throws CloseException — this is SUPPRESSED

// catch (IOException e) {
//     e.getSuppressedExceptions(); // Contains CloseException
// }
```

### Multiple Resources
```java
try (
    Connection conn = dataSource.getConnection();
    PreparedStatement stmt = conn.prepareStatement(sql);
    ResultSet rs = stmt.executeQuery()
) {
    // All three are closed in REVERSE order: rs → stmt → conn
}
```

---