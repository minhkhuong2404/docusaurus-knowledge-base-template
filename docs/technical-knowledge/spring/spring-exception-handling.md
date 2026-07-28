---
id: spring-exception-handling
title: Exception Handling in Spring Boot
sidebar_label: Exception Handling
description: A complete guide to @ControllerAdvice and @RestControllerAdvice — handling checked and unchecked exceptions globally, building consistent error responses, validation errors, and senior-level exception hierarchy design.
tags: [spring-boot, java, exception-handling, controlleradvice, restcontrolleradvice, checked-exception, unchecked-exception, validation, error-response]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import JavaExceptionHierarchyDiagram from '@site/src/components/JavaExceptionHierarchyDiagram';

# Exception Handling in Spring Boot

:::info[Who this guide is for]
- **New learners** — start at [Checked vs Unchecked Exceptions](#checked-vs-unchecked-exceptions) and [Your First @RestControllerAdvice](#your-first-restcontrolleradvice) to understand the foundational patterns.
- **Senior engineers** — jump to [Custom Exception Hierarchy](#custom-exception-hierarchy), [Validation Errors](#handling-validation-errors), [Problem Details (RFC 7807)](#problem-details-rfc-7807), or [Production Patterns](#production-patterns).
:::

---

## Why Global Exception Handling?

Without centralised exception handling, error management is scattered across every controller:

```java
// ❌ Without global handling — duplicated in every controller
@GetMapping("/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
    try {
        return ResponseEntity.ok(userService.findById(id));
    } catch (UserNotFoundException e) {
        return ResponseEntity.status(404).body(null);  // null body — no error message
    } catch (Exception e) {
        return ResponseEntity.status(500).body(null);  // swallowed — no logging
    }
}
```

Problems with this approach:
- Error response structure varies per developer — no consistency across endpoints.
- Exception logic is duplicated across dozens of controllers.
- No central place to add logging, tracing, or alerting.
- Callers get inconsistent JSON shapes for errors.

**The solution:** centralise all exception handling in a single `@RestControllerAdvice` class — controllers stay clean, and every error response has a consistent shape.

---

## Checked vs Unchecked Exceptions

Understanding this distinction is foundational before looking at how Spring handles them.

### Unchecked exceptions (RuntimeException)

Extend `RuntimeException`. The compiler does **not** require you to declare or catch them. They represent programming errors or unexpected failures:

```java
// These are all unchecked:
throw new NullPointerException();
throw new IllegalArgumentException("Invalid input");
throw new IllegalStateException("Cannot process in this state");
throw new UserNotFoundException("User 42 not found"); // your custom unchecked
```

<JavaExceptionHierarchyDiagram />

### Checked exceptions

Extend `Exception` directly (not `RuntimeException`). The compiler **forces** you to either catch them or declare them with `throws`. They model recoverable conditions:

```java
// Compiler forces you to handle this:
public User readFromFile(String path) throws IOException {
    // ...
}

// Or catch it:
try {
    User u = readFromFile("/data/user.json");
} catch (IOException e) {
    // must handle
}
```

### When to use each

| | Checked | Unchecked |
|--|---------|-----------|
| **Use for** | Recoverable conditions the caller can reasonably handle (file not found, network timeout) | Programming errors, domain rule violations, unexpected failures |
| **Compiler enforcement** | Yes — forces handling | No — optional to catch |
| **Spring Web recommendation** | Wrap in unchecked or catch in `@ExceptionHandler` | Directly handled by `@ExceptionHandler` |
| **Examples** | `IOException`, `SQLException`, `ParseException` | `IllegalArgumentException`, `NullPointerException`, your custom domain exceptions |

:::tip[Spring Boot's own convention]
Spring itself almost exclusively throws unchecked exceptions (`DataAccessException`, `HttpMessageNotReadableException`, `MethodArgumentNotValidException`, etc.) — wrapping checked exceptions from JDBC, Jackson, etc. into unchecked. Following this pattern in your own code keeps controllers clean.
:::

---

## @ControllerAdvice vs @RestControllerAdvice

| | `@ControllerAdvice` | `@RestControllerAdvice` |
|--|--------------------|-----------------------|
| **Composition** | Standalone annotation | `@ControllerAdvice` + `@ResponseBody` |
| **Response body** | Must add `@ResponseBody` to each handler method | Automatic — all handler methods return JSON/XML |
| **Use with** | MVC controllers returning views (Thymeleaf, JSP) | REST APIs returning JSON |
| **Typical usage** | Mixed MVC + API applications | Pure REST API applications |

```java
// @RestControllerAdvice is a shorthand for:
@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler { ... }

// Equivalent to:
@RestControllerAdvice
public class GlobalExceptionHandler { ... }
```

**For REST APIs, always use `@RestControllerAdvice`.**

---

## Your First @RestControllerAdvice

### Step 1 — Define a consistent error response shape

Before handling exceptions, decide what your error JSON looks like. Be consistent across all endpoints:

```java
// ErrorResponse.java
@Getter
@Builder
public class ErrorResponse {
    private final int         status;      // HTTP status code
    private final String      error;       // HTTP status reason phrase
    private final String      message;     // Human-readable message
    private final String      path;        // Request URI
    private final Instant     timestamp;   // When the error occurred
}
```

Example JSON output:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "User with id 42 was not found",
  "path": "/api/users/42",
  "timestamp": "2024-01-15T09:30:00Z"
}
```

### Step 2 — Create the global handler

```java
// GlobalExceptionHandler.java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // Injected to read the current request's URI
    @Autowired
    private HttpServletRequest request;

    // ── Catch-all for anything unhandled ──────────────────────────
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex) {
        log.error("Unexpected error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ErrorResponse.builder()
                .status(500)
                .error("Internal Server Error")
                .message("An unexpected error occurred. Please try again later.")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
    }
}
```

### Step 3 — Add specific handlers

**More specific handlers take priority over less specific ones.** Spring resolves the most specific matching `@ExceptionHandler` first:

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @Autowired
    private HttpServletRequest request;

    // Handles UserNotFoundException (most specific — checked first)
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleUserNotFound(UserNotFoundException ex) {
        log.warn("User not found: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // Handles any ResourceNotFoundException (less specific)
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // Handles business rule violations
    @ExceptionHandler(BusinessRuleException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleBusinessRule(BusinessRuleException ex) {
        log.warn("Business rule violation: {}", ex.getMessage());
        return buildError(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    // Handles IllegalArgumentException (unchecked, Spring and app code)
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // Catch-all fallback
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex) {
        log.error("Unexpected error on {}", request.getRequestURI(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.");
    }

    // ── Helper ────────────────────────────────────────────────────
    private ErrorResponse buildError(HttpStatus status, String message) {
        return ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
    }
}
```

:::info[Handler resolution order]
Spring picks the **most specific** exception type that matches. `UserNotFoundException extends ResourceNotFoundException` → the `handleUserNotFound` handler fires, not `handleNotFound`. If no specific handler matches, Spring walks up the hierarchy until it reaches `Exception.class`.
:::

---

## Custom Exception Hierarchy

A well-designed exception hierarchy is the backbone of clean error handling. Define a base exception and build domain exceptions from it.

### Base exception

```java
// BaseException.java — all your custom exceptions extend this
@Getter
public abstract class BaseException extends RuntimeException {

    private final String    errorCode;   // machine-readable code, e.g. "USER_NOT_FOUND"
    private final HttpStatus httpStatus; // the HTTP status this maps to

    protected BaseException(String errorCode, HttpStatus httpStatus, String message) {
        super(message);
        this.errorCode  = errorCode;
        this.httpStatus = httpStatus;
    }

    protected BaseException(String errorCode, HttpStatus httpStatus, String message, Throwable cause) {
        super(message, cause);
        this.errorCode  = errorCode;
        this.httpStatus = httpStatus;
    }
}
```

### Domain-specific exceptions

```java
// 404 Not Found exceptions
public class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String resource, Object id) {
        super(
            resource.toUpperCase() + "_NOT_FOUND",
            HttpStatus.NOT_FOUND,
            String.format("%s with id '%s' was not found", resource, id)
        );
    }
}

// Convenience subclasses — callers don't need to know about HTTP
public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException(Long userId) {
        super("User", userId);
    }
}

public class OrderNotFoundException extends ResourceNotFoundException {
    public OrderNotFoundException(Long orderId) {
        super("Order", orderId);
    }
}

// 409 Conflict
public class ResourceAlreadyExistsException extends BaseException {
    public ResourceAlreadyExistsException(String resource, String field, Object value) {
        super(
            resource.toUpperCase() + "_ALREADY_EXISTS",
            HttpStatus.CONFLICT,
            String.format("%s with %s '%s' already exists", resource, field, value)
        );
    }
}

// 422 Unprocessable Entity — domain rule violated
public class BusinessRuleException extends BaseException {
    public BusinessRuleException(String errorCode, String message) {
        super(errorCode, HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}

// 403 Forbidden — caller doesn't have permission
public class AccessDeniedException extends BaseException {
    public AccessDeniedException(String resource, Long id) {
        super(
            "ACCESS_DENIED",
            HttpStatus.FORBIDDEN,
            String.format("You do not have permission to access %s %d", resource, id)
        );
    }
}
```

### Simplified handler using the base exception

With the hierarchy in place, your advice can handle all custom exceptions in one method:

```java
@ExceptionHandler(BaseException.class)
public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
    log.warn("[{}] {}", ex.getErrorCode(), ex.getMessage());

    ErrorResponse body = ErrorResponse.builder()
            .status(ex.getHttpStatus().value())
            .error(ex.getErrorCode())               // machine-readable
            .message(ex.getMessage())               // human-readable
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();

    return ResponseEntity.status(ex.getHttpStatus()).body(body);
}
```

**Usage in service layer:**

```java
@Service
public class UserService {

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        // → if not found: 404 {"error":"USER_NOT_FOUND","message":"User with id '42' was not found"}
    }

    public void transferBalance(Long fromId, Long toId, BigDecimal amount) {
        User from = findById(fromId);
        if (from.getBalance().compareTo(amount) < 0) {
            throw new BusinessRuleException(
                "INSUFFICIENT_BALANCE",
                "Insufficient balance to transfer " + amount
            );
            // → 422 {"error":"INSUFFICIENT_BALANCE","message":"..."}
        }
        // ...
    }
}
```

---

## Handling Checked Exceptions

Checked exceptions (like `IOException`, `SQLException`) must be caught somewhere. The cleanest pattern is to **catch them at the service layer and rethrow as your unchecked domain exceptions**, keeping controllers and advice free of checked-exception concerns.

### Wrap at the service boundary

```java
@Service
public class FileImportService {

    public List<User> importUsers(MultipartFile file) {
        try {
            // IOException is checked — wrap it
            byte[] bytes = file.getBytes();
            return parseCsv(bytes);
        } catch (IOException e) {
            // Rethrow as unchecked — ControllerAdvice will catch it
            throw new FileProcessingException("Failed to read uploaded file: " + e.getMessage(), e);
        }
    }

    private List<User> parseCsv(byte[] data) {
        try {
            // CsvParseException is checked — wrap it
            return csvParser.parse(data);
        } catch (CsvParseException e) {
            throw new BusinessRuleException("INVALID_CSV_FORMAT",
                    "CSV file format is invalid: " + e.getMessage());
        }
    }
}
```

```java
// FileProcessingException.java
public class FileProcessingException extends BaseException {
    public FileProcessingException(String message, Throwable cause) {
        super("FILE_PROCESSING_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, message, cause);
    }
}
```

### Handle Spring's own checked-wrapping

Spring wraps many checked exceptions into its own unchecked hierarchy. Register handlers for the ones you care about:

```java
// DataAccessException wraps all JDBC/JPA checked exceptions
@ExceptionHandler(DataAccessException.class)
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public ErrorResponse handleDatabaseError(DataAccessException ex) {
    log.error("Database error: {}", ex.getMessage(), ex);
    // Don't expose internal DB details to the client
    return buildError(HttpStatus.SERVICE_UNAVAILABLE,
            "A database error occurred. Please try again later.");
}

// HttpClientErrorException from RestTemplate / WebClient
@ExceptionHandler(HttpClientErrorException.class)
public ResponseEntity<ErrorResponse> handleHttpClientError(HttpClientErrorException ex) {
    log.warn("Downstream HTTP error: {} {}", ex.getStatusCode(), ex.getMessage());
    return ResponseEntity
            .status(ex.getStatusCode())
            .body(buildError((HttpStatus) ex.getStatusCode(),
                    "Downstream service error: " + ex.getStatusText()));
}
```

---

## Handling Validation Errors

Bean Validation (`@Valid`, `@Validated`) throws `MethodArgumentNotValidException` when request body validation fails and `ConstraintViolationException` when method parameter validation fails. Both need special handling because they carry structured field-level errors.

### The extended error response with field errors

```java
@Getter
@Builder
public class ValidationErrorResponse {
    private final int                    status;
    private final String                 error;
    private final String                 message;
    private final String                 path;
    private final Instant                timestamp;
    private final List<FieldError>       fieldErrors;  // ← per-field detail

    @Getter
    @AllArgsConstructor
    public static class FieldError {
        private final String field;
        private final Object rejectedValue;
        private final String message;
    }
}
```

### Handler for `@RequestBody` validation (`@Valid`)

```java
// Fired when @Valid fails on a @RequestBody
@ExceptionHandler(MethodArgumentNotValidException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {

    List<ValidationErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new ValidationErrorResponse.FieldError(
                    fe.getField(),
                    fe.getRejectedValue(),
                    fe.getDefaultMessage()
            ))
            .collect(Collectors.toList());

    log.warn("Validation failed on {}: {}", request.getRequestURI(), fieldErrors);

    return ValidationErrorResponse.builder()
            .status(400)
            .error("Validation Failed")
            .message("Request body contains invalid fields")
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .fieldErrors(fieldErrors)
            .build();
}
```

### Handler for path/query param validation (`@Validated`)

```java
// Fired when @Validated fails on @PathVariable or @RequestParam
@ExceptionHandler(ConstraintViolationException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ValidationErrorResponse handleConstraintViolation(ConstraintViolationException ex) {

    List<ValidationErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations()
            .stream()
            .map(cv -> new ValidationErrorResponse.FieldError(
                    extractFieldName(cv.getPropertyPath().toString()),
                    cv.getInvalidValue(),
                    cv.getMessage()
            ))
            .collect(Collectors.toList());

    return ValidationErrorResponse.builder()
            .status(400)
            .error("Validation Failed")
            .message("Request parameters contain invalid values")
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .fieldErrors(fieldErrors)
            .build();
}

private String extractFieldName(String propertyPath) {
    // propertyPath is like "getUserById.id" — take the last segment
    String[] parts = propertyPath.split("\\.");
    return parts[parts.length - 1];
}
```

**Example JSON output for a failed POST /users:**

```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Request body contains invalid fields",
  "path": "/api/users",
  "timestamp": "2024-01-15T09:30:00Z",
  "fieldErrors": [
    { "field": "email",    "rejectedValue": "not-an-email",   "message": "must be a well-formed email address" },
    { "field": "age",      "rejectedValue": -1,               "message": "must be greater than or equal to 0" },
    { "field": "username", "rejectedValue": "",               "message": "must not be blank" }
  ]
}
```

### Handling `@RequestParam` type mismatch

```java
// Fired when a path variable or request param can't be converted to the target type
// e.g. GET /users/abc when id is @PathVariable Long id
@ExceptionHandler(MethodArgumentTypeMismatchException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ErrorResponse handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    String message = String.format(
        "Parameter '%s' with value '%s' could not be converted to type '%s'",
        ex.getName(), ex.getValue(),
        ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown"
    );
    log.warn("Type mismatch: {}", message);
    return buildError(HttpStatus.BAD_REQUEST, message);
}

// Fired when @RequestBody JSON is malformed (unparseable JSON)
@ExceptionHandler(HttpMessageNotReadableException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ErrorResponse handleUnreadableMessage(HttpMessageNotReadableException ex) {
    log.warn("Malformed JSON body: {}", ex.getMessage());
    return buildError(HttpStatus.BAD_REQUEST, "Request body is malformed or missing");
}

// Fired when a required @RequestParam is missing
@ExceptionHandler(MissingServletRequestParameterException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ErrorResponse handleMissingParam(MissingServletRequestParameterException ex) {
    String message = String.format("Required parameter '%s' of type '%s' is missing",
            ex.getParameterName(), ex.getParameterType());
    return buildError(HttpStatus.BAD_REQUEST, message);
}
```

---

## Handling Spring Security Exceptions

Spring Security exceptions are thrown **before** the dispatcher servlet, so `@RestControllerAdvice` doesn't catch them by default. Handle them in a custom `AuthenticationEntryPoint` and `AccessDeniedHandler`:

```java
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException ex) throws IOException {

        ErrorResponse body = ErrorResponse.builder()
                .status(401)
                .error("Unauthorized")
                .message("Authentication is required to access this resource")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), body);
    }
}

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       org.springframework.security.access.AccessDeniedException ex) throws IOException {

        ErrorResponse body = ErrorResponse.builder()
                .status(403)
                .error("Forbidden")
                .message("You do not have permission to access this resource")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
```

Register both in your security configuration:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http,
        RestAuthenticationEntryPoint entryPoint,
        RestAccessDeniedHandler accessDeniedHandler) throws Exception {
    http
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(entryPoint)
            .accessDeniedHandler(accessDeniedHandler)
        );
    return http.build();
}
```

---

## Problem Details (RFC 7807)

RFC 7807 (Problem Details for HTTP APIs) is an IETF standard for error response format. Spring Boot 3.x ships built-in support via `ProblemDetail`.

### Built-in support (Spring Boot 3.x)

Enable it in `application.yaml`:

```yaml
spring:
  mvc:
    problemdetails:
      enabled: true
