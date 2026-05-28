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

> **Key Topics:** Java Exception Hierarchy, Checked vs. Unchecked, Try-Catch-Finally, Multi-Catch, Try-With-Resources (Effectively Final Resources), Suppressed Exceptions, custom exceptions, `Locale` creation, localizing numbers and dates, `CompactNumberFormat`, `ResourceBundle` fallback hierarchy, `MessageFormat`, and the `Properties` class.

---

## 🟦 New Learner: Exception Handling

### 1. Exception Classification and Hierarchy
An exception is an event that alters program flow. The parent of all exception types is `java.lang.Throwable`.

```
                  Throwable
                 /         \
          Exception         Error
          /       \
  RuntimeException  [Checked Exceptions]
```

*   **`java.lang.Error`**: Indicates serious, unrecoverable system problems (e.g., `OutOfMemoryError`, `StackOverflowError`, `NoClassDefFoundError`). Application code should not handle or declare them.
*   **Checked Exceptions**: Must be handled or declared (the *handle or declare rule*). They inherit `Exception` but not `RuntimeException` (e.g., `IOException`, `FileNotFoundException`, `ParseException`).
*   **Unchecked Exceptions (Runtime Exceptions)**: Inherit `RuntimeException` (or `Error`). They do not need to be handled or declared. Can be thrown by the JVM or programmatically (e.g., `NullPointerException`, `ArithmeticException`, `ArrayIndexOutOfBoundsException`, `ClassCastException`, `IllegalArgumentException`, `NumberFormatException`).

---

### 2. Method Overriding and Exception Boundaries
When overriding a method, the subclass version is constrained by the exceptions declared in the parent method:
*   An overridden method **cannot** declare new or broader checked exceptions.
*   An overridden method **can** declare narrower checked exceptions (subclasses) or omit checked exceptions entirely.
*   There are **no restrictions** on declaring unchecked (runtime) exceptions or errors.

```java
class SuperClass {
    void doWork() throws IOException {}
}
class SubClass extends SuperClass {
    // OK: Declaring a subclass of IOException
    void doWork() throws FileNotFoundException {} 
    
    // OK: Omitting throws
    // void doWork() {} 
    
    // Compile Error: Exception is broader than IOException
    // void doWork() throws Exception {} 
}
```

---

### 3. Syntax and Behavior of Try-Catch Statements
A traditional `try` statement must be followed by at least one `catch` block or a `finally` block. Braces `{}` are mandatory even if there is only a single statement inside the block.

```java
try {
    System.out.println(10 / 0);
} catch (ArithmeticException e) {
    System.out.println("Divided by zero: " + e.getMessage());
}
```

#### Chaining Catch Blocks (Order Rules)
When catching multiple exceptions, Java checks them in the order they are written.
*   A **subclass exception** catch block must appear **before** its superclass exception catch block.
*   If a superclass catch block is placed before a subclass catch block, the code will fail to compile due to unreachable code.

```java
try {
    // some file access
} catch (FileNotFoundException e) { // Subclass of IOException
    System.out.println("File not found");
} catch (IOException e) { // Superclass
    System.out.println("General I/O error");
}
```

---

### 4. Multi-Catch Blocks
Java allows catching multiple unrelated exception types in a single `catch` block using the pipe (`|`) character.
*   **Syntax**: `catch (ExceptionType1 | ExceptionType2 variableName)`
*   The variable name must appear only once at the end.
*   The exception variable in a multi-catch is **implicitly final** and cannot be reassigned inside the block.
*   Redundant or related exceptions (e.g. subclass and superclass) cannot be caught in the same multi-catch.

```java
try {
    System.out.println(Integer.parseInt(args[1]));
} catch (ArrayIndexOutOfBoundsException | NumberFormatException e) {
    // e is implicitly final here
    System.out.println("Missing or invalid input: " + e.getMessage());
}
```

---

### 5. Finally Block Control Flow
The `finally` block runs regardless of whether an exception is thrown or caught.

#### The Return Value Override Trap
If a `finally` block contains a `return` statement, it will override any previous `return` statements or thrown exceptions inside the `try` or `catch` blocks.

```java
int getNumber() {
    try {
        return 1;
    } finally {
        return 2; // Overrides the return value of 1! Returns 2.
    }
}
```

#### Exceptions in the `finally` block
If the `finally` block throws an exception, any exception previously thrown inside the `try` or `catch` blocks is **swallowed** (lost).
Additionally, the only way a `finally` block will not execute is if the JVM terminates (e.g., calling `System.exit(status)`).

