---
title: Spring Security — Complete Guide
description: Comprehensive guide to Spring Security, including authentication, authorization, filter chains, exception handling, and common application security patterns.
tags: [spring-security, spring-boot, java, authentication, authorization, filters]
---

import SpringSecurityFilterDiagram from '@site/src/components/SpringSecurityFilterDiagram';
import OAuthPkceFlowDiagram from '@site/src/components/OAuthPkceFlowDiagram';
import SpringSecurityE2EWorkflowDiagram from '@site/src/components/SpringSecurityE2EWorkflowDiagram';


# Spring Security — Complete Guide

Spring Security is the de-facto standard for securing Spring-based applications. It provides comprehensive authentication, authorization, and protection against common exploits out of the box.

---

## What Is Spring Security?

Spring Security is a powerful and highly customizable **authentication and access-control framework** for Java applications. It is the standard for securing Spring applications — both servlet-based (Spring MVC) and reactive (WebFlux).

**Key idea:** Security is a cross-cutting concern. Spring Security provides a declarative, filter-based architecture that keeps security logic separate from business logic.

#### 👶 Beginner Concept: The "Nightclub" Analogy
Security always boils down to two distinct steps:
1. **Authentication (Who are you?):** This is the **Bouncer** at the front door checking your ID. He verifies you are who you say you are and gives you a wristband.
2. **Authorization (What are you allowed to do?):** This is the **VIP Lounge Guard** inside the club. Just because you got through the front door (Authentication) doesn't mean you can walk into the VIP area. The guard checks if your wristband has "VIP" printed on it (Authorization/Roles).

Spring Security handles both the Bouncer (Authentication Filters) and the VIP Guard (Authorization Filters) automatically before your code even runs.

---

## Why Use Spring Security?

### Problems It Solves

| Security Need                    | How Spring Security Addresses It                                               |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Authentication (who are you?)    | Supports form login, HTTP Basic, OAuth2, SAML, LDAP, JWT, and custom providers |
| Authorization (what can you do?) | URL-based and method-level access control with roles and permissions           |
| CSRF protection                  | Enabled by default for stateful applications                                   |
| Session management               | Session fixation protection, concurrent session control                        |
| Password storage                 | `BCryptPasswordEncoder` and other secure hashing algorithms                    |
| CORS                             | Configurable cross-origin resource sharing                                     |
| Security headers                 | X-Content-Type-Options, X-Frame-Options, HSTS, etc.                            |

---

## How Does Spring Security Work?

### The Security Filter Chain

Spring Security works through a **filter chain** that intercepts every HTTP request before it reaches your controllers. 

<SpringSecurityFilterDiagram defaultMode="FILTER_CHAIN" />

### Authentication Architecture

<SpringSecurityFilterDiagram defaultMode="AUTH_FLOW" />

### End-to-End Authentication Workflow

<SpringSecurityE2EWorkflowDiagram />

The complete end-to-end workflow, combining the filter chain and authentication architecture, operates as follows:

1. **Client** sends an HTTP **Request**.
2. **DelegatingFilterProxy** intercepts the servlet request and delegates it to the Spring-managed **FilterChainProxy**.
3. **FilterChainProxy** determines which **SecurityFilterChain** to invoke based on the request URL.
4. The **SecurityFilterChain** contains multiple filters, eventually executing an **Authentication Filter** (e.g., `UsernamePasswordAuthenticationFilter`).
5. The **Authentication Filter** extracts credentials from the request and creates an unauthenticated **Authentication Object** (e.g., an authentication token).
6. This unauthenticated object is passed to the **AuthenticationManager** (the default implementation is **ProviderManager**).
7. The **ProviderManager** delegates to one or more **AuthenticationProvider**s (e.g., `DaoAuthenticationProvider`).
8. The **AuthenticationProvider** uses a **UserDetailsService** (often a **DAO** accessing a database) to load the user's record.
9. The `UserDetailsService` returns a **UserDetails** object (containing the stored password and authorities).
10. The **AuthenticationProvider** validates the credentials (e.g., checking if the password matches). If successful, it creates a fully populated, authenticated **Authentication Object** and returns it back to the `ProviderManager`, which returns it back to the `Authentication Filter`.
11. Finally, the **Authentication Filter** stores this authenticated object in the **SecurityContextHolder** (Spring Context Holder) where it can be used for authorization decisions later in the filter chain or in your application code.

### 🧠 Senior Deep Dive: The `ThreadLocal` Architecture

When the `AuthenticationFilter` successfully logs a user in, it stores the identity in the `SecurityContextTracker`. But how does a completely random Controller method know *who* is making the request without passing a `User` object through 15 layers of method arguments?

Spring uses a Java `ThreadLocal`. 
Because Tomcat assigns exactly **one Dedicated Thread** per incoming HTTP Request, Spring binds the `SecurityContext` specifically to that one running Thread. 

Any method, anywhere in the code, can statically call `SecurityContextHolder.getContext().getAuthentication()` and it will retrieve the exact user belonging *only* to the current HTTP Request Thread. When the HTTP request finishes and the response is sent back, the FilterChain explicitly calls `SecurityContextHolder.clearContext()` to wipe the `ThreadLocal` clean before Tomcat recycles the Thread for the next user. If it fails to clear, you end up with massive security breaches where User B suddenly sees User A's private data!

