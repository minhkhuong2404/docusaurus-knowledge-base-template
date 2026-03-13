---
title: Spring MVC — Complete Guide
description: Complete guide to Spring MVC covering controllers, request handling, model binding, validation, and REST application structure.
tags: [spring-mvc, spring-framework, java, web]
---

# Spring MVC — Complete Guide

Spring MVC is the web framework within Spring that implements the Model-View-Controller design pattern, providing a structured way to build web applications and RESTful services.

---

## What Is Spring MVC?

Spring MVC is a module of the Spring Framework used to create web applications. It organizes the application into three parts:

- **Model** — The data and business logic
- **View** — The user interface (HTML, JSON, XML)
- **Controller** — The logic that handles requests and connects Model to View

This separation makes applications easier to develop, test, and maintain.

---

## Why Use Spring MVC?

### Problems It Solves

| Problem | How Spring MVC Fixes It |
|---|---|
| Tight coupling between request handling and business logic | MVC pattern separates concerns cleanly |
| Manual servlet configuration | `DispatcherServlet` handles request routing automatically |
| No standard way to map URLs to handler methods | `@RequestMapping` and HTTP-method annotations |
| Complex form handling and validation | `@ModelAttribute`, `@Valid`, `BindingResult` |
| Hard to test web layer | `MockMvc` provides first-class testing support |
| Boilerplate response serialization | `@RestController` auto-serializes to JSON/XML |

### Core Benefits

1. **Clean Separation of Concerns** — Model, View, and Controller are independent and testable.
2. **Annotation-Driven** — Minimal XML; configure with `@Controller`, `@RequestMapping`, `@GetMapping`, etc.
3. **Flexible View Resolution** — Supports JSP, Thymeleaf, FreeMarker, JSON, XML, and more.
4. **Built-in Validation** — Integrates with Bean Validation (JSR 380) via `@Valid`.
5. **RESTful Support** — `@RestController` makes building REST APIs straightforward.
6. **Interceptors** — Cross-cutting concerns (logging, auth) without modifying controllers.
7. **Testability** — `MockMvc` allows testing without starting a server.

---

## Core Components

| Component | Role |
|---|---|
| `DispatcherServlet` | Front controller — receives all requests, dispatches to handlers |
| `HandlerMapping` | Maps URLs to controller methods |
| `Controller` | Processes the request, interacts with the model |
| `ModelAndView` | Bundles model data and the view name |
| `ViewResolver` | Resolves a view name to an actual view implementation |
| `View` | Renders the response (JSP, Thymeleaf, JSON, etc.) |

---

## Request Lifecycle

Understanding how a request flows through Spring MVC is essential:

```
1. Client sends HTTP request
         │
         ▼
2. DispatcherServlet receives the request
         │
         ▼
3. HandlerMapping finds the matching Controller method
         │
         ▼
4. Controller processes the request
   - Interacts with Service / Repository layers
   - Populates the Model with data
   - Returns a view name (or response body for REST)
         │
         ▼
5. ViewResolver resolves the view name to an actual View
         │
         ▼
6. View renders the response (HTML, JSON, XML)
         │
         ▼
7. DispatcherServlet sends the response to the client
```

---

## DispatcherServlet

The `DispatcherServlet` is the **front controller** of Spring MVC. It is the single entry point for all HTTP requests.

**Responsibilities:**
- Receives all incoming requests
- Consults `HandlerMapping` to find the right controller
- Invokes the controller method
- Uses `ViewResolver` to resolve the view
- Sends the rendered response back to the client

### WebApplicationContext

The `DispatcherServlet` uses a `WebApplicationContext` — a specialized Spring application context for web applications that stores and manages web-specific components (controllers, view resolvers, handler mappings, interceptors).

### Configuration (Spring Boot)

In Spring Boot, `DispatcherServlet` is auto-configured. No `web.xml` is needed. You can customize it via properties:

```yaml
spring:
  mvc:
    servlet:
      path: /api  # Changes the servlet path
```

### Java-Based Setup (Without Spring Boot)

```java
public class WebAppInitializer implements WebApplicationInitializer {

    @Override
    public void onStartup(ServletContext servletContext) {
        AnnotationConfigWebApplicationContext context =
            new AnnotationConfigWebApplicationContext();
        context.register(WebConfig.class);

        DispatcherServlet servlet = new DispatcherServlet(context);
        ServletRegistration.Dynamic registration =
            servletContext.addServlet("dispatcher", servlet);
        registration.setLoadOnStartup(1);
        registration.addMapping("/");
    }
}
```

---

## Controllers

### @Controller vs @RestController

