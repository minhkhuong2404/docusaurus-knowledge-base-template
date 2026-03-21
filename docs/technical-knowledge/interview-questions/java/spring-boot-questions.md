---
id: spring-boot-interview
title: Spring Boot Interview Questions
sidebar_label: Spring Boot
description: "Top Spring Boot interview questions covering annotations, configuration, and service development basics."
tags: [spring-boot, java, interview, backend]
---

# Top Spring Boot Interview Questions & Answers

These questions cover core Spring Boot concepts, annotations, and configuration as explained in the Code Decode tutorial.

## 1. What is Spring Boot and why should we use it?
Spring Boot is an extension of the Spring framework that eliminates the boilerplate configurations required for setting up a Spring application. It follows an "opinionated" approach to configuration.
* **Auto-configuration:** It automatically configures your application based on the dependencies in the classpath.
* **Embedded Servers:** It comes with embedded servers like TomCat, Jetty, or Undertow, meaning you don't need to install an external server.
* **Starter Dependencies:** Simplifies dependency management by providing aggregate dependencies (e.g., `spring-boot-starter-web`).

## 2. How to change the default port of a Spring Boot application?
The default port is `8080`. You can change it by adding the following property to your `application.properties` file:
```properties
server.port=8081

```

## 3. How can you change the embedded server?

By default, Spring Boot uses **Tomcat**. To switch to another server like **Jetty**, you must exclude the Tomcat starter from the `spring-boot-starter-web` dependency and include the Jetty starter:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>

```

## 4. What is `@SpringBootApplication`?

This is a convenience annotation that combines three other annotations:

1. **`@SpringBootConfiguration`**: Indicates that the class provides Spring Boot application configuration.
2. **`@EnableAutoConfiguration`**: Tells Spring Boot to start adding beans based on classpath settings.
3. **`@ComponentScan`**: Tells Spring to look for other components, configurations, and services in the package.

## 5. Difference between `@Controller` and `@RestController`

* **`@Controller`**: Used for traditional Spring MVC controllers where the response is usually an HTML page (view). You need to use `@ResponseBody` on methods if you want to return data (JSON/XML).
* **`@RestController`**: A specialized version of `@Controller` that includes `@ResponseBody` by default. It is used for RESTful web services that return data directly in the response body.

## 6. `@RequestMapping` vs `@GetMapping`

* **`@RequestMapping`**: A general-purpose annotation to map web requests. You must specify the method (e.g., `method = RequestMethod.GET`).
* **`@GetMapping`**: A composed annotation that acts as a shortcut for `@RequestMapping(method = RequestMethod.GET)`. Similarly, there are `@PostMapping`, `@PutMapping`, and `@DeleteMapping`.

## 7. What are Spring Boot Profiles?

Profiles allow you to segregate parts of your application configuration and make it only available in certain environments (e.g., Dev, Test, Prod).

* You can create files like `application-dev.properties` and `application-prod.properties`.
* To activate a profile, use: `spring.profiles.active=dev`.

---
