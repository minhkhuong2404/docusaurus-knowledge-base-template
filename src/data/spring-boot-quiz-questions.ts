export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const springBootQuestions: QuizQuestion[] = [
  {
    "id": "spring-quiz-t1-1",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_1 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-1",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_1' into a singleton controller 'AnalyticsController_1'. How does 'RequestTracker_1' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_1' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons.",
      "The controller reuses the exact same instance of 'RequestTracker_1' injected at startup, behaving as a singleton."
    ],
    "correctOptionIndex": 3,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_1 {}\n\n@RestController\npublic class AnalyticsController_1 {\n    @Autowired\n    private RequestTracker_1 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-1",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_1.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-1",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_1' and 'BeanB_1'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_1' nor 'BeanB_1' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_1 {\n    public BeanA_1(BeanB_1 b) {}\n}\n@Component\npublic class BeanB_1 {\n    public BeanB_1(BeanA_1 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-1",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 4 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "4 SQL queries.",
      "2 SQL queries.",
      "5 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (4 queries), resulting in 5 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 4 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-1",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation."
    ],
    "correctOptionIndex": 3,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-1",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_1' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_1 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_1 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_1 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_1(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_1(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-1",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_1', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_1\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_1\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-1",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_1' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_1', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_1(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-1",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_1' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_1 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-1",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.1' is defined in application.properties as 10, in JVM properties as 60, and as an OS environment variable as 110, what value is resolved?",
    "options": [
      "110 (OS Environment variables take highest precedence)",
      "60 (JVM system properties override OS environment variables and properties files)",
      "10 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 60 is selected.",
    "codeSnippet": "@Value(\"${app.rate.1}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-1",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 101 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 101; }\n}"
  },
  {
    "id": "spring-quiz-t13-1",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_1\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_1\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-1",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_1'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_1 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-1",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_1' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_1' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_1.class)\n    public String handleDb(DatabaseException_1 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-1",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_1' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1010.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_1 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1010);\n}"
  },
  {
    "id": "spring-quiz-t17-1",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 11 and failureRateThreshold = 50%. If 7 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 11 requests, Resilience4j calculates the failure rate. Since 7/11 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(11)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-1",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_1 primaryBean() { return new BeanVal_1(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_1.class)\n    public BeanVal_1 fallbackBean() { return new BeanVal_1(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-1",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_1'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_1 {\n    private String status;\n    public ResponseData_1(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-1",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 2,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-2",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_2 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-2",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_2' into a singleton controller 'AnalyticsController_2'. How does 'RequestTracker_2' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_2' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_2' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_2 {}\n\n@RestController\npublic class AnalyticsController_2 {\n    @Autowired\n    private RequestTracker_2 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-2",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_2.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-2",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_2' and 'BeanB_2'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_2' nor 'BeanB_2' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_2 {\n    public BeanA_2(BeanB_2 b) {}\n}\n@Component\npublic class BeanB_2 {\n    public BeanB_2(BeanA_2 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-2",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 5 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "6 SQL queries.",
      "1 SQL query.",
      "5 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (5 queries), resulting in 6 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 5 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-2",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-2",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_2' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_2 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_2 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_2 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_2(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_2(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-2",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_2', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_2\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_2\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-2",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_2' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_2', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_2(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-2",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_2' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_2 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-2",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.2' is defined in application.properties as 20, in JVM properties as 70, and as an OS environment variable as 120, what value is resolved?",
    "options": [
      "120 (OS Environment variables take highest precedence)",
      "20 (application.properties overrides all external configurations)",
      "70 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 70 is selected.",
    "codeSnippet": "@Value(\"${app.rate.2}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-2",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 102 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 1,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 102; }\n}"
  },
  {
    "id": "spring-quiz-t13-2",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_2\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_2\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-2",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_2'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_2 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-2",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_2' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_2' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_2.class)\n    public String handleDb(DatabaseException_2 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-2",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_2' and the database result when the method process() exits?",
    "options": [
      "The entity is in the detached state; no database updates occur.",
      "The entity is in the persistent state; the database is updated with balance 1020.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 0,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_2 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1020);\n}"
  },
  {
    "id": "spring-quiz-t17-2",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 12 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 67%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 12 requests, Resilience4j calculates the failure rate. Since 8/12 (67%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(12)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-2",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_2 primaryBean() { return new BeanVal_2(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_2.class)\n    public BeanVal_2 fallbackBean() { return new BeanVal_2(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-2",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_2'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_2 {\n    private String status;\n    public ResponseData_2(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-2",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 2,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-3",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_3 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-3",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_3' into a singleton controller 'AnalyticsController_3'. How does 'RequestTracker_3' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_3' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons.",
      "The controller reuses the exact same instance of 'RequestTracker_3' injected at startup, behaving as a singleton."
    ],
    "correctOptionIndex": 3,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_3 {}\n\n@RestController\npublic class AnalyticsController_3 {\n    @Autowired\n    private RequestTracker_3 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-3",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_3.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-3",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_3' and 'BeanB_3'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_3' nor 'BeanB_3' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_3 {\n    public BeanA_3(BeanB_3 b) {}\n}\n@Component\npublic class BeanB_3 {\n    public BeanB_3(BeanA_3 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-3",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 6 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "6 SQL queries.",
      "7 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 2,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (6 queries), resulting in 7 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 6 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-3",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-3",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_3' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_3 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_3 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_3(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_3 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_3(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-3",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_3', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_3\") is injected, overriding @Primary.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 1,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_3\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-3",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_3' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_3', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_3(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-3",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_3' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_3 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-3",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.3' is defined in application.properties as 30, in JVM properties as 80, and as an OS environment variable as 130, what value is resolved?",
    "options": [
      "130 (OS Environment variables take highest precedence)",
      "30 (application.properties overrides all external configurations)",
      "80 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 80 is selected.",
    "codeSnippet": "@Value(\"${app.rate.3}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-3",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 103 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first."
    ],
    "correctOptionIndex": 3,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 103; }\n}"
  },
  {
    "id": "spring-quiz-t13-3",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_3\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_3\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-3",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_3'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_3 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-3",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_3' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_3' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_3.class)\n    public String handleDb(DatabaseException_3 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-3",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_3' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1030.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance.",
      "The entity is in the detached state; no database updates occur."
    ],
    "correctOptionIndex": 3,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_3 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1030);\n}"
  },
  {
    "id": "spring-quiz-t17-3",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 13 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 62%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 13 requests, Resilience4j calculates the failure rate. Since 8/13 (62%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(13)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-3",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_3 primaryBean() { return new BeanVal_3(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_3.class)\n    public BeanVal_3 fallbackBean() { return new BeanVal_3(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-3",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_3'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_3 {\n    private String status;\n    public ResponseData_3(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-3",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-4",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_4 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-4",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_4' into a singleton controller 'AnalyticsController_4'. How does 'RequestTracker_4' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_4' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_4' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_4 {}\n\n@RestController\npublic class AnalyticsController_4 {\n    @Autowired\n    private RequestTracker_4 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-4",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_4.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-4",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_4' and 'BeanB_4'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_4' nor 'BeanB_4' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_4 {\n    public BeanA_4(BeanB_4 b) {}\n}\n@Component\npublic class BeanB_4 {\n    public BeanB_4(BeanA_4 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-4",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 7 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "7 SQL queries.",
      "8 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 2,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (7 queries), resulting in 8 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 7 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-4",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-4",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_4' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Use addFilterBefore(new CustomAuthFilter_4(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Annotate CustomAuthFilter_4 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_4 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_4 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 0,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_4(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-4",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_4', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_4\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_4\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-4",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_4' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_4', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_4(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-4",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_4' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 1,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_4 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-4",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.4' is defined in application.properties as 40, in JVM properties as 90, and as an OS environment variable as 140, what value is resolved?",
    "options": [
      "140 (OS Environment variables take highest precedence)",
      "90 (JVM system properties override OS environment variables and properties files)",
      "40 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 90 is selected.",
    "codeSnippet": "@Value(\"${app.rate.4}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-4",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 104 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 104; }\n}"
  },
  {
    "id": "spring-quiz-t13-4",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_4\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_4\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-4",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_4'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_4 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-4",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_4' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_4' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_4.class)\n    public String handleDb(DatabaseException_4 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-4",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_4' and the database result when the method process() exits?",
    "options": [
      "The entity is in the detached state; no database updates occur.",
      "The entity is in the persistent state; the database is updated with balance 1040.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 0,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_4 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1040);\n}"
  },
  {
    "id": "spring-quiz-t17-4",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 14 and failureRateThreshold = 50%. If 9 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Once the sliding window registers 14 requests, Resilience4j calculates the failure rate. Since 9/14 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(14)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-4",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_4 primaryBean() { return new BeanVal_4(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_4.class)\n    public BeanVal_4 fallbackBean() { return new BeanVal_4(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-4",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_4'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_4 {\n    private String status;\n    public ResponseData_4(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-4",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-5",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_5 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-5",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_5' into a singleton controller 'AnalyticsController_5'. How does 'RequestTracker_5' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_5' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_5' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_5 {}\n\n@RestController\npublic class AnalyticsController_5 {\n    @Autowired\n    private RequestTracker_5 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-5",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_5.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-5",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_5' and 'BeanB_5'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_5' nor 'BeanB_5' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_5 {\n    public BeanA_5(BeanB_5 b) {}\n}\n@Component\npublic class BeanB_5 {\n    public BeanB_5(BeanA_5 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-5",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 3 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "4 SQL queries.",
      "1 SQL query.",
      "3 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (3 queries), resulting in 4 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 3 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-5",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-5",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_5' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Use addFilterBefore(new CustomAuthFilter_5(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Annotate CustomAuthFilter_5 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_5 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_5 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 0,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_5(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-5",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_5', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_5\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_5\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-5",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_5' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_5', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_5(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-5",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_5' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_5 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-5",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.5' is defined in application.properties as 50, in JVM properties as 100, and as an OS environment variable as 150, what value is resolved?",
    "options": [
      "150 (OS Environment variables take highest precedence)",
      "50 (application.properties overrides all external configurations)",
      "100 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 100 is selected.",
    "codeSnippet": "@Value(\"${app.rate.5}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-5",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 105 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 105; }\n}"
  },
  {
    "id": "spring-quiz-t13-5",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_5\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_5\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-5",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_5'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_5 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-5",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_5' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_5' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_5.class)\n    public String handleDb(DatabaseException_5 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-5",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_5' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1050.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_5 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1050);\n}"
  },
  {
    "id": "spring-quiz-t17-5",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 10 and failureRateThreshold = 50%. If 6 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 60%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 10 requests, Resilience4j calculates the failure rate. Since 6/10 (60%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(10)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-5",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_5 primaryBean() { return new BeanVal_5(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_5.class)\n    public BeanVal_5 fallbackBean() { return new BeanVal_5(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-5",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_5'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_5 {\n    private String status;\n    public ResponseData_5(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-5",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-6",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_6 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-6",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_6' into a singleton controller 'AnalyticsController_6'. How does 'RequestTracker_6' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_6' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_6' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_6 {}\n\n@RestController\npublic class AnalyticsController_6 {\n    @Autowired\n    private RequestTracker_6 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-6",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_6.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-6",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_6' and 'BeanB_6'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_6' nor 'BeanB_6' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_6 {\n    public BeanA_6(BeanB_6 b) {}\n}\n@Component\npublic class BeanB_6 {\n    public BeanB_6(BeanA_6 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-6",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 4 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "4 SQL queries.",
      "2 SQL queries.",
      "5 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (4 queries), resulting in 5 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 4 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-6",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-6",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_6' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_6 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_6(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_6 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_6 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_6(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-6",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_6', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_6\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_6\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-6",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_6' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_6', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_6(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-6",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_6' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_6 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-6",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.6' is defined in application.properties as 60, in JVM properties as 110, and as an OS environment variable as 160, what value is resolved?",
    "options": [
      "160 (OS Environment variables take highest precedence)",
      "60 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict",
      "110 (JVM system properties override OS environment variables and properties files)"
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 110 is selected.",
    "codeSnippet": "@Value(\"${app.rate.6}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-6",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 106 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first."
    ],
    "correctOptionIndex": 3,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 106; }\n}"
  },
  {
    "id": "spring-quiz-t13-6",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_6\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_6\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-6",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_6'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_6 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-6",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_6' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_6' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_6.class)\n    public String handleDb(DatabaseException_6 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-6",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_6' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1060.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_6 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1060);\n}"
  },
  {
    "id": "spring-quiz-t17-6",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 11 and failureRateThreshold = 50%. If 7 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 11 requests, Resilience4j calculates the failure rate. Since 7/11 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(11)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-6",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_6 primaryBean() { return new BeanVal_6(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_6.class)\n    public BeanVal_6 fallbackBean() { return new BeanVal_6(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-6",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_6'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_6 {\n    private String status;\n    public ResponseData_6(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-6",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-7",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_7 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-7",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_7' into a singleton controller 'AnalyticsController_7'. How does 'RequestTracker_7' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_7' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_7' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_7 {}\n\n@RestController\npublic class AnalyticsController_7 {\n    @Autowired\n    private RequestTracker_7 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-7",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_7.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-7",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_7' and 'BeanB_7'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_7' nor 'BeanB_7' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_7 {\n    public BeanA_7(BeanB_7 b) {}\n}\n@Component\npublic class BeanB_7 {\n    public BeanB_7(BeanA_7 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-7",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 5 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "6 SQL queries.",
      "5 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 1,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (5 queries), resulting in 6 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 5 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-7",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-7",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_7' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_7 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_7 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_7 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_7(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_7(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-7",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_7', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_7\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_7\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-7",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_7' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_7', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_7(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-7",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_7' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_7 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-7",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.7' is defined in application.properties as 70, in JVM properties as 120, and as an OS environment variable as 170, what value is resolved?",
    "options": [
      "170 (OS Environment variables take highest precedence)",
      "70 (application.properties overrides all external configurations)",
      "120 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 120 is selected.",
    "codeSnippet": "@Value(\"${app.rate.7}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-7",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 107 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 1,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 107; }\n}"
  },
  {
    "id": "spring-quiz-t13-7",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_7\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_7\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-7",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_7'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_7 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-7",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_7' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_7' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_7.class)\n    public String handleDb(DatabaseException_7 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-7",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_7' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1070.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_7 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1070);\n}"
  },
  {
    "id": "spring-quiz-t17-7",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 12 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 67%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 12 requests, Resilience4j calculates the failure rate. Since 8/12 (67%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(12)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-7",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_7 primaryBean() { return new BeanVal_7(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_7.class)\n    public BeanVal_7 fallbackBean() { return new BeanVal_7(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-7",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_7'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_7 {\n    private String status;\n    public ResponseData_7(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-7",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-8",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_8 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-8",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_8' into a singleton controller 'AnalyticsController_8'. How does 'RequestTracker_8' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_8' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_8' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_8 {}\n\n@RestController\npublic class AnalyticsController_8 {\n    @Autowired\n    private RequestTracker_8 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-8",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_8.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-8",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_8' and 'BeanB_8'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_8' nor 'BeanB_8' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_8 {\n    public BeanA_8(BeanB_8 b) {}\n}\n@Component\npublic class BeanB_8 {\n    public BeanB_8(BeanA_8 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-8",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 6 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "6 SQL queries.",
      "2 SQL queries.",
      "7 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (6 queries), resulting in 7 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 6 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-8",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-8",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_8' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_8 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_8(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_8 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_8 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_8(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-8",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_8', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_8\") is injected, overriding @Primary.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 1,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_8\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-8",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_8' which is missing on the Entity, what happens?",
    "options": [
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_8', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_8(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-8",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_8' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_8 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-8",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.8' is defined in application.properties as 80, in JVM properties as 130, and as an OS environment variable as 180, what value is resolved?",
    "options": [
      "180 (OS Environment variables take highest precedence)",
      "80 (application.properties overrides all external configurations)",
      "130 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 130 is selected.",
    "codeSnippet": "@Value(\"${app.rate.8}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-8",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 108 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 108; }\n}"
  },
  {
    "id": "spring-quiz-t13-8",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_8\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_8\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-8",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_8'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_8 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-8",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_8' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_8' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_8.class)\n    public String handleDb(DatabaseException_8 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-8",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_8' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1080.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_8 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1080);\n}"
  },
  {
    "id": "spring-quiz-t17-8",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 13 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 62%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 13 requests, Resilience4j calculates the failure rate. Since 8/13 (62%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(13)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-8",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_8 primaryBean() { return new BeanVal_8(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_8.class)\n    public BeanVal_8 fallbackBean() { return new BeanVal_8(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-8",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_8'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 2,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_8 {\n    private String status;\n    public ResponseData_8(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-8",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-9",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_9 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-9",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_9' into a singleton controller 'AnalyticsController_9'. How does 'RequestTracker_9' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_9' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_9' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_9 {}\n\n@RestController\npublic class AnalyticsController_9 {\n    @Autowired\n    private RequestTracker_9 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-9",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_9.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-9",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_9' and 'BeanB_9'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_9' nor 'BeanB_9' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_9 {\n    public BeanA_9(BeanB_9 b) {}\n}\n@Component\npublic class BeanB_9 {\n    public BeanB_9(BeanA_9 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-9",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 7 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "7 SQL queries.",
      "8 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 2,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (7 queries), resulting in 8 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 7 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-9",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-9",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_9' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_9 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_9(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_9 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_9 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_9(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-9",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_9', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_9\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_9\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-9",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_9' which is missing on the Entity, what happens?",
    "options": [
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_9', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_9(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-9",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_9' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_9 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-9",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.9' is defined in application.properties as 90, in JVM properties as 140, and as an OS environment variable as 190, what value is resolved?",
    "options": [
      "190 (OS Environment variables take highest precedence)",
      "90 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict",
      "140 (JVM system properties override OS environment variables and properties files)"
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 140 is selected.",
    "codeSnippet": "@Value(\"${app.rate.9}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-9",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 109 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 109; }\n}"
  },
  {
    "id": "spring-quiz-t13-9",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_9\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_9\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-9",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_9'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_9 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-9",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_9' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_9' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_9.class)\n    public String handleDb(DatabaseException_9 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-9",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_9' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1090.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_9 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1090);\n}"
  },
  {
    "id": "spring-quiz-t17-9",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 14 and failureRateThreshold = 50%. If 9 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Once the sliding window registers 14 requests, Resilience4j calculates the failure rate. Since 9/14 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(14)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-9",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_9 primaryBean() { return new BeanVal_9(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_9.class)\n    public BeanVal_9 fallbackBean() { return new BeanVal_9(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-9",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_9'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_9 {\n    private String status;\n    public ResponseData_9(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-9",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-10",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_10 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-10",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_10' into a singleton controller 'AnalyticsController_10'. How does 'RequestTracker_10' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_10' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_10' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_10 {}\n\n@RestController\npublic class AnalyticsController_10 {\n    @Autowired\n    private RequestTracker_10 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-10",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_10.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-10",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_10' and 'BeanB_10'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_10' nor 'BeanB_10' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_10 {\n    public BeanA_10(BeanB_10 b) {}\n}\n@Component\npublic class BeanB_10 {\n    public BeanB_10(BeanA_10 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-10",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 3 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "4 SQL queries.",
      "1 SQL query.",
      "3 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (3 queries), resulting in 4 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 3 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-10",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-10",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_10' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_10 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_10 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_10(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_10 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_10(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-10",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_10', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_10\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_10\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-10",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_10' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_10', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_10(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-10",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_10' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_10 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-10",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.10' is defined in application.properties as 100, in JVM properties as 150, and as an OS environment variable as 200, what value is resolved?",
    "options": [
      "200 (OS Environment variables take highest precedence)",
      "100 (application.properties overrides all external configurations)",
      "150 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 150 is selected.",
    "codeSnippet": "@Value(\"${app.rate.10}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-10",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 110 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 110; }\n}"
  },
  {
    "id": "spring-quiz-t13-10",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_10\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_10\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-10",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_10'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_10 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-10",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_10' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_10' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_10.class)\n    public String handleDb(DatabaseException_10 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-10",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_10' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1100.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_10 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1100);\n}"
  },
  {
    "id": "spring-quiz-t17-10",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 10 and failureRateThreshold = 50%. If 6 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 60%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 10 requests, Resilience4j calculates the failure rate. Since 6/10 (60%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(10)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-10",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_10 primaryBean() { return new BeanVal_10(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_10.class)\n    public BeanVal_10 fallbackBean() { return new BeanVal_10(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-10",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_10'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 0,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_10 {\n    private String status;\n    public ResponseData_10(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-10",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-11",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_11 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-11",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_11' into a singleton controller 'AnalyticsController_11'. How does 'RequestTracker_11' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_11' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_11' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_11 {}\n\n@RestController\npublic class AnalyticsController_11 {\n    @Autowired\n    private RequestTracker_11 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-11",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_11.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-11",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_11' and 'BeanB_11'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_11' nor 'BeanB_11' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_11 {\n    public BeanA_11(BeanB_11 b) {}\n}\n@Component\npublic class BeanB_11 {\n    public BeanB_11(BeanA_11 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-11",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 4 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "4 SQL queries.",
      "2 SQL queries.",
      "5 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (4 queries), resulting in 5 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 4 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-11",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-11",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_11' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_11 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_11 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_11(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_11 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_11(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-11",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_11', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_11\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_11\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-11",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_11' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_11', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_11(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-11",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_11' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_11 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-11",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.11' is defined in application.properties as 110, in JVM properties as 160, and as an OS environment variable as 210, what value is resolved?",
    "options": [
      "160 (JVM system properties override OS environment variables and properties files)",
      "210 (OS Environment variables take highest precedence)",
      "110 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 160 is selected.",
    "codeSnippet": "@Value(\"${app.rate.11}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-11",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 111 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 111; }\n}"
  },
  {
    "id": "spring-quiz-t13-11",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_11\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_11\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-11",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_11'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_11 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-11",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_11' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_11' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_11.class)\n    public String handleDb(DatabaseException_11 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-11",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_11' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1110.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_11 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1110);\n}"
  },
  {
    "id": "spring-quiz-t17-11",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 11 and failureRateThreshold = 50%. If 7 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 11 requests, Resilience4j calculates the failure rate. Since 7/11 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(11)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-11",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_11 primaryBean() { return new BeanVal_11(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_11.class)\n    public BeanVal_11 fallbackBean() { return new BeanVal_11(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-11",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_11'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_11 {\n    private String status;\n    public ResponseData_11(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-11",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-12",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_12 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-12",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_12' into a singleton controller 'AnalyticsController_12'. How does 'RequestTracker_12' behave across multiple HTTP requests?",
    "options": [
      "The controller reuses the exact same instance of 'RequestTracker_12' injected at startup, behaving as a singleton.",
      "A new instance of 'RequestTracker_12' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 0,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_12 {}\n\n@RestController\npublic class AnalyticsController_12 {\n    @Autowired\n    private RequestTracker_12 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-12",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_12.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-12",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_12' and 'BeanB_12'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_12' nor 'BeanB_12' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_12 {\n    public BeanA_12(BeanB_12 b) {}\n}\n@Component\npublic class BeanB_12 {\n    public BeanB_12(BeanA_12 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-12",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 5 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "6 SQL queries.",
      "1 SQL query.",
      "5 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (5 queries), resulting in 6 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 5 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-12",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-12",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_12' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_12 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_12 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_12(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_12 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_12(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-12",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_12', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_12\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_12\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-12",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_12' which is missing on the Entity, what happens?",
    "options": [
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_12', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_12(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-12",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_12' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_12 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-12",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.12' is defined in application.properties as 120, in JVM properties as 170, and as an OS environment variable as 220, what value is resolved?",
    "options": [
      "220 (OS Environment variables take highest precedence)",
      "120 (application.properties overrides all external configurations)",
      "170 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 170 is selected.",
    "codeSnippet": "@Value(\"${app.rate.12}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-12",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 112 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 112; }\n}"
  },
  {
    "id": "spring-quiz-t13-12",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_12\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_12\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-12",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_12'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_12 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-12",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_12' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_12' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_12.class)\n    public String handleDb(DatabaseException_12 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-12",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_12' and the database result when the method process() exits?",
    "options": [
      "The entity is in the detached state; no database updates occur.",
      "The entity is in the persistent state; the database is updated with balance 1120.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 0,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_12 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1120);\n}"
  },
  {
    "id": "spring-quiz-t17-12",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 12 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 67%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 12 requests, Resilience4j calculates the failure rate. Since 8/12 (67%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(12)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-12",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_12 primaryBean() { return new BeanVal_12(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_12.class)\n    public BeanVal_12 fallbackBean() { return new BeanVal_12(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-12",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_12'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_12 {\n    private String status;\n    public ResponseData_12(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-12",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-13",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_13 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-13",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_13' into a singleton controller 'AnalyticsController_13'. How does 'RequestTracker_13' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_13' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons.",
      "The controller reuses the exact same instance of 'RequestTracker_13' injected at startup, behaving as a singleton."
    ],
    "correctOptionIndex": 3,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_13 {}\n\n@RestController\npublic class AnalyticsController_13 {\n    @Autowired\n    private RequestTracker_13 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-13",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_13.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-13",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_13' and 'BeanB_13'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_13' nor 'BeanB_13' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_13 {\n    public BeanA_13(BeanB_13 b) {}\n}\n@Component\npublic class BeanB_13 {\n    public BeanB_13(BeanA_13 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-13",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 6 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "7 SQL queries.",
      "1 SQL query.",
      "6 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (6 queries), resulting in 7 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 6 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-13",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-13",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_13' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_13 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_13 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_13 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_13(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_13(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-13",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_13', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_13\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_13\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-13",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_13' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_13', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_13(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-13",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_13' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_13 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-13",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.13' is defined in application.properties as 130, in JVM properties as 180, and as an OS environment variable as 230, what value is resolved?",
    "options": [
      "180 (JVM system properties override OS environment variables and properties files)",
      "230 (OS Environment variables take highest precedence)",
      "130 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 180 is selected.",
    "codeSnippet": "@Value(\"${app.rate.13}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-13",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 113 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 113; }\n}"
  },
  {
    "id": "spring-quiz-t13-13",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_13\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_13\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-13",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_13'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_13 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-13",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_13' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_13' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_13.class)\n    public String handleDb(DatabaseException_13 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-13",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_13' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1130.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance.",
      "The entity is in the detached state; no database updates occur."
    ],
    "correctOptionIndex": 3,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_13 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1130);\n}"
  },
  {
    "id": "spring-quiz-t17-13",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 13 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 62%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 13 requests, Resilience4j calculates the failure rate. Since 8/13 (62%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(13)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-13",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_13 primaryBean() { return new BeanVal_13(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_13.class)\n    public BeanVal_13 fallbackBean() { return new BeanVal_13(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-13",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_13'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_13 {\n    private String status;\n    public ResponseData_13(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-13",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-14",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_14 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-14",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_14' into a singleton controller 'AnalyticsController_14'. How does 'RequestTracker_14' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_14' is created for every HTTP request.",
      "The controller reuses the exact same instance of 'RequestTracker_14' injected at startup, behaving as a singleton.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_14 {}\n\n@RestController\npublic class AnalyticsController_14 {\n    @Autowired\n    private RequestTracker_14 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-14",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_14.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-14",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_14' and 'BeanB_14'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 2,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_14' nor 'BeanB_14' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_14 {\n    public BeanA_14(BeanB_14 b) {}\n}\n@Component\npublic class BeanB_14 {\n    public BeanB_14(BeanA_14 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-14",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 7 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "7 SQL queries.",
      "8 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 2,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (7 queries), resulting in 8 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 7 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-14",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-14",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_14' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_14 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_14 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_14(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_14 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_14(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-14",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_14', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_14\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_14\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-14",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_14' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_14', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_14(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-14",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_14' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_14 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-14",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.14' is defined in application.properties as 140, in JVM properties as 190, and as an OS environment variable as 240, what value is resolved?",
    "options": [
      "240 (OS Environment variables take highest precedence)",
      "140 (application.properties overrides all external configurations)",
      "190 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 190 is selected.",
    "codeSnippet": "@Value(\"${app.rate.14}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-14",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 114 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 114; }\n}"
  },
  {
    "id": "spring-quiz-t13-14",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_14\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_14\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-14",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_14'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_14 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-14",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_14' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_14' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_14.class)\n    public String handleDb(DatabaseException_14 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-14",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_14' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1140.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_14 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1140);\n}"
  },
  {
    "id": "spring-quiz-t17-14",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 14 and failureRateThreshold = 50%. If 9 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 14 requests, Resilience4j calculates the failure rate. Since 9/14 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(14)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-14",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_14 primaryBean() { return new BeanVal_14(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_14.class)\n    public BeanVal_14 fallbackBean() { return new BeanVal_14(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-14",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_14'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_14 {\n    private String status;\n    public ResponseData_14(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-14",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 2,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-15",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_15 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-15",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_15' into a singleton controller 'AnalyticsController_15'. How does 'RequestTracker_15' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_15' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_15' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_15 {}\n\n@RestController\npublic class AnalyticsController_15 {\n    @Autowired\n    private RequestTracker_15 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-15",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_15.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-15",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_15' and 'BeanB_15'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_15' nor 'BeanB_15' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_15 {\n    public BeanA_15(BeanB_15 b) {}\n}\n@Component\npublic class BeanB_15 {\n    public BeanB_15(BeanA_15 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-15",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 3 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "3 SQL queries.",
      "2 SQL queries.",
      "4 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (3 queries), resulting in 4 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 3 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-15",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-15",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_15' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_15 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_15 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_15(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_15 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_15(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-15",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_15', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_15\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_15\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-15",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_15' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_15', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_15(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-15",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_15' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_15 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-15",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.15' is defined in application.properties as 150, in JVM properties as 200, and as an OS environment variable as 250, what value is resolved?",
    "options": [
      "250 (OS Environment variables take highest precedence)",
      "150 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict",
      "200 (JVM system properties override OS environment variables and properties files)"
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 200 is selected.",
    "codeSnippet": "@Value(\"${app.rate.15}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-15",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 115 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 1,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 115; }\n}"
  },
  {
    "id": "spring-quiz-t13-15",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_15\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_15\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-15",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_15'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server."
    ],
    "correctOptionIndex": 3,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_15 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-15",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_15' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_15' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_15.class)\n    public String handleDb(DatabaseException_15 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-15",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_15' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1150.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance.",
      "The entity is in the detached state; no database updates occur."
    ],
    "correctOptionIndex": 3,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_15 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1150);\n}"
  },
  {
    "id": "spring-quiz-t17-15",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 10 and failureRateThreshold = 50%. If 6 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 60%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 10 requests, Resilience4j calculates the failure rate. Since 6/10 (60%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(10)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-15",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_15 primaryBean() { return new BeanVal_15(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_15.class)\n    public BeanVal_15 fallbackBean() { return new BeanVal_15(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-15",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_15'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_15 {\n    private String status;\n    public ResponseData_15(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-15",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-16",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_16 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-16",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_16' into a singleton controller 'AnalyticsController_16'. How does 'RequestTracker_16' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_16' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_16' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_16 {}\n\n@RestController\npublic class AnalyticsController_16 {\n    @Autowired\n    private RequestTracker_16 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-16",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_16.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-16",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_16' and 'BeanB_16'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 2,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_16' nor 'BeanB_16' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_16 {\n    public BeanA_16(BeanB_16 b) {}\n}\n@Component\npublic class BeanB_16 {\n    public BeanB_16(BeanA_16 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-16",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 4 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "4 SQL queries.",
      "2 SQL queries.",
      "5 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (4 queries), resulting in 5 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 4 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-16",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-16",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_16' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_16 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_16 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_16(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_16 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_16(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-16",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_16', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_16\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_16\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-16",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_16' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_16', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_16(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-16",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_16' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_16 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-16",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.16' is defined in application.properties as 160, in JVM properties as 210, and as an OS environment variable as 260, what value is resolved?",
    "options": [
      "260 (OS Environment variables take highest precedence)",
      "160 (application.properties overrides all external configurations)",
      "210 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 210 is selected.",
    "codeSnippet": "@Value(\"${app.rate.16}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-16",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 116 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 1,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 116; }\n}"
  },
  {
    "id": "spring-quiz-t13-16",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_16\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_16\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-16",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_16'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_16 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-16",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_16' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_16' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_16.class)\n    public String handleDb(DatabaseException_16 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-16",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_16' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1160.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_16 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1160);\n}"
  },
  {
    "id": "spring-quiz-t17-16",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 11 and failureRateThreshold = 50%. If 7 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 11 requests, Resilience4j calculates the failure rate. Since 7/11 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(11)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-16",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_16 primaryBean() { return new BeanVal_16(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_16.class)\n    public BeanVal_16 fallbackBean() { return new BeanVal_16(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-16",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_16'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 2,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_16 {\n    private String status;\n    public ResponseData_16(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-16",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 2,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-17",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_17 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-17",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_17' into a singleton controller 'AnalyticsController_17'. How does 'RequestTracker_17' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_17' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_17' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_17 {}\n\n@RestController\npublic class AnalyticsController_17 {\n    @Autowired\n    private RequestTracker_17 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-17",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_17.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-17",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_17' and 'BeanB_17'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_17' nor 'BeanB_17' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_17 {\n    public BeanA_17(BeanB_17 b) {}\n}\n@Component\npublic class BeanB_17 {\n    public BeanB_17(BeanA_17 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-17",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 5 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "5 SQL queries.",
      "2 SQL queries.",
      "6 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (5 queries), resulting in 6 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 5 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-17",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-17",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_17' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_17 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_17 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_17(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_17 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_17(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-17",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_17', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_17\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_17\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-17",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_17' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_17', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_17(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-17",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_17' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_17 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-17",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.17' is defined in application.properties as 170, in JVM properties as 220, and as an OS environment variable as 270, what value is resolved?",
    "options": [
      "220 (JVM system properties override OS environment variables and properties files)",
      "270 (OS Environment variables take highest precedence)",
      "170 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 220 is selected.",
    "codeSnippet": "@Value(\"${app.rate.17}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-17",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 117 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first."
    ],
    "correctOptionIndex": 3,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 117; }\n}"
  },
  {
    "id": "spring-quiz-t13-17",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_17\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_17\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-17",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_17'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_17 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-17",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_17' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_17' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_17.class)\n    public String handleDb(DatabaseException_17 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-17",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_17' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1170.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_17 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1170);\n}"
  },
  {
    "id": "spring-quiz-t17-17",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 12 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately.",
      "Transitions to OPEN state (failure rate is 67%, exceeding the 50% threshold)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Once the sliding window registers 12 requests, Resilience4j calculates the failure rate. Since 8/12 (67%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(12)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-17",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_17 primaryBean() { return new BeanVal_17(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_17.class)\n    public BeanVal_17 fallbackBean() { return new BeanVal_17(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-17",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_17'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 0,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_17 {\n    private String status;\n    public ResponseData_17(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-17",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-18",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_18 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-18",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_18' into a singleton controller 'AnalyticsController_18'. How does 'RequestTracker_18' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_18' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_18' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_18 {}\n\n@RestController\npublic class AnalyticsController_18 {\n    @Autowired\n    private RequestTracker_18 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-18",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_18.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-18",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_18' and 'BeanB_18'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 2,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_18' nor 'BeanB_18' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_18 {\n    public BeanA_18(BeanB_18 b) {}\n}\n@Component\npublic class BeanB_18 {\n    public BeanB_18(BeanA_18 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-18",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 6 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "6 SQL queries.",
      "7 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 2,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (6 queries), resulting in 7 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 6 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-18",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation."
    ],
    "correctOptionIndex": 3,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-18",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_18' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_18 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_18(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_18 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_18 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_18(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-18",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_18', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_18\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_18\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-18",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_18' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_18', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_18(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-18",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_18' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_18 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-18",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.18' is defined in application.properties as 180, in JVM properties as 230, and as an OS environment variable as 280, what value is resolved?",
    "options": [
      "280 (OS Environment variables take highest precedence)",
      "230 (JVM system properties override OS environment variables and properties files)",
      "180 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 230 is selected.",
    "codeSnippet": "@Value(\"${app.rate.18}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-18",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 118 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first."
    ],
    "correctOptionIndex": 3,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 118; }\n}"
  },
  {
    "id": "spring-quiz-t13-18",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_18\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_18\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-18",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_18'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_18 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-18",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_18' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_18' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_18.class)\n    public String handleDb(DatabaseException_18 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-18",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_18' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1180.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_18 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1180);\n}"
  },
  {
    "id": "spring-quiz-t17-18",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 13 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 62%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 13 requests, Resilience4j calculates the failure rate. Since 8/13 (62%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(13)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-18",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_18 primaryBean() { return new BeanVal_18(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_18.class)\n    public BeanVal_18 fallbackBean() { return new BeanVal_18(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-18",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_18'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_18 {\n    private String status;\n    public ResponseData_18(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-18",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-19",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_19 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-19",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_19' into a singleton controller 'AnalyticsController_19'. How does 'RequestTracker_19' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_19' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons.",
      "The controller reuses the exact same instance of 'RequestTracker_19' injected at startup, behaving as a singleton."
    ],
    "correctOptionIndex": 3,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_19 {}\n\n@RestController\npublic class AnalyticsController_19 {\n    @Autowired\n    private RequestTracker_19 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-19",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_19.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-19",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_19' and 'BeanB_19'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_19' nor 'BeanB_19' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_19 {\n    public BeanA_19(BeanB_19 b) {}\n}\n@Component\npublic class BeanB_19 {\n    public BeanB_19(BeanA_19 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-19",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 7 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "7 SQL queries.",
      "2 SQL queries.",
      "8 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (7 queries), resulting in 8 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 7 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-19",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation."
    ],
    "correctOptionIndex": 3,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-19",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_19' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_19 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_19(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_19 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_19 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_19(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-19",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_19', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_19\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_19\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-19",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_19' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_19', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_19(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-19",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_19' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_19 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-19",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.19' is defined in application.properties as 190, in JVM properties as 240, and as an OS environment variable as 290, what value is resolved?",
    "options": [
      "290 (OS Environment variables take highest precedence)",
      "190 (application.properties overrides all external configurations)",
      "240 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 240 is selected.",
    "codeSnippet": "@Value(\"${app.rate.19}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-19",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 119 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 119; }\n}"
  },
  {
    "id": "spring-quiz-t13-19",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_19\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_19\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-19",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_19'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_19 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-19",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_19' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_19' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_19.class)\n    public String handleDb(DatabaseException_19 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-19",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_19' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1190.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_19 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1190);\n}"
  },
  {
    "id": "spring-quiz-t17-19",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 14 and failureRateThreshold = 50%. If 9 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once the sliding window registers 14 requests, Resilience4j calculates the failure rate. Since 9/14 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(14)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-19",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_19 primaryBean() { return new BeanVal_19(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_19.class)\n    public BeanVal_19 fallbackBean() { return new BeanVal_19(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-19",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_19'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_19 {\n    private String status;\n    public ResponseData_19(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-19",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-20",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_20 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-20",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_20' into a singleton controller 'AnalyticsController_20'. How does 'RequestTracker_20' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_20' is created for every HTTP request.",
      "The controller reuses the exact same instance of 'RequestTracker_20' injected at startup, behaving as a singleton.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_20 {}\n\n@RestController\npublic class AnalyticsController_20 {\n    @Autowired\n    private RequestTracker_20 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-20",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_20.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-20",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_20' and 'BeanB_20'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_20' nor 'BeanB_20' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_20 {\n    public BeanA_20(BeanB_20 b) {}\n}\n@Component\npublic class BeanB_20 {\n    public BeanB_20(BeanA_20 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-20",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 3 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "4 SQL queries.",
      "3 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 1,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (3 queries), resulting in 4 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 3 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-20",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation."
    ],
    "correctOptionIndex": 3,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-20",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_20' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_20 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_20(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_20 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_20 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_20(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-20",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_20', what is injected?",
    "options": [
      "The bean annotated with @Qualifier(\"customPaymentSvc_20\") is injected, overriding @Primary.",
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 0,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_20\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-20",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_20' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_20', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_20(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-20",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_20' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 1,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_20 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-20",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.20' is defined in application.properties as 200, in JVM properties as 250, and as an OS environment variable as 300, what value is resolved?",
    "options": [
      "250 (JVM system properties override OS environment variables and properties files)",
      "300 (OS Environment variables take highest precedence)",
      "200 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 250 is selected.",
    "codeSnippet": "@Value(\"${app.rate.20}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-20",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 120 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first."
    ],
    "correctOptionIndex": 3,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 120; }\n}"
  },
  {
    "id": "spring-quiz-t13-20",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_20\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_20\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-20",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_20'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_20 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-20",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_20' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_20' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_20.class)\n    public String handleDb(DatabaseException_20 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-20",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_20' and the database result when the method process() exits?",
    "options": [
      "The entity is in the detached state; no database updates occur.",
      "The entity is in the persistent state; the database is updated with balance 1200.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 0,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_20 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1200);\n}"
  },
  {
    "id": "spring-quiz-t17-20",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 10 and failureRateThreshold = 50%. If 6 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately.",
      "Transitions to OPEN state (failure rate is 60%, exceeding the 50% threshold)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Once the sliding window registers 10 requests, Resilience4j calculates the failure rate. Since 6/10 (60%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(10)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-20",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_20 primaryBean() { return new BeanVal_20(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_20.class)\n    public BeanVal_20 fallbackBean() { return new BeanVal_20(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-20",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_20'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_20 {\n    private String status;\n    public ResponseData_20(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-20",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-21",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_21 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-21",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_21' into a singleton controller 'AnalyticsController_21'. How does 'RequestTracker_21' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_21' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons.",
      "The controller reuses the exact same instance of 'RequestTracker_21' injected at startup, behaving as a singleton."
    ],
    "correctOptionIndex": 3,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_21 {}\n\n@RestController\npublic class AnalyticsController_21 {\n    @Autowired\n    private RequestTracker_21 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-21",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_21.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-21",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_21' and 'BeanB_21'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_21' nor 'BeanB_21' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_21 {\n    public BeanA_21(BeanB_21 b) {}\n}\n@Component\npublic class BeanB_21 {\n    public BeanB_21(BeanA_21 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-21",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 4 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "5 SQL queries.",
      "1 SQL query.",
      "4 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (4 queries), resulting in 5 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 4 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-21",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-21",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_21' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_21 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_21 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_21 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_21(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_21(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-21",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_21', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_21\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_21\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-21",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_21' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_21', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_21(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-21",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_21' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_21 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-21",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.21' is defined in application.properties as 210, in JVM properties as 260, and as an OS environment variable as 310, what value is resolved?",
    "options": [
      "310 (OS Environment variables take highest precedence)",
      "260 (JVM system properties override OS environment variables and properties files)",
      "210 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 260 is selected.",
    "codeSnippet": "@Value(\"${app.rate.21}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-21",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 121 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 121; }\n}"
  },
  {
    "id": "spring-quiz-t13-21",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_21\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_21\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-21",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_21'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_21 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-21",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_21' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_21' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_21.class)\n    public String handleDb(DatabaseException_21 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-21",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_21' and the database result when the method process() exits?",
    "options": [
      "The entity is in the detached state; no database updates occur.",
      "The entity is in the persistent state; the database is updated with balance 1210.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 0,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_21 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1210);\n}"
  },
  {
    "id": "spring-quiz-t17-21",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 11 and failureRateThreshold = 50%. If 7 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Once the sliding window registers 11 requests, Resilience4j calculates the failure rate. Since 7/11 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(11)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-21",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_21 primaryBean() { return new BeanVal_21(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_21.class)\n    public BeanVal_21 fallbackBean() { return new BeanVal_21(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-21",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_21'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 1,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_21 {\n    private String status;\n    public ResponseData_21(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-21",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-22",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_22 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-22",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_22' into a singleton controller 'AnalyticsController_22'. How does 'RequestTracker_22' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_22' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_22' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_22 {}\n\n@RestController\npublic class AnalyticsController_22 {\n    @Autowired\n    private RequestTracker_22 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-22",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_22.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-22",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_22' and 'BeanB_22'?",
    "options": [
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_22' nor 'BeanB_22' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_22 {\n    public BeanA_22(BeanB_22 b) {}\n}\n@Component\npublic class BeanB_22 {\n    public BeanB_22(BeanA_22 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-22",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 5 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "6 SQL queries.",
      "5 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 1,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (5 queries), resulting in 6 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 5 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-22",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-22",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_22' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_22 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_22 as a Spring @Component; Spring Security loads custom beans first.",
      "Use addFilterBefore(new CustomAuthFilter_22(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Declare CustomAuthFilter_22 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 2,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_22(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-22",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_22', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_22\") is injected, overriding @Primary."
    ],
    "correctOptionIndex": 3,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_22\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-22",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_22' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_22', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_22(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-22",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_22' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 0,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_22 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-22",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.22' is defined in application.properties as 220, in JVM properties as 270, and as an OS environment variable as 320, what value is resolved?",
    "options": [
      "270 (JVM system properties override OS environment variables and properties files)",
      "320 (OS Environment variables take highest precedence)",
      "220 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 270 is selected.",
    "codeSnippet": "@Value(\"${app.rate.22}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-22",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 122 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 1,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 122; }\n}"
  },
  {
    "id": "spring-quiz-t13-22",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_22\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_22\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-22",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_22'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_22 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-22",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_22' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_22' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_22.class)\n    public String handleDb(DatabaseException_22 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-22",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_22' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1220.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_22 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1220);\n}"
  },
  {
    "id": "spring-quiz-t17-22",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 12 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to OPEN state (failure rate is 67%, exceeding the 50% threshold).",
      "Transitions to HALF_OPEN state.",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 1,
    "explanation": "Once the sliding window registers 12 requests, Resilience4j calculates the failure rate. Since 8/12 (67%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(12)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-22",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_22 primaryBean() { return new BeanVal_22(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_22.class)\n    public BeanVal_22 fallbackBean() { return new BeanVal_22(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-22",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_22'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_22 {\n    private String status;\n    public ResponseData_22(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-22",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-23",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution.",
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_23 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-23",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_23' into a singleton controller 'AnalyticsController_23'. How does 'RequestTracker_23' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_23' is created for every HTTP request.",
      "The controller reuses the exact same instance of 'RequestTracker_23' injected at startup, behaving as a singleton.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_23 {}\n\n@RestController\npublic class AnalyticsController_23 {\n    @Autowired\n    private RequestTracker_23 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-23",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_23.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-23",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_23' and 'BeanB_23'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_23' nor 'BeanB_23' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_23 {\n    public BeanA_23(BeanB_23 b) {}\n}\n@Component\npublic class BeanB_23 {\n    public BeanB_23(BeanA_23 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-23",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 6 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "7 SQL queries.",
      "6 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 1,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (6 queries), resulting in 7 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 6 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-23",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 0,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-23",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_23' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_23 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Use addFilterBefore(new CustomAuthFilter_23(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Register CustomAuthFilter_23 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_23 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 1,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_23(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-23",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_23', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_23\") is injected, overriding @Primary.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 1,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_23\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-23",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_23' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_23', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_23(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-23",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_23' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods."
    ],
    "correctOptionIndex": 3,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_23 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-23",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.23' is defined in application.properties as 230, in JVM properties as 280, and as an OS environment variable as 330, what value is resolved?",
    "options": [
      "330 (OS Environment variables take highest precedence)",
      "280 (JVM system properties override OS environment variables and properties files)",
      "230 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 280 is selected.",
    "codeSnippet": "@Value(\"${app.rate.23}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-23",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 123 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 123; }\n}"
  },
  {
    "id": "spring-quiz-t13-23",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_23\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_23\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-23",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_23'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_23 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-23",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_23' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_23' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_23.class)\n    public String handleDb(DatabaseException_23 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-23",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_23' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1230.",
      "An EntityNotFoundException is thrown during detach.",
      "The entity is in the detached state; no database updates occur.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 2,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_23 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1230);\n}"
  },
  {
    "id": "spring-quiz-t17-23",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 13 and failureRateThreshold = 50%. If 8 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 62%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 13 requests, Resilience4j calculates the failure rate. Since 8/13 (62%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(13)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-23",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_23 primaryBean() { return new BeanVal_23(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_23.class)\n    public BeanVal_23 fallbackBean() { return new BeanVal_23(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-23",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_23'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 2,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_23 {\n    private String status;\n    public ResponseData_23(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-23",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-24",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_24 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-24",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_24' into a singleton controller 'AnalyticsController_24'. How does 'RequestTracker_24' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_24' is created for every HTTP request.",
      "The controller reuses the exact same instance of 'RequestTracker_24' injected at startup, behaving as a singleton.",
      "Spring throws a ScopeMismatchException during startup.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_24 {}\n\n@RestController\npublic class AnalyticsController_24 {\n    @Autowired\n    private RequestTracker_24 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-24",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The transaction is automatically rolled back for all exceptions.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_24.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-24",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_24' and 'BeanB_24'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The application fails to start and throws a BeanCurrentlyInCreationException.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null."
    ],
    "correctOptionIndex": 1,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_24' nor 'BeanB_24' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_24 {\n    public BeanA_24(BeanB_24 b) {}\n}\n@Component\npublic class BeanB_24 {\n    public BeanB_24(BeanA_24 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-24",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 7 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "8 SQL queries.",
      "1 SQL query.",
      "7 SQL queries.",
      "2 SQL queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (7 queries), resulting in 8 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 7 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-24",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-24",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_24' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Annotate CustomAuthFilter_24 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_24 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_24 inside application.properties under security.filter.order.",
      "Use addFilterBefore(new CustomAuthFilter_24(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config."
    ],
    "correctOptionIndex": 3,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_24(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-24",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_24', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_24\") is injected, overriding @Primary.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 2,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_24\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-24",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_24' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_24', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_24(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-24",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_24' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The application throws a ClassCastException during method call.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 1,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_24 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-24",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.24' is defined in application.properties as 240, in JVM properties as 290, and as an OS environment variable as 340, what value is resolved?",
    "options": [
      "290 (JVM system properties override OS environment variables and properties files)",
      "340 (OS Environment variables take highest precedence)",
      "240 (application.properties overrides all external configurations)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 290 is selected.",
    "codeSnippet": "@Value(\"${app.rate.24}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-24",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 124 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 2,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 124; }\n}"
  },
  {
    "id": "spring-quiz-t13-24",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_24\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_24\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-24",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_24'?",
    "options": [
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 2,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_24 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-24",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_24' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_24' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_24.class)\n    public String handleDb(DatabaseException_24 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-24",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_24' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1240.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance.",
      "The entity is in the detached state; no database updates occur."
    ],
    "correctOptionIndex": 3,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_24 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1240);\n}"
  },
  {
    "id": "spring-quiz-t17-24",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 14 and failureRateThreshold = 50%. If 9 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 64%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 14 requests, Resilience4j calculates the failure rate. Since 9/14 (64%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(14)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-24",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered."
    ],
    "correctOptionIndex": 3,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_24 primaryBean() { return new BeanVal_24(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_24.class)\n    public BeanVal_24 fallbackBean() { return new BeanVal_24(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-24",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_24'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 0,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_24 {\n    private String status;\n    public ResponseData_24(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-24",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "spring-quiz-t1-25",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "In the service below, orderProcessor() is invoked from an external REST controller. What is the transactional behavior of saveOrder()?",
    "options": [
      "No transaction starts, because self-invocation bypasses the Spring AOP proxy.",
      "Spring starts a new transaction automatically using aspect interception.",
      "The application throws a CircularDependencyException at startup.",
      "A TransactionRequiredException is thrown during execution."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's declarative annotations rely on AOP proxy wrappers. Method calls from outside go through the proxy, running transaction interceptors. Direct internal calls (self-invocation) run directly on the target object, bypassing the proxy and annotations.",
    "codeSnippet": "@Service\npublic class OrderService_25 {\n    public void orderProcessor() {\n        saveOrder(); // Self-invocation\n    }\n\n    @Transactional\n    public void saveOrder() {\n        // Save database record\n    }\n}"
  },
  {
    "id": "spring-quiz-t2-25",
    "topic": "Spring Core & Scopes",
    "difficulty": "hard",
    "questionText": "You inject a prototype-scoped bean 'RequestTracker_25' into a singleton controller 'AnalyticsController_25'. How does 'RequestTracker_25' behave across multiple HTTP requests?",
    "options": [
      "A new instance of 'RequestTracker_25' is created for every HTTP request.",
      "Spring throws a ScopeMismatchException during startup.",
      "The controller reuses the exact same instance of 'RequestTracker_25' injected at startup, behaving as a singleton.",
      "The application fails to start because prototype beans cannot be injected into singletons."
    ],
    "correctOptionIndex": 2,
    "explanation": "Because the controller is a singleton, it is initialized once. Consequently, its fields are injected once. The prototype-scoped bean is instantiated during this injection, and that same instance is shared for all requests. To resolve, use scoped proxies.",
    "codeSnippet": "@Scope(\"prototype\")\n@Component\npublic class RequestTracker_25 {}\n\n@RestController\npublic class AnalyticsController_25 {\n    @Autowired\n    private RequestTracker_25 tracker;\n}"
  },
  {
    "id": "spring-quiz-t3-25",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If a transaction method throws an Exception (checked exception) during database operations, what is the default rollback behavior?",
    "options": [
      "The transaction is automatically rolled back for all exceptions.",
      "The transaction is committed, and changes are saved because checked exceptions do not trigger rollback by default.",
      "The compiler throws an error because Transactional cannot declare checked throws.",
      "The transaction rolls back, but only if the database isolation is SERIALIZABLE."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's @Transactional default configuration rolls back transactions only for unchecked exceptions (subclasses of RuntimeException and Error). Checked exceptions (like Exception, IOException) do not trigger rollback unless configured as @Transactional(rollbackFor = Exception.class).",
    "codeSnippet": "@Transactional\npublic void process(User user) throws Exception {\n    UserRepo_25.save(user);\n    if (user.getName() == null) {\n        throw new Exception(\"Invalid User\");\n    }\n}"
  },
  {
    "id": "spring-quiz-t4-25",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "What occurs when Spring starts up and detects a circular constructor dependency between singleton beans 'BeanA_25' and 'BeanB_25'?",
    "options": [
      "Spring automatically resolves the cycle by injecting a dynamic proxy.",
      "The JVM crashes with a StackOverflowError during initialization.",
      "Spring instantiates both beans as null.",
      "The application fails to start and throws a BeanCurrentlyInCreationException."
    ],
    "correctOptionIndex": 3,
    "explanation": "Unlike setter/field injection, constructor dependencies must be resolved during object creation. Since neither 'BeanA_25' nor 'BeanB_25' can be constructed without the other, Spring cannot resolve the dependency cycle and throws a BeanCurrentlyInCreationException.",
    "codeSnippet": "@Component\npublic class BeanA_25 {\n    public BeanA_25(BeanB_25 b) {}\n}\n@Component\npublic class BeanB_25 {\n    public BeanB_25(BeanA_25 a) {}\n}"
  },
  {
    "id": "spring-quiz-t5-25",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "An entity has a lazy-loaded collection association. If you fetch all 3 parent entities and access their associations in a loop, how many SQL queries hit the database?",
    "options": [
      "1 SQL query.",
      "3 SQL queries.",
      "2 SQL queries.",
      "4 SQL queries."
    ],
    "correctOptionIndex": 3,
    "explanation": "This is the N+1 query problem. The initial query fetches the parents (1 query). When accessing the lazy collection for each parent in the loop, Hibernate sends a separate select query per parent (3 queries), resulting in 4 queries.",
    "codeSnippet": "List<Parent> parents = parentRepository.findAll(); // Fetches 3 parents\nfor (Parent p : parents) {\n    System.out.println(p.getChildren().size()); // Lazy load\n}"
  },
  {
    "id": "spring-quiz-t6-25",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "What is the hazard of calling a blocking method like RestTemplate inside a Spring WebFlux controller running on Netty event loops?",
    "options": [
      "WebFlux automatically shifts the call to virtual threads to avoid blocking.",
      "The controller immediately throws a BlockedEventLoopException during compilation.",
      "It blocks the Netty EventLoop thread, reducing server capacity to process concurrent requests and causing starvation.",
      "It causes a deadlock because Netty restricts HTTP requests."
    ],
    "correctOptionIndex": 2,
    "explanation": "WebFlux uses a small number of non-blocking event loop threads. Blocking operations on these threads exhaust the pool and block the server from handling other connections. Offload blocking logic using subscribeOn(Schedulers.boundedElastic()).",
    "codeSnippet": "@GetMapping(\"/data\")\npublic Mono<String> getData() {\n    return Mono.fromCallable(() -> restTemplate.getForObject(\"https://api.com\", String.class));\n}"
  },
  {
    "id": "spring-quiz-t7-25",
    "topic": "Spring Security",
    "difficulty": "medium",
    "questionText": "How do you insert a custom filter 'CustomAuthFilter_25' in a security chain so it executes before UsernamePasswordAuthenticationFilter?",
    "options": [
      "Use addFilterBefore(new CustomAuthFilter_25(), UsernamePasswordAuthenticationFilter.class) inside HttpSecurity config.",
      "Annotate CustomAuthFilter_25 with @Order(Ordered.HIGHEST_PRECEDENCE).",
      "Register CustomAuthFilter_25 as a Spring @Component; Spring Security loads custom beans first.",
      "Declare CustomAuthFilter_25 inside application.properties under security.filter.order."
    ],
    "correctOptionIndex": 0,
    "explanation": "The order of filters inside a SecurityFilterChain is explicitly configured via HttpSecurity APIs. Class-level @Order annotations do not position filters within the SecurityFilterChain.",
    "codeSnippet": "@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    http.addFilterBefore(new CustomAuthFilter_25(), UsernamePasswordAuthenticationFilter.class);\n    return http.build();\n}"
  },
  {
    "id": "spring-quiz-t8-25",
    "topic": "Spring Core",
    "difficulty": "medium",
    "questionText": "If a payment service interface has a default bean marked with @Primary, and another bean with qualifier 'customPaymentSvc_25', what is injected?",
    "options": [
      "The @Primary bean is injected because primary beans take highest precedence.",
      "The bean annotated with @Qualifier(\"customPaymentSvc_25\") is injected, overriding @Primary.",
      "A BeanCreationException is thrown due to injection ambiguity.",
      "Both beans are injected inside a wrapper candidate proxy."
    ],
    "correctOptionIndex": 1,
    "explanation": "While @Primary sets a default candidate, an explicit @Qualifier specifies the precise bean name requested. Explicit qualifiers take precedence over primary bean designations.",
    "codeSnippet": "@RestController\npublic class PaymentController {\n    @Autowired\n    @Qualifier(\"customPaymentSvc_25\")\n    private PaymentService service;\n}"
  },
  {
    "id": "spring-quiz-t9-25",
    "topic": "Spring Data JPA",
    "difficulty": "medium",
    "questionText": "If you specify a derived query method using property name 'emailAddress_25' which is missing on the Entity, what happens?",
    "options": [
      "The query executes but returns an empty list at runtime.",
      "Spring Data fallback parses it to a native SQL query.",
      "A compile-time error occurs on the repository interface.",
      "Spring Boot throws a PropertyReferenceException and fails to start during application context initialization."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring Data JPA parses derived query methods at application startup to validate them against the Entity's properties. If a method references a missing field like 'emailAddress_25', it throws a PropertyReferenceException and halts startup.",
    "codeSnippet": "public interface UserRepository extends JpaRepository<User, Long> {\n    List<User> findByemailAddress_25(String email); // Entity field is 'email'\n}"
  },
  {
    "id": "spring-quiz-t10-25",
    "topic": "Spring Core & AOP",
    "difficulty": "hard",
    "questionText": "What happens if you apply @Transactional to a final method inside bean class 'DataFetcher_25' proxied by Spring AOP CGLIB subclassing?",
    "options": [
      "Spring throws a FinalMethodAopException at startup.",
      "The application throws a ClassCastException during method call.",
      "The transaction aspect is bypassed silently because CGLIB creates a subclass and cannot override final methods.",
      "The JVM crashes at runtime when calling the final method."
    ],
    "correctOptionIndex": 2,
    "explanation": "CGLIB creates proxies by generating a dynamic subclass at runtime. Because final methods cannot be overridden by subclasses, the generated proxy class cannot insert aspect interceptor code. The final method runs directly, bypassing the aspect.",
    "codeSnippet": "public class DataFetcher_25 {\n    @Transactional\n    public final void loadData() {\n        // DB changes\n    }\n}"
  },
  {
    "id": "spring-quiz-t11-25",
    "topic": "Spring Boot Configurations",
    "difficulty": "medium",
    "questionText": "If 'app.rate.25' is defined in application.properties as 250, in JVM properties as 300, and as an OS environment variable as 350, what value is resolved?",
    "options": [
      "350 (OS Environment variables take highest precedence)",
      "250 (application.properties overrides all external configurations)",
      "300 (JVM system properties override OS environment variables and properties files)",
      "It throws a property resolution error due to conflict"
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring Boot property sources order: 1) Command-line args, 2) JVM System properties (-D...), 3) OS environment variables, 4) application.properties. Thus, the JVM value of 300 is selected.",
    "codeSnippet": "@Value(\"${app.rate.25}\")\nprivate int rate;"
  },
  {
    "id": "spring-quiz-t12-25",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "medium",
    "questionText": "How does the integer phase value 125 returned by getPhase() in SmartLifecycle affect context startup and shutdown order?",
    "options": [
      "Beans with lower phase numbers are started first. During shutdown, beans with higher phase numbers are stopped first.",
      "Beans with higher phase numbers are started first and stopped last.",
      "The phase determines the priority thread pool, where higher phase means more threads.",
      "SmartLifecycle beans start concurrently and ignore the phase value."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle defines getPhase() to resolve dependency execution order: lower phase numbers start first (e.g. databases, dependencies) and stop last. Shutdown goes in reverse, stopping higher phase numbers first.",
    "codeSnippet": "public class CustomService implements SmartLifecycle {\n    @Override\n    public int getPhase() { return 125; }\n}"
  },
  {
    "id": "spring-quiz-t13-25",
    "topic": "Spring Caching",
    "difficulty": "hard",
    "questionText": "Why does the cache eviction fail under the configuration below?",
    "options": [
      "Because cache names must be different.",
      "Because evictUser() returns void.",
      "Because CacheEvict requires @Transactional to run.",
      "Because evictUser() does not define a key, causing Spring to use SimpleKeyGenerator on '#id' while getUser() keys on '#id', resulting in mismatch."
    ],
    "correctOptionIndex": 3,
    "explanation": "By default, key generation combines all method arguments. For getUser(), the key combines id and ctx, but key='#id' overrides it to 'id'. For evictUser(), the key defaults to 'id' as well, but if arguments mismatch in key structure, we must explicitly set key='#id' in both to prevent cache desync.",
    "codeSnippet": "@Cacheable(value = \"users_cache_25\", key = \"#id\")\npublic User getUser(Long id, Context ctx) { ... }\n\n@CacheEvict(value = \"users_cache_25\")\npublic void evictUser(Long id) { ... }"
  },
  {
    "id": "spring-quiz-t14-25",
    "topic": "Spring Core & Bean Lifecycle",
    "difficulty": "hard",
    "questionText": "What is the runtime impact of performing a blocking/long-running task inside the @PostConstruct method of 'SetupBean_25'?",
    "options": [
      "It blocks the main startup thread, preventing the application context from finishing initialization and starting the web server.",
      "It triggers an asynchronous thread pool execution and continues startup.",
      "Spring immediately throws an InitializationTimeoutException.",
      "The JVM runs the method in the background without affecting startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "@PostConstruct methods are executed synchronously during bean instantiation on the main thread. If a bean blocks in @PostConstruct, application context startup halts, blocking the web server (Tomcat) from starting. Use events or Async tasks instead.",
    "codeSnippet": "@Component\npublic class SetupBean_25 {\n    @PostConstruct\n    public void init() {\n        // Blocks on network/external server call\n        loadConfiguration();\n    }\n}"
  },
  {
    "id": "spring-quiz-t15-25",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "If a controller throws a 'DatabaseException_25' (which extends RuntimeException), which ExceptionHandler method inside ControllerAdvice is invoked?",
    "options": [
      "handleRuntime(), because RuntimeException is checked first as the parent class.",
      "Both methods run in sequence.",
      "Spring throws an ExceptionHandlerAmbiguityException at startup.",
      "handleDb(), because it is mapped to the most specific exception type matching the exception thrown."
    ],
    "correctOptionIndex": 3,
    "explanation": "Spring's exception resolver resolves to the exception handler that maps to the most specific exception in the type hierarchy. Since 'DatabaseException_25' matches the thrown exception exactly, handleDb() is preferred over handleRuntime().",
    "codeSnippet": "@ControllerAdvice\npublic class GlobalHandler {\n    @ExceptionHandler(RuntimeException.class)\n    public String handleRuntime(RuntimeException ex) { return \"Runtime\"; }\n\n    @ExceptionHandler(DatabaseException_25.class)\n    public String handleDb(DatabaseException_25 ex) { return \"Db\"; }\n}"
  },
  {
    "id": "spring-quiz-t16-25",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "What is the state of entity 'Account_25' and the database result when the method process() exits?",
    "options": [
      "The entity is in the persistent state; the database is updated with balance 1250.",
      "The entity is in the detached state; no database updates occur.",
      "An EntityNotFoundException is thrown during detach.",
      "Hibernate throws a LazyInitializationException when setting the balance."
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling entityManager.detach(entity) removes the entity from the Persistence Context. It changes from 'persistent' to 'detached' state. Hibernate no longer tracks modifications, so the balance change is not flushed to the database.",
    "codeSnippet": "@Transactional\npublic void process(Long id) {\n    Account_25 acc = repository.findById(id).orElseThrow();\n    entityManager.detach(acc);\n    acc.setBalance(1250);\n}"
  },
  {
    "id": "spring-quiz-t17-25",
    "topic": "Spring Cloud & Resilience",
    "difficulty": "medium",
    "questionText": "A Resilience4j Circuit Breaker has slidingWindowSize = 10 and failureRateThreshold = 50%. If 6 requests fail within the sliding window, what is the state transition?",
    "options": [
      "Remains in CLOSED state because the sliding window must exceed capacity.",
      "Transitions to HALF_OPEN state.",
      "Transitions to OPEN state (failure rate is 60%, exceeding the 50% threshold).",
      "Throws a CircuitBreakerOpenException immediately."
    ],
    "correctOptionIndex": 2,
    "explanation": "Once the sliding window registers 10 requests, Resilience4j calculates the failure rate. Since 6/10 (60%) is greater than or equal to 50%, the Circuit Breaker transitions to the OPEN state.",
    "codeSnippet": "CircuitBreakerConfig config = CircuitBreakerConfig.custom()\n    .slidingWindowSize(10)\n    .failureRateThreshold(50)\n    .build();"
  },
  {
    "id": "spring-quiz-t18-25",
    "topic": "Spring Boot Internals",
    "difficulty": "hard",
    "questionText": "Inside a single configuration class, what determines the registration order of beans and the result of @ConditionalOnMissingBean?",
    "options": [
      "fallbackBean overrides primaryBean because @ConditionalOnMissingBean forces precedence.",
      "Bean methods are registered in order of definition. primaryBean() registers first, causing fallbackBean()'s conditional check to fail. Only primaryBean is registered.",
      "Both beans are registered, creating an array list injection candidate.",
      "Spring throws a BeanDefinitionOverrideException during startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Within a single configuration class, beans are parsed and registered sequentially. Since primaryBean() is defined first, its bean exists when fallbackBean() is evaluated. The conditional check fails, and fallbackBean() is skipped.",
    "codeSnippet": "@Configuration\npublic class AppConfig {\n    @Bean\n    public BeanVal_25 primaryBean() { return new BeanVal_25(\"A\"); }\n\n    @Bean\n    @ConditionalOnMissingBean(BeanVal_25.class)\n    public BeanVal_25 fallbackBean() { return new BeanVal_25(\"B\"); }\n}"
  },
  {
    "id": "spring-quiz-t19-25",
    "topic": "Spring MVC",
    "difficulty": "medium",
    "questionText": "A controller returns an instance of 'ResponseData_25'. If fields are private and no getters are defined, what is the HTTP response behavior?",
    "options": [
      "HTTP 500 error or exception (Jackson throws an InvalidDefinitionException: No serializer found).",
      "HTTP 200 with JSON payload {\"status\":null}.",
      "HTTP 200 with JSON payload {\"status\":\"...\"} using reflection.",
      "The code fails to compile because classes returned from RestController require getters."
    ],
    "correctOptionIndex": 0,
    "explanation": "Jackson (Spring Boot's default serializer) uses public getter methods to discover properties to write to JSON. If fields are private and no getters/setters/annotations are present, Jackson throws an exception, resulting in an HTTP 500.",
    "codeSnippet": "public class ResponseData_25 {\n    private String status;\n    public ResponseData_25(String status) { this.status = status; }\n    // No getters\n}"
  },
  {
    "id": "spring-quiz-t20-25",
    "topic": "Spring Data JPA",
    "difficulty": "hard",
    "questionText": "If outerMethod() is marked as @Transactional and invokes nestedMethod() which is marked as @Transactional(propagation = Propagation.NESTED), what happens to DB updates if nestedMethod() fails and throws an exception caught inside outerMethod()?",
    "options": [
      "The entire transaction is rolled back because the outer method was marked as Transactional.",
      "Only nestedMethod()'s updates are rolled back to the savepoint; outerMethod()'s updates can still commit successfully.",
      "nestedMethod()'s updates are committed because the exception was caught in the outer method.",
      "Spring throws a NestedTransactionNotSupportedException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.NESTED creates a nested transaction using database savepoints. If the nested transaction fails and its exception is caught and handled inside the outer transaction, only the nested transaction rolls back to its savepoint. The outer transaction remains valid.",
    "codeSnippet": "@Transactional\npublic void outerMethod() {\n    try {\n        innerService.nestedMethod();\n    } catch (Exception e) {\n        // Exception caught\n    }\n    // Save other data\n}"
  },
  {
    "id": "sb-quiz-adv-1",
    "topic": "Spring Boot 3.2+ Virtual Threads",
    "difficulty": "medium",
    "questionText": "When you enable 'spring.threads.virtual.enabled=true' in a Spring Boot 3.2+ application running Tomcat, how does the web server handle incoming HTTP request threads?",
    "options": [
      "Tomcat replaces its fixed-size platform thread pool with an executor that spawns a new Virtual Thread for every incoming HTTP request.",
      "Spring Boot converts all MVC controllers into WebFlux reactive Mono/Flux streams automatically at startup.",
      "Tomcat disables HTTP keep-alive connections and forces single-threaded synchronous processing.",
      "Spring Boot compiles the application to a GraalVM native binary prior to starting Tomcat."
    ],
    "correctOptionIndex": 0,
    "explanation": "Setting 'spring.threads.virtual.enabled=true' in Spring Boot 3.2+ instructs embedded web servers (Tomcat/Jetty) to use Java 21 Virtual Threads for handling incoming HTTP requests. Each request gets its own lightweight virtual thread.",
    "codeSnippet": "# application.properties\nspring.threads.virtual.enabled=true"
  },
  {
    "id": "sb-quiz-adv-2",
    "topic": "Spring Data JPA & N+1 Problem",
    "difficulty": "hard",
    "questionText": "You have an Order entity with `@OneToMany(fetch = FetchType.LAZY) List<OrderItem> items`. Querying 100 Orders and accessing `order.getItems()` in a loop executes 101 SQL queries (N+1 problem). What is the most idiomatic Spring Data JPA solution?",
    "options": [
      "Use @EntityGraph(attributePaths = {\"items\"}) or JOIN FETCH in JPQL to fetch Orders and OrderItems in a single SQL JOIN query.",
      "Change FetchType.LAZY to FetchType.EAGER on the @OneToMany annotation.",
      "Annotate the repository method with @Transactional(readOnly = true) to suppress SQL queries.",
      "Wrap the repository call inside a CompletableFuture.allOf() to run N queries in parallel."
    ],
    "correctOptionIndex": 0,
    "explanation": "@EntityGraph or JPQL 'JOIN FETCH' instructs Hibernate to perform an SQL JOIN, fetching the root entity and lazily annotated child collections in 1 query. Simply changing FetchType.EAGER does NOT solve N+1 (it still issues N+1 queries under SELECT fetching).",
    "codeSnippet": "@Entity\npublic class Order {\n    @OneToMany(fetch = FetchType.LAZY)\n    private List<OrderItem> items;\n}\n\npublic interface OrderRepository extends JpaRepository<Order, Long> {\n    @EntityGraph(attributePaths = {\"items\"})\n    List<Order> findAll();\n}"
  },
  {
    "id": "sb-quiz-adv-3",
    "topic": "Spring Transaction Management",
    "difficulty": "hard",
    "questionText": "Method A() in `@Service` has `@Transactional`. It calls Method B() in the SAME class which has `@Transactional(propagation = Propagation.REQUIRES_NEW)`. What happens to Method B's transaction?",
    "options": [
      "Method B runs inside Method A's existing transaction because Spring AOP proxies are bypassed during internal self-invocations (this.methodB()).",
      "Method B pauses Method A's transaction and creates a new independent database transaction.",
      "Spring throws an IllegalTransactionStateException at runtime during startup.",
      "Method B executes without any database transaction."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring `@Transactional` works via AOP proxies. Calling `methodB()` directly from `methodA()` inside the same class uses `this.methodB()`, bypassing the Spring AOP proxy. As a result, `REQUIRES_NEW` is ignored and methodB runs in methodA's transaction.",
    "codeSnippet": "@Service\npublic class OrderService {\n    @Transactional\n    public void methodA() {\n        // ...\n        methodB(); // internal call in same class\n    }\n\n    @Transactional(propagation = Propagation.REQUIRES_NEW)\n    public void methodB() {\n        // ...\n    }\n}"
  },
  {
    "id": "sb-quiz-adv-4",
    "topic": "Spring WebFlux & Reactor Backpressure",
    "difficulty": "hard",
    "questionText": "In Spring WebFlux, what mechanism prevents a fast reactive producer from overwhelming a slow downstream consumer with unbuffered items?",
    "options": [
      "Reactive Streams Backpressure: the subscriber requests N items from the publisher via Subscription.request(n) when ready.",
      "The JVM automatically pauses the producer's CPU thread using Thread.yield().",
      "Reactor buffers all 1,000,000 items in heap RAM and drops items when RAM exceeds 90%.",
      "The underlying Netty event loop throws an OverflowBufferException."
    ],
    "correctOptionIndex": 0,
    "explanation": "Reactive Streams specification defines subscriber-driven Backpressure. Consumers request data by signaling `Subscription.request(n)`. Publishers send at most N items until the consumer requests more, preventing buffer overflows.",
    "codeSnippet": "Flux.range(1, 1000000)\n    .limitRate(100)\n    .subscribe(new BaseSubscriber<Integer>() {\n        // ...\n    });"
  },
  {
    "id": "sb-quiz-adv-5",
    "topic": "Spring Boot Auto-Configuration",
    "difficulty": "medium",
    "questionText": "How does Spring Boot resolve `@ConditionalOnMissingBean(DataSource.class)` during auto-configuration bootstrap?",
    "options": [
      "If the user has already defined a custom DataSource @Bean, Spring Boot skips creation of the default HikariDataSource bean.",
      "Spring Boot creates both DataSource beans and primary auto-wire fails with NoUniqueBeanDefinitionException.",
      "Spring Boot overrides the user custom DataSource bean with its default HikariDataSource.",
      "The annotation causes Spring Boot to throw a BeanCreationException if no DataSource exists."
    ],
    "correctOptionIndex": 0,
    "explanation": "`@ConditionalOnMissingBean` ensures user-defined beans take priority. If Spring context already contains a bean matching the type (DataSource), the auto-configuration bean definition is skipped.",
    "codeSnippet": "@AutoConfiguration\npublic class DataSourceAutoConfiguration {\n    @Bean\n    @ConditionalOnMissingBean\n    public DataSource dataSource() {\n        return new HikariDataSource();\n    }\n}"
  },
  {
    "id": "sb-quiz-auto-506",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "How does Spring WebFlux handle blocking JDBC calls without starving the Netty event loop thread pool? (Variant #506)",
    "options": [
      "By offloading the blocking JDBC call to Schedulers.boundedElastic(), executing it on a dedicated thread pool.",
      "By pausing the Netty event loop thread until the SQL query completes.",
      "By compiling JDBC drivers into non-blocking R2DBC drivers automatically.",
      "By throwing a BlockingOperationException at startup."
    ],
    "correctOptionIndex": 0,
    "explanation": "Netty event loops should never be blocked. Offloading blocking I/O (like legacy JDBC) to `Schedulers.boundedElastic()` keeps Netty threads free to handle non-blocking HTTP I/O.",
    "codeSnippet": "@GetMapping(\"/orders\")\npublic Flux<OrderDto> getOrders() {\n    return Flux.defer(() -> Flux.fromIterable(orderRepo.findAll()))\n               .subscribeOn(Schedulers.boundedElastic());\n}"
  },
  {
    "id": "sb-quiz-auto-507",
    "topic": "Spring Boot Core",
    "difficulty": "medium",
    "questionText": "What is the function of @Configuration(proxyBeanMethods = false) in Spring Boot 3+? (Variant #507)",
    "options": [
      "Disables @Bean annotation processing completely.",
      "Disables CGLIB proxy generation for the @Configuration class, reducing startup time and RAM when inter-bean method calls are not needed.",
      "Forces Spring to instantiate all beans as prototype scope.",
      "Prevents spring-boot-starter-web from launching Tomcat."
    ],
    "correctOptionIndex": 1,
    "explanation": "Setting `proxyBeanMethods = false` (Lite mode) avoids generating CGLIB bytecode proxies. `@Bean` methods execute as plain Java methods without intercepting inter-bean calls.",
    "codeSnippet": "@Configuration(proxyBeanMethods = false)\npublic class AppConfig {\n    @Bean public ServiceA serviceA() { return new ServiceA(); }\n}"
  },
  {
    "id": "sb-quiz-auto-508",
    "topic": "Spring WebFlux",
    "difficulty": "hard",
    "questionText": "How does Spring WebFlux handle blocking JDBC calls without starving the Netty event loop thread pool? (Variant #508)",
    "options": [
      "By pausing the Netty event loop thread until the SQL query completes.",
      "By offloading the blocking JDBC call to Schedulers.boundedElastic(), executing it on a dedicated thread pool.",
      "By compiling JDBC drivers into non-blocking R2DBC drivers automatically.",
      "By throwing a BlockingOperationException at startup."
    ],
    "correctOptionIndex": 1,
    "explanation": "Netty event loops should never be blocked. Offloading blocking I/O (like legacy JDBC) to `Schedulers.boundedElastic()` keeps Netty threads free to handle non-blocking HTTP I/O.",
    "codeSnippet": "@GetMapping(\"/orders\")\npublic Flux<OrderDto> getOrders() {\n    return Flux.defer(() -> Flux.fromIterable(orderRepo.findAll()))\n               .subscribeOn(Schedulers.boundedElastic());\n}"
  }
];
