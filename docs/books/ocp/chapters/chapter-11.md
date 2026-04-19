---
id: chapter-11
title: "Chapter 11 — Exceptions & Localization"
sidebar_label: "Ch 11 · Exceptions & Localization"
description: "Master Java's exception hierarchy (checked vs unchecked vs Error), try-catch-finally, multi-catch, try-with-resources, suppressed exceptions, custom exceptions, plus Locale, NumberFormat, DateTimeFormatter, and ResourceBundle for the OCP exam."
tags:
  - exceptions
  - try-with-resources
  - checked-exceptions
  - localization
  - locale
  - resource-bundle
  - numberformat
  - datetimeformatter
  - suppressed-exceptions
---

# Chapter 11 — Exceptions & Localization

<span class="chapter-badge">Exam Domain: Handling Exceptions · Implementing Localization</span>

> **Key Topics:** Exception hierarchy, checked vs unchecked, try-catch-finally, multi-catch, try-with-resources, custom exceptions, `Locale`, resource bundles, `NumberFormat`, `DateTimeFormatter`.

---

## 🟦 New Learner: Exception Handling

### Exception Hierarchy

```
Throwable
├── Error (unrecoverable — don't catch)
│     ├── OutOfMemoryError
│     ├── StackOverflowError
│     └── VirtualMachineError
└── Exception
      ├── RuntimeException (unchecked — optional handling)
      │     ├── NullPointerException
      │     ├── ArrayIndexOutOfBoundsException
      │     ├── ClassCastException
      │     ├── ArithmeticException
      │     ├── IllegalArgumentException
      │     └── UnsupportedOperationException
      └── [checked exceptions — must handle or declare]
            ├── IOException
            ├── SQLException
            └── ParseException
```