---

## Authorization Architecture: FilterSecurityInterceptor vs. AuthorizationFilter

Once a user is authenticated, Spring Security must decide if they are allowed to access a specific resource. The mechanism for this changed significantly between Spring Security 5 and Spring Security 6.

### The Legacy Way (Spring Security 5 and below): `FilterSecurityInterceptor`

For years, the **`FilterSecurityInterceptor`** was the final and most crucial filter in the chain. Its job was to enforce HTTP authorization rules.

Here is how `FilterSecurityInterceptor` worked internally:
1. **Intercept the Request:** It stops the incoming HTTP request just before it reaches the `DispatcherServlet`.
2. **Retrieve Authentication:** It grabs the current `Authentication` object from the `SecurityContextHolder`.
3. **Lookup Metadata:** It consults the `FilterInvocationSecurityMetadataSource` to look up the required roles/authorities for the current request URL (e.g., "Does `/api/admin` require `ROLE_ADMIN`?").
4. **Make Access Decision:** It passes the `Authentication`, the request object, and the required authorities to the **`AccessDecisionManager`**.
5. **Vote:** The `AccessDecisionManager` uses a series of **`AccessDecisionVoter`** components to vote (GRANT, DENY, or ABSTAIN) on whether the user should be allowed in.
6. **Result:** If access is denied, it throws an `AccessDeniedException` (caught by the `ExceptionTranslationFilter`). If granted, the filter chain proceeds to the Controller.

### The Modern Way (Spring Security 6+): `AuthorizationFilter`

In Spring Security 6.0, `FilterSecurityInterceptor`, `AccessDecisionManager`, and `AccessDecisionVoter` were officially deprecated and replaced by a simpler, more performant component: the **`AuthorizationFilter`**.

It uses the new **`AuthorizationManager`** API instead of voters:
1. It intercepts the request.
2. It delegates directly to an `AuthorizationManager<HttpServletRequest>` (typically `RequestMatcherDelegatingAuthorizationManager`).
3. The manager checks the URL rules configured in your `SecurityFilterChain` and returns an `AuthorizationDecision`.
4. If the decision is negative, it throws an `AccessDeniedException`.

*Note: While `FilterSecurityInterceptor` is legacy, understanding it is critical for maintaining older Spring Boot 2.x codebases and for senior-level system architecture interviews.*

---

## Exception Handling: The ExceptionTranslationFilter

A critical component of the filter chain is the `ExceptionTranslationFilter`. Its sole responsibility is to catch and handle Spring Security exceptions thrown by the authorization filters (`FilterSecurityInterceptor` / `AuthorizationFilter`) or by method-level security (AOP).

### How It Works

The `ExceptionTranslationFilter` acts as a `try-catch` block around the remaining filter chain. It listens for two specific types of exceptions:

1. **`AuthenticationException` (401 Unauthorized):** Thrown when a user provides invalid credentials or accesses a protected resource without being authenticated.
2. **`AccessDeniedException` (403 Forbidden):** Thrown when an *authenticated* user attempts to access a resource they do not have the required roles/permissions for.

### The Exception Resolution Flow

<SpringSecurityFilterDiagram defaultMode="EXCEPTION_FLOW" />

### Customizing Security Responses (REST APIs)

By default, Spring Security might return a white-label HTML error page. For REST APIs, provide custom JSON responses:

#### 1. Custom AccessDeniedHandler (403 Forbidden)
```java
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, 
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"You do not have permission to access this resource.\"}");
    }
}
```

#### 2. Custom AuthenticationEntryPoint (401 Unauthorized)
```java
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, 
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Authentication is required.\"}");
    }
}
```

#### 3. Spring Security Exceptions vs. `@ControllerAdvice`

A common issue backend engineers face is trying to catch `AccessDeniedException` using `@RestControllerAdvice` and realizing it doesn't work for URL-level security.

**Why?** Filters execute *before* the `DispatcherServlet`. `@ControllerAdvice` only catches exceptions thrown *inside* the `DispatcherServlet`. If the `AuthorizationFilter` throws the exception, the Advice never sees it. *(However, if a `@PreAuthorize` annotation on a Controller method throws it, the Advice WILL catch it because it happens inside the servlet).*

---

## Configuration (Spring Boot 3.x / Spring Security 6)

### Custom SecurityFilterChain

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Replaces @EnableGlobalMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable for stateless APIs
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            );
            
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## Method-Level Security

Beyond URL-based rules, Spring Security supports fine-grained access control on individual methods using Spring Expression Language (SpEL).

### Annotations

```java
@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public Order getOrder(Long userId, Long orderId) {
        // Only admins or the owning user can access
    }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Order findOrder(Long orderId) {
        // Result is checked after method execution
    }
}
```

---

## Interview Questions