```

With this enabled, Spring's built-in exceptions (`MethodArgumentNotValidException`, `NoResourceFoundException`, etc.) automatically return RFC 7807 JSON:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "No static resource api/users/999.",
  "instance": "/api/users/999"
}
```

### Extending ProblemDetail for custom exceptions

```java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex,
                                            HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());

        // Standard fields
        problem.setTitle("User Not Found");
        problem.setInstance(URI.create(request.getRequestURI()));

        // Custom extension fields
        problem.setProperty("errorCode", ex.getErrorCode());
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }

    // Override built-in handler for MethodArgumentNotValidException
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {

        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setTitle("Validation Failed");
        problem.setDetail("One or more fields failed validation");

        List<Map<String, Object>> errors = ex.getBindingResult()
                .getFieldErrors().stream()
                .map(fe -> Map.<String, Object>of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage()
                ))
                .collect(Collectors.toList());

        problem.setProperty("fieldErrors", errors);
        return ResponseEntity.status(status).headers(headers).body(problem);
    }
}
```

**RFC 7807 JSON output:**

```json
{
  "type": "about:blank",
  "title": "User Not Found",
  "status": 404,
  "detail": "User with id '42' was not found",
  "instance": "/api/users/42",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2024-01-15T09:30:00Z"
}
```