```java
// Returns views (HTML pages)
@Controller
public class PageController {

    @GetMapping("/home")
    public String home(Model model) {
        model.addAttribute("message", "Welcome!");
        return "home";  // Resolved by ViewResolver to a template
    }
}

// Returns data directly (JSON/XML) — combines @Controller + @ResponseBody
@RestController
@RequestMapping("/api/users")
public class UserApiController {

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();  // Serialized to JSON automatically
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

| Feature | `@Controller` | `@RestController` |
|---|---|---|
| Returns | View names (HTML pages) | Data (JSON/XML) directly |
| `@ResponseBody` needed? | Yes, on each method | No, implicit |
| Use case | Traditional web apps with templates | RESTful APIs |

### Request Mapping Annotations

```java
@RestController
@RequestMapping("/api/orders")  // Base path for all methods
public class OrderController {

    @GetMapping                          // GET /api/orders
    public List<Order> list() { ... }

    @GetMapping("/{id}")                 // GET /api/orders/42
    public Order get(@PathVariable Long id) { ... }

    @PostMapping                         // POST /api/orders
    public Order create(@RequestBody @Valid OrderRequest req) { ... }

    @PutMapping("/{id}")                 // PUT /api/orders/42
    public Order update(@PathVariable Long id, @RequestBody OrderRequest req) { ... }

    @DeleteMapping("/{id}")              // DELETE /api/orders/42
    public void delete(@PathVariable Long id) { ... }
}
```

### @RequestMapping Attributes

| Attribute | Purpose |
|---|---|
| `value` / `path` | URL pattern |
| `method` | HTTP method (GET, POST, PUT, DELETE) |
| `params` | Required request parameters |
| `headers` | Required HTTP headers |
| `consumes` | Content types the method accepts |
| `produces` | Content types the method returns |

---

## Request Parameters and Data Binding

### @PathVariable

Extracts values from the URL path:

```java
@GetMapping("/users/{userId}/orders/{orderId}")
public Order getOrder(@PathVariable Long userId, @PathVariable Long orderId) {
    return orderService.findByUserAndId(userId, orderId);
}
```

### @RequestParam

Extracts query parameters:

```java
// GET /search?query=spring&page=2&size=10
@GetMapping("/search")
public Page<Article> search(
    @RequestParam String query,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size) {
    return articleService.search(query, PageRequest.of(page, size));
}
```

### @RequestBody

Deserializes the HTTP request body to a Java object:

```java
@PostMapping("/users")
public User create(@RequestBody @Valid CreateUserRequest request) {
    return userService.create(request);
}
```

### @ModelAttribute

Binds form data to a Java object:

```java
@PostMapping("/register")
public String register(@ModelAttribute @Valid RegistrationForm form,
                        BindingResult result) {
    if (result.hasErrors()) {
        return "register";  // Return to form with errors
    }
    userService.register(form);
    return "redirect:/login";
}
```

---

## Form Validation

Spring MVC integrates with Bean Validation (JSR 380):

```java
public class RegistrationForm {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    // getters and setters
}
```

```java
@PostMapping("/register")
public String register(@Valid @ModelAttribute RegistrationForm form,
                        BindingResult result, Model model) {
    if (result.hasErrors()) {
        return "register";
    }
    userService.register(form);
    return "redirect:/success";
}
```

---

## View Resolvers

A `ViewResolver` maps view names returned by controllers to actual view implementations.

### Common ViewResolvers

| ViewResolver | Purpose |
|---|---|
| `InternalResourceViewResolver` | Resolves JSP views by adding prefix/suffix |
| `ThymeleafViewResolver` | Resolves Thymeleaf templates |
| `FreeMarkerViewResolver` | Resolves FreeMarker templates |
| `BeanNameViewResolver` | Resolves views by bean name |
| `ContentNegotiatingViewResolver` | Delegates to other resolvers based on content type |

### InternalResourceViewResolver Example

```java
@Bean
public InternalResourceViewResolver viewResolver() {
    InternalResourceViewResolver resolver = new InternalResourceViewResolver();
    resolver.setPrefix("/WEB-INF/views/");
    resolver.setSuffix(".jsp");
    return resolver;
}
```

With this configuration, returning `"home"` from a controller resolves to `/WEB-INF/views/home.jsp`.

### ContentNegotiatingViewResolver

Automatically chooses the right view (JSON, XML, HTML) based on the client's `Accept` header. This allows a single endpoint to serve different response formats.

---

## Interceptors

Interceptors execute code **before and after** a controller method, without modifying the controller itself.

### HandlerInterceptor Interface

```java
public class LoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                              Object handler) {
        // Runs BEFORE the controller — return false to block the request
        log.info("Request: {} {}", request.getMethod(), request.getRequestURI());
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
                            Object handler, ModelAndView modelAndView) {
        // Runs AFTER the controller but BEFORE the view is rendered
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        // Runs AFTER the view is rendered — cleanup
    }
}
```

### Registering Interceptors

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoggingInterceptor())
            .addPathPatterns("/**")
            .excludePathPatterns("/static/**", "/css/**");
    }
}
```