| Type | Must Handle/Declare? | Examples |
|------|---------------------|---------|
| Checked | **Yes** | `IOException`, `SQLException` |
| Unchecked (`RuntimeException`) | No | `NPE`, `ClassCastException` |
| `Error` | No (and shouldn't!) | `OutOfMemoryError` |

---

### try-catch-finally

```java
try {
    int result = 10 / 0; // ArithmeticException
    System.out.println("never reached");
} catch (ArithmeticException e) {
    System.out.println("Caught: " + e.getMessage()); // / by zero
} finally {
    System.out.println("Always runs"); // even if exception is uncaught
}
```

**Key rules:**
- `finally` **always** runs (even if `catch` re-throws or there's a `return`)
- Only exception: `System.exit()` or JVM crash

---

### Multi-catch

```java
try {
    // code that might throw multiple types
} catch (IOException | SQLException e) { // multi-catch
    System.out.println("I/O or SQL error: " + e.getMessage());
}
// Note: you CANNOT multi-catch related exceptions (one must not extend the other)
```

---

### try-with-resources

Automatically closes `AutoCloseable` resources:

```java
try (FileReader fr = new FileReader("data.txt");
     BufferedReader br = new BufferedReader(fr)) {
    String line = br.readLine();
} catch (IOException e) {
    e.printStackTrace();
}
// fr and br are closed automatically in REVERSE order
// Close happens BEFORE catch/finally blocks
```

---

### Custom Exceptions

```java
// Checked custom exception
public class InsufficientFundsException extends Exception {
    private final double amount;
    public InsufficientFundsException(double amount) {
        super("Insufficient funds: need " + amount + " more");
        this.amount = amount;
    }
    public double getAmount() { return amount; }
}

// Unchecked custom exception
public class InvalidUserException extends RuntimeException {
    public InvalidUserException(String message) { super(message); }
    public InvalidUserException(String message, Throwable cause) {
        super(message, cause); // wrapping another exception
    }
}
```

---

### Localization

```java
// Locale represents a language + region
Locale english = Locale.ENGLISH;           // en
Locale usEnglish = Locale.US;              // en_US
Locale french = new Locale("fr", "FR");    // fr_FR
Locale.setDefault(Locale.US);             // set default
```

#### NumberFormat

```java
Locale locale = Locale.US;
NumberFormat nf = NumberFormat.getInstance(locale);        // general number
NumberFormat currency = NumberFormat.getCurrencyInstance(locale); // $1,234.56
NumberFormat percent = NumberFormat.getPercentInstance(locale);   // 12%

double amount = 1234567.89;
System.out.println(currency.format(amount)); // $1,234,567.89

// Parsing
Number parsed = nf.parse("1,234.56"); // 1234.56
```

#### DateTimeFormatter

```java
LocalDate date = LocalDate.of(2024, 3, 15);

// Predefined formatters
DateTimeFormatter isoDate = DateTimeFormatter.ISO_LOCAL_DATE;
System.out.println(date.format(isoDate)); // 2024-03-15

// Custom patterns
DateTimeFormatter custom = DateTimeFormatter.ofPattern("MM/dd/yyyy");
System.out.println(date.format(custom)); // 03/15/2024

// Localized
DateTimeFormatter localized = DateTimeFormatter
    .ofLocalizedDate(FormatStyle.LONG)
    .withLocale(Locale.US);
System.out.println(date.format(localized)); // March 15, 2024
```

#### Resource Bundles (Internationalization)

```java
// Zoo_en.properties
// greeting=Hello!
// animal=Animal

// Zoo_fr.properties
// greeting=Bonjour!
// animal=Animal

ResourceBundle rb = ResourceBundle.getBundle("Zoo", Locale.FRENCH);
System.out.println(rb.getString("greeting")); // Bonjour!
```

**Bundle selection hierarchy:**
1. Exact locale match: `Zoo_fr_FR.properties`
2. Language only: `Zoo_fr.properties`
3. Default locale
4. Default bundle: `Zoo.properties`
5. `MissingResourceException`

---

## 🟣 Senior Deep Dive

### Exception Chaining

```java
try {
    // low-level operation
    Files.readAllBytes(Path.of("file.txt"));
} catch (IOException e) {
    // Wrap with higher-level context
    throw new ServiceException("Failed to load config", e); // e is the cause
}

// Later, retrieve cause
try { ... }
catch (ServiceException e) {
    Throwable cause = e.getCause(); // original IOException
    cause.printStackTrace();
}
```

### Suppressed Exceptions in try-with-resources

```java
class Resource implements AutoCloseable {
    @Override
    public void close() throws Exception {
        throw new Exception("Close failed");
    }
}

try (Resource r = new Resource()) {
    throw new RuntimeException("Primary exception");
} catch (RuntimeException e) {
    System.out.println(e.getMessage()); // "Primary exception"
    for (Throwable t : e.getSuppressed()) {
        System.out.println(t.getMessage()); // "Close failed"
    }
}
```

The exception from `close()` is **suppressed** — attached to the primary exception, not lost.

### `finally` Return Value Trap

```java
int tricky() {
    try {
        return 1;
    } finally {
        return 2; // ← OVERRIDES the try's return 1!
    }
}
System.out.println(tricky()); // 2 (not 1!)
// Avoid returning from finally — it swallows exceptions too!
```

### Resource Bundle Caching and `Control`

```java
// Bundles are cached by default — reloading requires:
ResourceBundle.clearCache();

// Custom Control for different encoding
ResourceBundle rb = ResourceBundle.getBundle("Messages",
    Locale.JAPAN,
    ResourceBundle.Control.getControl(ResourceBundle.Control.FORMAT_PROPERTIES));
```

---

## 📝 Exam Quick Reference

| Topic | Key Fact |
|-------|----------|
| Checked exception | Must handle or declare with `throws` |
| `RuntimeException` | Unchecked — no `throws` required |
| `Error` | Never catch (OutOfMemory, StackOverflow) |
| `finally` | Always executes (except `System.exit()`) |
| try-with-resources | Resources closed in **reverse** declaration order |
| Close before catch | `close()` runs **before** `catch`/`finally` |
| Multi-catch | Cannot catch related types (`IOException \| FileNotFoundException`) |
| Suppressed exceptions | Stored in primary exception when `close()` also throws |
| Resource bundle | Selection: exact → language → default locale → root |
| `DateTimeFormatter` | Immutable and thread-safe |
| `AutoCloseable` | Single method `close()` — any class can be used in try-with-resources |
| `Closeable` | Extends `AutoCloseable`; `close()` may only throw `IOException` |
| Multi-catch variable | Implicitly `final` — cannot reassign inside the catch block |
| `throws` declaration | Required for checked exceptions; allowed but not required for unchecked |
| `try` resource scope | Resources declared in try-with-resources are effectively final in try block |
| `Throwable.getSuppressed()` / `addSuppressed()` | Access exceptions suppressed by try-with-resources or try/finally |
| `MessageFormat` | `MessageFormat.format(pattern, args...)` — positional `{0}`, `{1}` |
| `DateTimeFormatter` + `Locale` | Use `withLocale(Locale)` for localized month/day names |
| `NumberFormat.getCurrencyInstance` | Locale controls symbol and grouping |
| `ExceptionInInitializerError` | Wraps failure in static initializer; `getCause()` has original |
| `AssertionError` | Unchecked — from `assert` when `-ea` enabled |
| `try` block rules | `catch` or `finally` required unless try is try-with-resources only |

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 11]
**Trap 1 — Multi-catch with related exception types:**
```java
try { ... }
catch (IOException | Exception e) { } // ❌ IOException is-a Exception — compile error!
// Multi-catch types must be UNRELATED (no inheritance relationship)

catch (FileNotFoundException | IOException e) { } // ❌ FileNotFoundException is-a IOException
catch (IOException | SQLException e) { }          // ✅ unrelated
```

**Trap 2 — try-with-resources close order:**
```java
try (ResourceA a = new ResourceA();  // opened first
     ResourceB b = new ResourceB()) { // opened second
    // use a and b
}
// Closed in REVERSE: b.close() first, then a.close()
// close() runs BEFORE catch and finally
```

**Trap 3 — `finally` swallows exceptions:**
```java
void dangerous() throws Exception {
    try {
        throw new RuntimeException("try");
    } finally {
        throw new IOException("finally"); // ❌ RuntimeException lost!
    }
}
// Only IOException propagates — RuntimeException is silently swallowed!
```

**Trap 4 — `finally` return overrides try return:**
```java
int get() {
    try { return 1; }
    finally { return 2; } // return 2 wins; return 1 is discarded
}
// Also: if finally throws, any return/throw from try is discarded
```

**Trap 5 — Custom exception must call super with message:**
```java
class MyException extends RuntimeException {
    MyException() { } // ❌ getMessage() returns null — always pass message
    MyException(String msg) { super(msg); } // ✅
    MyException(String msg, Throwable cause) { super(msg, cause); } // ✅ with chaining
}
```

**Trap 6 — Multi-catch variable is implicitly final:**
```java
try { ... }
catch (IOException | SQLException e) {
    e = new IOException("replaced"); // ❌ COMPILE ERROR — e is effectively final
}
```

**Trap 7 — Resource bundle locale fallback chain:**
```java
// Requested: fr_FR, default locale: en_US
// Search order:
// 1. Messages_fr_FR.properties  (exact match)
// 2. Messages_fr.properties     (language only)
// 3. Messages_en_US.properties  (default locale exact)
// 4. Messages_en.properties     (default locale language)
// 5. Messages.properties        (root bundle)
// 6. MissingResourceException   (none found)
```

**Trap 8 — `NumberFormat.parse()` is locale-sensitive:**
```java
NumberFormat nf = NumberFormat.getInstance(Locale.GERMANY);
nf.parse("1.234,56"); // 1234.56 — Germany uses . for thousands, , for decimal
NumberFormat us = NumberFormat.getInstance(Locale.US);
us.parse("1,234.56"); // 1234.56 — US uses , for thousands, . for decimal
```

**Trap 9 — Rethrowing with narrower type in `throws` (Java 7+):**
```java
void m() throws IOException {
    try { throw new FileNotFoundException(); }
    catch (IOException e) { throw e; } // OK — declared IOException covers actual type
}
```

**Trap 10 — `close()` exception vs body exception (suppressed):**
```java
try (AutoCloseable a = () -> { throw new IOException("close"); }) {
    throw new RuntimeException("body");
}
// Primary: RuntimeException; IOException from close is suppressed on primary
```

**Trap 11 — `finally` without `catch`:**
```java
try { work(); }
finally { cleanup(); } // valid — no catch required
```
:::

### Exam vignettes

```java
// Vignette 1 — Illegal multi-catch
// catch (Exception | RuntimeException e) {} // ❌ related types

// Vignette 2 — Resource bundle root
ResourceBundle.getBundle("messages", Locale.FRANCE); // tries messages_fr_FR → messages_fr → ...
```

:::tip[Spring/Senior Relevance]
- Spring's `@Transactional` catches exceptions based on their type — by default only `RuntimeException` (unchecked) triggers rollback. Add `rollbackFor = IOException.class` for checked exceptions.
- `try-with-resources` is the standard pattern for Spring's `JdbcTemplate` connection management — understanding the close-before-catch ordering explains why exceptions from `close()` appear as suppressed.
- Spring Boot's `MessageSource` (i18n) is built on `ResourceBundle` fallback chains — knowing the locale resolution order explains why `messages_fr_FR.properties` is preferred over `messages_fr.properties` for French-France users.
:::

---

## 🔗 Review Questions Focus

1. What is the difference between a checked and unchecked exception?
2. In try-with-resources, when are resources closed relative to catch/finally?
3. What are suppressed exceptions and how do you access them?
4. What is the resource bundle selection order for a `fr_FR` locale?
5. What happens if `finally` has a `return` statement?
6. Can you use multi-catch for `FileNotFoundException` and `IOException` together? Why?
7. What interface must a class implement to be used in try-with-resources?
8. What does `Exception.getSuppressed()` return?
9. What happens to the original exception if `finally` also throws?
10. Why must `throws` be declared on a method that throws a checked exception?