---

## Complete Handler Reference

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Autowired
    private HttpServletRequest request;

    // ── Your domain exceptions ─────────────────────────────────────
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBase(BaseException ex) {
        log.warn("[{}] {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(buildError(ex.getHttpStatus(), ex.getErrorCode(), ex.getMessage()));
    }

    // ── Spring MVC exceptions ──────────────────────────────────────
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String msg = String.format("Parameter '%s' has invalid value '%s'",
                ex.getName(), ex.getValue());
        return buildError(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleUnreadable(HttpMessageNotReadableException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "MALFORMED_JSON",
                "Request body is malformed or missing");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMissingParam(MissingServletRequestParameterException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER",
                "Required parameter '" + ex.getParameterName() + "' is missing");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ErrorResponse handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return buildError(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNoResourceFound(NoResourceFoundException ex) {
        return buildError(HttpStatus.NOT_FOUND, "ROUTE_NOT_FOUND",
                "The requested URL was not found on this server");
    }

    // ── Validation exceptions ──────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<ValidationErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
                .getFieldErrors().stream()
                .map(fe -> new ValidationErrorResponse.FieldError(
                        fe.getField(), fe.getRejectedValue(), fe.getDefaultMessage()))
                .collect(Collectors.toList());
        log.warn("Validation failed: {}", fieldErrors);
        return buildValidationError("Request body contains invalid fields", fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleConstraint(ConstraintViolationException ex) {
        List<ValidationErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(cv -> new ValidationErrorResponse.FieldError(
                        cv.getPropertyPath().toString(), cv.getInvalidValue(), cv.getMessage()))
                .collect(Collectors.toList());
        return buildValidationError("Request parameters contain invalid values", fieldErrors);
    }

    // ── Data access exceptions ─────────────────────────────────────
    @ExceptionHandler(DataAccessException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleDataAccess(DataAccessException ex) {
        log.error("Database error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildError(HttpStatus.SERVICE_UNAVAILABLE, "DATABASE_ERROR",
                "A database error occurred. Please try again later.");
    }

    // ── Catch-all fallback ─────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex) {
        log.error("Unexpected error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please try again later.");
    }

    // ── Helpers ────────────────────────────────────────────────────
    private ErrorResponse buildError(HttpStatus status, String code, String message) {
        return ErrorResponse.builder()
                .status(status.value())
                .error(code)
                .message(message)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
    }

    private ValidationErrorResponse buildValidationError(String message,
            List<ValidationErrorResponse.FieldError> fieldErrors) {
        return ValidationErrorResponse.builder()
                .status(400)
                .error("VALIDATION_FAILED")
                .message(message)
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .fieldErrors(fieldErrors)
                .build();
    }
}
```

---

## HTTP Status Code Mapping Guide

| Scenario | HTTP Status | Error code convention |
|---------|------------|----------------------|
| Resource not found | `404 Not Found` | `USER_NOT_FOUND`, `ORDER_NOT_FOUND` |
| Request body malformed (bad JSON) | `400 Bad Request` | `MALFORMED_JSON` |
| Field validation failed | `400 Bad Request` | `VALIDATION_FAILED` |
| Missing required parameter | `400 Bad Request` | `MISSING_PARAMETER` |
| Conflict (duplicate resource) | `409 Conflict` | `USER_ALREADY_EXISTS` |
| Business rule violated | `422 Unprocessable Entity` | `INSUFFICIENT_BALANCE`, `ORDER_ALREADY_CANCELLED` |
| Authentication missing | `401 Unauthorized` | `UNAUTHORIZED` |
| Permission denied | `403 Forbidden` | `ACCESS_DENIED` |
| Method not allowed | `405 Method Not Allowed` | `METHOD_NOT_ALLOWED` |
| External service error | `502 Bad Gateway` | `UPSTREAM_SERVICE_ERROR` |
| Database / infra error | `503 Service Unavailable` | `DATABASE_ERROR` |
| Unexpected / unhandled | `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` |

---

## Production Patterns

<details>
<summary>🔬 Senior deep-dive: error codes and internationalisation</summary>

### Machine-readable error codes

Always include a machine-readable `errorCode` alongside the human-readable `message`. This lets API clients handle errors programmatically without parsing strings:

```json
// Bad — client must parse the message string:
{ "message": "User with id 42 was not found" }

// Good — client can switch on errorCode:
{ "errorCode": "USER_NOT_FOUND", "message": "User with id 42 was not found" }
```

```typescript
// Frontend can handle errors cleanly:
switch (error.errorCode) {
  case 'USER_NOT_FOUND':     return showNotFoundPage();
  case 'INSUFFICIENT_BALANCE': return showFundingModal();
  case 'VALIDATION_FAILED':   return highlightFieldErrors(error.fieldErrors);
  default:                     return showGenericError();
}
```

### Internationalisation (i18n) of error messages

Store error messages in `messages.properties` and resolve them via `MessageSource`:

```properties
# messages.properties (default — English)
error.user.not_found=User with id '{0}' was not found
error.insufficient_balance=Insufficient balance to transfer {0}

# messages_vi.properties (Vietnamese)
error.user.not_found=Không tìm thấy người dùng có id '{0}'
error.insufficient_balance=Số dư không đủ để chuyển {0}
```

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private MessageSource messageSource;

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleUserNotFound(UserNotFoundException ex,
                                            Locale locale) {
        String message = messageSource.getMessage(
                "error.user.not_found",
                new Object[]{ ex.getUserId() },
                locale
        );
        return buildError(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", message);
    }
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: logging strategy</summary>

Not all exceptions deserve the same log level. Over-logging creates noise; under-logging misses real issues:

```java
@ExceptionHandler(BaseException.class)
public ResponseEntity<ErrorResponse> handleBase(BaseException ex) {
    // 4xx client errors → WARN (client sent bad data, not a server problem)
    if (ex.getHttpStatus().is4xxClientError()) {
        log.warn("[{}] {} — path={}", ex.getErrorCode(), ex.getMessage(),
                 request.getRequestURI());
    }
    // 5xx server errors → ERROR with full stack trace
    else {
        log.error("[{}] {} — path={}", ex.getErrorCode(), ex.getMessage(),
                  request.getRequestURI(), ex);
    }
    // ...
}

@ExceptionHandler(Exception.class)
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public ErrorResponse handleUnexpected(Exception ex) {
    // Always ERROR with stack trace — this should never happen in production
    log.error("UNHANDLED EXCEPTION on {} {}: {}",
              request.getMethod(), request.getRequestURI(),
              ex.getMessage(), ex);
    // Consider sending an alert (PagerDuty, Slack, etc.) here
    alertService.sendCriticalAlert(ex, request.getRequestURI());
    return buildError(HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
}
```

| Exception category | Log level | Stack trace? |
|-------------------|----------|-------------|
| Validation / bad request (4xx) | `WARN` | No |
| Business rule violation (4xx) | `WARN` | No |
| Not found (404) | `WARN` | No |
| Server / infrastructure (5xx) | `ERROR` | Yes |
| Unexpected catch-all | `ERROR` + alert | Yes |

</details>

<details>
<summary>🔬 Senior deep-dive: correlation IDs for tracing</summary>

Include a correlation/trace ID in every error response so support teams can find the exact log entry:

```java
@ExceptionHandler(Exception.class)
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public ErrorResponse handleUnexpected(Exception ex) {
    // MDC is populated by a request filter with a UUID per request
    String traceId = MDC.get("traceId");

    log.error("[traceId={}] Unexpected error on {}: {}",
              traceId, request.getRequestURI(), ex.getMessage(), ex);

    return ErrorResponse.builder()
            .status(500)
            .error("INTERNAL_SERVER_ERROR")
            .message("An unexpected error occurred. Please contact support with trace ID: " + traceId)
            .traceId(traceId)  // ← included in response
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
}
```

```java
// TraceIdFilter.java — adds a UUID to MDC for every request
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    private static final String TRACE_HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws IOException, ServletException {
        String traceId = Optional.ofNullable(request.getHeader(TRACE_HEADER))
                .orElseGet(() -> UUID.randomUUID().toString());

        MDC.put("traceId", traceId);
        response.setHeader(TRACE_HEADER, traceId); // echo back in response header
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

</details>

<details>
<summary>🔬 Senior deep-dive: testing your exception handlers</summary>

Test exception handling with `@WebMvcTest` — it loads only the web layer (no full application context):

```java
@WebMvcTest(UserController.class)
class UserControllerExceptionTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getUser_notFound_returns404WithErrorBody() throws Exception {
        given(userService.findById(42L))
                .willThrow(new UserNotFoundException(42L));

        mockMvc.perform(get("/api/users/42"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("User with id '42' was not found"))
                .andExpect(jsonPath("$.path").value("/api/users/42"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void createUser_invalidBody_returns400WithFieldErrors() throws Exception {
        String invalidJson = """
            { "email": "not-an-email", "username": "", "age": -1 }
            """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors[*].field",
                        containsInAnyOrder("email", "username", "age")));
    }

    @Test
    void getUser_unexpectedError_returns500AndDoesNotLeakDetails() throws Exception {
        given(userService.findById(anyLong()))
                .willThrow(new RuntimeException("Connection refused to database"));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message")
                        .value("An unexpected error occurred. Please try again later."))
                // internal details must NOT be leaked
                .andExpect(jsonPath("$.message",
                        not(containsString("Connection refused"))));
    }
}
```

</details>

---

## Common Mistakes

| Mistake | Why it's a problem | Fix |
|---------|-------------------|-----|
| Returning `null` body on error | Client gets empty response — impossible to debug | Always return a structured `ErrorResponse` |
| Exposing stack traces in responses | Information leakage — attackers learn your internals | Log stack trace server-side; return generic message to client |
| Using `500` for all errors | Clients can't distinguish client errors from server errors | Map exception types to correct HTTP status codes |
| Not handling `MethodArgumentNotValidException` | Validation errors return Spring's ugly default HTML error page | Add explicit handler returning structured JSON |
| Catching `Exception` without logging | Errors are silently swallowed | Always `log.error(...)` in the catch-all handler |
| One giant `try-catch` in each controller | Duplicated handling, inconsistent shapes | Use `@RestControllerAdvice` and remove try-catch from controllers |
| Using checked exceptions in Spring services | Forces ugly `throws` declarations on every method in the call chain | Wrap checked exceptions at the boundary and rethrow as unchecked |

---

## Interview Questions

**Q1. What is the difference between `@ControllerAdvice` and `@RestControllerAdvice`?**
> `@RestControllerAdvice` is a composed annotation — it is `@ControllerAdvice` + `@ResponseBody`. With `@ControllerAdvice` alone, each `@ExceptionHandler` method needs its own `@ResponseBody` to serialise the return value as JSON. `@RestControllerAdvice` applies `@ResponseBody` globally to all handler methods. For REST APIs, always use `@RestControllerAdvice`.

**Q2. What is the difference between checked and unchecked exceptions, and which should you prefer in Spring?**
> **Checked exceptions** (`Exception` subclasses, not `RuntimeException`) force the compiler to either catch them or declare them with `throws`. **Unchecked exceptions** (`RuntimeException` subclasses) carry no compiler requirement. Spring's own framework exclusively uses unchecked exceptions (`DataAccessException`, `HttpMessageNotReadableException`, etc.) — wrapping checked I/O and JDBC exceptions into unchecked ones. You should do the same: catch checked exceptions at the service boundary, wrap them in domain-specific unchecked exceptions, and let `@RestControllerAdvice` handle them globally. This keeps controllers and service signatures clean.

**Q3. How does Spring resolve which `@ExceptionHandler` to invoke when multiple handlers could match?**
> Spring resolves the **most specific exception type** first. If `UserNotFoundException extends ResourceNotFoundException extends RuntimeException`, and you have handlers for all three, Spring picks `handleUserNotFound(UserNotFoundException)`. If no handler matches exactly, Spring walks up the class hierarchy. The `@ExceptionHandler(Exception.class)` catch-all is always picked last. Within the same specificity level, the first declared handler wins.

**Q4. Why doesn't `@RestControllerAdvice` catch Spring Security exceptions like `AuthenticationException`?**
> Spring Security's filter chain runs *before* the DispatcherServlet processes the request. By the time a `UsernameNotFoundException` or `AccessDeniedException` is thrown by a security filter, the request has never reached the DispatcherServlet — and therefore never reaches `@RestControllerAdvice`. The solution is implementing `AuthenticationEntryPoint` (for 401) and `AccessDeniedHandler` (for 403) and registering them in the security configuration. These intercept security exceptions at the filter layer.

**Q5. How do you handle validation errors and return field-level details?**
> `@Valid` on a `@RequestBody` parameter throws `MethodArgumentNotValidException` on failure. Register an `@ExceptionHandler(MethodArgumentNotValidException.class)` in your `@RestControllerAdvice`. Extract field errors from `ex.getBindingResult().getFieldErrors()` and map each to a `FieldError` object with `field`, `rejectedValue`, and `message`. Return all of them in the response body. For `@RequestParam` / `@PathVariable` validation (via `@Validated` on the controller class), catch `ConstraintViolationException` instead.

**Q6. (Senior) How would you design a custom exception hierarchy for a large Spring Boot application?**
> Create an abstract `BaseException extends RuntimeException` that carries an `errorCode` (String, machine-readable), an `httpStatus` (HttpStatus), and the message. All domain exceptions extend `BaseException` and pass their HTTP status in the constructor — `UserNotFoundException` sets 404, `BusinessRuleException` sets 422, etc. The `@RestControllerAdvice` has a single `@ExceptionHandler(BaseException.class)` that reads `ex.getHttpStatus()` and `ex.getErrorCode()` dynamically, eliminating the need for a separate handler per exception type. This scales to hundreds of exception types with no additional handler methods.

**Q7. (Senior) How do you ensure internal details (stack traces, SQL errors) are never leaked to API clients?**
> Never put exception messages from `DataAccessException`, `RuntimeException`, or the catch-all `Exception` handler directly into the response body. Log the full exception server-side with `log.error("...", ex)` which records the stack trace in your log aggregator (ELK, CloudWatch). Return only a generic, safe message to the client: `"An unexpected error occurred. Please try again later."` For debugging, include a correlation/trace ID in the response — the client can provide this ID to support, who can find the exact log entry without the client ever seeing internal details.

---

## See Also

- Spring Validation & Bean Validation Guide
- [Spring Security](./spring-security.md)
- [Microservices Patterns](../system-design/microservices-patterns.md)
- Exception Handling in Spring WebFlux (Reactive)
