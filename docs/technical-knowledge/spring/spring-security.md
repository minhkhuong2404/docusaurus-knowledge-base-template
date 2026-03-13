---
title: Spring Security — Complete Guide
description: Comprehensive guide to Spring Security, including authentication, authorization, filter chains, and common application security patterns.
tags: [spring-security, spring-boot, java, authentication]
---

# Spring Security — Complete Guide

Spring Security is the de-facto standard for securing Spring-based applications. It provides comprehensive authentication, authorization, and protection against common exploits out of the box.

---

## What Is Spring Security?

Spring Security is a powerful and highly customizable **authentication and access-control framework** for Java applications. It is the standard for securing Spring applications — both servlet-based (Spring MVC) and reactive (WebFlux).

**Key idea:** Security is a cross-cutting concern. Spring Security provides a declarative, filter-based architecture that keeps security logic separate from business logic.

---

## Why Use Spring Security?

### Problems It Solves

| Security Need | How Spring Security Addresses It |
|---|---|
| Authentication (who are you?) | Supports form login, HTTP Basic, OAuth2, SAML, LDAP, JWT, and custom providers |
| Authorization (what can you do?) | URL-based and method-level access control with roles and permissions |
| CSRF protection | Enabled by default for stateful applications |
| Session management | Session fixation protection, concurrent session control |
| Password storage | `BCryptPasswordEncoder` and other secure hashing algorithms |
| CORS | Configurable cross-origin resource sharing |
| Security headers | X-Content-Type-Options, X-Frame-Options, HSTS, etc. |

### Core Benefits

1. **Defense in Depth** — Multiple layers of security (filters, method annotations, URL rules) work together.
2. **Battle-Tested** — Used by millions of applications; vulnerabilities are patched quickly.
3. **Extensible** — Every component can be customized or replaced.
4. **Spring Integration** — Works seamlessly with Spring Boot, Spring MVC, Spring Data, and Spring Cloud.
5. **Standards-Based** — Supports OAuth 2.0, OpenID Connect, SAML 2.0, and LDAP.

---

## How Does Spring Security Work?

### The Security Filter Chain

Spring Security works through a **filter chain** that intercepts every HTTP request before it reaches your controllers:

```
HTTP Request
    │
    ▼
┌─────────────────────────────┐
│   SecurityFilterChain       │
│  ┌───────────────────────┐  │
│  │ CorsFilter            │  │
│  │ CsrfFilter            │  │
│  │ AuthenticationFilter  │  │
│  │ AuthorizationFilter   │  │
│  │ ExceptionTranslation  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
    │
    ▼
Controller / Endpoint
```

Each filter performs a specific security task. Filters are ordered — authentication happens before authorization.

### Authentication Architecture

```
AuthenticationFilter
    │
    ▼
AuthenticationManager
    │
    ▼
AuthenticationProvider (can have multiple)
    │
    ▼
UserDetailsService (loads user data)
    │
    ▼
PasswordEncoder (verifies password)
    │
    ▼
SecurityContext (stores authenticated principal)
```

**Key interfaces:**

| Interface | Responsibility |
|---|---|
| `Authentication` | Represents the token for an authentication request or an authenticated principal |
| `AuthenticationManager` | Processes an authentication request |
| `AuthenticationProvider` | Performs actual authentication against a specific source |
| `UserDetailsService` | Loads user data from a store (DB, LDAP, etc.) |
| `SecurityContext` | Holds the `Authentication` for the current thread |

### Complete Authentication Flow (Step-by-Step)

The following diagram shows the full journey of an HTTP request through Spring Security's authentication pipeline:

```
Client (Browser / API Consumer)
    │
    │  HTTP Request (e.g., POST /login with credentials)
    ▼
┌──────────────────────────┐
│  DelegatingFilterProxy   │  ① Servlet container filter — bridges to Spring
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  FilterChainProxy        │  ② Spring-managed — selects the right SecurityFilterChain
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  SecurityFilterChain     │  ③ Ordered list of security filters
│  (CORS, CSRF, Auth...)   │     (matched by URL pattern)
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  AuthenticationFilter    │  ④ Extracts credentials from the request
│  (e.g., UsernamePassword │     and creates an Authentication object
│   AuthenticationFilter)  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  Authentication Object   │  ⑤ Unauthenticated token holding
│  (UsernamePasswordAuth   │     username + password (not yet verified)
│   enticationToken)       │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  ProviderManager         │  ⑥ Default AuthenticationManager — iterates
│  (AuthenticationManager) │     through registered AuthenticationProviders
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  AuthenticationProvider  │  ⑦ Performs actual authentication
│  (e.g., DaoAuthProvider) │     (delegates to UserDetailsService + PasswordEncoder)
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  UserDetailsService      │  ⑧ DAO layer — loads user from database
│  (e.g., custom impl)     │     by username (calls UserRepository)
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  UserDetails             │  ⑨ Returned object containing username,
│                          │     hashed password, roles/authorities
└────────────┬─────────────┘
             ▼
      PasswordEncoder          ⑩ Compares raw password with stored hash
      verifies password           (BCrypt, Argon2, etc.)
             │
             ▼  (if valid)
┌──────────────────────────┐
│  Authenticated           │  ⑪ Fully authenticated token with
│  Authentication Object   │     principal, credentials, authorities
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  SecurityContextHolder   │  ⑫ Stores the Authentication in a
│  → SecurityContext       │     ThreadLocal so it's available
│    → Authentication      │     throughout the request lifecycle
└──────────────────────────┘
             │
             ▼
      Controller / Endpoint      Request proceeds to business logic
```