---

## 🟣 Senior Deep Dive

### 1. Try-With-Resources and Effectively Final Resources
Try-with-resources automatically closes resources that implement `java.lang.AutoCloseable` (or its child `java.io.Closeable`).
*   The resource's `close()` method is called implicitly in a hidden `finally` block.
*   Implicit resource closing occurs **before** any programmer-defined `catch` or `finally` blocks run.
*   Multiple resources are closed in the **reverse** order of their declaration.

#### Variable Declaration Rules
*   Resources are separated by semicolons (`;`). Semicolons are optional after the last resource.
*   You can declare new variables (including using `var`) inside the `try` parentheses.
*   **Effectively Final Resources**: Since Java 9, resources declared *before* the `try` block can be used inside the `try` parentheses, provided they are `final` or effectively final.

```java
final var input = new MyResource(1);
var output = new MyResource(2); // Effectively final

try (input; output; var temp = new MyResource(3)) {
    System.out.println("Inside try");
} finally {
    System.out.println("Inside finally");
}
// Closing Order: temp (3) -> output (2) -> input (1)
```

---

### 2. Suppressed Exceptions
If a resource's `close()` method throws an exception, and the `try` block also throws an exception, the exception from the `try` block becomes the **primary** exception. The exception from `close()` is added as a **suppressed exception**.

*   Suppressed exceptions are retrieved by calling `Throwable.getSuppressed()` on the primary exception.
*   If multiple resources throw exceptions during closing, they are all added as suppressed exceptions to the primary exception.

```java
try (var resource = new JammedResource()) { // close() throws JammedException
    throw new RuntimeException("Primary Exception");
} catch (RuntimeException e) {
    System.out.println("Caught: " + e.getMessage()); // Primary Exception
    for (Throwable t : e.getSuppressed()) {
        System.out.println("Suppressed: " + t.getMessage()); // JammedException
    }
}
```

---

### 3. Formatting Numbers, Dates, and Custom Escapes

#### Formatting Numbers (`DecimalFormat` Symbols)
`DecimalFormat` is a concrete subclass of `NumberFormat`.
*   `#`: Digit placeholder. Omitted if no digit exists.
*   `0`: Digit placeholder. Prints `0` if no digit exists in that position.

```java
double d = 123.456;
System.out.println(new DecimalFormat("0000.00").format(d)); // 0123.46 (rounds)
System.out.println(new DecimalFormat("####.##").format(d)); // 123.46
```

#### DateTimeFormatter Custom Patterns & Escaping Text
You can design custom patterns using standard formatting symbols (e.g. `y` for year, `M` for month, `d` for day, `h` for hour, `m` for minute).
*   Literal text in custom patterns must be **escaped** using single quotes (`'`).
*   To output a literal single quote, place two single quotes together (`''`).

```java
var dt = LocalDateTime.of(2025, 10, 20, 15, 30);
var formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");
System.out.println(dt.format(formatter)); // October 20, 2025 at 03:30 PM

var quoteFormatter = DateTimeFormatter.ofPattern("hh:mm 'o''clock'");
System.out.println(dt.format(quoteFormatter)); // 03:30 o'clock
```

---

### 4. Internationalization (I18n) & Localization (L10n)

#### Picking a Locale
A `Locale` represents a geographical or cultural region. Creation methods:
1.  **Constants**: `Locale.US`, `Locale.GERMANY`, `Locale.GERMAN`
2.  **Factory method**: `Locale.of("en")`, `Locale.of("fr", "CA")` (Java 19+)
3.  **Builder**: `new Locale.Builder().setLanguage("es").setRegion("MX").build()`
4.  *(Deprecated constructor: `new Locale("en", "US")`)*
*   **Format**: language (lowercase, e.g. `en`) + underscore + region (uppercase, e.g. `US`). You cannot have a region without a language code.

#### NumberFormat and Currency/Percentage Instances
*   `NumberFormat.getInstance(locale)` / `getNumberInstance(locale)`
*   `NumberFormat.getCurrencyInstance(locale)`
*   `NumberFormat.getPercentInstance(locale)`
*   `NumberFormat.parse(String)`: parses strings to numbers. Throws checked `ParseException`.

```java
String s = "40.45";
double usValue = (Double) NumberFormat.getInstance(Locale.US).parse(s); // 40.45
double frValue = (Double) NumberFormat.getInstance(Locale.FRANCE).parse(s); // 40.0 ( France uses ',' as decimal separator)
```

