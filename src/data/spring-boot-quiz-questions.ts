export interface QuizQuestion {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export const springBootQuestions: QuizQuestion[] = [
  {
    "id": "spring-core-1",
    "topic": "Spring Core & AOP",
    "questionText": "In Spring, which of the following best describes the difference between Constructor Injection and Setter Injection regarding dependency immutability?",
    "options": [
      "Constructor injection allows injecting immutable dependencies via final fields, whereas setter injection does not.",
      "Setter injection allows final fields to be initialized, whereas constructor injection is purely for optional dependencies.",
      "Both constructor and setter injection allow dependencies to be declared as final.",
      "Constructor injection is only used for circular dependencies, whereas setter injection prevents them."
    ],
    "correctOptionIndex": 0,
    "explanation": "Constructor injection is the recommended way to inject mandatory dependencies as it allows the fields to be declared as 'final', ensuring immutability. Setter injection cannot be used for 'final' fields since they must be initialized at object construction time."
  },
  {
    "id": "spring-core-2",
    "topic": "Spring Core & AOP",
    "questionText": "You have a Spring bean with a circular dependency issue between two singleton beans, Bean A and Bean B, which are using constructor injection. What is Spring's default behavior, and how can it be resolved without changing bean scopes?",
    "options": [
      "Spring throws a BeanCurrentlyInCreationException. It can be resolved by using @Lazy on one of the constructor parameters.",
      "Spring resolves circular dependencies automatically for all types of injection, including constructor injection.",
      "Spring will fail to start and the only way to resolve it is to switch the beans to prototype scope.",
      "Spring throws a CircularDependencyException. It can be resolved by declaring both beans as @Scope(\"prototype\")."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring can automatically resolve circular dependencies for setter or field injection in singleton beans using its three-level cache. However, for constructor injection, it cannot resolve it and throws a BeanCurrentlyInCreationException. Using @Lazy on one of the constructor injection points resolves this by injecting a lazy-resolution proxy instead of the fully initialized bean."
  },
  {
    "id": "spring-core-3",
    "topic": "Spring Core & AOP",
    "questionText": "Consider a scenario where a Singleton bean 'ReportService' needs to access a Prototype bean 'ReportGenerator' for each method invocation. If 'ReportGenerator' is injected using standard field injection via @Autowired, what will be the behavior?",
    "options": [
      "A new instance of ReportGenerator is created and injected on every call to ReportService methods.",
      "ReportService will hold a single, cached instance of ReportGenerator that was injected at creation time.",
      "Spring will throw a BeanCreationException due to scope mismatch.",
      "The prototype bean will behave as a singleton only if it is marked as @Lazy."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because ReportService is a singleton, it is only instantiated once. Consequently, its dependencies (including the prototype-scoped ReportGenerator) are also injected only once. Thus, the same ReportGenerator instance will be reused on subsequent method calls, defeating the purpose of the prototype scope. To resolve this, one must use method injection (like @Lookup) or retrieve it programmatically."
  },
  {
    "id": "spring-core-4",
    "topic": "Spring Core & AOP",
    "questionText": "Which annotation is used to specify that a bean should be injected based on a specific qualifier name when multiple beans of the same type exist in the context?",
    "options": [
      "@Primary",
      "@Qualifier",
      "@Resource",
      "@Named"
    ],
    "correctOptionIndex": 1,
    "explanation": "@Qualifier is used alongside @Autowired to resolve ambiguity when there are multiple beans of the same type by specifying the exact name of the bean to inject. @Primary is used on a bean definition to designate it as the default choice."
  },
  {
    "id": "spring-core-5",
    "topic": "Spring Core & AOP",
    "questionText": "If a class has multiple constructors, how does Spring decide which constructor to use for Dependency Injection when no @Autowired annotations are present?",
    "options": [
      "Spring will always use the default (no-argument) constructor if it exists.",
      "Spring will randomly choose one of the constructors.",
      "Spring will fail to start because @Autowired is mandatory for constructor injection if multiple constructors exist.",
      "Spring will choose the constructor with the maximum number of arguments that can be resolved."
    ],
    "correctOptionIndex": 0,
    "explanation": "If no constructor is annotated with @Autowired (or @Inject), Spring will look for the default (no-argument) constructor. If it is present, Spring will use it. If there is no default constructor and multiple parameterized constructors exist, Spring will throw a BeanCreationException unless one constructor is explicitly annotated."
  },
  {
    "id": "spring-core-6",
    "topic": "Spring Core & AOP",
    "questionText": "How does the @Resource annotation differ from @Autowired in Spring?",
    "options": [
      "@Resource is a Spring-proprietary annotation, whereas @Autowired is a standard JSR-250 annotation.",
      "@Resource performs dependency lookup by type first, then by name, whereas @Autowired resolves by name first.",
      "@Resource resolves dependencies by name first (defaulting to the field/property name), whereas @Autowired resolves by type first.",
      "@Resource only supports field injection, whereas @Autowired only supports constructor injection."
    ],
    "correctOptionIndex": 2,
    "explanation": "@Resource is a standard Java annotation (JSR-250/Jakarta EE) supported by Spring, which resolves dependencies by name first. If no bean matches the name, it falls back to type matching. Conversely, @Autowired is Spring-specific and resolves dependencies by type first, falling back to name matching (using @Qualifier or field/parameter names) if there are multiple matches."
  },
  {
    "id": "spring-core-7",
    "topic": "Spring Core & AOP",
    "questionText": "Under what condition is the @Autowired(required = false) property useful, and what is its default value?",
    "options": [
      "It makes injection optional; the default value is false.",
      "It makes injection optional; the default value is true.",
      "It allows injecting null if no bean of the matching type is found; the default value is true.",
      "It allows injecting a mock object if no bean of the matching type is found; the default value is false."
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, @Autowired has required = true, meaning Spring will fail to start if it cannot find a matching bean to inject. Setting required = false allows the application to start and injects null (or empty Optional/List) if the bean is missing."
  },
  {
    "id": "spring-core-8",
    "topic": "Spring Core & AOP",
    "questionText": "Which of the following is true regarding @Component vs @Bean in Spring?",
    "options": [
      "@Component is a class-level annotation scanned via classpath scanning, while @Bean is a method-level annotation used within @Configuration classes to register a bean.",
      "@Component is used for external libraries where source code is unavailable, while @Bean is used for local classes.",
      "@Bean automatically enables autowiring on the returned object, whereas @Component requires manual configuration.",
      "There is no difference; they are completely interchangeable aliases."
    ],
    "correctOptionIndex": 0,
    "explanation": "@Component is used for auto-detection and classpath scanning of custom classes. @Bean is used to explicitly declare a bean in a configuration class, which is especially useful when integrating third-party classes where you cannot modify the source code to add @Component."
  },
  {
    "id": "spring-core-9",
    "topic": "Spring Core & AOP",
    "questionText": "What is the correct execution order of the following lifecycle callbacks during the initialization phase of a Spring Bean?",
    "options": [
      "@PostConstruct method -> InitializingBean.afterPropertiesSet() -> Custom init-method (specified in @Bean(initMethod = \"...\"))",
      "InitializingBean.afterPropertiesSet() -> @PostConstruct method -> Custom init-method",
      "Custom init-method -> @PostConstruct method -> InitializingBean.afterPropertiesSet()",
      "@PostConstruct method -> Custom init-method -> InitializingBean.afterPropertiesSet()"
    ],
    "correctOptionIndex": 0,
    "explanation": "During the bean initialization phase, the callbacks run in this order: @PostConstruct annotated method first (handled by CommonAnnotationBeanPostProcessor), then InitializingBean's afterPropertiesSet() method, and finally the custom init-method defined via XML or @Bean(initMethod = \"...\")."
  },
  {
    "id": "spring-core-10",
    "topic": "Spring Core & AOP",
    "questionText": "Which bean post-processor is responsible for processing the @PostConstruct and @PreDestroy annotations in a Spring container?",
    "options": [
      "AutowiredAnnotationBeanPostProcessor",
      "CommonAnnotationBeanPostProcessor",
      "RequiredAnnotationBeanPostProcessor",
      "ConfigurationClassPostProcessor"
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostConstruct and @PreDestroy are JSR-250 annotations. They are processed by the CommonAnnotationBeanPostProcessor registered automatically by Spring."
  },
  {
    "id": "spring-core-11",
    "topic": "Spring Core & AOP",
    "questionText": "What is the primary difference between a BeanFactoryPostProcessor and a BeanPostProcessor in the Spring container lifecycle?",
    "options": [
      "BeanFactoryPostProcessor operates on the bean configuration metadata before any beans are instantiated, while BeanPostProcessor operates on the instantiated bean instances.",
      "BeanFactoryPostProcessor runs after beans are created, whereas BeanPostProcessor runs before beans are created.",
      "BeanFactoryPostProcessor is only used for prototype beans, whereas BeanPostProcessor is only for singleton beans.",
      "BeanFactoryPostProcessor modifies the runtime bean instances, while BeanPostProcessor modifies the XML/Java configuration files."
    ],
    "correctOptionIndex": 0,
    "explanation": "BeanFactoryPostProcessor executes first. It can read and modify the bean definition metadata (e.g., resolving property placeholders) before the container instantiates any beans (other than the BFPPs themselves). BeanPostProcessor operates on bean instances, allowing custom modifications before and after bean initialization callbacks."
  },
  {
    "id": "spring-core-12",
    "topic": "Spring Core & AOP",
    "questionText": "When does a Spring bean become eligible for destruction callbacks, and for which bean scopes does Spring NOT manage the destruction phase?",
    "options": [
      "Destruction happens when the context is closed; Spring does not execute destruction callbacks for prototype-scoped beans.",
      "Destruction happens when the GC runs; Spring does not execute destruction callbacks for singleton beans.",
      "Destruction happens when the bean is dereferenced; Spring does not execute destruction callbacks for request-scoped beans.",
      "Destruction happens when the context is closed; Spring manages destruction for all scopes including prototype."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring manages the full lifecycle of singleton beans, including their destruction when the application context is closed. However, for prototype-scoped beans, Spring instantiates, configures, and assembles the bean and hands it over to the client, but does not track it or call its destruction lifecycle methods. The client must clean up prototype beans."
  },
  {
    "id": "spring-core-13",
    "topic": "Spring Core & AOP",
    "questionText": "How can you programmatically receive notifications of the container's lifecycle events, such as when the context is started or stopped?",
    "options": [
      "Implement the SmartLifecycle interface or register an ApplicationListener for ContextRefreshedEvent / ContextClosedEvent.",
      "Implement the InitializingBean and DisposableBean interfaces.",
      "Annotate methods with @PostConstruct and @PreDestroy.",
      "Define custom init-method and destroy-method attributes."
    ],
    "correctOptionIndex": 0,
    "explanation": "SmartLifecycle and ApplicationListener (monitoring events like ContextStartedEvent, ContextStoppedEvent, ContextRefreshedEvent, etc.) allow beans to participate in container startup and shutdown phases. InitializingBean and @PostConstruct are for individual bean lifecycle phases, not the container's."
  },
  {
    "id": "spring-core-14",
    "topic": "Spring Core & AOP",
    "questionText": "Which Aware interface would you implement if a bean needs direct access to the ApplicationContext that created it?",
    "options": [
      "BeanNameAware",
      "BeanFactoryAware",
      "ApplicationContextAware",
      "EnvironmentAware"
    ],
    "correctOptionIndex": 2,
    "explanation": "Implementing ApplicationContextAware gives a bean access to the ApplicationContext object through the setApplicationContext method. (Note that @Autowired ApplicationContext is also widely used, but the Aware interface is the classic callback mechanism)."
  },
  {
    "id": "spring-core-15",
    "topic": "Spring Core & AOP",
    "questionText": "During bean instantiation, when does Spring inject dependencies via setters or fields relative to the Aware interface callbacks?",
    "options": [
      "Dependencies are injected after the Aware callbacks are executed.",
      "Dependencies are injected before the Aware callbacks are executed.",
      "Dependencies are injected simultaneously with Aware callbacks.",
      "Aware callbacks are executed before bean construction, and dependencies are injected after."
    ],
    "correctOptionIndex": 1,
    "explanation": "The sequence of bean creation is: 1) Instantiate bean, 2) Populate properties (inject dependencies), 3) Call Aware interfaces (e.g., BeanNameAware, BeanFactoryAware, ApplicationContextAware), 4) BeanPostProcessor pre-initialization, 5) Initialization callbacks (@PostConstruct, afterPropertiesSet, custom init), 6) BeanPostProcessor post-initialization."
  },
  {
    "id": "spring-core-16",
    "topic": "Spring Core & AOP",
    "questionText": "If a bean implements BeanPostProcessor, what is the default behavior if it returns null from postProcessBeforeInitialization or postProcessAfterInitialization?",
    "options": [
      "The initialization process is aborted, and a BeanCreationException is thrown.",
      "The bean instance becomes null in the application context, and other beans get a null reference.",
      "The post-processor behaves as a no-op, and Spring continues using the original bean instance.",
      "The bean is registered as a prototype bean instead."
    ],
    "correctOptionIndex": 2,
    "explanation": "According to the BeanPostProcessor contract in Spring, returning null from either of the post-process methods means that no modification was made to the bean, and the original bean instance will be passed down the chain."
  },
  {
    "id": "spring-core-17",
    "topic": "Spring Core & AOP",
    "questionText": "What is the significance of the @Configuration annotation's proxyBeanMethods attribute (introduced in Spring 5.2), and what is its default value?",
    "options": [
      "It defaults to true. When true, @Bean methods are proxied via CGLIB to ensure inter-bean references return the same singleton instance.",
      "It defaults to false. When false, it disables AOP proxying entirely for all beans declared within the configuration class.",
      "It defaults to true. When true, it prevents circular dependencies from being resolved.",
      "It defaults to false. When false, CGLIB proxying is used to optimize bean initialization speed."
    ],
    "correctOptionIndex": 0,
    "explanation": "proxyBeanMethods defaults to true (Full mode). In this mode, @Bean methods are proxied via CGLIB, so calling one @Bean method from another within the same configuration class returns the cached singleton bean instance rather than invoking the method again. Setting it to false (Lite mode) avoids proxy generation, which improves startup performance and reduces memory overhead, but inter-bean method calls behave like regular Java calls (returning new instances)."
  },
  {
    "id": "spring-core-18",
    "topic": "Spring Core & AOP",
    "questionText": "How can you import multiple configuration classes or XML configuration files into a main @Configuration class?",
    "options": [
      "Using @Import for Java configuration classes and @ImportResource for XML files.",
      "Using @ComponentScan for both Java and XML configurations.",
      "Using @PropertySource for both Java configurations and XML files.",
      "Using @EnableAutoConfiguration for Java configurations and @XmlRootElement for XML."
    ],
    "correctOptionIndex": 0,
    "explanation": "@Import allows you to load other @Configuration classes or components into the current context. @ImportResource is used to load legacy XML bean definition files."
  },
  {
    "id": "spring-core-19",
    "topic": "Spring Core & AOP",
    "questionText": "What happens if you define a bean with the same ID in both a Java @Configuration class and an XML configuration file, and both are loaded by the ApplicationContext?",
    "options": [
      "The application throws a ConflictingBeanDefinitionException during context startup.",
      "The XML bean definition will always override the Java-based configuration, regardless of the loading order.",
      "The overriding behavior depends on whether bean definition overriding is enabled, and typically the last processed definition overrides the previous ones.",
      "Both beans are instantiated, and Spring uses a qualifier to differentiate them automatically."
    ],
    "correctOptionIndex": 2,
    "explanation": "By default, Spring allows bean definition overriding. If enabled, the last processed bean definition overrides the earlier one. If disabled, a BeanDefinitionOverrideException is thrown at startup. (Note: in Spring Boot, overriding is disabled by default, but core Spring allows it by default)."
  },
  {
    "id": "spring-core-20",
    "topic": "Spring Core & AOP",
    "questionText": "Which annotation should you use to register a bean conditionally based on the presence of a specific system property or environment variable?",
    "options": [
      "@ConditionalOnExpression or @Conditional",
      "@DependsOn",
      "@Profile",
      "@Lazy"
    ],
    "correctOptionIndex": 0,
    "explanation": "@Conditional (along with custom Condition implementations) or specialized annotations like @ConditionalOnProperty / @ConditionalOnExpression allow conditional bean registration based on properties, environment variables, or other custom criteria."
  },
  {
    "id": "spring-core-21",
    "topic": "Spring Core & AOP",
    "questionText": "How does the @Profile annotation work behind the scenes in Spring's configuration?",
    "options": [
      "It uses the @Conditional annotation under the hood, checking if the specified profile(s) are active in the Environment.",
      "It dynamically parses XML configuration files at runtime.",
      "It modifies the JVM system properties to force-load specific classes.",
      "It compiles separate bytecode versions of the class for each profile."
    ],
    "correctOptionIndex": 0,
    "explanation": "@Profile is meta-annotated with @Conditional(ProfileCondition.class). The ProfileCondition class reads the active profiles from the Spring Environment and determines if the bean configuration should be registered."
  },
  {
    "id": "spring-core-22",
    "topic": "Spring Core & AOP",
    "questionText": "Which annotation is used to map a property file (e.g., app.properties) to the Spring Environment so that properties can be resolved via @Value?",
    "options": [
      "@PropertySource",
      "@ConfigFile",
      "@Resource",
      "@ValueSource"
    ],
    "correctOptionIndex": 0,
    "explanation": "@PropertySource is used to add property sources to Spring's Environment. Once added, values from the property file can be injected using @Value(\"${property.name}\")."
  },
  {
    "id": "spring-core-23",
    "topic": "Spring Core & AOP",
    "questionText": "In a Java configuration class, what is the role of the @Bean annotation's destroyMethod attribute, and what is its default value?",
    "options": [
      "It specifies the destruction method; the default value is '(inferred)', which automatically looks for public 'close' or 'shutdown' methods.",
      "It specifies the destruction method; the default value is empty, meaning no destruction method is called unless explicitly named.",
      "It specifies the method to call before garbage collection; the default value is 'finalize'.",
      "It registers a thread hook; the default value is 'destroy'."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, @Bean(destroyMethod = \"(inferred)\") is configured. This instructs Spring to look for public methods named 'close' or 'shutdown' on the bean class and execute them upon container destruction. To prevent this automatic destruction behavior, you must explicitly set @Bean(destroyMethod = \"\")."
  },
  {
    "id": "spring-core-24",
    "topic": "Spring Core & AOP",
    "questionText": "How can you declare that a configuration class or bean definition should only be loaded after another specific bean has been successfully created?",
    "options": [
      "Use the @DependsOn annotation.",
      "Use the @Order annotation.",
      "Use the @Priority annotation.",
      "Configure a BeanPostProcessor to re-order instantiation."
    ],
    "correctOptionIndex": 0,
    "explanation": "The @DependsOn annotation can be used on any class directly or indirectly annotated with @Component or on methods annotated with @Bean to force the initialization of one or more beans before the target bean is initialized."
  },
  {
    "id": "spring-core-25",
    "topic": "Spring Core & AOP",
    "questionText": "Which of the following features is supported by ApplicationContext but NOT by the basic BeanFactory interface?",
    "options": [
      "Constructor dependency injection",
      "Prototype and singleton scopes",
      "Application event publication (Event Handling) and internationalization (MessageSource)",
      "Registration of BeanPostProcessors"
    ],
    "correctOptionIndex": 2,
    "explanation": "ApplicationContext inherits from BeanFactory but adds enterprise-specific features such as message resolution (for internationalization/i18n via MessageSource), event publication (via ApplicationEventPublisher), resource loading, and automatic registration of BeanFactoryPostProcessor and BeanPostProcessor implementations."
  },
  {
    "id": "spring-core-26",
    "topic": "Spring Core & AOP",
    "questionText": "How do BeanFactory and ApplicationContext differ in terms of bean instantiation timing for singleton-scoped beans?",
    "options": [
      "BeanFactory instantiates singleton beans eagerly, while ApplicationContext instantiates them lazily.",
      "Both instantiate singleton beans eagerly by default.",
      "BeanFactory instantiates singleton beans lazily on demand (when getBean is called), while ApplicationContext instantiates them eagerly at startup.",
      "Both instantiate singleton beans lazily by default."
    ],
    "correctOptionIndex": 2,
    "explanation": "A basic BeanFactory instantiates singleton beans lazily (on demand when they are requested). In contrast, ApplicationContext pre-instantiates singleton beans eagerly at startup to fail-fast if there are configuration or instantiation issues."
  },
  {
    "id": "spring-core-27",
    "topic": "Spring Core & AOP",
    "questionText": "Which class is the most common implementation of ApplicationContext used for standalone Java applications configured via Java configuration classes?",
    "options": [
      "ClassPathXmlApplicationContext",
      "FileSystemXmlApplicationContext",
      "AnnotationConfigApplicationContext",
      "XmlWebApplicationContext"
    ],
    "correctOptionIndex": 2,
    "explanation": "AnnotationConfigApplicationContext is used for standalone applications that use Java configuration classes (annotated with @Configuration) and component scanning."
  },
  {
    "id": "spring-core-28",
    "topic": "Spring Core & AOP",
    "questionText": "If you want to prevent ApplicationContext from eagerly instantiating a specific singleton bean during startup, which annotation should you apply to the bean?",
    "options": [
      "@Scope(\"prototype\")",
      "@Lazy",
      "@Delay",
      "@Conditional"
    ],
    "correctOptionIndex": 1,
    "explanation": "The @Lazy annotation prevents eager initialization of a singleton bean during startup. Instead, the bean is created when it is first requested (either via dependency injection or direct lookup)."
  },
  {
    "id": "spring-core-29",
    "topic": "Spring Core & AOP",
    "questionText": "In Spring, which container hierarchy is typical for Web applications, and how do child contexts access beans from parent contexts?",
    "options": [
      "The parent context can access all beans of the child context, but the child cannot access the parent.",
      "A child context (e.g., dispatcher servlet) can access beans in the parent context (e.g., root WebApplicationContext), but the parent context cannot access beans in the child context.",
      "Parent and child contexts are completely isolated and cannot access each other's beans.",
      "Child and parent contexts share all beans bi-directionally without any restriction."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring supports hierarchical context structures. A child context inherits from a parent context. Therefore, beans inside the child context can look up and depend on beans in the parent context. However, the parent context does not have access to beans defined in the child context."
  },
  {
    "id": "spring-core-30",
    "topic": "Spring Core & AOP",
    "questionText": "Which method in the ConfigurableApplicationContext interface should be called to trigger the destruction of all singletons and clean up resources in a standalone application?",
    "options": [
      "stop()",
      "close()",
      "refresh()",
      "destroy()"
    ],
    "correctOptionIndex": 1,
    "explanation": "Calling close() on the ApplicationContext triggers the JVM shutdown hook (if registered via registerShutdownHook()), closes the application context, and destroys all singleton beans by calling their destruction callbacks."
  },
  {
    "id": "spring-core-31",
    "topic": "Spring Core & AOP",
    "questionText": "What are the two standard scopes available in any Spring container (including non-web environments), and what are the web-aware scopes?",
    "options": [
      "Standard: singleton and prototype. Web-aware: request, session, application, and websocket.",
      "Standard: singleton, prototype, and request. Web-aware: session and application.",
      "Standard: singleton and request. Web-aware: prototype, session, and application.",
      "Standard: singleton and global-session. Web-aware: prototype, request, and session."
    ],
    "correctOptionIndex": 0,
    "explanation": "Singleton and prototype scopes are available in any Spring container. The request, session, application, and websocket scopes are web-aware and are only available in a web-related ApplicationContext (like XmlWebApplicationContext)."
  },
  {
    "id": "spring-core-32",
    "topic": "Spring Core & AOP",
    "questionText": "What is the behavior of a prototype scoped bean when it is retrieved multiple times from the ApplicationContext?",
    "options": [
      "The container returns the exact same bean instance every time.",
      "The container returns a new instance of the bean every time it is requested.",
      "The container returns a new instance only if the previous instance was garbage collected.",
      "The container throws a ScopeException if it is requested more than once."
    ],
    "correctOptionIndex": 1,
    "explanation": "Prototype scope results in the creation of a new bean instance every time a request for that specific bean is made (via injection or context.getBean())."
  },
  {
    "id": "spring-core-33",
    "topic": "Spring Core & AOP",
    "questionText": "How can you inject a request-scoped bean into a singleton-scoped controller without converting the controller itself into a request scope?",
    "options": [
      "Declare the request-scoped bean with a proxy mode of target class or interface (using @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)).",
      "Annotate the request-scoped bean with @Lazy(false).",
      "Use field injection on the request-scoped bean in the controller.",
      "Use @Autowired with a @Qualifier on the controller."
    ],
    "correctOptionIndex": 0,
    "explanation": "Since the controller is a singleton, it is initialized once. If you inject a request-scoped bean directly, Spring will fail at startup or inject a static instance. By using a scoped proxy (proxyMode = ScopedProxyMode.TARGET_CLASS), Spring injects a thread-safe proxy that delegates method calls to the actual request-scoped bean instance associated with the current HTTP request."
  },
  {
    "id": "spring-core-34",
    "topic": "Spring Core & AOP",
    "questionText": "What is the primary difference between the session scope and the application scope in Spring Web MVC?",
    "options": [
      "Session scope creates a bean instance per HTTP Session, while Application scope creates a single bean instance for the lifecycle of the ServletContext (shared by all sessions).",
      "Session scope is shared by all users, while Application scope is restricted to a single user thread.",
      "Session scope is stored in the database, while Application scope is stored in the JVM heap.",
      "Application scope is equivalent to the singleton scope in all contexts."
    ],
    "correctOptionIndex": 0,
    "explanation": "Session scope binds a bean instance to the lifecycle of an HTTP Session. Application scope binds a bean instance to the lifecycle of the ServletContext (analogous to a singleton, but scoped at the servlet context level rather than the Spring context level)."
  },
  {
    "id": "spring-core-35",
    "topic": "Spring Core & AOP",
    "questionText": "You want to implement a custom scope in Spring. Which interface must you implement, and how do you register it with the container?",
    "options": [
      "Implement org.springframework.beans.factory.config.Scope and register it using ConfigurableBeanFactory.registerScope().",
      "Implement org.springframework.context.Lifecycle and register it using @Bean.",
      "Implement org.springframework.beans.factory.FactoryBean and register it in web.xml.",
      "Implement org.springframework.beans.factory.config.BeanPostProcessor and annotate it with @CustomScope."
    ],
    "correctOptionIndex": 0,
    "explanation": "Custom scopes require implementing the Scope interface (methods: get, remove, registerDestructionCallback, etc.). Once implemented, the scope must be registered programmatically on the bean factory using beanFactory.registerScope(\"scopeName\", new CustomScope()), typically done within a BeanFactoryPostProcessor or configuration step."
  },
  {
    "id": "spring-core-36",
    "topic": "Spring Core & AOP",
    "questionText": "What is the default scope of a bean in Spring if none is specified?",
    "options": [
      "prototype",
      "singleton",
      "request",
      "session"
    ],
    "correctOptionIndex": 1,
    "explanation": "The default bean scope in Spring is singleton."
  },
  {
    "id": "spring-core-37",
    "topic": "Spring Core & AOP",
    "questionText": "When using a prototype-scoped bean, does Spring manage the destruction of the bean, and does @PreDestroy get called when the application context is closed?",
    "options": [
      "Yes, Spring manages the destruction of all beans and calls @PreDestroy.",
      "No, Spring does not manage the destruction of prototype beans, and @PreDestroy is NOT called by the container.",
      "Yes, but only if the prototype bean is explicitly registered in XML.",
      "No, but @PreDestroy is called if the GC destroys the bean."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring does not track or manage the destruction of prototype-scoped beans. Consequently, any destruction callbacks (like @PreDestroy or DisposableBean.destroy()) are not invoked by the Spring container. The client code is responsible for cleaning up resources held by prototype beans."
  },
  {
    "id": "spring-core-38",
    "topic": "Spring Core & AOP",
    "questionText": "In a Spring Web application, what is the purpose of the RequestContextListener or RequestContextFilter in web.xml or Servlet configuration?",
    "options": [
      "They enable security filters for authentication.",
      "They expose HTTP request, session, and application scopes to Spring beans outside of Spring's DispatcherServlet.",
      "They map static resources to the classpath.",
      "They configure database connection pools."
    ],
    "correctOptionIndex": 1,
    "explanation": "When using web-scoped beans (request, session) outside Spring's DispatcherServlet (e.g., inside JSF or custom filters), you must declare RequestContextListener or RequestContextFilter in the web application configuration to expose the current request attributes."
  },
  {
    "id": "spring-core-39",
    "topic": "Spring Core & AOP",
    "questionText": "Which of the following is the correct SpEL syntax to access a property named 'dbPort' from a Spring bean named 'dbConfig' inside an @Value annotation?",
    "options": [
      "@Value(\"${dbConfig.dbPort}\")",
      "@Value(\"#{dbConfig.dbPort}\")",
      "@Value(\"#dbConfig.dbPort\")",
      "@Value(\"${dbConfig[dbPort]}\")"
    ],
    "correctOptionIndex": 1,
    "explanation": "In SpEL, bean references and property evaluation are denoted by the #{expression} syntax. A property of a bean is accessed via #{beanName.propertyName}. The ${property.name} syntax is used for property placeholder resolution, not SpEL."
  },
  {
    "id": "spring-core-40",
    "topic": "Spring Core & AOP",
    "questionText": "What is the purpose of the safe navigation operator (?.) in SpEL?",
    "options": [
      "It checks if a bean is initialized; if not, it initializes it.",
      "It prevents NullPointerException by returning null if the object before the operator is null.",
      "It evaluates an expression asynchronously in a separate thread.",
      "It compares two variables for null-safe equality."
    ],
    "correctOptionIndex": 1,
    "explanation": "SpEL's safe navigation operator ?. prevents a NullPointerException. If the object reference is null, the expression evaluates to null instead of throwing an exception (e.g., #{user?.address?.city})."
  },
  {
    "id": "spring-core-41",
    "topic": "Spring Core & AOP",
    "questionText": "How do you reference a system property or environment variable directly inside a SpEL expression?",
    "options": [
      "Use #{systemProperties['os.name']} and #{systemEnvironment['PATH']} respectively.",
      "Use #{systemProperty.os.name} and #{environment.PATH}.",
      "Use #{OS_NAME} and #{PATH}.",
      "Use #{system.properties['os.name']} and #{system.env['PATH']}."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring pre-registers implicit variables named systemProperties (a Map of JVM system properties) and systemEnvironment (a Map of OS environment variables) in the SpEL evaluation context, which can be accessed using map key syntax."
  },
  {
    "id": "spring-core-42",
    "topic": "Spring Core & AOP",
    "questionText": "How do you invoke a static method of a class using SpEL?",
    "options": [
      "#{T(fully.qualified.ClassName).methodName(args)}",
      "#{fully.qualified.ClassName::methodName(args)}",
      "#{class(fully.qualified.ClassName).methodName(args)}",
      "#{T[fully.qualified.ClassName].methodName(args)}"
    ],
    "correctOptionIndex": 0,
    "explanation": "The T() operator in SpEL is used to specify an instance of java.lang.Class. Once the class is specified, static methods and constants can be invoked or accessed directly (e.g., #{T(java.lang.Math).random()})."
  },
  {
    "id": "spring-core-43",
    "topic": "Spring Core & AOP",
    "questionText": "In SpEL, what do the selection operator ^[...] and projection operator ![...] do when applied to a collection?",
    "options": [
      "^[...] returns the first matching element, while ![...] projects a new collection by extracting a property from each element.",
      "^[...] sorts the collection, while ![...] filters the collection.",
      "^[...] returns all matching elements, while ![...] checks if any element matches.",
      "^[...] gets the first element, while ![...] gets the last element."
    ],
    "correctOptionIndex": 0,
    "explanation": "SpEL supports collection selection and projection. Selection filters a collection: ?[expression] selects all matching elements, ^[expression] selects the first matching element, and $[expression] selects the last matching element. Projection ![expression] maps a collection by evaluating an expression against each element."
  },
  {
    "id": "spring-core-44",
    "topic": "Spring Core & AOP",
    "questionText": "Which SpEL operator behaves like a ternary operator but simplifies null-coalescing, returning a default value if the expression evaluates to null?",
    "options": [
      "The Elvis operator (?:)",
      "The safe navigation operator (?.)",
      "The ternary shorthand (?)",
      "The null checker (??)"
    ],
    "correctOptionIndex": 0,
    "explanation": "The Elvis operator ?: is used to provide a fallback/default value when an expression evaluates to null or empty (e.g., #{user.name ?: 'Guest'})."
  },
  {
    "id": "spring-core-45",
    "topic": "Spring Core & AOP",
    "questionText": "What are the differences between JoinPoint and Pointcut in Spring AOP?",
    "options": [
      "JoinPoint represents an execution point in the application (like method execution), whereas Pointcut is a predicate expression that matches one or more JoinPoints.",
      "Pointcut represents the execution point, whereas JoinPoint defines when the advice should run.",
      "JoinPoint is the logic implemented by the aspect, whereas Pointcut is the class target.",
      "There is no difference; they are synonymous terms in Spring AOP."
    ],
    "correctOptionIndex": 0,
    "explanation": "A JoinPoint is a candidate point in the execution of an application where an aspect can be plugged in (in Spring AOP, this is always a method execution). A Pointcut is an expression that filters or defines which specific JoinPoints should be intercepted."
  },
  {
    "id": "spring-core-46",
    "topic": "Spring Core & AOP",
    "questionText": "Which type of Advice in Spring AOP has the maximum control, allowing it to decide whether to proceed with the target method execution, modify the arguments, or return a custom value?",
    "options": [
      "Before Advice",
      "After Returning Advice",
      "Around Advice",
      "After Throwing Advice"
    ],
    "correctOptionIndex": 2,
    "explanation": "Around Advice (declared with @Around and taking a ProceedingJoinPoint as a parameter) has complete control over the intercepted method. It can choose to invoke the method via proceed(), skip invocation, modify arguments before calling proceed(), catch exceptions, or modify the return value."
  },
  {
    "id": "spring-core-47",
    "topic": "Spring Core & AOP",
    "questionText": "A class 'MyService' has two public methods: methodA() and methodB(). methodA() calls methodB() internally using standard Java invocation (this.methodB()). Both methods are targeted by a Spring AOP aspect. What happens when an external client calls methodA()?",
    "options": [
      "Both methodA() and methodB() will trigger the aspect's advice.",
      "Only methodA() will trigger the aspect's advice; the internal call to methodB() bypasses the proxy.",
      "Only methodB() will trigger the aspect's advice.",
      "The application throws a ClassCastException because internal self-invocation is forbidden."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring AOP is proxy-based. When an external client calls methodA(), it calls the method on the proxy object, which triggers the aspect. However, the proxy delegates the call to the actual target object. Once inside the target object, the internal call to methodB() is executed on 'this' (the raw target, not the proxy). Therefore, the aspect is bypassed for the internal call."
  },
  {
    "id": "spring-core-48",
    "topic": "Spring Core & AOP",
    "questionText": "What is the default proxying mechanism used by Spring AOP, and how does it change based on the target class interfaces?",
    "options": [
      "JDK dynamic proxies are used if the target class implements at least one interface; otherwise, CGLIB is used.",
      "CGLIB is always used, regardless of interfaces.",
      "JDK dynamic proxies are always used; classes without interfaces cannot be proxied.",
      "AspectJ compile-time weaving is used by default."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, Spring AOP uses JDK dynamic proxies if the target class implements at least one interface. If the class does not implement any interface, Spring AOP automatically uses CGLIB to generate a subclass proxy."
  },
  {
    "id": "spring-core-49",
    "topic": "Spring Core & AOP",
    "questionText": "Which Pointcut designator (PCD) is used to match JoinPoints (method executions) within classes that have a specific class-level annotation?",
    "options": [
      "@within()",
      "execution()",
      "@annotation()",
      "args()"
    ],
    "correctOptionIndex": 0,
    "explanation": "@within() matches join points within types that have a given annotation. @annotation() matches join points where the executing method itself is annotated with the given annotation. execution() matches method execution signatures."
  },
  {
    "id": "spring-core-50",
    "topic": "Spring Core & AOP",
    "questionText": "In Spring AOP, what is the default order of execution when multiple advices of different types (Before, After, After Returning, Around) are configured on the same join point?",
    "options": [
      "Around (entry) -> Before -> Target Method -> After Returning / After Throwing -> After -> Around (exit)",
      "Before -> Around (entry) -> Target Method -> Around (exit) -> After Returning -> After",
      "Around (entry) -> Before -> Target Method -> Around (exit) -> After -> After Returning",
      "Before -> After -> After Returning -> Around"
    ],
    "correctOptionIndex": 0,
    "explanation": "In Spring AOP, the Around advice wraps all other advices. On entry, the Around advice starts execution first, then it calls proceed(), which executes Before advice. Then the target method is invoked. On exit, the target returns, executing the After Returning (or After Throwing) advice, then the After (finally-like) advice runs, and finally, execution returns to the Around advice to complete."
  },
  {
    "id": "spring-boot-1",
    "topic": "Spring Boot Internals",
    "questionText": "In Spring Boot 3.x, what is the standard location for registering custom auto-configuration classes, replacing the legacy META-INF/spring.factories entry under EnableAutoConfiguration?",
    "options": [
      "META-INF/spring-autoconfigure-metadata.properties",
      "META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports",
      "META-INF/spring/org.springframework.boot.autoconfigure.EnableAutoConfiguration.imports",
      "META-INF/services/org.springframework.boot.autoconfigure.AutoConfiguration"
    ],
    "correctOptionIndex": 1,
    "explanation": "Starting in Spring Boot 2.7 and strictly enforced in Spring Boot 3.0, auto-configuration classes must be registered in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports. The key under META-INF/spring.factories is no longer supported for auto-configuration classes in 3.0."
  },
  {
    "id": "spring-boot-2",
    "topic": "Spring Boot Internals",
    "questionText": "Which class is primarily responsible for reading the auto-configuration import files and filtering out candidate configurations based on conditional annotations during application startup?",
    "options": [
      "AutoConfigurationImportSelector",
      "SpringFactoriesLoader",
      "ConfigurationClassParser",
      "AutoConfigurationPackages"
    ],
    "correctOptionIndex": 0,
    "explanation": "AutoConfigurationImportSelector implements DeferredImportSelector and is responsible for loading the candidate auto-configuration classes, sorting them, and filtering them against conditional annotations before import."
  },
  {
    "id": "spring-boot-3",
    "topic": "Spring Boot Internals",
    "questionText": "How can you programmatically exclude specific auto-configuration classes (e.g., DataSourceAutoConfiguration) from being loaded, without using the 'exclude' attribute of the @SpringBootApplication annotation?",
    "options": [
      "Setting the 'spring.autoconfigure.exclude' property in application.properties or yaml",
      "Registering a custom bean of type AutoConfigurationExcludeFilter",
      "Annotating a configuration class with the @ExcludeAutoConfiguration annotation",
      "Defining a system environment variable named SPRING_AUTOCONFIGURE_IGNORE"
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'spring.autoconfigure.exclude' property (in properties/yaml, or as a command-line / environment property) allows you to specify a comma-separated list of auto-configuration classes to exclude."
  },
  {
    "id": "spring-boot-4",
    "topic": "Spring Boot Internals",
    "questionText": "What is the primary design characteristic of Spring Boot 'Starters' (e.g., spring-boot-starter-data-jpa) regarding their codebase?",
    "options": [
      "They contain binary compiled classes that implement custom auto-configurations.",
      "They are empty descriptors (POMs/Gradle files) that only contain transitive dependencies and no source code.",
      "They contain properties files that override Spring Boot default properties.",
      "They contain custom compiler plugins to optimize runtime bean definitions."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot Starters are dependency descriptors containing transitive dependencies required for a specific technology stack. They do not contain application code or configuration classes of their own; the auto-configuration logic resides in the corresponding 'spring-boot-autoconfigure' library."
  },
  {
    "id": "spring-boot-5",
    "topic": "Spring Boot Internals",
    "questionText": "The @SpringBootApplication annotation is a convenience annotation that combines which three core annotations?",
    "options": [
      "@Configuration, @EnableAutoConfiguration, @ComponentScan",
      "@SpringBootConfiguration, @EnableAutoConfiguration, @ComponentScan",
      "@SpringBootConfiguration, @AutoConfiguration, @Component",
      "@Configuration, @EnableConfigurationProperties, @ComponentScan"
    ],
    "correctOptionIndex": 1,
    "explanation": "@SpringBootApplication is meta-annotated with @SpringBootConfiguration (which is a specialization of @Configuration), @EnableAutoConfiguration, and @ComponentScan."
  },
  {
    "id": "spring-boot-6",
    "topic": "Spring Boot Internals",
    "questionText": "What is the primary difference between @SpringBootConfiguration and standard Spring @Configuration?",
    "options": [
      "@SpringBootConfiguration allows beans to be registered asynchronously.",
      "@SpringBootConfiguration allows automatic detection of configuration by integration tests (e.g., via @SpringBootTest).",
      "@SpringBootConfiguration disables proxyBeanMethods by default.",
      "@SpringBootConfiguration is processed during a separate, earlier compiler phase."
    ],
    "correctOptionIndex": 1,
    "explanation": "@SpringBootConfiguration is a specialized @Configuration that Spring's test framework uses to automatically detect the bootstrap configuration class for integration testing. There is no behavioral difference in application runtime bean definition parsing."
  },
  {
    "id": "spring-boot-7",
    "topic": "Spring Boot Internals",
    "questionText": "If you define @SpringBootApplication on a class in the package 'com.example.app', which packages are scanned for components by default?",
    "options": [
      "Only the package 'com.example' and all its sibling packages",
      "The package 'com.example.app' and all its subpackages",
      "The entire classpath, searching for all @Component annotated classes",
      "Only classes in the default (unnamed) package"
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, @ComponentScan (which is part of @SpringBootApplication) scans the package of the class it is declared on and all its subpackages."
  },
  {
    "id": "spring-boot-8",
    "topic": "Spring Boot Internals",
    "questionText": "You want your custom auto-configuration class MyAutoConfiguration to be processed after Spring Boot's standard DataSourceAutoConfiguration. Which annotation should you apply to MyAutoConfiguration?",
    "options": [
      "@Order(Ordered.LOWEST_PRECEDENCE)",
      "@AutoConfigureAfter(DataSourceAutoConfiguration.class)",
      "@DependsOn(\"dataSource\")",
      "@AutoConfigureOrder(Ordered.LOWEST_PRECEDENCE)"
    ],
    "correctOptionIndex": 1,
    "explanation": "@AutoConfigureAfter and @AutoConfigureBefore are specifically designed to order auto-configurations. Standard Spring @Order does not affect the loading order of auto-configuration classes."
  },
  {
    "id": "spring-boot-9",
    "topic": "Spring Boot Internals",
    "questionText": "How does @AutoConfigureOrder differ from Spring's standard @Order annotation?",
    "options": [
      "@AutoConfigureOrder applies to Bean definitions, while @Order applies to classes.",
      "@AutoConfigureOrder is only used to resolve ordering between auto-configuration classes themselves, whereas @Order resolves ordering of regular beans or command-line runners.",
      "@AutoConfigureOrder takes a String value pointing to property keys.",
      "@AutoConfigureOrder is processed by the Servlet container, not the Spring ApplicationContext."
    ],
    "correctOptionIndex": 1,
    "explanation": "@AutoConfigureOrder is designed specifically to sort auto-configuration classes, whereas standard @Order is used for regular Spring beans (like command-line runners, filters, etc.)."
  },
  {
    "id": "spring-boot-10",
    "topic": "Spring Boot Internals",
    "questionText": "Under what condition will a configuration annotated with @ConditionalOnClass(name = \"com.mysql.cj.jdbc.Driver\") be loaded?",
    "options": [
      "If the MySQL driver class is present in the application's runtime classpath.",
      "If the MySQL database is currently running and reachable.",
      "If the MySQL driver has been explicitly initialized as a Spring bean.",
      "If the MySQL dependency is defined in the pom.xml at compile time only."
    ],
    "correctOptionIndex": 0,
    "explanation": "@ConditionalOnClass matches only when the specified class (or class name) is present on the runtime classpath of the application."
  },
  {
    "id": "spring-boot-11",
    "topic": "Spring Boot Internals",
    "questionText": "Why is it common practice to annotate @Bean methods in auto-configurations with @ConditionalOnMissingBean?",
    "options": [
      "To ensure that the bean is only created if the user has NOT defined their own bean of that type.",
      "To throw an exception if the bean is already defined by the user.",
      "To register the bean as a fallback lazy-initialized singleton.",
      "To force Spring to override any user-defined bean of the same type."
    ],
    "correctOptionIndex": 0,
    "explanation": "@ConditionalOnMissingBean provides a default bean declaration that backs off if a bean of that type (or name) is already registered in the context, allowing users to easily override defaults."
  },
  {
    "id": "spring-boot-12",
    "topic": "Spring Boot Internals",
    "questionText": "Consider the annotation @ConditionalOnProperty(prefix = \"app.feature\", name = \"enabled\", havingValue = \"true\", matchIfMissing = false). Under which condition will the bean/configuration be created?",
    "options": [
      "When the property 'app.feature.enabled' is absent from properties.",
      "When the property 'app.feature.enabled' is explicitly set to 'true'.",
      "When the property 'app.feature.enabled' is set to any value other than 'false'.",
      "When the property 'app.feature.enabled' matches the default value in spring-boot-starter."
    ],
    "correctOptionIndex": 1,
    "explanation": "@ConditionalOnProperty requires the property 'app.feature.enabled' to be set explicitly to 'true' (since havingValue is 'true' and matchIfMissing is 'false')."
  },
  {
    "id": "spring-boot-13",
    "topic": "Spring Boot Internals",
    "questionText": "How can a custom condition implemented via Spring's 'Condition' interface control whether it is evaluated during the configuration class parsing phase or the bean registration phase?",
    "options": [
      "By implementing the ConfigurationCondition interface and returning the appropriate ConfigurationPhase.",
      "By annotating the condition class with @Order.",
      "By implementing OrderedCondition and specifying the precedence level.",
      "By throwing a specific PhaseException from the matches() method."
    ],
    "correctOptionIndex": 0,
    "explanation": "The ConfigurationCondition interface extends Condition and provides the getConfigurationPhase() method, which returns either PARSE_CONFIGURATION (evaluated during config class parsing) or REGISTER_BEAN (evaluated when registering the bean)."
  },
  {
    "id": "spring-boot-14",
    "topic": "Spring Boot Internals",
    "questionText": "During the execution of SpringApplication.run(), which of the following events happens first?",
    "options": [
      "The ApplicationContext is created.",
      "The command-line runners are executed.",
      "The SpringApplicationRunListeners are starting and preparing the ConfigurableEnvironment.",
      "Singleton beans are instantiated."
    ],
    "correctOptionIndex": 2,
    "explanation": "The environment is prepared before the ApplicationContext is created or any beans are instantiated. Command-line runners run at the very end of the bootstrapping process."
  },
  {
    "id": "spring-boot-15",
    "topic": "Spring Boot Internals",
    "questionText": "How does Spring Boot decide whether to create an AnnotationConfigApplicationContext, an AnnotationConfigServletWebServerApplicationContext, or an AnnotationConfigReactiveWebServerApplicationContext at startup?",
    "options": [
      "Based on the WebApplicationType inferred from the presence of specific classes on the classpath (like Servlet, DispatcherHandler, etc.).",
      "Based on the presence of @EnableWebMvc on the main application class.",
      "Based on the value of the 'spring.main.context-class' property in application.properties.",
      "By querying the active OS process type and memory footprint."
    ],
    "correctOptionIndex": 0,
    "explanation": "SpringApplication infers the WebApplicationType (NONE, SERVLET, REACTIVE) from the classpath and creates the corresponding ApplicationContext subclass."
  },
  {
    "id": "spring-boot-16",
    "topic": "Spring Boot Internals",
    "questionText": "Which component can be registered in spring.factories to listen to the entire bootstrapping lifecycle of a Spring Boot application, starting before the environment is prepared?",
    "options": [
      "ApplicationListener<ApplicationStartingEvent>",
      "SpringApplicationRunListener",
      "CommandLineRunner",
      "ApplicationContextInitializer"
    ],
    "correctOptionIndex": 1,
    "explanation": "SpringApplicationRunListener is designed specifically to listen to the bootstrap sequence of SpringApplication. It must be registered in META-INF/spring.factories."
  },
  {
    "id": "spring-boot-17",
    "topic": "Spring Boot Internals",
    "questionText": "You have both a CommandLineRunner and an ApplicationRunner bean in your context. Both are annotated with @Order(1). How are their arguments passed differently, and in what order are they run relative to bean initialization?",
    "options": [
      "CommandLineRunner receives raw String[] arguments, ApplicationRunner receives ApplicationArguments. They both run after bean initialization.",
      "CommandLineRunner receives ApplicationArguments, ApplicationRunner receives String[]. They both run before bean initialization.",
      "CommandLineRunner runs before the ApplicationContext is fully refreshed, while ApplicationRunner runs after.",
      "They both receive String[] arguments, but CommandLineRunner executes with higher priority."
    ],
    "correctOptionIndex": 0,
    "explanation": "Both runners execute after the application context has fully refreshed and singleton beans are initialized. CommandLineRunner takes raw String[] arguments, whereas ApplicationRunner takes ApplicationArguments."
  },
  {
    "id": "spring-boot-18",
    "topic": "Spring Boot Internals",
    "questionText": "If a property named 'my.setting' is defined in all of the following locations, which source has the HIGHEST precedence and will override the others according to Spring Boot's Externalized Configuration rules?",
    "options": [
      "A property in application.properties packaged inside the jar.",
      "A property in application.yaml defined in the same directory as the jar.",
      "An environment variable (e.g. MY_SETTING=value).",
      "A command-line argument (e.g. --my.setting=value)."
    ],
    "correctOptionIndex": 3,
    "explanation": "Command-line arguments have higher precedence than environment variables, packaged configuration, and config files in the directory. The precedence order is: command-line args > env variables > config files (external > internal)."
  },
  {
    "id": "spring-boot-19",
    "topic": "Spring Boot Internals",
    "questionText": "Which of the following is an example of Spring Boot's 'Relaxed Binding' where a property defined in the environment as 'APP_DATABASE_MAX_POOL_SIZE' is successfully bound to a @ConfigurationProperties class field?",
    "options": [
      "A field named 'appDatabaseMaxPoolSize'",
      "A field named 'app_database_max_pool_size'",
      "A field named 'appdatabasemaxpoolsize'",
      "All of the above will bind successfully."
    ],
    "correctOptionIndex": 3,
    "explanation": "Relaxed binding allows properties to be resolved using camelCase, kebab-case, snake_case, or UPPER_SNAKE_CASE (for environment variables) to bind to properties fields like 'appDatabaseMaxPoolSize'."
  },
  {
    "id": "spring-boot-20",
    "topic": "Spring Boot Internals",
    "questionText": "In Spring Boot 3.x, how can you define an immutable @ConfigurationProperties class that uses constructor injection without needing to explicitly add @ConstructorBinding to the constructor?",
    "options": [
      "By ensuring the class is annotated with @ImmutableConfiguration.",
      "By defining the class as a Java 'record' annotated with @ConfigurationProperties.",
      "By making the class final and all its fields package-private.",
      "In Spring Boot 3.x, constructor binding always requires @ConstructorBinding at the class level."
    ],
    "correctOptionIndex": 1,
    "explanation": "For Java records and classes with a single parameterized constructor, @ConstructorBinding is automatically assumed and is not required explicitly in Spring Boot 3.x."
  },
  {
    "id": "spring-boot-21",
    "topic": "Spring Boot Internals",
    "questionText": "If the active profiles are 'prod' and 'mysql', in what order of precedence will Spring Boot load properties from application.yaml, application-prod.yaml, and application-mysql.yaml? (Assume the profile activation order was 'prod', then 'mysql')",
    "options": [
      "application-mysql.yaml > application-prod.yaml > application.yaml",
      "application.yaml > application-prod.yaml > application-mysql.yaml",
      "application-prod.yaml > application-mysql.yaml > application.yaml",
      "Properties are merged alphabetically, so application-mysql.yaml takes precedence over application-prod.yaml."
    ],
    "correctOptionIndex": 0,
    "explanation": "Profile-specific properties override non-specific properties (application.yaml). Among profile-specific properties, those activated later in the declaration list (e.g. mysql after prod) override those activated earlier."
  },
  {
    "id": "spring-boot-22",
    "topic": "Spring Boot Internals",
    "questionText": "How can you define a profile group in application.yaml so that activating the profile 'production' automatically activates the profiles 'db-prod' and 'metrics'?",
    "options": [
      "spring.profiles.group.production: db-prod, metrics",
      "spring.profiles.include.production: db-prod, metrics",
      "spring.profiles.active.production: db-prod, metrics",
      "spring.profiles.production.imports: db-prod, metrics"
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'spring.profiles.group' property allows grouping related profiles together so that activating the group profile activates all the profiles defined within it."
  },
  {
    "id": "spring-boot-23",
    "topic": "Spring Boot Internals",
    "questionText": "By default, in Spring Boot 3.x, which Actuator endpoints are exposed over HTTP (Web) without any custom configuration?",
    "options": [
      "Only /actuator/health and /actuator/info",
      "All actuator endpoints except /actuator/shutdown",
      "/actuator/health and /actuator/metrics",
      "None, HTTP endpoints are completely disabled by default for security."
    ],
    "correctOptionIndex": 0,
    "explanation": "For security, only the 'health' and 'info' endpoints are exposed via HTTP/Web by default in Spring Boot 3.x."
  },
  {
    "id": "spring-boot-24",
    "topic": "Spring Boot Internals",
    "questionText": "Which annotations must be used to create a custom read-only Actuator endpoint named '/actuator/release-info' that works over both HTTP and JMX?",
    "options": [
      "@Component and @Endpoint(id = \"release-info\") with @ReadOperation on the read method.",
      "@RestController and @GetMapping(\"/actuator/release-info\").",
      "@Component and @WebEndpoint(id = \"release-info\") with @GetMapping.",
      "@Component and @JmxEndpoint(id = \"release-info\") with @WriteOperation."
    ],
    "correctOptionIndex": 0,
    "explanation": "@Endpoint creates a technology-agnostic endpoint (HTTP and JMX). The read operation method must be annotated with @ReadOperation."
  },
  {
    "id": "spring-boot-25",
    "topic": "Spring Boot Internals",
    "questionText": "You are writing a custom health indicator for Actuator. How can you register it so that it is automatically picked up, and what interface must it implement?",
    "options": [
      "Implement HealthIndicator and register it as a Spring @Component.",
      "Implement HealthContributor and register it in META-INF/spring.factories.",
      "Annotate a method with @HealthCheck returning a Map<String, Object>.",
      "Implement ReactiveHealthIndicator and annotate the class with @Endpoint."
    ],
    "correctOptionIndex": 0,
    "explanation": "Implementing HealthIndicator (or ReactiveHealthIndicator) and exposing it as a bean (@Component or @Bean) is sufficient for Spring Boot to automatically register it in the health endpoint."
  },
  {
    "id": "spring-boot-26",
    "topic": "Spring Boot Internals",
    "questionText": "How does Spring Boot DevTools achieve fast application restarts when code changes are detected?",
    "options": [
      "By utilizing two classloaders: a base classloader for static jars (dependencies) and a restart classloader for active development classes.",
      "By dynamically modifying JVM byte code using Java agents.",
      "By running the application in a lightweight container and hot-swapping classes using OSGi.",
      "By utilizing the standard JVM Hotswap mechanism which works for all structural changes."
    ],
    "correctOptionIndex": 0,
    "explanation": "DevTools uses two classloaders. Classes that do not change (e.g. third-party jars) are loaded into a base classloader. Classes that change are loaded into a restart classloader. When a restart is triggered, only the restart classloader is discarded and recreated."
  },
  {
    "id": "spring-boot-27",
    "topic": "Spring Boot Internals",
    "questionText": "How does the LiveReload feature of DevTools notify the browser to refresh when resources are updated?",
    "options": [
      "Through a WebSocket connection established by an embedded LiveReload server.",
      "Through long-polling HTTP requests initiated by the browser.",
      "By injecting a custom Javascript snippet into all generated HTML responses.",
      "By sending a push notification via the browser's Service Worker."
    ],
    "correctOptionIndex": 0,
    "explanation": "DevTools runs an embedded LiveReload server that communicates with a browser extension or custom script via WebSockets to trigger a reload."
  },
  {
    "id": "spring-boot-28",
    "topic": "Spring Boot Internals",
    "questionText": "How can you programmatically set active profiles before the application context is refreshed, within a custom ApplicationContextInitializer?",
    "options": [
      "context.getEnvironment().setActiveProfiles(\"profileName\");",
      "System.setProperty(\"spring.profiles.active\", \"profileName\");",
      "SpringApplication.addProfiles(\"profileName\");",
      "context.getBeanFactory().registerSingleton(\"profile\", \"profileName\");"
    ],
    "correctOptionIndex": 0,
    "explanation": "The profile can be programmatically set on the environment of the context before refresh via 'context.getEnvironment().setActiveProfiles(...)' or 'addActiveProfile(...)'."
  },
  {
    "id": "spring-boot-29",
    "topic": "Spring Boot Internals",
    "questionText": "If you want to configure a fallback bean only when a library (e.g., Jackson) is NOT available on the classpath, which annotation is correct?",
    "options": [
      "@ConditionalOnMissingClass(\"com.fasterxml.jackson.databind.ObjectMapper\")",
      "@ConditionalOnClass(value = ObjectMapper.class, negate = true)",
      "@ConditionalOnMissingBean(ObjectMapper.class)",
      "@ConditionalOnResource(resources = \"!classpath:jackson.jar\")"
    ],
    "correctOptionIndex": 0,
    "explanation": "@ConditionalOnMissingClass matches when the specified class name is not present on the classpath. Note that we must specify the class name as a String, since referencing ObjectMapper.class directly would cause a compilation error if Jackson is missing."
  },
  {
    "id": "spring-boot-30",
    "topic": "Spring Boot Internals",
    "questionText": "If you import spring-boot-starter-web but want to use Jetty instead of Tomcat, how do you configure your build file and dependencies?",
    "options": [
      "Exclude spring-boot-starter-tomcat from spring-boot-starter-web and add spring-boot-starter-jetty.",
      "Set server.jetty.enabled=true in application.properties.",
      "Exclude tomcat-embed-core and add jetty-server as a direct dependency.",
      "Annotate your main configuration with @EnableJettyServer."
    ],
    "correctOptionIndex": 0,
    "explanation": "The standard practice is to exclude the transitive spring-boot-starter-tomcat dependency from spring-boot-starter-web and include the spring-boot-starter-jetty dependency."
  },
  {
    "id": "spring-boot-31",
    "topic": "Spring Boot Internals",
    "questionText": "When writing an auto-configuration, what is the purpose of annotating it with @EnableConfigurationProperties(MyProperties.class)?",
    "options": [
      "It registers MyProperties as a Spring bean in the application context and enables property binding to it.",
      "It validates that the property fields match the system environment variables.",
      "It exports the properties to the Actuator /configprops endpoint.",
      "It disables relaxed binding for the class MyProperties."
    ],
    "correctOptionIndex": 0,
    "explanation": "@EnableConfigurationProperties registers the specified @ConfigurationProperties class as a bean in the context so that other beans can inject it."
  },
  {
    "id": "spring-boot-32",
    "topic": "Spring Boot Internals",
    "questionText": "Which annotation allows you to conditionally configure a bean based on a SpEL (Spring Expression Language) expression checking multiple properties?",
    "options": [
      "@ConditionalOnExpression",
      "@ConditionalOnSpEL",
      "@ConditionalOnPropertyExpression",
      "@ConditionalOnCondition"
    ],
    "correctOptionIndex": 0,
    "explanation": "@ConditionalOnExpression evaluates a SpEL expression to decide whether a configuration should match."
  },
  {
    "id": "spring-boot-33",
    "topic": "Spring Boot Internals",
    "questionText": "What is the benefit of injecting the ApplicationArguments bean instead of parsing raw String[] arguments in your bean?",
    "options": [
      "It parses command-line arguments into option arguments (e.g. --debug) and non-option arguments.",
      "It allows arguments to be loaded dynamically from a remote config server.",
      "It validates command-line arguments against a pre-defined schema.",
      "It automatically converts arguments to camelCase."
    ],
    "correctOptionIndex": 0,
    "explanation": "ApplicationArguments parses command-line arguments and exposes them through helper methods like getOptionNames(), getOptionValues(), and getNonOptionArgs()."
  },
  {
    "id": "spring-boot-34",
    "topic": "Spring Boot Internals",
    "questionText": "To enable JSR-380 validation (e.g. @NotNull, @Min) on a @ConfigurationProperties bean, what annotation must be added to the class?",
    "options": [
      "@Validated",
      "@Valid",
      "@ConfigurationPropertiesValidator",
      "@NonNull"
    ],
    "correctOptionIndex": 0,
    "explanation": "A @ConfigurationProperties bean must be annotated with Spring's @Validated annotation to trigger validation of its properties during configuration binding."
  },
  {
    "id": "spring-boot-35",
    "topic": "Spring Boot Internals",
    "questionText": "In Spring Boot 3.x, what is the recommended way to record custom metrics (e.g., a counter for login attempts) using Actuator and Micrometer?",
    "options": [
      "Inject a MeterRegistry bean and use it to register and increment a Counter.",
      "Implement MetricWriter and register it as a bean.",
      "Call Actuator.incrementMetric(\"login.attempts\") statically.",
      "Annotate the login method with @CountedMetric."
    ],
    "correctOptionIndex": 0,
    "explanation": "The standard approach in Spring Boot 3/Micrometer is to inject the MeterRegistry bean and programmatically create or retrieve counters, gauges, or timers."
  },
  {
    "id": "spring-boot-36",
    "topic": "Spring Boot Internals",
    "questionText": "How can you disable the automatic restart feature of DevTools programmatically in your application's main method?",
    "options": [
      "System.setProperty(\"spring.devtools.restart.enabled\", \"false\");",
      "SpringApplication.setDevToolsEnabled(false);",
      "DevTools.disableRestart();",
      "Setting spring.devtools.livereload.enabled=false"
    ],
    "correctOptionIndex": 0,
    "explanation": "You must set the system property 'spring.devtools.restart.enabled' to 'false' before calling 'SpringApplication.run(..., args)' because DevTools reads the system property early in the bootstrapping phase."
  },
  {
    "id": "spring-boot-37",
    "topic": "Spring Boot Internals",
    "questionText": "Which of the following annotations correctly configures a bean to load ONLY if both the 'production' profile and the 'eu-west' profile are active?",
    "options": [
      "@Profile(\"production & eu-west\")",
      "@Profile({\"production\", \"eu-west\"})",
      "@Profile(\"production && eu-west\")",
      "@Profile(\"production + eu-west\")"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring 5.1+ supports profile expressions using operators like & (AND), | (OR), and ! (NOT). In contrast, @Profile({'production', 'eu-west'}) matches if EITHER is active."
  },
  {
    "id": "spring-boot-38",
    "topic": "Spring Boot Internals",
    "questionText": "What is the purpose of an ApplicationContextInitializer in Spring Boot?",
    "options": [
      "To perform customization of the ConfigurableApplicationContext before it is refreshed.",
      "To bootstrap the embedded Tomcat or Jetty servlet container.",
      "To run initialization scripts against an active database.",
      "To initialize singleton beans after the context is refreshed."
    ],
    "correctOptionIndex": 0,
    "explanation": "ApplicationContextInitializer is called after the context is created but before it is refreshed, allowing programmatically modifying the context (e.g. adding property sources, registering beans, etc.)."
  },
  {
    "id": "spring-boot-39",
    "topic": "Spring Boot Internals",
    "questionText": "How can you expose additional custom application details under the /actuator/info endpoint?",
    "options": [
      "Implement InfoContributor and register it as a bean.",
      "Define properties starting with info.custom.* in application.properties.",
      "Create a custom JSON file named info.json in the classpath.",
      "Both A and B are valid ways."
    ],
    "correctOptionIndex": 3,
    "explanation": "You can expose details in the info endpoint by either adding properties under the 'info.*' prefix (which are read by the built-in MapInfoContributor) or by implementing the InfoContributor interface."
  },
  {
    "id": "spring-boot-40",
    "topic": "Spring Boot Internals",
    "questionText": "Why is it risky to use @ConditionalOnBean or @ConditionalOnMissingBean on configuration classes instead of bean methods?",
    "options": [
      "The condition evaluation order depends heavily on the ordering of configuration class parsing, which is not guaranteed.",
      "It forces all beans in the class to be lazily initialized.",
      "It completely disables auto-configuration imports.",
      "It conflicts with @ConfigurationProperties."
    ],
    "correctOptionIndex": 0,
    "explanation": "Bean conditions are evaluated based on what has been parsed so far. When applied at the configuration level, if the target bean has not been registered yet due to class parsing order, the condition might evaluate incorrectly."
  },
  {
    "id": "spring-boot-41",
    "topic": "Spring Boot Internals",
    "questionText": "Which Spring Boot interface allows you to intercept startup exceptions (such as port already in use) and present a clean, diagnostic error message?",
    "options": [
      "FailureAnalyzer",
      "ApplicationStartupFailureHandler",
      "SpringApplicationRunListener",
      "StartupErrorHandler"
    ],
    "correctOptionIndex": 0,
    "explanation": "FailureAnalyzer parses exceptions thrown on startup and returns a FailureAnalysis containing a description and a suggested action."
  },
  {
    "id": "spring-boot-42",
    "topic": "Spring Boot Internals",
    "questionText": "Where can you place a global configuration file to configure DevTools properties (like remote secrets) across all Spring Boot projects on a developer's machine?",
    "options": [
      "~/.config/spring-boot/spring-boot-devtools.properties",
      "/etc/spring/devtools.properties",
      ".spring-boot-devtools.properties in the project root directory",
      "~/.spring-boot-devtools.properties"
    ],
    "correctOptionIndex": 3,
    "explanation": "DevTools looks for a global properties file named '.spring-boot-devtools.properties' in the user's home directory (~/)."
  },
  {
    "id": "spring-boot-43",
    "topic": "Spring Boot Internals",
    "questionText": "What is a major advantage of @ConfigurationProperties over @Value?",
    "options": [
      "@ConfigurationProperties supports relaxed binding and structured/hierarchical binding.",
      "@ConfigurationProperties supports SpEL expressions.",
      "@ConfigurationProperties can be used directly on static methods.",
      "@ConfigurationProperties doesn't require getter and setter methods in any configuration style."
    ],
    "correctOptionIndex": 0,
    "explanation": "@ConfigurationProperties supports relaxed binding, JSR-380 validation, constructor binding, and binding structured/nested data, while @Value does not support relaxed binding or structured data binding."
  },
  {
    "id": "spring-boot-44",
    "topic": "Spring Boot Internals",
    "questionText": "What is the recommended naming convention for custom, third-party Spring Boot starters to avoid clashing with official starters?",
    "options": [
      "projectname-spring-boot-starter",
      "spring-boot-starter-projectname",
      "starter-projectname-spring",
      "custom-starter-projectname"
    ],
    "correctOptionIndex": 0,
    "explanation": "Official Spring Boot starters start with 'spring-boot-starter-'. Third-party starters should follow the format 'projectname-spring-boot-starter'."
  },
  {
    "id": "spring-boot-45",
    "topic": "Spring Boot Internals",
    "questionText": "Under what condition will @ConditionalOnWebApplication(type = Type.REACTIVE) evaluate to true?",
    "options": [
      "When the application context is a reactive web application context (e.g., using WebFlux).",
      "When the application includes both WebFlux and Spring Web MVC on the classpath.",
      "When the application is running in an embedded Tomcat instance.",
      "When reactive programming is enabled via @EnableReactiveStreams."
    ],
    "correctOptionIndex": 0,
    "explanation": "Type.REACTIVE matches only when the running application context is reactive-based (e.g., AnnotationConfigReactiveWebServerApplicationContext)."
  },
  {
    "id": "spring-boot-46",
    "topic": "Spring Boot Internals",
    "questionText": "How does Spring Boot Actuator sanitize sensitive keys (like passwords, keys, tokens) in endpoints like /env or /configprops?",
    "options": [
      "By replacing their values with ****** (asterisks) using a configured Sanitizer.",
      "By encrypting the sensitive fields using AES-256.",
      "By completely omitting sensitive keys from the output.",
      "By requiring a special JWT token to view any key containing 'password'."
    ],
    "correctOptionIndex": 0,
    "explanation": "Actuator sanitizes sensitive values by replacing them with ******. You can customize the keys to be sanitized using 'management.endpoint.env.keys-to-sanitize'."
  },
  {
    "id": "spring-boot-47",
    "topic": "Spring Boot Internals",
    "questionText": "When using Spring Security, how are Spring Boot Actuator endpoints secured by default?",
    "options": [
      "They are secured with the same security rules as the rest of the application unless specific request matchers are added for EndpointRequest.",
      "They bypass security entirely because they run on a different port by default.",
      "They are secured with HTTP Basic authentication using a generated developer password.",
      "Web actuator endpoints are completely open, while JMX endpoints are secured."
    ],
    "correctOptionIndex": 0,
    "explanation": "Once Spring Security is on the classpath, all actuator endpoints are secured by default. To customize access, you typically use EndpointRequest.toAnyEndpoint() or EndpointRequest.to(...) in the security filter chain configuration."
  },
  {
    "id": "spring-boot-48",
    "topic": "Spring Boot Internals",
    "questionText": "Since Spring Boot 2.4, how can you import external config files from another location (like a directory or a volume mount) directly within application.properties?",
    "options": [
      "Using the 'spring.config.import' property.",
      "Using the 'spring.config.additional-location' property.",
      "Annotating the configuration class with @ImportResource.",
      "Using the 'spring.profiles.include' property."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Boot 2.4+ introduced the 'spring.config.import' property which allows importing additional configuration files (like 'file:/etc/config/') or configuration trees."
  },
  {
    "id": "spring-boot-49",
    "topic": "Spring Boot Internals",
    "questionText": "In a multi-profile environment, what is the default behavior if multiple profile-specific files define the same property value?",
    "options": [
      "The last active profile in the spring.profiles.active list takes precedence and overrides the others.",
      "The application fails to start due to a profile conflict exception.",
      "They are merged into a list of comma-separated values.",
      "The profile file with the shortest filename takes precedence."
    ],
    "correctOptionIndex": 0,
    "explanation": "The properties are overridden sequentially in the order that the profiles are specified in the active profiles list. The last one wins."
  },
  {
    "id": "spring-boot-50",
    "topic": "Spring Boot Internals",
    "questionText": "Which property can be used to prevent DevTools from restarting the application when specific static assets (like HTML, CSS) are modified?",
    "options": [
      "spring.devtools.restart.exclude",
      "spring.devtools.restart.ignore",
      "spring.devtools.livereload.exclude",
      "spring.devtools.static.ignore"
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'spring.devtools.restart.exclude' property allows defining a list of paths/files (using ant patterns) that should not trigger an application restart when modified."
  },
  {
    "id": "spring-data-1",
    "topic": "Spring Data JPA Repositories",
    "questionText": "You have a repository interface extending JpaRepository. Which of the following statements is true regarding its relation to CrudRepository and PagingAndSortingRepository?",
    "options": [
      "JpaRepository extends PagingAndSortingRepository, which in turn extends CrudRepository.",
      "CrudRepository extends JpaRepository, which in turn extends PagingAndSortingRepository.",
      "JpaRepository and PagingAndSortingRepository are completely independent interfaces that only share common implementation classes.",
      "JpaRepository extends CrudRepository directly, bypassing PagingAndSortingRepository entirely."
    ],
    "correctOptionIndex": 0,
    "explanation": "In the Spring Data Repository hierarchy, JpaRepository extends ListPagingAndSortingRepository (or PagingAndSortingRepository in older versions), which extends CrudRepository, which extends Repository. Therefore, JpaRepository inherits all CRUD, paging, and sorting operations."
  },
  {
    "id": "spring-data-2",
    "topic": "Spring Data JPA Repositories",
    "questionText": "When implementing custom repository behavior, you want to merge custom logic into your standard spring repository interface. What is the default naming convention that Spring Data JPA uses to find the custom implementation class for an interface named 'UserRepository'?",
    "options": [
      "UserRepositoryCustom",
      "UserRepositoryImpl",
      "CustomUserRepository",
      "UserRepositoryCustomImpl"
    ],
    "correctOptionIndex": 1,
    "explanation": "By default, Spring Data looks for the implementation of the custom interface by appending the 'Impl' suffix to the repository interface name (e.g., UserRepositoryImpl). This postfix can be customized via @EnableJpaRepositories(repositoryImplementationPostfix = '...')."
  },
  {
    "id": "spring-data-3",
    "topic": "Spring Data JPA Repositories",
    "questionText": "You are creating several repository interfaces that share a set of common custom queries. To prevent Spring Data from trying to instantiate a repository bean for the shared base interface, which annotation must you place on the base interface?",
    "options": [
      "@NoRepositoryBean",
      "@Transient",
      "@IgnoreRepository",
      "@Component"
    ],
    "correctOptionIndex": 0,
    "explanation": "@NoRepositoryBean is used to exclude repository interfaces from being picked up as Spring beans. This is crucial for base interfaces that act as shared parent interfaces but should not be instantiated directly."
  },
  {
    "id": "spring-data-4",
    "topic": "Spring Data JPA Repositories",
    "questionText": "A developer wants to restrict access to database operations by exposing only 'findById' and 'save' methods in their repository, preventing delete or bulk select operations. How can they achieve this?",
    "options": [
      "Extend CrudRepository and annotate all unwanted methods with @Deprecated.",
      "Extend the base Repository interface (which is empty) and declare only 'findById' and 'save' method signatures matching the CrudRepository signatures.",
      "Override the delete methods in a JpaRepository sub-interface and throw an UnsupportedOperationException.",
      "Use @Repository(readOnly = true) to prevent modifications, although this does not hide delete method signatures."
    ],
    "correctOptionIndex": 1,
    "explanation": "By extending the marker Repository interface, Spring Data will only expose the methods explicitly declared in your interface. The method names and signatures must match those of CrudRepository to be correctly routed to the default implementation."
  },
  {
    "id": "spring-data-5",
    "topic": "Spring Data JPA Repositories",
    "questionText": "Which interface can an entity implement to programmatically control whether Spring Data's SimpleJpaRepository treats it as 'new' versus 'existing' when save() is called?",
    "options": [
      "Serializable",
      "Persistable",
      "Identifiable",
      "EntityStateCallback"
    ],
    "correctOptionIndex": 1,
    "explanation": "By implementing org.springframework.data.domain.Persistable, an entity can implement the 'isNew()' method. This allows custom logic (like checking a boolean flag or a timestamp) to determine if save() should trigger persist() or merge() when using assigned IDs."
  },
  {
    "id": "spring-data-6",
    "topic": "Spring Data JPA Repositories",
    "questionText": "What is a key architectural difference between standard Spring Data JPA Repositories and Reactive Repositories (like Spring Data R2DBC)?",
    "options": [
      "Standard Spring Data JPA relies on blocking JDBC drivers and blocking threads, while Reactive Repositories use non-blocking database drivers and reactive streams (Flux/Mono).",
      "Reactive Repositories support JPQL and full Hibernate caching natively, whereas standard JPA repositories do not.",
      "Reactive Repositories support lazy loading of nested collections automatically using proxy objects.",
      "Standard JPA repositories cannot participate in transactions, while Reactive Repositories can."
    ],
    "correctOptionIndex": 0,
    "explanation": "Standard JPA (and Hibernate) is built on top of the blocking JDBC API and requires blocking threads. Spring Data R2DBC provides a non-blocking reactive API returning Publisher types (Flux/Mono) and does not use JPA/Hibernate under the hood."
  },
  {
    "id": "spring-data-7",
    "topic": "Query Methods",
    "questionText": "Consider the query method: List<User> findByAddress_ZipCode(String zipCode). How does Spring Data JPA resolve the property path in this method?",
    "options": [
      "It splits the name by the underscore '_' to explicitly treat 'address' as a property of User, and 'zipCode' as a property of Address, resolving property path ambiguity.",
      "The underscore is ignored, and Spring Data attempts to match a property named 'address_ZipCode' in the User entity.",
      "The underscore represents a database native underscore matching constraint for column names.",
      "It triggers an automatic SQL JOIN using a native query fallback mechanism."
    ],
    "correctOptionIndex": 0,
    "explanation": "Although Spring Data can traverse properties automatically (e.g., findByAddressZipCode), ambiguity can arise if the User entity has an 'addressZip' property. Using an underscore (_) acts as a delimiter to explicitly define the traversal path (address -> zipCode)."
  },
  {
    "id": "spring-data-8",
    "topic": "Query Methods",
    "questionText": "Which query method suffix will generate an SQL statement containing 'LIKE %?1%' (where the search parameter is automatically wrapped with wildcard characters)?",
    "options": [
      "findByLastNameLike",
      "findByLastNameContaining",
      "findByLastNameStartingWith",
      "findByLastNameEndingWith"
    ],
    "correctOptionIndex": 1,
    "explanation": "findByLastNameContaining (and findByLastNameIsContaining / findByLastNameContains) automatically surrounds the query parameter with '%' characters before executing the query. 'Like' does not append '%' characters automatically; the developer must pass them in the argument."
  },
  {
    "id": "spring-data-9",
    "topic": "Query Methods",
    "questionText": "When returning a java.util.stream.Stream<User> from a Spring Data JPA query method, what requirement must be met by the caller to avoid an Exception?",
    "options": [
      "The stream must be processed asynchronously using a CompletableFuture.",
      "The method must be invoked within an active transaction, and the stream must be closed after consumption.",
      "The entity must have second-level cache enabled.",
      "The query method must be annotated with @Modifying."
    ],
    "correctOptionIndex": 1,
    "explanation": "Streaming results requires the underlying database connection and Hibernate Session to remain open during streaming. Thus, the calling method must be annotated with @Transactional, and the Stream should be wrapped in a try-with-resources block to ensure it is closed."
  },
  {
    "id": "spring-data-10",
    "topic": "Query Methods",
    "questionText": "Which method signature correctly limits the result set to the first 3 users sorted by their creation date in descending order?",
    "options": [
      "List<User> findTop3ByOrderByCreatedDateDesc();",
      "List<User> findFirst3ByCreatedDateDesc();",
      "List<User> findByCreatedDateDescLimit3();",
      "List<User> findTopByOrderByCreatedDateDesc(int limit);"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data supports query limiting using 'First' or 'Top' followed by a number. To sort, we append 'OrderBy' followed by the property name and direction ('Desc' or 'Asc'). Thus, findTop3ByOrderByCreatedDateDesc() is the correct signature."
  },
  {
    "id": "spring-data-11",
    "topic": "Query Methods",
    "questionText": "You want to find all products that are either marked as active or have a stock count greater than zero. Which query method name is valid and correct?",
    "options": [
      "List<Product> findByActiveTrueOrStockGreaterThan(Integer stock);",
      "List<Product> findByActiveOrStockGreaterThanZero();",
      "List<Product> findActiveOrStockGreaterThan(Integer stock);",
      "List<Product> findByActiveIsTrueOrStockIsGreaterThan(Integer stock);"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data matches properties and keywords. 'ActiveTrue' maps to active = true (omitting the need for a parameter for that property), and 'OrStockGreaterThan' maps to 'OR stock > ?'. The argument passed corresponds to the 'stock' parameter."
  },
  {
    "id": "spring-data-12",
    "topic": "Query Methods",
    "questionText": "If an entity has both a field 'accountNumber' and an embedded object 'account' with a field 'number', how does Spring Data resolve the method name 'findByAccountNumber(String number)' if no underscore is used?",
    "options": [
      "It will prioritize the direct property 'accountNumber' first. If that doesn't exist, it splits the property path using camel case and looks for 'account.number'.",
      "It splits the property path first ('account.number'), throwing an exception if 'account' is null.",
      "It throws a startup exception due to ambiguity.",
      "It requires a native query fallback because nested properties must contain underscores."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data JPA's property parser first checks for a direct property matching the name (accountNumber). Only if that match fails does it split the name from right to left based on camel case (account and number)."
  },
  {
    "id": "spring-data-13",
    "topic": "@Query annotation",
    "questionText": "When using the @Query annotation, which parameter binding style is recommended to prevent issues when refactoring method parameter positions?",
    "options": [
      "Positional parameters (?1, ?2)",
      "Named parameters (:name) using the @Param annotation",
      "Index-based parameters (?index)",
      "Spring Data does not support named parameter binding in JPQL."
    ],
    "correctOptionIndex": 1,
    "explanation": "Named parameters (e.g., :status bound via @Param(\"status\")) make queries robust against refactoring because their binding does not depend on the order of arguments in the method signature."
  },
  {
    "id": "spring-data-14",
    "topic": "@Query annotation",
    "questionText": "Which of the following describes the difference in query validation between JPQL/HQL queries and Native queries defined via @Query?",
    "options": [
      "JPQL/HQL queries are validated by the persistence provider (Hibernate) during Spring application context startup, while Native queries are executed directly and validated by the database at runtime.",
      "Native queries are validated at compilation time, while JPQL queries are validated at runtime.",
      "JPQL queries run directly in the database, whereas native queries run in the JVM cache.",
      "There is no difference; both are fully validated at startup against the database schema."
    ],
    "correctOptionIndex": 0,
    "explanation": "Hibernate parses JPQL/HQL queries when building the SessionFactory at startup, throwing errors for invalid syntax or wrong properties. Native queries (nativeQuery = true) are passed directly to the DB and are not validated until executed."
  },
  {
    "id": "spring-data-15",
    "topic": "@Query annotation",
    "questionText": "How can you refer to the entity name dynamically in a JPQL @Query template, ensuring that if the entity class is renamed or has a custom JPA name, the query remains valid?",
    "options": [
      "Using SpEL: #{#entityName}",
      "Using the wildcard: $Entity",
      "Using the template placeholder: %entity%",
      "It is not possible to refer to the entity dynamically; the name must be hardcoded."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data JPA supports SpEL templates. Using #{#entityName} resolves dynamically to the entity name associated with the repository interface, which respects @Entity(name = \"...\") settings."
  },
  {
    "id": "spring-data-16",
    "topic": "@Query annotation",
    "questionText": "A developer runs a bulk update query using @Query(\"UPDATE User u SET u.active = false\"). The update executes, but subsequent findById() calls in the same transaction still return the old active state. What annotation configuration is missing?",
    "options": [
      "@Modifying(clearAutomatically = true)",
      "@Transactional(propagation = Propagation.REQUIRES_NEW)",
      "@Query(nativeQuery = true)",
      "@CacheEvict(allEntries = true)"
    ],
    "correctOptionIndex": 0,
    "explanation": "Modifying queries execute updates directly in the database, bypassing the Hibernate Persistence Context (first-level cache). By setting @Modifying(clearAutomatically = true), Spring Data will clear the Persistence Context, forcing Hibernate to reload fresh entity states from the database."
  },
  {
    "id": "spring-data-17",
    "topic": "@Query annotation",
    "questionText": "You want to retrieve a subset of fields from an entity using a JPQL query and map them directly into a read-only class (DTO). Which JPQL syntax is correct?",
    "options": [
      "SELECT new com.example.UserDto(u.id, u.name) FROM User u",
      "SELECT u.id, u.name AS dto FROM User u",
      "SELECT (UserDto) u FROM User u",
      "SELECT u.id, u.name INTO UserDto FROM User u"
    ],
    "correctOptionIndex": 0,
    "explanation": "JPQL constructor expressions require the 'new' keyword followed by the fully qualified class name of the DTO and the arguments matching the DTO's constructor: SELECT new path.to.Dto(args) FROM Entity e."
  },
  {
    "id": "spring-data-18",
    "topic": "@Query annotation",
    "questionText": "When using pagination with a native @Query, what attribute must be defined in the @Query annotation if the native query contains joins or complex filtering that prevents automatic count query generation?",
    "options": [
      "countQuery",
      "countProjection",
      "value",
      "countQueryRequired = true"
    ],
    "correctOptionIndex": 0,
    "explanation": "For paginated native queries, Spring Data JPA cannot reliably auto-generate a count query. You must explicitly define a secondary query in the 'countQuery' attribute (e.g., @Query(value = \"...\", countQuery = \"...\")) to fetch the total records."
  },
  {
    "id": "spring-data-19",
    "topic": "@Query annotation",
    "questionText": "If you pass an empty collection (e.g., an empty List) into a JPQL query parameter used in an 'IN' clause (e.g., WHERE u.id IN :ids), what is the behavior in modern Hibernate versions?",
    "options": [
      "It throws a PreparedStatement Exception because an empty IN clause (IN ()) is syntax-invalid in SQL.",
      "Hibernate translates it to a query that evaluates to false (like '1=0' or returns no results) without throwing an exception.",
      "It returns all records in the table, ignoring the clause.",
      "It blocks the thread and causes a deadlock."
    ],
    "correctOptionIndex": 1,
    "explanation": "Historically, empty collections caused syntax errors. Modern Hibernate versions handle this gracefully by generating a dummy condition (e.g., '1=0' or matching against NULL) so the query executes and safely returns no matches for that criteria."
  },
  {
    "id": "spring-data-20",
    "topic": "Entity lifecycle states",
    "questionText": "An entity instance that has an assigned primary key but is not associated with an active persistence context (EntityManager) and has no counterpart in the database yet is in which state?",
    "options": [
      "Transient",
      "Managed",
      "Detached",
      "Removed"
    ],
    "correctOptionIndex": 0,
    "explanation": "An entity is 'Transient' if it is newly created in Java memory and not yet associated with an EntityManager session. Even if it has an assigned ID, it remains transient until persist() is called or it is saved."
  },
  {
    "id": "spring-data-21",
    "topic": "Entity lifecycle states",
    "questionText": "What is the difference between EntityManager.persist() and EntityManager.merge() when dealing with a detached entity?",
    "options": [
      "persist() will throw an EntityExistsException (or duplicate key database error) because it attempts to insert a new row; merge() copies the state to a managed instance, querying the DB first if necessary.",
      "persist() attaches the detached entity directly back into the session; merge() deletes and re-inserts the entity.",
      "persist() returns a managed copy of the entity; merge() does not return anything (void).",
      "There is no difference; both perform SQL inserts."
    ],
    "correctOptionIndex": 0,
    "explanation": "persist() is strictly for making transient instances managed (SQL INSERT). Calling it with a detached instance (which already has an ID) violates this and throws an exception. merge() is for copying detached state into a managed instance (SQL UPDATE or INSERT)."
  },
  {
    "id": "spring-data-22",
    "topic": "Entity lifecycle states",
    "questionText": "In Spring Data JPA, when you call repository.save(entity), how does the default SimpleJpaRepository implementation decide whether to call persist() or merge()?",
    "options": [
      "If the entity implements Persistable and isNew() returns true, or if its @Id annotated field is null (or 0 for primitive types), it calls persist(); otherwise, it calls merge().",
      "It always calls merge() first, and if that fails, it catches the exception and calls persist().",
      "It parses the database logs to see if the record exists.",
      "It performs a SELECT count query for every single save() invocation to determine presence."
    ],
    "correctOptionIndex": 0,
    "explanation": "SimpleJpaRepository inspects the identifier property. If the ID is null or zero, it is assumed new and persist() is called. Otherwise, it is assumed existing, calling merge(). If using assigned IDs, you should implement Persistable to avoid unnecessary SELECT statements triggered by merge()."
  },
  {
    "id": "spring-data-23",
    "topic": "Entity lifecycle states",
    "questionText": "By default, when Hibernate performs dirty checking, how does it determine which columns to include in the SQL UPDATE statement?",
    "options": [
      "It updates all columns of the table, regardless of which fields were modified, unless the entity is annotated with @DynamicUpdate.",
      "It only updates the columns that were modified, by default.",
      "It compares the hashcode of the entity fields to update only changed columns.",
      "It updates only the primary key and the modified columns."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, Hibernate generates static UPDATE statements that update all columns of the entity to improve SQL execution plan caching. If you want Hibernate to generate dynamic SQL containing only modified fields, you must annotate the entity class with @DynamicUpdate."
  },
  {
    "id": "spring-data-24",
    "topic": "Entity lifecycle states",
    "questionText": "Which JPA entity lifecycle callback annotation is executed immediately before an entity is written to the database (either on insert or update) to perform audit-logging fields setup?",
    "options": [
      "@PrePersist and @PreUpdate",
      "@PostPersist and @PostUpdate",
      "@PreFlush",
      "@PostLoad"
    ],
    "correctOptionIndex": 0,
    "explanation": "@PrePersist is executed before an entity is first saved (SQL INSERT), and @PreUpdate is executed before an update (SQL UPDATE). These are perfect for setting fields like 'lastModifiedDate'."
  },
  {
    "id": "spring-data-25",
    "topic": "Entity lifecycle states",
    "questionText": "A User entity has a One-to-Many association to Address with orphanRemoval = true. What happens when you remove an Address instance from the User's address list and save the User?",
    "options": [
      "Hibernate automatically executes a DELETE statement for that Address record in the database.",
      "Hibernate sets the foreign key column of the Address table to NULL but leaves the record in the database.",
      "It throws a Foreign Key Constraint violation exception.",
      "Nothing happens until you call addressRepository.delete()."
    ],
    "correctOptionIndex": 0,
    "explanation": "Unlike CascadeType.REMOVE (which only deletes child entities when the parent itself is deleted), 'orphanRemoval = true' means that if a child is dissociated from the parent (removed from the collection), it becomes an orphan and Hibernate automatically deletes it from the database."
  },
  {
    "id": "spring-data-26",
    "topic": "Transaction management",
    "questionText": "Method A is annotated with @Transactional(propagation = Propagation.REQUIRED). It calls Method B, which is annotated with @Transactional(propagation = Propagation.REQUIRES_NEW). If Method B completes successfully but Method A subsequently throws a RuntimeException, what is the status of the changes made in Method B?",
    "options": [
      "Method B's changes are committed because it ran in its own independent transaction which completed before Method A rolled back.",
      "Method B's changes are rolled back because it joined Method A's outer transaction.",
      "Both transactions are rolled back because they are linked through the transaction manager.",
      "Method B's transaction goes into a suspended state indefinitely."
    ],
    "correctOptionIndex": 0,
    "explanation": "Propagation.REQUIRES_NEW suspends the outer transaction and starts a new independent transaction. Once Method B completes, its transaction commits. A rollback in the outer Method A has no effect on Method B's already-committed transaction."
  },
  {
    "id": "spring-data-27",
    "topic": "Transaction management",
    "questionText": "To prevent phantom reads (where a query inside transaction T1 returns new rows inserted by a concurrent transaction T2), which minimum isolation level should be configured?",
    "options": [
      "Isolation.READ_COMMITTED",
      "Isolation.REPEATABLE_READ",
      "Isolation.SERIALIZABLE",
      "Isolation.DEFAULT"
    ],
    "correctOptionIndex": 2,
    "explanation": "While REPEATABLE_READ prevents dirty and non-repeatable reads, only SERIALIZABLE guarantees prevention of phantom reads in SQL standards by locking ranges of keys (though some databases like MySQL/InnoDB can prevent them in REPEATABLE_READ using Next-Key Locks)."
  },
  {
    "id": "spring-data-28",
    "topic": "Transaction management",
    "questionText": "You have a UserService class with two methods: public void register() and @Transactional public void saveUser(). If register() calls saveUser() directly (e.g., this.saveUser()), is the transaction applied?",
    "options": [
      "No, because Spring's declarative transaction management uses AOP proxies, and self-invocation bypasses the proxy.",
      "Yes, Spring AOP intercepts all internal calls automatically.",
      "Yes, but only if the class is annotated with @Component instead of @Service.",
      "No, unless saveUser() is declared as private."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring's transaction management is proxy-based. When method register() calls saveUser() internally, it calls it on the target object directly ('this'), not on the proxy. Thus, the proxy interceptor is bypassed, and no transaction is started."
  },
  {
    "id": "spring-data-29",
    "topic": "Transaction management",
    "questionText": "By default, which of the following exceptions will cause a Spring @Transactional method to roll back the current transaction?",
    "options": [
      "Any exception inheriting from java.lang.Exception (both checked and unchecked exceptions).",
      "Only unchecked exceptions (RuntimeException) and Errors.",
      "Only checked exceptions (IOException, SQLException).",
      "Only NullPointerException and IllegalArgumentException."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring's default rollback behavior aligns with EJB: a transaction is rolled back automatically on unchecked exceptions (RuntimeException and subclasses) and java.lang.Error. For checked exceptions (subclasses of Exception excluding RuntimeException), it will not rollback unless 'rollbackFor' is specified."
  },
  {
    "id": "spring-data-30",
    "topic": "Transaction management",
    "questionText": "When using @Transactional(readOnly = true) with Hibernate as the JPA provider, how does Hibernate optimize the persistence context?",
    "options": [
      "It sets the FlushMode to FlushMode.MANUAL, skips dirty checking for entities, and avoids taking database write locks.",
      "It caches all query results in the second-level cache automatically.",
      "It disables the first-level cache entirely to save memory.",
      "It forces the database connection to use read-only hardware replicas."
    ],
    "correctOptionIndex": 0,
    "explanation": "Setting readOnly = true optimizes Hibernate session management. Hibernate sets FlushMode to MANUAL, which means it won't perform dirty checking checks on flush, improving CPU/memory performance. It also hints to the JDBC driver that the transaction is read-only."
  },
  {
    "id": "spring-data-31",
    "topic": "Transaction management",
    "questionText": "If method outer() with Propagation.REQUIRED calls method inner() with Propagation.MANDATORY, what happens if there is no active transaction when outer() is invoked?",
    "options": [
      "outer() starts a transaction, and inner() joins it successfully.",
      "An IllegalTransactionStateException is thrown when inner() is called.",
      "outer() runs without a transaction, and inner() throws an exception immediately upon invocation of outer().",
      "inner() starts a new transaction, leaving outer() non-transactional."
    ],
    "correctOptionIndex": 1,
    "explanation": "Propagation.MANDATORY requires that an active transaction must already exist. Since there is no transaction when outer() runs (assuming outer didn't start one), when the code reaches inner(), Spring will throw an IllegalTransactionStateException."
  },
  {
    "id": "spring-data-32",
    "topic": "Transaction management",
    "questionText": "You need to execute database updates in a separate transaction, but the transaction must be committed programmatically inside a specific block of code rather than waiting for the method to return. What is the recommended Spring component to use?",
    "options": [
      "TransactionTemplate",
      "JdbcTemplate",
      "PlatformTransactionManager directly with try-catch",
      "EntityManager.getTransaction().commit()"
    ],
    "correctOptionIndex": 0,
    "explanation": "TransactionTemplate is Spring's programmatic transaction management helper. It provides thread-safe transaction demarcation, exceptions handling, and proper rollback/commit resource cleanups, making it cleaner than raw PlatformTransactionManager calls."
  },
  {
    "id": "spring-data-33",
    "topic": "Transaction management",
    "questionText": "You want to publish a Spring ApplicationEvent inside a transaction, but ensure that the event listener is executed only after the transaction commits successfully. Which annotation should be used on the listener method?",
    "options": [
      "@EventListener",
      "@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)",
      "@TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)",
      "@Async"
    ],
    "correctOptionIndex": 1,
    "explanation": "@TransactionalEventListener binds listener execution to a transaction phase. The default phase is AFTER_COMMIT, ensuring the event is processed only after the database transaction has committed successfully."
  },
  {
    "id": "spring-data-34",
    "topic": "Caching in Spring Boot",
    "questionText": "A developer annotates a method with @Cacheable(value = 'books', key = '#isbn'). What does the key attribute represent?",
    "options": [
      "It defines the cache key using a Spring Expression Language (SpEL) expression that references the 'isbn' parameter of the method.",
      "It is a hardcoded string literal that represents the cache entry key.",
      "It refers to a property in application.properties.",
      "It specifies the database primary key of the Book entity."
    ],
    "correctOptionIndex": 0,
    "explanation": "The 'key' attribute in Spring's caching annotations accepts SpEL. '#isbn' retrieves the value of the method parameter named 'isbn' and uses it as the key for storing/retrieving values in the 'books' cache."
  },
  {
    "id": "spring-data-35",
    "topic": "Caching in Spring Boot",
    "questionText": "You want a method to invalidate and clear all entries in the 'products' cache whenever it is called. How should you configure the annotation?",
    "options": [
      "@CacheEvict(value = 'products', allEntries = true)",
      "@CacheEvict(value = 'products', clearAll = true)",
      "@CachePut(value = 'products', evict = true)",
      "@Cacheable(value = 'products', evictAll = true)"
    ],
    "correctOptionIndex": 0,
    "explanation": "@CacheEvict is used to remove data from caches. Setting 'allEntries = true' forces the cache manager to clear the entire 'products' cache, ignoring individual key resolutions."
  },
  {
    "id": "spring-data-36",
    "topic": "Caching in Spring Boot",
    "questionText": "What is the key difference between the @Cacheable and @CachePut annotations in Spring Boot?",
    "options": [
      "@Cacheable skips method execution if the key is found in the cache; @CachePut always executes the method and updates the cache with the result.",
      "@CachePut skips method execution if found, while @Cacheable always executes.",
      "@Cacheable is only for reading from DB; @CachePut is only for SQL UPDATE statements.",
      "There is no difference; they are aliases for each other."
    ],
    "correctOptionIndex": 0,
    "explanation": "@Cacheable acts as a cache look-aside: it reads from the cache first. @CachePut is used to update the cache; it always runs the method body and stores the returned value under the designated key."
  },
  {
    "id": "spring-data-37",
    "topic": "Caching in Spring Boot",
    "questionText": "Similar to @Transactional, why does calling a @Cacheable method from within another method of the same class fail to hit the cache?",
    "options": [
      "Because Spring's cache abstraction is implemented using AOP proxies, and internal calls bypass the proxy wrapper.",
      "Because caching does not support local method calls.",
      "Because Spring Boot cache requires an active JTA transaction.",
      "Because the second-level cache only works for direct entity queries."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Caching is powered by Spring AOP proxies. An internal call (self-invocation) targets the 'this' instance directly rather than the proxy object, meaning the interceptor that handles caching logic is never executed."
  },
  {
    "id": "spring-data-38",
    "topic": "Caching in Spring Boot",
    "questionText": "You want to cache the result of a method findBook(Long id), but ONLY if the returned Book object has its 'isRare' property set to true. Which attribute configuration is correct?",
    "options": [
      "@Cacheable(value = 'books', condition = '#result.isRare')",
      "@Cacheable(value = 'books', unless = '!#result.isRare')",
      "@Cacheable(value = 'books', filter = '#result.isRare')",
      "@Cacheable(value = 'books', unless = '#result == null || !#result.isRare')"
    ],
    "correctOptionIndex": 3,
    "explanation": "The 'unless' expression is evaluated AFTER the method completes, and has access to '#result'. If 'unless' is true, caching is vetoed. Therefore, unless '#result is null or not rare' (meaning we cache only when result is NOT null AND is rare) is the correct expression."
  },
  {
    "id": "spring-data-39",
    "topic": "Caching in Spring Boot",
    "questionText": "By default, if no external cache provider (like Redis, Hazelcast, or Caffeine) is configured in a Spring Boot application, what cache implementation is fallback-registered?",
    "options": [
      "ConcurrentMapCacheManager (using JVM ConcurrentHashMap)",
      "NoOpCacheManager (caching disabled)",
      "EhCacheManager",
      "RedisCacheManager"
    ],
    "correctOptionIndex": 0,
    "explanation": "If cache support is enabled (@EnableCaching) but no specific provider is configured, Spring Boot registers a ConcurrentMapCacheManager which stores cache data in simple ConcurrentHashMaps in JVM memory."
  },
  {
    "id": "spring-data-40",
    "topic": "Pagination & Sorting",
    "questionText": "What is the primary performance advantage of returning a Slice<User> instead of a Page<User> from a repository query method?",
    "options": [
      "Slice does not execute a count query to determine the total number of elements, saving a database roundtrip and query parsing overhead.",
      "Slice uses reactive non-blocking execution under the hood.",
      "Slice keeps all records in the first-level cache, while Page does not.",
      "Slice does not require a Pageable parameter."
    ],
    "correctOptionIndex": 0,
    "explanation": "Returning Page requires Spring Data to execute a count query to calculate total elements and pages. Slice only queries for the requested limit + 1 elements to determine if there is a next page, avoiding the expensive count query."
  },
  {
    "id": "spring-data-41",
    "topic": "Pagination & Sorting",
    "questionText": "Which of the following is the correct way to instantiate a Sort object to sort first by 'lastName' ascending, and then by 'firstName' descending?",
    "options": [
      "Sort.by('lastName').ascending().and(Sort.by('firstName').descending())",
      "Sort.by(Order.asc('lastName'), Order.desc('firstName'))",
      "new Sort('lastName ASC', 'firstName DESC')",
      "Sort.by('lastName', 'firstName').descending()"
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data's Sort class is fluent. You can combine sorts using .and(): Sort.by('lastName').ascending().and(Sort.by('firstName').descending()) is the standard approach."
  },
  {
    "id": "spring-data-42",
    "topic": "Pagination & Sorting",
    "questionText": "Why is offset-based pagination (e.g. LIMIT 10 OFFSET 100000) considered an anti-pattern for large datasets, and what is the alternative?",
    "options": [
      "The database must scan and discard all preceding offset rows, degrading performance. The alternative is keyset pagination (cursor-based), which filters using the last seen ID (e.g., WHERE id > last_id LIMIT 10).",
      "Offset-based pagination triggers an N+1 query problem automatically. The alternative is Fetch Joins.",
      "Offset-based pagination causes memory leaks in Hibernate first-level cache. The alternative is Slice.",
      "Offset is not supported by PostgreSQL or Oracle. The alternative is Pageable."
    ],
    "correctOptionIndex": 0,
    "explanation": "Offset pagination forces the database to read all rows up to OFFSET + LIMIT, even though it discards the offset rows. Keyset pagination avoids this scan by querying for values greater than the last record of the previous page."
  },
  {
    "id": "spring-data-43",
    "topic": "Pagination & Sorting",
    "questionText": "When using Pageable in a native query (nativeQuery = true), how does Spring Data JPA handle the ORDER BY clause if you pass a Sort object dynamically?",
    "options": [
      "It attempts to append the sort properties to the end of the native SQL query, but this can fail if the property names do not match the database column names exactly.",
      "It translates the camel-case properties of the Sort object to snake-case column names automatically.",
      "It ignores the Sort object entirely for native queries.",
      "It performs sorting in-memory in the JVM after fetching all records."
    ],
    "correctOptionIndex": 0,
    "explanation": "Spring Data appends sorting to native queries. However, because Sort properties correspond to Java Entity fields (e.g., firstName), it will append ORDER BY firstName, which will fail if the DB column is named first_name. You must map Sort names to match database columns."
  },
  {
    "id": "spring-data-44",
    "topic": "Pagination & Sorting",
    "questionText": "What does Hibernate do when you attempt to paginate a query that uses 'JOIN FETCH' to load a collection (e.g., fetching a User and their list of Orders)?",
    "options": [
      "It logs a warning ('firstResult/maxResults specified with collection fetch; applying in memory!') and fetches ALL rows to paginate them in memory, which can lead to OutOfMemoryError.",
      "It throws a QuerySyntaxException at application startup.",
      "It splits the query into two queries automatically to run pagination safely.",
      "It ignores the JOIN FETCH and executes lazy loading on-demand."
    ],
    "correctOptionIndex": 0,
    "explanation": "When join-fetching collections, database result rows duplicate parent entities (e.g., 1 user with 3 orders produces 3 rows). If Hibernate applied LIMIT/OFFSET, it would truncate the child rows, corrupting the collection. Thus, Hibernate is forced to load all records and paginate in memory."
  },
  {
    "id": "spring-data-45",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "Which of the following scenarios triggers the classic N+1 query problem in Hibernate?",
    "options": [
      "You fetch a list of N parents, and then iterate through them to access a lazy-loaded child association for each parent, causing 1 query for parents + N individual queries for children.",
      "You execute a single query that updates N rows in the database.",
      "You save N entities inside a loop, causing Hibernate to open N database connections.",
      "You fetch 1 entity that has N different columns."
    ],
    "correctOptionIndex": 0,
    "explanation": "The N+1 query problem occurs when you run 1 query to fetch N parent records (e.g., select * from user), and then for each user, you access an uninitialized lazy collection, forcing Hibernate to fire another SELECT query (N times)."
  },
  {
    "id": "spring-data-46",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "How does the @EntityGraph annotation solve the N+1 query problem when declared on a repository query method?",
    "options": [
      "It instructs Hibernate to perform an SQL JOIN FETCH for the specified paths in a single query, overriding their lazy-loading configuration.",
      "It saves all entities to the second-level cache, avoiding database calls.",
      "It uses a batch fetch size of 100 to group child queries.",
      "It generates a database view and queries the view instead."
    ],
    "correctOptionIndex": 0,
    "explanation": "@EntityGraph defines a plan for fetching associations. By specifying paths in @EntityGraph(attributePaths = {'orders'}), Hibernate generates an SQL JOIN to fetch those associations in a single database roundtrip, converting LAZY to EAGER for that query."
  },
  {
    "id": "spring-data-47",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "In JPQL, what is the syntactic difference between 'LEFT JOIN' and 'LEFT JOIN FETCH'?",
    "options": [
      "'LEFT JOIN' queries the related entities but does not populate the parent's association collection; 'LEFT JOIN FETCH' populates the association collection, preventing lazy loading queries.",
      "'LEFT JOIN FETCH' only works on native SQL queries, while 'LEFT JOIN' works in JPQL.",
      "'LEFT JOIN' is eager by default, while 'LEFT JOIN FETCH' is lazy.",
      "There is no difference; Hibernate treats them identically."
    ],
    "correctOptionIndex": 0,
    "explanation": "'JOIN' or 'LEFT JOIN' is used for filtering or projections (e.g. joining to query on order status). 'JOIN FETCH' tells Hibernate to fetch the association data and immediately construct the object graph and populate the collections of the returned entities."
  },
  {
    "id": "spring-data-48",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "If you cannot modify the repository query to use join fetches, which annotation can you put on a target entity collection to mitigate the N+1 query problem by loading child entities in chunks rather than one by one?",
    "options": [
      "@BatchSize(size = X)",
      "@Fetch(FetchMode.SUBSELECT)",
      "Both @BatchSize(size = X) and @Fetch(FetchMode.SUBSELECT) are valid approaches.",
      "@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)"
    ],
    "correctOptionIndex": 2,
    "explanation": "Both options mitigate N+1. @BatchSize loads child associations in batches of size X (e.g. SELECT ... WHERE parent_id IN (1, 2, ... X)). @Fetch(FetchMode.SUBSELECT) fetches all child associations using a subselect of the original query."
  },
  {
    "id": "spring-data-49",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "What is the scope and duration of Hibernate's First-Level Cache?",
    "options": [
      "It is bound to the EntityManager (Session) and lasts for the duration of the transaction/session.",
      "It is shared across all threads and lasts until the application restarts.",
      "It is bound to the JVM heap and managed by the Garbage Collector.",
      "It is stored in the database temporary tables."
    ],
    "correctOptionIndex": 0,
    "explanation": "The First-Level Cache is the Hibernate Session (or JPA EntityManager). It is transaction/session-scoped and isolated to the executing thread. It is cleared when the session is closed or cleared."
  },
  {
    "id": "spring-data-50",
    "topic": "Hibernate & N+1 Query Problem",
    "questionText": "Why does accessing a Lazy-loaded association (e.g., user.getOrders().size()) outside a @Transactional service method throw a LazyInitializationException?",
    "options": [
      "Because the EntityManager/Session has already closed, and the uninitialized proxy object cannot access the database to load the data.",
      "Because lazy loading is disabled when using DTOs.",
      "Because the collection exceeds the max-fetch size limit.",
      "Because Hibernate does not support collection methods outside transactions."
    ],
    "correctOptionIndex": 0,
    "explanation": "Hibernate uses proxy objects (or byte-code enhancement) for lazy associations. When the transaction completes, the EntityManager is closed. If you subsequently access the lazy collection, the proxy attempts to lazy-load but fails because the Session is closed, throwing LazyInitializationException."
  },
  {
    "id": "spring-web-sec-1",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants to build a RESTful API where every handler method automatically serializes the returned object directly into the HTTP response body instead of resolving an HTML view. Which annotation is the most appropriate to use at the class level?",
    "options": [
      "@Controller",
      "@RestController",
      "@ResponseBody",
      "@Component"
    ],
    "correctOptionIndex": 1,
    "explanation": "@RestController is a convenience annotation that combines @Controller and @ResponseBody. This ensures that all handler methods within the controller return their data directly in the response body (typically serialized to JSON or XML) rather than using a ViewResolver."
  },
  {
    "id": "spring-web-sec-2",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Web MVC, what is the key difference between using @PathVariable and @RequestParam for capturing request data?",
    "options": [
      "@PathVariable reads variables from the HTTP headers, while @RequestParam reads them from the request path segment.",
      "@PathVariable maps placeholders in the URI path template (e.g., /users/{id}), while @RequestParam extracts query parameters from the query string (e.g., /users?id=123) or form parameters.",
      "@PathVariable is only used for POST request payloads, whereas @RequestParam is exclusively used for GET request query parameters.",
      "There is no difference; they are aliases for each other and can be used interchangeably in any scenario."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PathVariable is used to extract values directly from the URI path template (matching placeholder variables like {id} in @GetMapping(\"/users/{id}\")). @RequestParam is used to extract query parameters from the request URI (e.g., ?id=123) or form data from a POST request."
  },
  {
    "id": "spring-web-sec-3",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants a controller method to handle requests sent to either /api/v1/items or /api/v2/items. How can this be configured using the @RequestMapping annotation (or one of its shortcuts like @GetMapping)?",
    "options": [
      "By defining multiple controller methods with identical signatures, each mapping to one of the paths.",
      "By providing an array of string paths to the value or path attribute, e.g., @GetMapping(value = {\"/api/v1/items\", \"/api/v2/items\"}).",
      "By using a wildcard match like @GetMapping(\"/api/*/items\") which automatically restricts it to only v1 and v2.",
      "This is not supported in Spring MVC; a controller method can only map to exactly one path pattern."
    ],
    "correctOptionIndex": 1,
    "explanation": "The value (or path) attribute of @RequestMapping (and its shortcut annotations like @GetMapping, @PostMapping, etc.) accepts an array of Strings, allowing a single method to handle requests directed to multiple distinct paths."
  },
  {
    "id": "spring-web-sec-4",
    "topic": "Spring Web & Security",
    "questionText": "Under what condition can a developer use Matrix Variables (e.g., /cars;color=red;year=2012) in a Spring MVC controller, and how must it be enabled?",
    "options": [
      "They are enabled by default and require no configuration; you only need to annotate the controller method parameter with @MatrixVariable.",
      "The developer must set the removeSemicolonContent property of UrlPathHelper to false in the MVC configuration, and use the @MatrixVariable annotation in the handler method.",
      "Matrix variables are only supported when using Spring WebFlux and are completely unsupported in Spring Web MVC.",
      "The developer must change the HTTP method to PATCH, as matrix variables are only parsed for PATCH request paths."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Spring Web MVC, request paths are parsed by UrlPathHelper, which by default removes semicolon content (matrix variables) for path matching. To use matrix variables, you must configure Spring MVC to disable this behavior (setting removeSemicolonContent to false via a WebMvcConfigurer implementation) and use @MatrixVariable in the controller method parameters."
  },
  {
    "id": "spring-web-sec-5",
    "topic": "Spring Web & Security",
    "questionText": "A controller method should only handle POST requests containing JSON payloads and must return a JSON response. Which configuration on @PostMapping is correct?",
    "options": [
      "@PostMapping(path = \"/data\", consumes = \"application/json\", produces = \"application/json\")",
      "@PostMapping(path = \"/data\", headers = {\"Content-Type=application/json\", \"Accept=application/json\"})",
      "@PostMapping(path = \"/data\", params = \"format=json\")",
      "Both A and B are identical in behavior and represent the standard way of handling content negotiation."
    ],
    "correctOptionIndex": 0,
    "explanation": "The consumes attribute specifies the media types that the request's Content-Type header must match (e.g., application/json). The produces attribute specifies the media types that the controller can return, which must match the request's Accept header. While headers could check headers, using consumes and produces is the standard, built-in mechanism for mapping requests based on content negotiation."
  },
  {
    "id": "spring-web-sec-6",
    "topic": "Spring Web & Security",
    "questionText": "If a query parameter is optional in a request (e.g., /search?query=spring), how should the @RequestParam parameter be defined in the controller method to avoid a MissingServletRequestParameterException when the parameter is absent?",
    "options": [
      "By setting the required attribute to false, e.g., @RequestParam(value = \"query\", required = false).",
      "By wrapping the parameter type in java.util.Optional, e.g., @RequestParam(\"query\") Optional<String> query.",
      "By providing a defaultValue, e.g., @RequestParam(value = \"query\", defaultValue = \"\").",
      "All of the above options are valid ways to prevent the exception."
    ],
    "correctOptionIndex": 3,
    "explanation": "All three options are valid: setting required = false returns null for objects when absent; using java.util.Optional wraps the value or returns an empty optional; providing a defaultValue automatically supplies the specified default string, which also implicitly sets required to false."
  },
  {
    "id": "spring-web-sec-7",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants to redirect the client to an external URL https://example.com/login from a Spring MVC @Controller method. What is the most idiomatic way to achieve this?",
    "options": [
      "Return the string \"redirect:https://example.com/login\".",
      "Return new RedirectView(\"https://example.com/login\").",
      "Return a ResponseEntity with status HttpStatus.FOUND (302) and a Location header containing the URL.",
      "All of the above are valid methods to trigger a redirect to the external URL."
    ],
    "correctOptionIndex": 3,
    "explanation": "Returning a string prefixed with \"redirect:\", returning a RedirectView instance, or returning a ResponseEntity with a 302/307 status and the Location header are all fully supported and valid methods to redirect a client in Spring MVC."
  },
  {
    "id": "spring-web-sec-8",
    "topic": "Spring Web & Security",
    "questionText": "In a Spring Web MVC controller, what is the primary benefit of returning a DeferredResult<ResponseEntity<T>> instead of a direct ResponseEntity<T>?",
    "options": [
      "It automatically serializes the response using XML instead of JSON.",
      "It offloads long-running request processing to a separate thread, freeing up the Servlet container thread (e.g., Tomcat request thread) to handle other incoming requests.",
      "It bypasses the Spring Security filter chain entirely to speed up execution.",
      "It enables reactive backpressure control directly on the client side using HTTP/2 flow control."
    ],
    "correctOptionIndex": 1,
    "explanation": "DeferredResult is used for asynchronous request processing. When a controller returns DeferredResult, Spring MVC releases the container's request thread immediately so it can process other requests. The response is written asynchronously once another thread sets a value in the DeferredResult object."
  },
  {
    "id": "spring-web-sec-9",
    "topic": "Spring Web & Security",
    "questionText": "A client sends a POST request with a JSON body representing a user registration. How does Spring MVC extract this JSON body and bind it to a Java object in the controller method?",
    "options": [
      "By using the @RequestParam annotation on a Map parameter.",
      "By annotating the parameter with @RequestBody, which instructs an HttpMessageConverter to deserialize the body into the target Java object.",
      "By injecting the HttpServletRequest and manually parsing the InputStream using a raw Jackson ObjectMapper.",
      "Spring MVC does this automatically for any parameter that matches the request object name without any annotation."
    ],
    "correctOptionIndex": 1,
    "explanation": "The @RequestBody annotation indicates that a method parameter should be bound to the body of the web request. Internally, Spring uses configured HttpMessageConverters (like MappingJackson2HttpMessageConverter) to convert the request body (e.g., JSON) into the Java object representation."
  },
  {
    "id": "spring-web-sec-10",
    "topic": "Spring Web & Security",
    "questionText": "Which annotation is used to map a specific HTTP header value from an incoming request to a controller method argument?",
    "options": [
      "@RequestHeader",
      "@HeaderValue",
      "@HttpHeader",
      "@PathVariable"
    ],
    "correctOptionIndex": 0,
    "explanation": "@RequestHeader is the official Spring MVC annotation used to bind request headers to controller method parameters. For example: @RequestHeader(\"User-Agent\") String userAgent."
  },
  {
    "id": "spring-web-sec-11",
    "topic": "Spring Web & Security",
    "questionText": "How does the scope of an @ExceptionHandler method declared inside a specific @Controller class differ from one declared inside a @ControllerAdvice class?",
    "options": [
      "The @ExceptionHandler in a controller only applies to exceptions thrown within that controller, whereas one in a @ControllerAdvice applies globally across all controllers.",
      "The @ExceptionHandler in a controller applies globally, while one in a @ControllerAdvice only applies to security-related exceptions.",
      "There is no difference; both are global and will conflict if they handle the same exception type.",
      "@ControllerAdvice only works for REST controllers, while local @ExceptionHandler methods only work for traditional MVC view controllers."
    ],
    "correctOptionIndex": 0,
    "explanation": "An @ExceptionHandler method defined within a specific @Controller or @RestController handles exceptions thrown only by handler methods in that specific controller class. If defined in a @ControllerAdvice or @RestControllerAdvice class, it acts globally and can handle exceptions thrown across all controllers in the application context."
  },
  {
    "id": "spring-web-sec-12",
    "topic": "Spring Web & Security",
    "questionText": "If a controller throws a NullPointerException (which extends RuntimeException), and a @ControllerAdvice has defined handlers for both NullPointerException and RuntimeException, which exception handler will Spring MVC execute?",
    "options": [
      "It will throw an AmbiguousExceptionHandlerException because two matching handlers are found.",
      "It will execute the handler for RuntimeException because it is the more general/generic type.",
      "It will execute the handler for NullPointerException because Spring MVC resolves the most specific matching handler first.",
      "It will execute both handlers sequentially starting from the most generic one."
    ],
    "correctOptionIndex": 2,
    "explanation": "Spring MVC's exception resolver matches the thrown exception to the handler using a hierarchy traversal, picking the handler for the exception type that is closest in the inheritance tree (the most specific match). Thus, NullPointerException will be handled by the handler declared for NullPointerException, not RuntimeException."
  },
  {
    "id": "spring-web-sec-13",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants a custom exception ResourceNotFoundException to automatically result in an HTTP 404 Not Found response whenever it is thrown from a controller, without writing a separate @ExceptionHandler method. How can this be done?",
    "options": [
      "Annotate the ResourceNotFoundException class with @ResponseStatus(value = HttpStatus.NOT_FOUND).",
      "Implement the HandlerExceptionResolver interface inside the custom exception class.",
      "Annotate the exception class with @ControllerAdvice.",
      "Configure the default error page in application.properties to redirect all errors to 404."
    ],
    "correctOptionIndex": 0,
    "explanation": "@ResponseStatus can be applied directly to custom exception classes. When such an exception is thrown from a controller method and goes unhandled, the ResponseStatusExceptionResolver automatically intercepts it and sets the response status and reason according to the values specified in the annotation."
  },
  {
    "id": "spring-web-sec-14",
    "topic": "Spring Web & Security",
    "questionText": "What is the primary difference between @ControllerAdvice and @RestControllerAdvice?",
    "options": [
      "@RestControllerAdvice is only active if the application is using Spring WebFlux instead of Spring MVC.",
      "@RestControllerAdvice combines @ControllerAdvice with @ResponseBody, meaning exception handler methods inside it automatically serialize their return values to the response body (e.g., as JSON) rather than rendering a view.",
      "@ControllerAdvice only intercepts security exceptions, while @RestControllerAdvice handles all exceptions.",
      "@RestControllerAdvice runs before the Spring Security filter chain, whereas @ControllerAdvice runs after it."
    ],
    "correctOptionIndex": 1,
    "explanation": "Just like @RestController is a convenience annotation that combines @Controller and @ResponseBody, @RestControllerAdvice is a convenience annotation that combines @ControllerAdvice and @ResponseBody. This ensures that any object returned from an @ExceptionHandler method inside it will be converted directly to the response body (typically JSON) using an HttpMessageConverter."
  },
  {
    "id": "spring-web-sec-15",
    "topic": "Spring Web & Security",
    "questionText": "When customizing default error responses in a Spring Boot application, which bean can be overridden to customize the attributes included in the default JSON error payload returned on /error?",
    "options": [
      "ErrorController",
      "DefaultErrorAttributes",
      "HandlerExceptionResolver",
      "HttpErrorFieldCustomizer"
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Boot uses a DefaultErrorAttributes bean to collect error attributes (such as message, path, timestamp, status, etc.) to expose in the error response. By declaring a custom @Bean of type ErrorAttributes (or extending DefaultErrorAttributes), developers can modify or remove default fields from the JSON error payload."
  },
  {
    "id": "spring-web-sec-16",
    "topic": "Spring Web & Security",
    "questionText": "A controller method returns a Callable<String> to process a request asynchronously. If an exception is thrown inside the Callable task, how does Spring MVC handle it?",
    "options": [
      "The exception is swallowed and a blank HTTP 200 OK is returned to the client.",
      "The Servlet container immediately crashes because the thread running the Callable does not have access to the DispatcherServlet.",
      "Spring MVC intercepts the exception thrown during asynchronous execution and passes it to the configured @ExceptionHandler methods (e.g. in a @ControllerAdvice) just as if it were thrown by a synchronous handler.",
      "Asynchronous exceptions cannot be handled by @ExceptionHandler and must be handled using a custom DeferredResultProcessingInterceptor only."
    ],
    "correctOptionIndex": 2,
    "explanation": "During asynchronous request processing (with Callable or DeferredResult), if an error occurs during the async task execution, Spring MVC catches it and dispatches the request back to the container with the error. This triggers standard error dispatching where the ExceptionHandlerExceptionResolver is used to invoke the appropriate @ExceptionHandler method."
  },
  {
    "id": "spring-web-sec-17",
    "topic": "Spring Web & Security",
    "questionText": "In Spring MVC, which component is responsible for serializing a Java object returned from a @ResponseBody method into JSON for the HTTP response body?",
    "options": [
      "ViewResolver",
      "HttpMessageConverter (specifically MappingJackson2HttpMessageConverter)",
      "ContentNegotiationManager",
      "ModelAndView"
    ],
    "correctOptionIndex": 1,
    "explanation": "HttpMessageConverter implementations are responsible for converting request payloads to Java objects and Java objects to response payloads. For JSON serialization and deserialization, Spring MVC uses MappingJackson2HttpMessageConverter by default if Jackson is on the classpath."
  },
  {
    "id": "spring-web-sec-18",
    "topic": "Spring Web & Security",
    "questionText": "A developer needs to configure Spring MVC to determine the requested media type using a query parameter named mediaType (e.g., /products?mediaType=xml) rather than using the Accept header. Which method on ContentNegotiationConfigurer enables this?",
    "options": [
      "configurer.favorParameter(true).parameterName(\"mediaType\")",
      "configurer.useQueryString(true).queryParamName(\"mediaType\")",
      "configurer.mediaTypeParameter(\"mediaType\")",
      "configurer.enableParameterNegotiation().name(\"mediaType\")"
    ],
    "correctOptionIndex": 0,
    "explanation": "To configure content negotiation in Spring MVC, you implement WebMvcConfigurer and override configureContentNegotiation. Using ContentNegotiationConfigurer, you can call favorParameter(true) and set the custom parameter name with parameterName(\"mediaType\") to allow clients to request a specific media type via a query parameter."
  },
  {
    "id": "spring-web-sec-19",
    "topic": "Spring Web & Security",
    "questionText": "By default in modern Spring Boot (Spring Boot 3.x / Spring MVC 6.x), which strategy is NOT enabled for content negotiation due to security issues like Reflected File Download (RFD) attacks?",
    "options": [
      "Content negotiation via HTTP Accept headers.",
      "Content negotiation via request query parameters.",
      "Content negotiation via URI path extensions (e.g., /users.json).",
      "Content negotiation via default fallback to application/json."
    ],
    "correctOptionIndex": 2,
    "explanation": "Content negotiation via suffix/path extension (e.g., /users.json or /users.xml) has been deprecated and disabled by default in Spring MVC for security reasons (RFD attacks) and to align with modern web standards. The HTTP Accept header is the primary recommended approach."
  },
  {
    "id": "spring-web-sec-20",
    "topic": "Spring Web & Security",
    "questionText": "To implement a custom message converter for a proprietary data format (e.g., proto or custom CSV), which base class should a developer extend to simplify the implementation?",
    "options": [
      "AbstractHttpMessageConverter<T>",
      "GenericHttpMessageConverter<T>",
      "HttpMessageConverter interface directly",
      "ObjectToStringHttpMessageConverter"
    ],
    "correctOptionIndex": 0,
    "explanation": "Extending AbstractHttpMessageConverter<T> is the standard way to write a custom message converter. It handles common tasks like checking supported media types, writing headers, and delegates the actual reading and writing of the object to template methods readInternal and writeInternal which the developer implements."
  },
  {
    "id": "spring-web-sec-21",
    "topic": "Spring Web & Security",
    "questionText": "During content negotiation, a client sends a request with Accept: application/xml, application/json;q=0.8. If the server controller method is capable of returning both XML and JSON, which format will the client receive and why?",
    "options": [
      "JSON, because JSON has a higher default priority in Spring Boot applications.",
      "XML, because it has a higher quality factor (q-value of 1.0 implicitly, compared to q=0.8 for JSON).",
      "The server will return HTTP 406 Not Acceptable because the client provided conflicting formats.",
      "The server will return a multipart response containing both formats."
    ],
    "correctOptionIndex": 1,
    "explanation": "In HTTP content negotiation, the q parameter indicates the relative quality factor/preference of the media type (ranging from 0.0 to 1.0, defaulting to 1.0 if omitted). Since application/xml has an implicit q of 1.0 and application/json has q=0.8, the server selects application/xml because it has the higher priority for the client."
  },
  {
    "id": "spring-web-sec-22",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Security, how is the security filter chain integrated into the standard Servlet container filter lifecycle?",
    "options": [
      "Spring Security bypasses the Servlet container and hooks directly into the JVM network sockets.",
      "Spring Security registers a single Servlet filter named DelegatingFilterProxy in the Servlet container, which delegates HTTP requests to a Spring-managed bean named FilterChainProxy.",
      "Spring Security requires replacing the default Servlet container (like Tomcat) with a custom Spring-branded servlet container.",
      "Every Spring Security filter is registered individually as a standard Servlet filter bean in the Tomcat context."
    ],
    "correctOptionIndex": 1,
    "explanation": "The standard Servlet container does not know about Spring beans. Therefore, Spring registers DelegatingFilterProxy (a standard Servlet Filter) which acts as a bridge, delegating all filtering work to a Spring-managed FilterChainProxy bean. FilterChainProxy then runs the request through the configured SecurityFilterChain beans."
  },
  {
    "id": "spring-web-sec-23",
    "topic": "Spring Web & Security",
    "questionText": "In a Spring Boot application, how can a developer configure multiple distinct security policies (e.g., one for public APIs /api/public/** using JWT and another for web UI /web/** using form login)?",
    "options": [
      "By defining a single SecurityFilterChain bean and splitting it using a standard Java if-else statement.",
      "By defining multiple SecurityFilterChain beans in the Spring context, each configured with an @Order annotation and a securityMatcher to define which request paths it applies to.",
      "Spring Security only allows a single SecurityFilterChain bean to be active per application; multiple policies require running separate microservices.",
      "By using the WebSecurityConfigurerAdapter and overriding the configure method twice."
    ],
    "correctOptionIndex": 1,
    "explanation": "Spring Security supports multiple SecurityFilterChain beans. By using the @Order annotation on the filter chain beans and configuring a matcher (like http.securityMatcher(\"/api/public/**\")), you specify the order of evaluation and the path patterns each chain handles. The first chain that matches the incoming request URL is selected."
  },
  {
    "id": "spring-web-sec-24",
    "topic": "Spring Web & Security",
    "questionText": "What is the primary contract/interface used by Spring Security's DaoAuthenticationProvider to retrieve user credentials and authorities based on a username?",
    "options": [
      "AuthenticationManager",
      "UserDetailsService",
      "UserDetails",
      "PasswordEncoder"
    ],
    "correctOptionIndex": 1,
    "explanation": "UserDetailsService is the core interface used to retrieve user authentication and authorization information. It contains a single method: loadUserByUsername(String username), which returns a UserDetails object containing the username, password, and granted authorities."
  },
  {
    "id": "spring-web-sec-25",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants to support authentication via both database-backed credentials and LDAP credentials. What is the correct way to model this in Spring Security's architecture?",
    "options": [
      "Implement a single UserDetailsService that manually queries both database and LDAP servers sequentially.",
      "Register two separate AuthenticationProvider beans (e.g., DaoAuthenticationProvider and LdapAuthenticationProvider) within the AuthenticationManager.",
      "Define two separate SecurityFilterChain beans with identical matchers.",
      "It is not possible; Spring Security's AuthenticationManager can only handle one authentication provider at a time."
    ],
    "correctOptionIndex": 1,
    "explanation": "The AuthenticationManager (typically ProviderManager) contains a list of AuthenticationProvider instances. When authenticating, it iterates through these providers. The first provider that supports the authentication token and successfully validates the credentials returns a fully authenticated token, allowing multiple authentication mechanisms (database, LDAP, etc.) to coexist."
  },
  {
    "id": "spring-web-sec-26",
    "topic": "Spring Web & Security",
    "questionText": "By default, Spring Security stores the security context (currently logged-in user details) in a ThreadLocal. What is the implication of this when a request handler spawns child threads or uses @Async methods?",
    "options": [
      "The child threads automatically inherit the security context from the parent thread.",
      "The security context is not available in the child threads because ThreadLocal variables are restricted to the thread that set them.",
      "Spring Security automatically intercepts all thread creations in the JVM to copy the context.",
      "The application will crash with a ConcurrentModificationException as soon as the child thread starts."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because the default strategy is MODE_THREADLOCAL, the security context is bound strictly to the current thread. Child threads (including tasks executed in @Async methods or thread pools) will not have access to the security context unless the strategy is changed (e.g., to MODE_INHERITABLETHREADLOCAL) or the tasks are wrapped with Spring Security's concurrent primitives (like DelegatingSecurityContextExecutor)."
  },
  {
    "id": "spring-web-sec-27",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Security 6, how should you obtain and expose the AuthenticationManager bean if it is needed for manual authentication (e.g., in a custom login REST endpoint)?",
    "options": [
      "By injecting the AuthenticationManagerBuilder into the controller and building it on every request.",
      "By declaring a bean of type AuthenticationManager that retrieves it from the AuthenticationConfiguration, using authenticationConfiguration.getAuthenticationManager().",
      "By extending WebSecurityConfigurerAdapter and calling super.authenticationManagerBean().",
      "The AuthenticationManager is automatically exposed as a public bean by default and can be directly @Autowired without any configuration."
    ],
    "correctOptionIndex": 1,
    "explanation": "In Spring Security 6 (where configuration is component-based and WebSecurityConfigurerAdapter is removed), you expose the AuthenticationManager as a bean by defining a @Bean method that takes AuthenticationConfiguration as a parameter and calls getAuthenticationManager()."
  },
  {
    "id": "spring-web-sec-28",
    "topic": "Spring Web & Security",
    "questionText": "What is the design reason for extending OncePerRequestFilter instead of implementing jakarta.servlet.Filter or extending GenericFilterBean when writing a custom authentication filter?",
    "options": [
      "OncePerRequestFilter runs asynchronously, whereas the others run synchronously.",
      "OncePerRequestFilter guarantees that the filter is only executed once per request, preventing redundant executions that can occur during internal servlet forwards or error dispatches.",
      "OncePerRequestFilter automatically performs JWT parsing, whereas the others require manual parsing.",
      "OncePerRequestFilter is the only filter type supported by the SecurityFilterChain."
    ],
    "correctOptionIndex": 1,
    "explanation": "A standard Servlet Filter might be invoked multiple times for a single request if the request is forwarded internally (e.g., forward to an error page or a JSP view). OncePerRequestFilter ensures that the filter's doFilterInternal method is executed exactly once per incoming request."
  },
  {
    "id": "spring-web-sec-29",
    "topic": "Spring Web & Security",
    "questionText": "A client makes a request using HTTP Basic authentication. What does the Authorization header in the HTTP request contain?",
    "options": [
      "A cryptographically signed JSON Web Token (JWT).",
      "The plain string Basic followed by the username and password separated by a colon (e.g., Basic admin:password).",
      "The string Basic followed by the Base64-encoded representation of the username and password joined by a colon (e.g., Basic YWRtaW46cGFzc3dvcmQ=).",
      "An MD5 hash of the username, password, and request URI."
    ],
    "correctOptionIndex": 2,
    "explanation": "HTTP Basic Authentication requires the client to send an Authorization header containing the word Basic followed by a space and a Base64-encoded string of username:password."
  },
  {
    "id": "spring-web-sec-30",
    "topic": "Spring Web & Security",
    "questionText": "When configuring a Spring Security Resource Server to validate JWTs locally using a set of public keys, which configuration property in application.yml is commonly used to auto-configure the JWT decoder with the authorization server's JWKS (JSON Web Key Set) endpoint?",
    "options": [
      "spring.security.oauth2.resourceserver.jwt.jwk-set-uri",
      "spring.security.oauth2.resourceserver.jwt.issuer-uri",
      "spring.security.oauth2.resourceserver.jwt.client-secret",
      "Both A and B are valid properties that can auto-configure the JWT decoder."
    ],
    "correctOptionIndex": 3,
    "explanation": "Both properties work. Setting jwk-set-uri points directly to the JWK Set endpoint for public key retrieval. Setting issuer-uri allows the resource server to use OpenID Connect discovery to find the JWKS endpoint (along with validating the token's issuer claim)."
  },
  {
    "id": "spring-web-sec-31",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Security, what is the main difference between configuring an application as an OAuth2 Client versus an OAuth2 Resource Server?",
    "options": [
      "An OAuth2 Client handles user login (redirection to authorization server, exchange of code for tokens), while a Resource Server accepts and validates access tokens in incoming request headers to protect API endpoints.",
      "An OAuth2 Client validates JWTs, while an OAuth2 Resource Server issues JWTs.",
      "An OAuth2 Client is used for microservices, whereas an OAuth2 Resource Server is only used for monoliths.",
      "There is no difference; the terms are synonyms in Spring Security."
    ],
    "correctOptionIndex": 0,
    "explanation": "An OAuth2 Client is responsible for initiating authentication, acquiring tokens (using authorization code grant, client credentials, etc.), and managing OAuth2/OIDC sessions. A Resource Server is an API that verifies access tokens (typically sent as Bearer tokens in the Authorization header) to authorize access to its resources."
  },
  {
    "id": "spring-web-sec-32",
    "topic": "Spring Web & Security",
    "questionText": "Under the OpenID Connect (OIDC) specification supported by Spring Security, what is the primary purpose of the id_token compared to the access_token?",
    "options": [
      "The id_token is used to authorize API calls, while the access_token is used to identify the user.",
      "The id_token is a JWT containing claims about the identity of the authenticated user (designed for the client application), while the access_token is an opaque or JWT token intended for the resource server to authorize API requests.",
      "The id_token is used for Basic Authentication, while the access_token is used for JWT Authentication.",
      "The id_token is stored on the server side, whereas the access_token is stored on the client side."
    ],
    "correctOptionIndex": 1,
    "explanation": "An id_token is specific to OIDC and contains information (claims) about the authenticated user's identity (e.g., name, email, sub). It is intended to be read by the client application. The access_token is designed to authorize access to resources and is sent to resource servers (APIs) which validate it to grant access."
  },
  {
    "id": "spring-web-sec-33",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants to add a custom JWT authentication filter (JwtAuthenticationFilter) before the standard username-password authentication filter. What is the correct way to register it in the SecurityFilterChain configuration?",
    "options": [
      "http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)",
      "http.addFilterAt(jwtFilter, UsernamePasswordAuthenticationFilter.class)",
      "http.registerFilter(jwtFilter).before(UsernamePasswordAuthenticationFilter.class)",
      "Spring Security automatically detects the custom filter if it is declared as a @Component and orders it correctly."
    ],
    "correctOptionIndex": 0,
    "explanation": "To position a custom filter relative to standard Spring Security filters, you use the addFilterBefore method of HttpSecurity (or addFilterAfter, addFilterAt). In this case, http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class) is the correct API call. Note: registering custom filters as Spring @Components can sometimes cause them to be registered twice (once in the Servlet filter chain and once in the Security filter chain), which is why manual registration in the config is preferred."
  },
  {
    "id": "spring-web-sec-34",
    "topic": "Spring Web & Security",
    "questionText": "In modern Spring Security OAuth2 configurations, why is Proof Key for Code Exchange (PKCE) used in conjunction with the Authorization Code Grant?",
    "options": [
      "To encrypt the client secret so it is never transmitted over the network.",
      "To prevent authorization code interception attacks, especially in public clients (like mobile or single-page apps) that cannot securely store a client secret.",
      "To bypass the requirement of having an HTTPS connection.",
      "To speed up the token exchange process by caching the authorization code."
    ],
    "correctOptionIndex": 1,
    "explanation": "PKCE (RFC 7636) is an extension to the OAuth 2.0 Authorization Code Flow. It prevents an attacker who intercepts the authorization code from exchanging it for an access token by requiring a dynamically generated cryptographic challenge (code_challenge and code_verifier), which does not rely on a static client secret."
  },
  {
    "id": "spring-web-sec-35",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Security 6, which annotation is used at the configuration class level to enable method-level security annotations such as @PreAuthorize and @PostAuthorize?",
    "options": [
      "@EnableGlobalMethodSecurity(prePostEnabled = true)",
      "@EnableMethodSecurity",
      "@EnableMethodSecurity(prePostEnabled = true)",
      "@EnableSecured"
    ],
    "correctOptionIndex": 1,
    "explanation": "In Spring Security 6, @EnableMethodSecurity is the modern annotation used to enable method-level security, replacing the deprecated @EnableGlobalMethodSecurity. By default, @EnableMethodSecurity has prePostEnabled set to true, so you don't need to specify it explicitly."
  },
  {
    "id": "spring-web-sec-36",
    "topic": "Spring Web & Security",
    "questionText": "A developer wants to secure a service method such that it only executes if the authenticated user's username matches the method's string argument named username. Which annotation and expression is correct?",
    "options": [
      "@PreAuthorize(\"#username == authentication.name\")",
      "@PostAuthorize(\"username == principal.username\")",
      "@PreAuthorize(\"authentication.principal.username == #username\")",
      "Both A and C are valid configurations, assuming the principal is a standard UserDetails."
    ],
    "correctOptionIndex": 3,
    "explanation": "In @PreAuthorize, SpEL (Spring Expression Language) has access to the method arguments prefixed with # (e.g., #username). It also has access to the authentication object. authentication.name returns the username. If the principal is a UserDetails object, authentication.principal.username is also valid."
  },
  {
    "id": "spring-web-sec-37",
    "topic": "Spring Web & Security",
    "questionText": "What is the primary difference between using @PreAuthorize and @PostAuthorize on a service method?",
    "options": [
      "@PreAuthorize works for database operations, whereas @PostAuthorize only works for REST endpoints.",
      "@PreAuthorize performs authorization checks before the method is invoked, while @PostAuthorize executes the method first and then performs the check on the returned object before returning it to the caller.",
      "@PreAuthorize checks roles, while @PostAuthorize checks permissions.",
      "@PostAuthorize is used to catch exceptions thrown by the method, while @PreAuthorize prevents exceptions."
    ],
    "correctOptionIndex": 1,
    "explanation": "@PreAuthorize is evaluated before the method execution begins; if the check fails, execution is blocked and an AccessDeniedException is thrown. @PostAuthorize is evaluated after the method completes, allowing access to the method's return value (via the returnObject placeholder in SpEL) to determine if the client is authorized to receive it."
  },
  {
    "id": "spring-web-sec-38",
    "topic": "Spring Web & Security",
    "questionText": "In a @PreAuthorize SpEL expression, what is the conceptual difference between hasRole('ADMIN') and hasAuthority('ADMIN') in Spring Security?",
    "options": [
      "hasRole('ADMIN') automatically prefixes the string with ROLE_ (resulting in a check for ROLE_ADMIN), whereas hasAuthority('ADMIN') checks for the exact authority string ADMIN without modification.",
      "hasAuthority('ADMIN') prefixes the string with ROLE_, whereas hasRole('ADMIN') does not.",
      "hasRole only works for static roles, while hasAuthority is used for dynamic database roles.",
      "There is no conceptual or functional difference; they behave identically in all scenarios."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, Spring Security's hasRole expression automatically prefixes the input role name with ROLE_ (e.g., hasRole('ADMIN') checks for the authority ROLE_ADMIN in the user's authority list). hasAuthority checks for the exact authority string matches (e.g., hasAuthority('ADMIN') checks for ADMIN)."
  },
  {
    "id": "spring-web-sec-39",
    "topic": "Spring Web & Security",
    "questionText": "A service method returns a list of items. A developer wants Spring Security to filter out any items from the returned list that do not belong to the currently logged-in user before returning the list. Which annotation should be used?",
    "options": [
      "@PreFilter",
      "@PostFilter",
      "@PostAuthorize",
      "@Secured"
    ],
    "correctOptionIndex": 1,
    "explanation": "@PostFilter is designed to filter the returned collection or map of a method. Spring Security evaluates the filter expression for each element in the returned collection (using the filterObject placeholder) and retains only the elements for which the expression evaluates to true."
  },
  {
    "id": "spring-web-sec-40",
    "topic": "Spring Web & Security",
    "questionText": "To support hierarchical roles (e.g., ROLE_ADMIN implicitly includes all permissions of ROLE_USER), which bean should be registered and configured in Spring Security?",
    "options": [
      "RoleHierarchy (configured with a rule string like ROLE_ADMIN > ROLE_USER)",
      "AccessDecisionManager",
      "GrantedAuthoritiesMapper",
      "SecurityExpressionHandler"
    ],
    "correctOptionIndex": 0,
    "explanation": "A RoleHierarchy bean (e.g., RoleHierarchyImpl) can be configured with role relationships (e.g., ROLE_ADMIN > ROLE_USER). Once configured, it is registered with the method security expression handler or web security expression handler, which resolves authority checks considering the configured hierarchy."
  },
  {
    "id": "spring-web-sec-41",
    "topic": "Spring Web & Security",
    "questionText": "How does Cross-Site Request Forgery (CSRF) protection in Spring Security prevent unauthorized state-changing requests?",
    "options": [
      "By blocking all requests coming from different IP addresses.",
      "By requiring a cryptographically secure, random token (the CSRF token) to be included in all state-changing HTTP requests (POST, PUT, DELETE) and validating it on the server.",
      "By enforcing CORS headers on the browser to block foreign script executions.",
      "By disabling the use of cookies entirely for authentication."
    ],
    "correctOptionIndex": 1,
    "explanation": "CSRF protection works by generating a unique, unpredictable token associated with the user's session. Any state-changing request (POST, PUT, DELETE, PATCH) must include this token (as a request parameter or HTTP header). The server validates the token against the one stored in the session/cookie; if it is missing or incorrect, the request is rejected with a 403 Forbidden."
  },
  {
    "id": "spring-web-sec-42",
    "topic": "Spring Web & Security",
    "questionText": "Under what circumstance is it considered safe and standard practice to disable CSRF protection in a Spring Security configuration?",
    "options": [
      "When the application is a traditional server-side rendered web app using Thymeleaf and session cookies.",
      "When the API is stateless and authentication is performed solely via headers (e.g., JWT access tokens) that are not stored in cookies or automatically sent by the browser.",
      "When the application is deployed behind a reverse proxy like Nginx.",
      "It is never safe to disable CSRF protection under any circumstances."
    ],
    "correctOptionIndex": 1,
    "explanation": "CSRF attacks rely on the browser automatically attaching authentication credentials (like session cookies) to requests made to a different site. If the API is stateless and does not use cookies for authentication (e.g., using JWTs sent in the Authorization: Bearer header, which the browser does not automatically send), CSRF attacks are not possible, and it is safe to disable CSRF."
  },
  {
    "id": "spring-web-sec-43",
    "topic": "Spring Web & Security",
    "questionText": "In Spring Security, which CSRF token repository implementation is commonly used to support Single Page Applications (SPAs) like Angular or React, where the client reads the token from a cookie and sends it back in a custom HTTP header (typically X-XSRF-TOKEN)?",
    "options": [
      "HttpSessionCsrfTokenRepository",
      "CookieCsrfTokenRepository.withHttpOnlyFalse()",
      "CookieCsrfTokenRepository.withHttpOnlyTrue()",
      "InMemoryCsrfTokenRepository"
    ],
    "correctOptionIndex": 1,
    "explanation": "To allow a Single Page Application (SPA) running in the browser to read the CSRF token, the cookie containing the token must not be marked HttpOnly (otherwise JavaScript cannot read it). CookieCsrfTokenRepository.withHttpOnlyFalse() writes the token to a cookie named XSRF-TOKEN with HttpOnly set to false, allowing front-end frameworks to read the cookie and include it in the X-XSRF-TOKEN header."
  },
  {
    "id": "spring-web-sec-44",
    "topic": "Spring Web & Security",
    "questionText": "A frontend application hosted on https://frontend.com makes an API request to a Spring Boot backend on https://api.backend.com. When configuring CORS, which component executes first and must allow the pre-flight request?",
    "options": [
      "The DispatcherServlet controller mapping.",
      "Spring Security's CorsFilter registered at the very beginning of the security filter chain.",
      "The Spring MVC WebMvcConfigurer CORS configuration.",
      "The system's DNS resolver."
    ],
    "correctOptionIndex": 1,
    "explanation": "For cross-origin requests, browsers send an HTTP OPTIONS pre-flight request before the actual request. This pre-flight request must be intercepted and permitted early in the request processing pipeline. Spring Security's CorsFilter runs before Spring Security's authorization filters; if configured correctly, it handles the OPTIONS request and returns a 200 OK with the proper CORS headers, allowing the subsequent actual request to proceed."
  },
  {
    "id": "spring-web-sec-45",
    "topic": "Spring Web & Security",
    "questionText": "If both Spring Security CORS configuration and Spring MVC CORS configuration (e.g., @CrossOrigin) are defined in a project, which configuration takes precedence and controls cross-origin access?",
    "options": [
      "Spring MVC @CrossOrigin takes precedence because it is closer to the controller.",
      "Spring Security CORS configuration takes precedence because security filters intercept requests before they reach the DispatcherServlet and the MVC handler mappings.",
      "They merge together, and any conflict results in a compilation error.",
      "CORS is handled solely by the Servlet container, so both configurations are ignored."
    ],
    "correctOptionIndex": 1,
    "explanation": "Because Spring Security's filter chain executes before the request reaches Spring MVC's DispatcherServlet, the CORS configuration defined in Spring Security (typically http.cors(...)) takes precedence. If Spring Security blocks the cross-origin request during the filter phase, the MVC configuration will never be evaluated."
  },
  {
    "id": "spring-web-sec-46",
    "topic": "Spring Web & Security",
    "questionText": "In Spring WebFlux, what is the main conceptual difference between return types Mono<T> and Flux<T>?",
    "options": [
      "Mono<T> is synchronous, while Flux<T> is asynchronous.",
      "Mono<T> represents a publisher that emits at most one item (0 or 1), while Flux<T> represents a publisher that emits 0 to N items.",
      "Mono<T> is used for database queries, while Flux<T> is only used for WebSockets.",
      "Mono<T> blocks the thread until completion, while Flux<T> is completely non-blocking."
    ],
    "correctOptionIndex": 1,
    "explanation": "Both Mono and Flux are reactive publishers implementing the Reactive Streams Publisher interface. Mono<T> emits 0 or 1 element before completing. Flux<T> emits 0 to N elements (potentially infinite) before completing."
  },
  {
    "id": "spring-web-sec-47",
    "topic": "Spring Web & Security",
    "questionText": "What makes Spring WebFlux's WebClient preferred over RestTemplate in high-throughput microservices?",
    "options": [
      "WebClient is simpler to write and requires no configuration.",
      "WebClient is non-blocking and reactive, allowing a small number of threads to handle a large number of concurrent HTTP connections, whereas RestTemplate uses a blocking 'one-thread-per-request' model.",
      "WebClient automatically encrypts all payloads using SHA-256 by default.",
      "WebClient is designed to run only on Apache Tomcat, which is faster than Netty."
    ],
    "correctOptionIndex": 1,
    "explanation": "RestTemplate is a blocking API that holds onto a servlet container thread for the duration of the HTTP call. In contrast, WebClient is non-blocking and reactive, meaning it releases the calling thread immediately and uses callbacks when data becomes available, leading to much higher concurrency and resource efficiency."
  },
  {
    "id": "spring-web-sec-48",
    "topic": "Spring Web & Security",
    "questionText": "How does the concept of 'backpressure' work in a Spring WebFlux application?",
    "options": [
      "The client forces the server to crash if the server sends too much data.",
      "It is a mechanism where a downstream subscriber controls the rate at which an upstream publisher sends data, requesting only as many items as the subscriber can process.",
      "It is a network-level protocol that automatically compresses JSON payloads.",
      "Backpressure is a thread-pooling strategy that prioritizes database threads over HTTP threads."
    ],
    "correctOptionIndex": 1,
    "explanation": "Backpressure is a core concept of Reactive Streams. It allows a subscriber to signal to the publisher (via the Subscription.request(n) method) how many elements it is currently ready to process, preventing the publisher from overwhelming the subscriber with too much data."
  },
  {
    "id": "spring-web-sec-49",
    "topic": "Spring Web & Security",
    "questionText": "In WebFlux, besides annotation-based controllers (using @RestController and @GetMapping), what alternative functional programming model is supported for routing and handling requests?",
    "options": [
      "Using XML configuration files.",
      "Using RouterFunction and HandlerFunction beans to define routes and handlers programmatically.",
      "Writing raw Servlets that extend HttpServlet.",
      "WebFlux does not support any alternative; annotation-based controllers are mandatory."
    ],
    "correctOptionIndex": 1,
    "explanation": "WebFlux supports a functional routing model. It uses RouterFunction to route requests to a HandlerFunction programmatically. This is configured using RouterFunctions.route() and provides an alternative to the annotation-based @Controller approach."
  },
  {
    "id": "spring-web-sec-50",
    "topic": "Spring Web & Security",
    "questionText": "What is the default runtime server/engine that Spring Boot uses to run Spring WebFlux applications, and how does its threading model compare to standard Spring MVC?",
    "options": [
      "Netty, which uses a small, fixed number of event loop threads to handle non-blocking requests, compared to Tomcat (used in Spring MVC) which uses a large thread pool of blocking request threads.",
      "Tomcat, which runs WebFlux in blocking servlet mode.",
      "Glassfish, which uses a single main thread for all operations.",
      "Apache HTTPD, which forks a new OS process for every request."
    ],
    "correctOptionIndex": 0,
    "explanation": "By default, Spring Boot WebFlux applications run on an embedded Netty server. Netty is built on a non-blocking, event-driven I/O model (Event Loop). It typically creates one thread per CPU core to handle all incoming requests asynchronously. Spring MVC, by default, runs on Tomcat with a pool of threads (typically 200) where each thread blocks waiting for input/output."
  }
];