### Interceptor vs Servlet Filter

| Aspect | Interceptor | Filter |
|---|---|---|
| Scope | Spring MVC only | Entire servlet container |
| Access to Spring | Full access to Spring beans and context | Limited |
| Granularity | Can target specific URL patterns easily | Applied to all requests |
| Use case | Logging, auth checks, locale switching | Security, compression, encoding |

---

## Exception Handling

### @ExceptionHandler (Controller-Level)

```java
@Controller
public class UserController {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
```

### @ControllerAdvice (Global)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(404, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(400, "Validation failed", errors));
    }
}
```

---

## Static Resources

### Serving CSS, JavaScript, Images

In Spring Boot, static files in `src/main/resources/static/` are served automatically. Custom configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
            .addResourceLocations("classpath:/static/assets/")
            .setCachePeriod(3600);
    }
}
```

---

## Useful Annotations Summary

| Annotation | Purpose |
|---|---|
| `@Controller` | Marks a class as a web controller (returns views) |
| `@RestController` | `@Controller` + `@ResponseBody` (returns data) |
| `@RequestMapping` | Maps URLs to handler methods |
| `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` | HTTP-method-specific shortcuts |
| `@PathVariable` | Extracts values from URL path |
| `@RequestParam` | Extracts query parameters |
| `@RequestBody` | Deserializes request body |
| `@ModelAttribute` | Binds form data to an object |
| `@Valid` | Triggers bean validation |
| `@ResponseBody` | Serializes return value to response body |
| `@SessionAttributes` | Stores model attributes in the HTTP session |
| `@CookieValue` | Extracts cookie values |
| `@ExceptionHandler` | Handles exceptions in a controller |
| `@ControllerAdvice` | Global exception handling across controllers |
| `@InitBinder` | Customizes data binding for a controller |

---

## Interview Questions

### Q1: What is Spring MVC?

Spring MVC is a web framework within the Spring ecosystem that implements the Model-View-Controller pattern. It separates the application into Model (data), View (UI), and Controller (request handling logic). The `DispatcherServlet` acts as the front controller, routing requests to appropriate handlers.

### Q2: Describe the lifecycle of a Spring MVC request.

1. `DispatcherServlet` receives the HTTP request
2. `HandlerMapping` finds the matching controller method
3. The controller processes the request, interacts with services/repositories
4. The controller returns a view name or response body
5. `ViewResolver` resolves the view name to an actual view
6. The view renders the response
7. `DispatcherServlet` sends the response to the client

### Q3: What role does the DispatcherServlet play?

`DispatcherServlet` is the front controller — the central entry point for all HTTP requests. It coordinates the entire request-processing pipeline: finding the handler, invoking it, resolving the view, and sending the response. All Spring MVC components (handler mappings, view resolvers, interceptors) are managed through it.

### Q4: What is the WebApplicationContext?

`WebApplicationContext` is a specialized Spring application context for web applications. It extends `ApplicationContext` with web-specific features and stores web components like controllers, view resolvers, and interceptors. When a request arrives, `DispatcherServlet` uses it to locate and wire these components.

### Q5: What are the differences between @Controller and @RestController?

`@Controller` is used for traditional web applications that return views (HTML pages). Methods need `@ResponseBody` to return data directly. `@RestController` combines `@Controller` and `@ResponseBody`, so every method automatically serializes its return value to JSON/XML. Use `@Controller` for template-based apps and `@RestController` for REST APIs.

### Q6: Explain the @RequestMapping annotation and its attributes.

`@RequestMapping` maps HTTP requests to controller methods. Key attributes:
- **value/path**: URL pattern
- **method**: HTTP method (GET, POST, etc.)
- **params**: Required request parameters
- **headers**: Required HTTP headers
- **consumes**: Accepted content types
- **produces**: Response content types

Shortcut annotations (`@GetMapping`, `@PostMapping`, etc.) are preferred for readability.

### Q7: How does Spring MVC handle form data and validation?

Form data is bound to objects using `@ModelAttribute`. Validation is applied using `@Valid` with Bean Validation annotations (`@NotBlank`, `@Size`, `@Email`). Errors are captured in `BindingResult`. If errors exist, the controller returns the form view with error messages. Individual parameters can be bound with `@RequestParam`.

