
---
title: Spring Boot
---

# Spring Boot

Spring Boot simplifies Java backend development.

```java
@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/users")
    public List<String> users() {
        return List.of("Alice", "Bob");
    }
}
```