#### CompactNumberFormat (Style SHORT vs LONG)
Useful for limited display spaces. It rounds numbers and appends locale-appropriate symbols.

```java
var formatterShort = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT);
var formatterLong = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.LONG);

System.out.println(formatterShort.format(120_000)); // 120K
System.out.println(formatterLong.format(120_000));  // 120 thousand
```

#### Specifying Locale Category
You can set display (language names) and formatting (currency, dates) locales independently using `Locale.setDefault(Locale.Category, Locale)`.
*   `Locale.Category.DISPLAY`: For displaying UI languages.
*   `Locale.Category.FORMAT`: For formatting dates, currency, numbers.

---

### 5. Resource Bundles
A resource bundle is a key-value collection of locale-specific objects, typically saved in properties files.

#### Naming Convention:
`BundleName_Language_Country.properties` (e.g., `Zoo_fr_CA.properties`).

#### Selection and Lookup Hierarchy
When Java looks up a resource bundle `BundleName` for a requested locale `R` when the default system locale is `D`:
1.  **Requested Locale match**: `BundleName_R.properties` (language + country)
2.  **Requested Language only**: `BundleName_RLanguage.properties`
3.  **Default Locale match**: `BundleName_D.properties` (language + country)
4.  **Default Language only**: `BundleName_DLanguage.properties`
5.  **Default Bundle**: `BundleName.properties` (Root bundle)
6.  Throws `MissingResourceException` if none are found.

#### Property Inheritance (Selection Rules)
Once a resource bundle is selected, Java will **only search along that bundle's parent hierarchy** to resolve keys. It will not fall back to the default locale.