### Q1: What is the ExceptionTranslationFilter and what does it do?
It is a filter that sits just above the authorization filters. It acts as a try-catch block for the rest of the filter chain. It translates `AuthenticationException` into a call to the `AuthenticationEntryPoint` (triggering a 401), and translates `AccessDeniedException` into a call to the `AccessDeniedHandler` (triggering a 403 Forbidden).

### Q2: What was the role of the FilterSecurityInterceptor, and what replaced it?
In Spring Security 5 and older, `FilterSecurityInterceptor` was the final filter responsible for HTTP authorization. It extracted the `Authentication` object, looked up the required authorities for the URL, and delegated to an `AccessDecisionManager` (which used Voters) to determine if access should be granted. In Spring Security 6, it was deprecated and replaced by the simpler `AuthorizationFilter` and the `AuthorizationManager` API.

### Q3: An authenticated user with role `USER` calls an endpoint protected by `@PreAuthorize("hasRole('ADMIN')")`. What exception is thrown, and who catches it?
An `AccessDeniedException` is thrown. Because `@PreAuthorize` relies on AOP around the controller, the exception originates *inside* the DispatcherServlet. Therefore, a `@RestControllerAdvice` (GlobalExceptionHandler) can catch it. If no `@ControllerAdvice` handles it, the exception bubbles up and is eventually caught by the `ExceptionTranslationFilter`, which delegates it to the `AccessDeniedHandler` to return a 403 status.

### Q4: Why won't my `@ControllerAdvice` catch exceptions thrown inside a custom JWT filter?
`@ControllerAdvice` only intercepts exceptions thrown within the Spring MVC `DispatcherServlet` lifecycle. Custom JWT filters execute in the Servlet Filter Chain *before* the request ever reaches the `DispatcherServlet`. To handle filter exceptions, you must either configure an `AuthenticationEntryPoint`, or use a `HandlerExceptionResolver` to manually forward the exception to the advice context.

### Q5: How do you implement JWT authentication in Spring Security?
1. Create a `JwtTokenProvider` utility to generate and validate JWTs.
2. Implement a `OncePerRequestFilter` that extracts the token from the `Authorization: Bearer` header.
3. Validate the token, extract the username, load the `UserDetails`, and instantiate a `UsernamePasswordAuthenticationToken`.
4. Set this token into the `SecurityContextHolder`.
5. Register this filter in the `SecurityFilterChain` *before* the `UsernamePasswordAuthenticationFilter`.

---

## SecurityContext in Async — The Silent Bug

By default, `SecurityContextHolder` uses `MODE_THREADLOCAL` — the security context is **not copied** to new threads. Any `@Async` method or thread pool task loses the authenticated user.

```java
@Service
public class ReportService {

    @Async
    public void generateReport(Long userId) {
        // ❌ SecurityContext is EMPTY here — @Async runs on a different thread
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUser = auth.getName();  // NullPointerException or anonymous
    }
}
```

### Fix 1: `DelegatingSecurityContextAsyncTaskExecutor`

```java
@Configuration
@EnableAsync
public class AsyncSecurityConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.initialize();
        // Wraps executor to copy SecurityContext to child threads
        return new DelegatingSecurityContextAsyncTaskExecutor(executor);
    }
}
```

### Fix 2: Change SecurityContext Strategy Globally

```java
// In application startup (use cautiously — affects all thread spawning)
SecurityContextHolder.setStrategyName(
    SecurityContextHolder.MODE_INHERITABLETHREADLOCAL  // Copies to child threads
);
```

> **Caution with `INHERITABLETHREADLOCAL`:** Thread pool workers may inherit the wrong context if the thread is reused from a pool. `DelegatingSecurityContextAsyncTaskExecutor` is the safer, per-task approach.

### Fix 3: Pass authentication explicitly

```java
@Async
public void generateReport(Long userId, Authentication auth) {
    SecurityContextHolder.getContext().setAuthentication(auth);
    // ... process
    SecurityContextHolder.clearContext();  // Always clean up!
}
```

---

## OAuth2 Authorization Code + PKCE Flow

PKCE (Proof Key for Code Exchange) prevents authorization code interception — mandatory for public clients (SPAs, mobile apps).

<OAuthPkceFlowDiagram />

**Spring Boot Resource Server (Spring Security 6.x):**

```java
@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthConverter())
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");  // Custom claim
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
}
```

---

## Advanced Editorial Pass: Security Architecture Beyond Defaults

### Senior Design Focus
- **Decouple Security from Controllers:** Use `@PreAuthorize` on the service layer rather than the web layer to ensure security is enforced regardless of the entry point (HTTP, GraphQL, or internal events).
- **Global Exception Consistency:** Ensure that your `AccessDeniedHandler`, `AuthenticationEntryPoint`, and `@ControllerAdvice` all return the exact same JSON error payload structure (e.g., RFC 7807 Problem Details for HTTP APIs).
- **Migration Strategy:** When migrating legacy Spring applications to Spring Boot 3, factor in the architectural shift from `AccessDecisionManager`/`Voter` classes to the new `AuthorizationManager` interfaces.

### Compare Next
- [Spring MVC - Complete Guide](./spring-mvc.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
- [Spring Data JPA - Best Practices](./spring-data-jpa.md)