### Q8: What is ViewResolver and how does it work?

A `ViewResolver` maps logical view names (returned by controllers) to actual view implementations. The `InternalResourceViewResolver` adds a prefix and suffix to the name — e.g., `"home"` becomes `/WEB-INF/views/home.jsp`. Other resolvers handle Thymeleaf, FreeMarker, and content negotiation. This decouples controllers from specific view technologies.

### Q9: How are interceptors used in Spring MVC?

Interceptors implement `HandlerInterceptor` with three methods: `preHandle()` (before the controller), `postHandle()` (after the controller, before view rendering), and `afterCompletion()` (after view rendering). They are registered via `WebMvcConfigurer.addInterceptors()` and are used for cross-cutting concerns like logging, authentication, and locale switching.

### Q10: What is the difference between a Spring MVC interceptor and a servlet filter?

Interceptors operate within the Spring MVC framework and have access to Spring beans and the handler method. Filters operate at the servlet container level and are more general-purpose. Interceptors can access `HandlerMethod` and `ModelAndView`; filters work only with `ServletRequest` and `ServletResponse`. Use interceptors for Spring-specific concerns and filters for low-level tasks like encoding and compression.

### Q11: How do you handle exceptions in Spring MVC?

- **`@ExceptionHandler`**: Handles exceptions in a single controller
- **`@ControllerAdvice` / `@RestControllerAdvice`**: Global exception handling across all controllers
- **`HandlerExceptionResolver`**: Programmatic exception resolution

Best practice: use `@RestControllerAdvice` with `@ExceptionHandler` methods for consistent error responses across the entire application.

### Q12: What is the role of @PathVariable?

`@PathVariable` extracts values from the URL path — e.g., `@GetMapping("/users/{id}")` with `@PathVariable Long id` captures the ID from the URL. When designing URLs, use clear names (`{userId}` not `{id}`), keep paths simple and logical, and avoid conflicts between fixed and variable segments.

### Q13: How does Spring MVC support data binding?

Spring MVC automatically binds HTTP request data to Java objects. `@ModelAttribute` binds form data, `@RequestParam` binds query parameters, and `@RequestBody` deserializes JSON/XML payloads. Custom binding rules can be added via `@InitBinder` methods and custom `Converter`/`Formatter` implementations.

### Q14: What is the role of @SessionAttributes and @CookieValue?

`@SessionAttributes` stores model attributes in the HTTP session across multiple requests — useful for multi-step forms or wizards. `@CookieValue` reads values from HTTP cookies. Security considerations: never store sensitive data in sessions or cookies, use secure and HttpOnly flags on cookies, and protect against XSS attacks.

### Q15: How do you test Spring MVC applications?

Use `MockMvc` to simulate HTTP requests without starting a server. `@WebMvcTest` sets up a minimal Spring context for controller testing. Use `@MockBean` to mock service dependencies. For integration tests, use `@SpringBootTest` with `TestRestTemplate` or `WebTestClient`. Mockito helps create test doubles for service layers.

### Q16: What are the best practices for integration testing in Spring MVC?

- Use `@SpringBootTest` for full application context tests
- Use `MockMvc` or `TestRestTemplate` to simulate HTTP requests
- Keep test environments isolated from production
- Clean up test data after each test
- Use `@Transactional` on test classes so database changes roll back automatically
- Test both happy paths and error scenarios

### Q17: How does Spring Security integrate with Spring MVC?

Spring Security plugs into Spring MVC through servlet filters that run before the `DispatcherServlet`. It is enabled with `@EnableWebSecurity` and configured via `SecurityFilterChain` beans. Security filters handle authentication and authorization before requests reach controllers. Method-level security (`@PreAuthorize`, `@Secured`) can be applied directly on controller or service methods.

---

## Advanced Editorial Pass: HTTP Layer Design and Failure Semantics

### Architectural Priorities
- Keep controllers thin and explicit about protocol-level responsibilities.
- Define error contracts, idempotency, and validation strategy up front.
- Ensure request lifecycle observability from ingress to persistence boundary.

### Common Production Gaps
- Inconsistent exception mapping creates unstable API behavior.
- Hidden blocking calls in request threads degrade tail latency.
- Overloaded controller methods blending transport and domain logic.

### Engineering Heuristics
1. Standardize response envelopes and error taxonomies for client stability.
2. Enforce timeout budgets and downstream call guards at the edge.
3. Track p95/p99 by endpoint and correlate with dependency latency.

### Compare Next
- [Spring Security - Complete Guide](./spring-security.md)
- [Spring Data JPA - Complete Guide](./spring-data-jpa.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