#### Step-by-Step Explanation

| Step | Component | What Happens |
|---|---|---|
| **①** | **DelegatingFilterProxy** | A standard servlet filter registered in the servlet container (e.g., Tomcat). It does not contain security logic itself — it delegates to a Spring-managed bean called `FilterChainProxy`. This is the bridge between the servlet world and Spring's application context. |
| **②** | **FilterChainProxy** | A Spring bean that holds one or more `SecurityFilterChain` instances. It matches the incoming request URL against the chain patterns and delegates to the first matching `SecurityFilterChain`. This is where Spring Security's processing begins. |
| **③** | **SecurityFilterChain** | An ordered list of security filters (CORS → CSRF → Authentication → Authorization → Exception handling, etc.). Each filter performs a specific task. The chain is configured via the `SecurityFilterChain` bean in your `@Configuration` class. |
| **④** | **AuthenticationFilter** | The filter responsible for extracting credentials from the request. For form login, this is `UsernamePasswordAuthenticationFilter` which reads `username` and `password` from the POST body. For JWT, this would be a custom `OncePerRequestFilter` that reads the `Authorization` header. |
| **⑤** | **Authentication Object** | The filter creates an **unauthenticated** `Authentication` token (e.g., `UsernamePasswordAuthenticationToken`) containing the raw credentials. At this point, `isAuthenticated()` returns `false`. |
| **⑥** | **ProviderManager** | The default implementation of `AuthenticationManager`. It holds a list of `AuthenticationProvider` instances and iterates through them until one successfully authenticates the token (or all fail). This allows supporting multiple authentication mechanisms (DB, LDAP, OAuth) simultaneously. |
| **⑦** | **AuthenticationProvider** | Performs the actual authentication. `DaoAuthenticationProvider` is the most common — it uses a `UserDetailsService` to load user data and a `PasswordEncoder` to verify the password. Other providers exist for LDAP, OAuth2, etc. |
| **⑧** | **UserDetailsService** | The DAO layer for security. Its single method `loadUserByUsername(String username)` queries the database (via a repository) and returns a `UserDetails` object. If the user is not found, it throws `UsernameNotFoundException`. |
| **⑨** | **UserDetails** | The returned object containing the user's **username**, **encoded password**, **authorities/roles**, and account status flags (enabled, locked, expired). Spring Security uses this to complete the authentication check. |
| **⑩** | **PasswordEncoder** | The `AuthenticationProvider` uses the `PasswordEncoder` (e.g., `BCryptPasswordEncoder`) to compare the raw password from the request with the hashed password from `UserDetails`. If they don't match, `BadCredentialsException` is thrown. |
| **⑪** | **Authenticated Token** | On success, a new **fully authenticated** `Authentication` object is created with the principal (`UserDetails`), credentials (cleared for security), and granted authorities. `isAuthenticated()` now returns `true`. |
| **⑫** | **SecurityContextHolder** | The authenticated `Authentication` is stored in the `SecurityContext`, which is held in a `ThreadLocal` via `SecurityContextHolder`. This makes the authenticated user available anywhere in the request processing chain — controllers, services, and even SpEL expressions in `@PreAuthorize`. |

#### What Happens on Authentication Failure?

```
AuthenticationProvider throws AuthenticationException
        │
        ▼
AuthenticationFilter catches it
        │
        ▼
AuthenticationFailureHandler is invoked
        │
        ▼
Response: 401 Unauthorized (or redirect to /login?error)
```

The `SecurityContext` is **not** populated, and the request does not reach the controller.

---

## Configuration (Spring Boot 3.x / Spring Security 6)

### Default Behavior

Adding `spring-boot-starter-security` to your project immediately:
- Protects all endpoints with HTTP Basic authentication
- Generates a random password (printed to console at startup)
- Enables CSRF protection
- Adds a default login page at `/login`
- Adds a logout endpoint at `/logout`