```
Zoo_fr_CA.properties ──► Zoo_fr.properties ──► Zoo.properties (Root)
```
*(If the requested locale was `fr_CA`, and a key isn't found in `Zoo_fr_CA`, it checks `Zoo_fr` and then `Zoo`. It will NOT check default locale `Zoo_en_US`).*

#### MessageFormat Positional Substitution
Uses curly braces `{0}`, `{1}`, etc. inside resource bundle strings to inject dynamic variables.

```java
// Property: welcome=Hello, {0}! Welcome to {1}.
String pattern = rb.getString("welcome");
String result = MessageFormat.format(pattern, "Alice", "the zoo"); // Hello, Alice! Welcome to the zoo.
```

#### The `java.util.Properties` Class
Functions like a hashtable where keys and values are both `String`s.
*   `setProperty(key, value)`: Stores a property.
*   `getProperty(key)`: Retrieves a property (returns `null` if key is missing).
*   `getProperty(key, defaultValue)`: Retrieves a property, returning the default value if the key does not exist.

---

## 📝 Exam Quick Reference

### Unchecked Runtime Exceptions & Errors
*   `ArithmeticException`: `/ by zero`
*   `ArrayIndexOutOfBoundsException`: Index out of array bounds.
*   `ClassCastException`: Invalid reference cast at runtime.
*   `NullPointerException`: Invoking methods/variables on `null`.
*   `IllegalArgumentException`: Caller passed inappropriate arguments.
*   `NumberFormatException`: Subclass of `IllegalArgumentException`. Failed conversion of string to number.
*   `ExceptionInInitializerError`: Static initializer block threw an exception.
*   `StackOverflowError`: Infinite recursion.

### AutoCloseable vs Closeable
*   `AutoCloseable` defines `close() throws Exception`.
*   `Closeable` extends `AutoCloseable` and defines `close() throws IOException`.

---

## 🚨 Extra Exam Tips

:::danger[Top Traps in Chapter 11]
**Trap 1 — Checked Exceptions caught in Try/Catch that cannot be thrown:**
Java does not allow catching checked exceptions in a `try` block if the code in the `try` block cannot throw them (with the exception of broad types like `Exception` or `Throwable`). This throws a compile-time error. Unchecked exceptions can be caught anywhere.
```java
public void bad() {
    try {
        System.out.println("No exception thrown here");
    } catch (IOException e) { // ❌ DOES NOT COMPILE (IOException is checked)
    } catch (NullPointerException e) { // ✅ Compiles (NPE is unchecked)
    }
}
```

**Trap 2 — Multi-catch with Related Exceptions:**
Catching subclass and superclass exception types in a single multi-catch block causes a compiler error.
```java
try {
    throw new FileNotFoundException();
} catch (FileNotFoundException | IOException e) {} // ❌ DOES NOT COMPILE
```

**Trap 3 — Suppressed Exception Loss due to Finally Block Throw:**
If both the try-with-resources statement and a programmer-defined `finally` block throw exceptions, the exceptions from try-with-resources (including suppressed exceptions) are **lost**, and only the exception thrown by the `finally` block is propagated.
```java
try (var r = new ClosedResource()) { // close() throws Exception A
    throw new Exception("Body Exception");
} finally {
    throw new Exception("Finally Exception"); // ❌ Body Exception & Exception A are both lost!
}
```

**Trap 4 — Mutating the Multi-Catch Variable:**
The exception parameter variable in a multi-catch block is implicitly `final`.
```java
catch (ArithmeticException | NullPointerException e) {
    e = new ArithmeticException(); // ❌ DOES NOT COMPILE
}
```

**Trap 5 — `Properties` get vs getProperty:**
Only `getProperty(key, default)` allows specifying a fallback default value. `get(key, default)` does not compile.
```java
var props = new Properties();
props.get("key", "default"); // ❌ DOES NOT COMPILE
props.getProperty("key", "default"); // ✅ Compiles
```

**Trap 6 — Formatting Dates with Time Symbols (and vice versa):**
Formatting a `LocalDate` using time symbols (e.g., `hh:mm`) or a `LocalTime` using date symbols (e.g., `yyyy`) throws a `DateTimeException` at runtime.
```java
LocalDate date = LocalDate.now();
date.format(DateTimeFormatter.ofPattern("hh:mm")); // ❌ Throws DateTimeException at runtime
```

**Trap 7 — Unescaped Text in DateTimeFormatter patterns:**
Literal characters (other than space, commas, colons, dashes, etc.) in date/time format patterns must be escaped.
```java
DateTimeFormatter.ofPattern("The time is hh:mm"); // ❌ Throws IllegalArgumentException at runtime
DateTimeFormatter.ofPattern("'The time is' hh:mm"); // ✅ Compiles and works
```

**Trap 8 — Reassigning an Effectively Final Resource:**
If a resource variable declared outside try-with-resources is reassigned anywhere in the method, it is no longer effectively final and cannot be used.
```java
var r = new MyResource();
try (r) { // ❌ DOES NOT COMPILE because r is reassigned on the next line
}
r = null;
```

**Trap 9 — `Locale` invalid string formats:**
Look out for reversed language/region codes or incorrect casing. Language codes are lowercase, country codes are uppercase. Country cannot exist without language.
```java
Locale.of("US", "en"); // ❌ Invalid locale codes reversed
Locale.of("US"); // ❌ Invalid, region code alone is not allowed
```

**Trap 10 — Missing constructor in custom checked exception:**
Custom exceptions should supply constructors that call `super(message)` so that `getMessage()` doesn't return `null`.
:::

:::tip[Spring/Senior Relevance]
*   **Transaction Rollback rules**: By default, Spring's `@Transactional` annotation only rolls back transactions on unchecked exceptions (`RuntimeException`). Checked exceptions do not trigger rollbacks unless configured via `@Transactional(rollbackFor = Exception.class)`.
*   **Database Resource leaks**: Connection pools (e.g. HikariCP) can quickly run out of connections if `Connection`, `PreparedStatement`, or `ResultSet` resources are not closed using try-with-resources, hanging the entire application.
*   **Spring i18n**: The default `MessageSource` in Spring Boot resolves locale resources following the standard properties file inheritance chain.
:::

---

## 🔗 Review Questions Focus

1.  If a method is overridden, can the subclass method add a new checked exception? What about a new runtime exception?
2.  What is the output of `System.out.println(new DecimalFormat("000.00").format(1.2));`?
3.  Why does `try (var r = new MyResource()) {}` compile even if `MyResource` does not implement `Closeable` but implements `AutoCloseable`?
4.  In a try-with-resources statement, does the resource close method run before or after the catch blocks?
5.  What happens if an exception is thrown in a `try` block, another in `close()`, and another in `finally`? Which exception propagates to the caller?
6.  Explain the fallback lookup hierarchy of Resource Bundles if a French Canadian (`fr_CA`) user makes a request on a system where the default locale is German (`de_DE`).
7.  How does `Locale.Category.FORMAT` differ from `Locale.Category.DISPLAY`?
8.  Which class and method are used to format a resource bundle string that contains placeholders like `Hello, {0}`?
9.  Why does `catch(IOException | FileNotFoundException e)` fail to compile?
10. What exception is thrown when an initializer block throws a runtime exception?
