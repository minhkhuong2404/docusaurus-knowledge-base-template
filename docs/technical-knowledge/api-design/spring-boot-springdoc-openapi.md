---
id: spring-boot-springdoc-openapi
title: Spring Boot + springdoc-openapi (Code-First Swagger)
sidebar_label: Spring Boot & springdoc
description: Generate and govern OpenAPI specs from Spring Boot 3 with springdoc-openapi - annotations, groups, security schemes, polymorphism, Pageable, global error responses, customizers, exporting the spec in CI, and production pitfalls.
tags:
  - technical-knowledge
  - api-design
  - openapi
  - spring-boot
  - springdoc
---

# Spring Boot + springdoc-openapi

`springdoc-openapi` scans Spring MVC/WebFlux controllers at startup, builds an `OpenAPI` model (swagger-core) and serves it at `/v3/api-docs` with Swagger UI at `/swagger-ui.html`. It **replaced Springfox**, which is unmaintained and breaks on Spring Boot 2.6+/3.

## 1. Setup

```xml
<!-- Spring Boot 3.x, Java 17+ ; MVC -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.6.0</version>
</dependency>
<!-- WebFlux: springdoc-openapi-starter-webflux-ui ; headless (no UI): ...-webmvc-api -->
```

```yaml
# application.yml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui.html
    operations-sorter: alpha
    tags-sorter: alpha
    disable-swagger-default-url: true
  default-produces-media-type: application/json
  paths-to-match: /api/**
  packages-to-scan: com.example.orders.api
  show-actuator: false
```

**Disable in production** (or protect with auth):

```yaml
# application-prod.yml
springdoc:
  api-docs.enabled: false
  swagger-ui.enabled: false
```

## 2. Global API Metadata & Security

```java
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ordersOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Orders API")
                .version("1.4.0")
                .description("Order lifecycle for the Checkout domain")
                .contact(new Contact().name("Checkout Team").email("checkout@example.com")))
            .servers(java.util.List.of(new Server().url("https://api.example.com").description("Production")))
            .components(new Components().addSecuritySchemes("bearerAuth",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
```

## 3. Annotating Controllers

```java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Create and manage orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @Operation(operationId = "createOrder", summary = "Create an order",
               description = "Idempotent when the same Idempotency-Key is replayed within 24h.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Created",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "409", description = "Idempotency key reused with a different payload",
            content = @Content(mediaType = "application/problem+json",
                               schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
        @ApiResponse(responseCode = "422", description = "Validation failed",
            content = @Content(mediaType = "application/problem+json"))
    })
    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @Parameter(description = "Unique key per logical request", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = service.create(idempotencyKey, request);
        return ResponseEntity.created(URI.create("/api/v1/orders/" + created.id())).body(created);
    }

    @Operation(operationId = "getOrderById", summary = "Get an order")
    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable String orderId) {
        return service.get(orderId);
    }
}
```

### Schemas with Java Records & Bean Validation

```java
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

@Schema(description = "Request to create an order")
public record CreateOrderRequest(
        @NotBlank @Schema(example = "cus_91") String customerId,
        @NotEmpty @Size(max = 100) List<@Valid OrderItem> items) {

    public record OrderItem(
            @NotBlank @Schema(example = "SKU-1") String sku,
            @Min(1) @Max(1000) int quantity) {}
}

@Schema(description = "An order")
public record OrderResponse(
        @Schema(accessMode = Schema.AccessMode.READ_ONLY, example = "ord_8f3kd92k") String id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) OrderStatus status,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) Instant createdAt) {}
```

springdoc maps Bean Validation (`@NotNull`, `@Size`, `@Min`, `@Pattern`) to `required`, `minLength`, `minimum`, `pattern` automatically. Prefer **separate request and response records** over one entity-shaped DTO.

## 4. Grouping Multiple APIs

```java
@Bean
public GroupedOpenApi publicApi() {
    return GroupedOpenApi.builder().group("public").pathsToMatch("/api/v1/**").pathsToExclude("/api/v1/internal/**").build();
}

@Bean
public GroupedOpenApi adminApi() {
    return GroupedOpenApi.builder().group("admin").pathsToMatch("/api/admin/**").build();
}
// Specs: /v3/api-docs/public and /v3/api-docs/admin ; ship only "public" to partners
```

## 5. Global Customisation with `OpenApiCustomizer`

Add the standard error responses to every operation instead of annotating each method:

```java
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;

@Bean
public OpenApiCustomizer standardErrors() {
    return openApi -> openApi.getPaths().values().forEach(pathItem ->
        pathItem.readOperations().forEach(this::addErrors));
}

private void addErrors(Operation op) {
    Schema<?> problem = new Schema<>().$ref("#/components/schemas/ProblemDetail");
    Content content = new Content().addMediaType("application/problem+json", new MediaType().schema(problem));
    op.getResponses().addApiResponse("401", new ApiResponse().description("Unauthenticated").content(content));
    op.getResponses().addApiResponse("403", new ApiResponse().description("Forbidden").content(content));
    op.getResponses().addApiResponse("429", new ApiResponse().description("Rate limited").content(content));
    op.getResponses().addApiResponse("500", new ApiResponse().description("Internal error").content(content));
}
```

Use `OperationCustomizer` to rewrite `operationId`s or add headers per handler method; use `@Hidden` to exclude controllers/methods; use `@SecurityRequirements` (empty) to mark a public endpoint.

## 6. Hard Cases

| Case | Problem | Solution |
|---|---|---|
| **`Pageable`** | Exposes `page`, `size`, `sort` as a nested object in older versions | `springdoc-openapi-starter-common` resolves it; for cursor APIs use your own `limit/cursor` params with `@ParameterObject` |
| **Query-parameter objects** | Spring binds `?a=1&b=2` into a POJO but spec shows body | Annotate with `@ParameterObject` |
| **Polymorphism** | Subtypes missing | `@Schema(oneOf = {A.class, B.class}, discriminatorProperty = "type")` plus Jackson `@JsonTypeInfo(use = NAME, property = "type")` + `@JsonSubTypes` |
| **Generic wrappers** `ApiResponse<T>` | Schema named `ApiResponseOrder`, unstable | Avoid envelope generics; or use `@Schema(name = "OrderPage")` per concrete type |
| **Enums** | Rendered as plain strings | Use real `enum`; custom `@JsonValue` values are respected |
| **`Optional<T>`/nullability** | Everything appears optional | Use `@NotNull`/`requiredMode = REQUIRED` consistently |
| **ProblemDetail** | Not in components automatically | Reference with `@Schema(implementation = ProblemDetail.class)` once, reuse |
| **Kotlin/records/Lombok** | Accessors missing | Ensure Jackson sees properties (`-parameters` compiler flag; `@Schema` on record components) |

## 7. Spec as a Build Artifact (Don't Rely on Runtime)

Generate the spec during the build so it can be linted/diffed in CI without booting a live service:

```xml
<plugin>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-maven-plugin</artifactId>
  <version>1.4</version>
  <executions>
    <execution>
      <id>integration-test</id>
      <goals><goal>generate</goal></goals>
    </execution>
  </executions>
  <configuration>
    <apiDocsUrl>http://localhost:8080/v3/api-docs.yaml</apiDocsUrl>
    <outputFileName>openapi.yaml</outputFileName>
    <outputDir>${project.build.directory}</outputDir>
  </configuration>
</plugin>
```

Or write a test that fetches the spec with `MockMvc` and fails the build when it differs from the committed `openapi.yaml` (snapshot test):

```java
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiSnapshotTest {
    @Autowired MockMvc mvc;

    @Test
    void specMatchesCommittedContract() throws Exception {
        String actual = mvc.perform(get("/v3/api-docs.yaml")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        String expected = java.nio.file.Files.readString(java.nio.file.Path.of("api/openapi.yaml"));
        org.junit.jupiter.api.Assertions.assertEquals(expected.strip(), actual.strip(),
            "API contract changed. Review diff, run oasdiff, then update api/openapi.yaml");
    }
}
```

This turns every accidental API change into an explicit, reviewable diff.

## 8. Code-First vs Design-First (Quick Verdict)

| | Code-first (springdoc) | Design-first (openapi-generator `interfaceOnly`) |
|---|---|---|
| Source of truth | Java code | YAML spec |
| Speed for one team | Fast | Slower start |
| Parallel consumer work | After code exists | Immediately (mocks) |
| Drift risk | Spec follows code (accidental breaking changes) | Compiler enforces interface |
| Best for | Internal APIs, small teams, prototypes | Public/partner APIs, multi-team, governed platforms |

Details and the hybrid approach: [Contract Governance & Testing](./contract-governance-testing.md).

## 9. Production Pitfalls Checklist

- [ ] `swagger-ui` and `/v3/api-docs` disabled or authenticated in production
- [ ] Spring Security permits Swagger paths only in non-prod profiles (`/swagger-ui/**`, `/v3/api-docs/**`)
- [ ] `servers` in the spec points to the real gateway URL, not `localhost`
- [ ] Reverse proxy `X-Forwarded-*` headers honoured (`server.forward-headers-strategy: framework`) so "Try it out" uses the right host
- [ ] Startup scanning cost is bounded with `packages-to-scan`/`paths-to-match` (large apps add seconds to cold start; use the build-time spec for native images / GraalVM)
- [ ] Springfox and springdoc not both on the classpath
- [ ] Entities never exposed as schemas (lazy-loading, cyclic references, leaking columns)

Next: [Naming Conventions](./naming-conventions.md).