### Custom SecurityFilterChain

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/public/**", "/css/**", "/js/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### UserDetailsService Implementation

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPassword())  // already BCrypt-encoded
            .roles(user.getRoles().toArray(new String[0]))
            .build();
    }
}
```

---

## JWT Authentication

JSON Web Tokens (JWT) are commonly used for stateless authentication in REST APIs.

### JWT Flow

```
1. Client sends credentials (POST /auth/login)
2. Server validates credentials, generates JWT
3. Server returns JWT to client
4. Client sends JWT in Authorization header: Bearer <token>
5. JwtAuthenticationFilter extracts and validates the token
6. SecurityContext is populated with the authenticated user
7. Request proceeds to the controller
```

### JWT Filter Implementation

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### Registering the JWT Filter

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())  // Stateless API — no CSRF needed
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter,
            UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

---

## OAuth 2.0 / OpenID Connect

Spring Security has first-class support for OAuth 2.0 as both a **client** and a **resource server**.

### OAuth2 Login (Social Login)

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
```

### Resource Server (Validating JWTs from an Authorization Server)

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
        );
    return http.build();
}
```

---

## Method-Level Security

Beyond URL-based rules, Spring Security supports fine-grained access control on individual methods.

### Enable Method Security

```java
@Configuration
@EnableMethodSecurity  // Spring Security 6+
public class MethodSecurityConfig { }
```

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

    @PreAuthorize("hasAuthority('ORDER_DELETE')")
    public void deleteOrder(Long orderId) {
        // Requires specific authority
    }
}
```

| Annotation | When It Runs | Use Case |
|---|---|---|
| `@PreAuthorize` | Before method execution | Check permissions before processing |
| `@PostAuthorize` | After method execution | Filter results based on return value |
| `@Secured` | Before method execution | Simple role-based check (no SpEL) |
| `@RolesAllowed` | Before method execution | JSR-250 standard annotation |

---

## CSRF Protection

**Cross-Site Request Forgery (CSRF)** attacks trick authenticated users into submitting malicious requests.

- **Stateful apps (form-based):** CSRF protection is enabled by default. Spring Security generates a token included in forms.
- **Stateless APIs (JWT):** CSRF can be disabled because authentication is token-based, not cookie-based.

```java
// For stateless REST APIs
http.csrf(csrf -> csrf.disable());

// For stateful apps with SPAs (cookie-based CSRF token)
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
);
```

---

## CORS Configuration

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
    // ... other config
    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://example.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Common Security Headers

Spring Security adds secure headers by default:

| Header | Purpose |
|---|---|
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options: DENY` | Prevents clickjacking |
| `Strict-Transport-Security` | Enforces HTTPS (HSTS) |
| `X-XSS-Protection: 0` | Defers to Content-Security-Policy |
| `Cache-Control: no-cache, no-store` | Prevents caching of authenticated responses |

---

## Interview Questions

### Q1: What is Spring Security and why is it used?

Spring Security is a framework that provides authentication, authorization, and protection against common attacks for Java applications. It is used because it offers a comprehensive, customizable, and battle-tested security layer that integrates seamlessly with the Spring ecosystem.

### Q2: How does the Spring Security filter chain work?

Spring Security uses a chain of servlet filters that intercept HTTP requests. Each filter performs a specific security function (CORS, CSRF, authentication, authorization, exception handling). The `DelegatingFilterProxy` delegates to Spring Security's `FilterChainProxy`, which manages the ordered `SecurityFilterChain`. Requests pass through each filter sequentially before reaching the controller.

### Q3: What is the difference between authentication and authorization?

**Authentication** verifies the identity of a user (who are you?). **Authorization** determines what an authenticated user is allowed to do (what can you access?). Authentication happens first — you must prove your identity before the system checks your permissions.

### Q4: How does Spring Security integrate with Spring MVC?

Spring Security integrates with Spring MVC through servlet filters that intercept requests before they reach MVC controllers. It is enabled with `@EnableWebSecurity` and configured through `SecurityFilterChain` beans. It also supports method-level security with `@PreAuthorize` and `@PostAuthorize` annotations on service or controller methods.

### Q5: What is the difference between `@Secured`, `@RolesAllowed`, and `@PreAuthorize`?

| Annotation | SpEL Support | Source |
|---|---|---|
| `@Secured` | No | Spring-specific |
| `@RolesAllowed` | No | JSR-250 standard |
| `@PreAuthorize` | Yes | Spring-specific, most powerful |

`@PreAuthorize` is the most flexible — it supports Spring Expression Language (SpEL) for complex access rules like `hasRole('ADMIN') or #userId == authentication.principal.id`.

### Q6: How do you implement JWT authentication in Spring Security?

1. Create a `JwtTokenProvider` to generate and validate tokens.
2. Implement a `JwtAuthenticationFilter` extending `OncePerRequestFilter` that extracts the token from the `Authorization` header, validates it, and sets the `SecurityContext`.
3. Register the filter before `UsernamePasswordAuthenticationFilter` in the `SecurityFilterChain`.
4. Configure stateless session management and disable CSRF.

### Q7: What is CSRF and when should you disable it?

CSRF (Cross-Site Request Forgery) is an attack where a malicious site tricks a user's browser into making unwanted requests to another site where the user is authenticated. Spring Security enables CSRF protection by default. You should disable it only for **stateless REST APIs** that use token-based authentication (JWT) rather than cookies, since the attack vector requires cookie-based session management.

### Q8: What is the difference between `hasRole()` and `hasAuthority()`?

`hasRole("ADMIN")` automatically prefixes with `ROLE_`, so it checks for the authority `ROLE_ADMIN`. `hasAuthority("ADMIN")` checks for the exact string `ADMIN` without any prefix. Use `hasRole()` for role-based access and `hasAuthority()` for fine-grained permission-based access.

### Q9: How does Spring Security handle password encoding?

Spring Security uses `PasswordEncoder` to hash passwords. `BCryptPasswordEncoder` is the recommended implementation — it uses bcrypt hashing with a random salt, making brute-force attacks impractical. Passwords are never stored in plain text. The `{bcrypt}` prefix in stored passwords enables delegating password encoding for migration scenarios.

### Q10: What is the purpose of `SecurityContextHolder`?

`SecurityContextHolder` is where Spring Security stores the `SecurityContext`, which contains the `Authentication` object of the currently authenticated user. By default, it uses a `ThreadLocal` strategy, meaning each thread has its own security context. This is how Spring Security makes the authenticated principal available throughout the request processing chain.

### Q11: What is OAuth 2.0 and how does Spring Security support it?

OAuth 2.0 is an authorization framework that allows third-party applications to access resources on behalf of a user without sharing credentials. Spring Security supports it as both an **OAuth2 Client** (for social login, calling protected APIs) and a **Resource Server** (validating access tokens to protect your API). Configuration is largely driven by `application.yml` properties.

### Q12: What are the common challenges when securing a Spring application?

- Properly configuring authentication and authorization rules
- Protecting against XSS, CSRF, and SQL injection
- Enforcing HTTPS and secure headers
- Managing sessions securely (fixation, timeout, concurrency)
- Storing passwords with strong hashing (BCrypt)
- Keeping dependencies updated to patch vulnerabilities
- Implementing proper CORS policies for SPA frontends

### Q13: What is the difference between `@EnableWebSecurity` and `@EnableMethodSecurity`?

`@EnableWebSecurity` activates Spring Security's web-layer filter chain, handling URL-based security rules. `@EnableMethodSecurity` (or the older `@EnableGlobalMethodSecurity`) activates annotation-based security on individual methods (`@PreAuthorize`, `@PostAuthorize`, `@Secured`). Both are typically used together for layered security.

### Q14: How do you handle session management in Spring Security?

```java
http.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
    .maximumSessions(1)             // One session per user
    .maxSessionsPreventsLogin(true)  // Block new login instead of expiring old
    .sessionFixation().changeSessionId()  // Protect against session fixation
);
```

`SessionCreationPolicy` options: `ALWAYS`, `IF_REQUIRED`, `NEVER`, `STATELESS`.

### Q15: What is the role of `DelegatingFilterProxy` in Spring Security?

`DelegatingFilterProxy` is a servlet filter registered in the servlet container that delegates to a Spring-managed bean (`FilterChainProxy`). It acts as a bridge between the servlet container's filter mechanism and Spring's application context, allowing Spring Security filters to be managed as Spring beans with full dependency injection support.

---

## Advanced Editorial Pass: Security Architecture Beyond Defaults

### Senior Design Focus
- Build least-privilege authorization around domain capabilities, not URL patterns only.
- Treat authentication, authorization, and auditability as separate concerns.
- Design token/session strategy around threat model and operational realities.

### Failure Modes Under Real Traffic
- Over-permissive fallback rules introduced during urgent hotfixes.
- Unbounded security filter complexity impacting latency and debuggability.
- Missing audit trails for sensitive privilege transitions.

### Practical Security Heuristics
1. Make deny-by-default explicit and test it continuously.
2. Keep policy decisions observable with structured authorization logs.
3. Regularly review role model drift against actual business ownership.

### Compare Next
- [Spring MVC - Complete Guide](./spring-mvc.md)
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
