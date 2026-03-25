---
id: hashedin-java-developer-interview-questions
title: HashedIn Java Developer Interview Experience & Questions [25 LPA+]
description: A comprehensive list of technical interview questions and answers from a real HashedIn (Deloitte) Java Developer interview for an SWE-2 role (2-5 years experience).
tags:
  - Java
  - System Design
  - Interview Experience
  - Backend Development
  - HashedIn
---

# HashedIn Java Developer Interview Questions (SWE-2)

This guide documents the real interview experience and questions asked during a HashedIn (by Deloitte) Software Engineer 2 (SWE-2) interview for a candidate with 2.7 years of experience. The interview consisted of three rounds: DSA & Development, System Design & Projects, and a Fitment/Technical HR round.

---

## Round 1: DSA & Development (1.5 Hours+)

### Q: Write a Java program to check whether a given mathematical equation is valid. (The equation may contain numbers, `+`, `-`, `*`, `/`, and parentheses). Return true if valid, false otherwise.
**A:** This can be solved using a **Stack**. 
1. Use the stack to push and pop parentheses to ensure they are balanced.
2. Iterate through the string to check for invalid operator sequences (e.g., `+*` consecutively) or misplaced operators.
3. Skip spaces and validate that the equation does not start or end with an operator (other than a minus sign for negative numbers).
4. Return `true` if the stack is empty at the end and all operator conditions are satisfied.

### Q: Design a Java program to simulate a Vending Machine.
**A:** *This is a classic Object-Oriented Design (OOD) / State Design Pattern question.* The program must:
1. Accept user input (coins/notes).
2. Check the current balance inserted.
3. Dispense the selected item if sufficient funds are provided and the item is in stock.
4. Return appropriate change and update the machine's internal inventory and cash balance.

### Q: Write an SQL query to find the 2nd, 3rd, and 4th highest salary from an Employee table.
**A:** You can achieve this using `ORDER BY`, `LIMIT`, and `OFFSET`.
```sql
SELECT DISTINCT salary 
FROM employees 
ORDER BY salary DESC 
LIMIT 1 OFFSET (n-1); 
-- Replace (n-1) with 1, 2, or 3 for the 2nd, 3rd, and 4th highest respectively.
```

### Q: Write an SQL query to find the average salary of each country from the employee list.
**A:** Use the `AVG()` aggregate function combined with the `GROUP BY` clause.
```sql
SELECT country, AVG(salary) as average_salary
FROM employees
GROUP BY country;
```

### Q: Find the sum of all odd numbers from a list using the Java Stream API.
**A:**
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
int sumOfOdds = numbers.stream()
                       .filter(n -> n % 2 != 0)
                       .mapToInt(Integer::intValue)
                       .sum();
```

---

## Round 2: System Design & Project Discussion (1.5 Hours+)

*This round started with a 25-minute in-depth discussion on past projects, followed by System Design.*

### Q: Design a Video Streaming Platform like YouTube.
**A:** I would design it using a **Microservices Architecture** for better scalability.
* **Core Services:** User Management, Video Upload, Transcoding, Streaming, and Content Delivery.
* **Storage:** AWS S3 for raw and processed video storage. Distributed database (like MongoDB/Cassandra) for storing metadata.
* **Search:** ElasticSearch for fast video search functionality.
* **Delivery:** Use a CDN (like AWS CloudFront) for low-latency, global video delivery.
* **Processing:** Use Kafka for real-time data processing and asynchronous tasks. Use FFmpeg for video encoding/transcoding to support adaptive streaming (multiple resolutions).
* **Caching:** Redis for caching user sessions, metadata, and popular video data.
* **Security:** OAuth 2.0 with RBAC (Role-Based Access Control) for secure access.
* **Deployment & Monitoring:** Deploy services using Kubernetes for auto-scaling. Use Prometheus and Grafana for system observability.

### Q: How do you handle millions of concurrent users?
**A:** We manage this by scaling horizontally. We implement Load Balancers, auto-scaling groups for our microservices, and utilize distributed databases. Aggressive caching using Redis reduces database hits, and leveraging CDNs ensures static and media content is delivered efficiently. We also ensure fault tolerance and monitor system performance strictly.

### Q: Explain CDN, Redis, and Load Balancing strategies.
**A:** * **CDN (Content Delivery Network):** Distributes static content across multiple geographical edge servers worldwide to reduce latency and server load.
* **Redis:** An in-memory data store used for high-speed caching and real-time processing.
* **Load Balancing:** Distributes incoming network traffic across multiple servers. Strategies include Round-Robin, Least Connections, or IP Hash to ensure optimal resource utilization.

### Q: How do you manage and store videos?
**A:** Videos are stored in cloud object storage (AWS S3). We encode the videos into multiple formats/resolutions upon upload. We then use a CDN for faster delivery and maintain a separate database (like MongoDB) to manage metadata (title, tags, views) for easy access and querying.

### Q: SQL vs NoSQL for metadata storage?
**A:** * **SQL:** Ideal for highly structured data, ensuring strict ACID compliance and consistency for complex queries (e.g., user billing or transactions).
* **NoSQL:** Suitable for unstructured or semi-structured data (like video metadata, comments, or tags), offering high horizontal scalability and efficient handling of massive data volumes.

### Q: What is an API Gateway?
**A:** An API Gateway acts as a single entry point for all client requests. It manages and routes API requests to the appropriate microservices. It handles cross-cutting concerns like authentication, rate limiting, load balancing, and SSL termination, improving security and performance.

### Q: Microservices vs Monolithic Architecture?
**A:** * **Monolithic:** Combines all functions into one codebase. Easy to initially deploy and test, but very hard to scale, maintain, and update as the application grows.
* **Microservices:** Breaks the application into smaller, independent, loosely coupled services. This makes the system easier to scale independently, fault-tolerant, and maintainable.

### Q: Explain Async messaging using Kafka and RabbitMQ.
**A:** Asynchronous messaging allows microservices to communicate without waiting for an immediate response. It queues messages, ensuring reliable delivery, decoupling services, and handling sudden spikes in traffic efficiently. This prevents service overload and improves overall system performance.

### Q: REST vs gRPC?
**A:** * **REST:** Uses standard HTTP/1.1 and JSON. It is simple, highly compatible, and human-readable, but the text payload can be slower for massive data transfers.
* **gRPC:** Uses HTTP/2 and Protocol Buffers (Protobuf). It is much faster, supports bidirectional streaming, and has a smaller binary payload, making it highly efficient for internal microservice-to-microservice communication, though it is harder to debug.

### Q: Difference between Authentication and Authorization?
**A:** * **Authentication:** Verifies *who* the user is (using credentials like username/password or tokens).
* **Authorization:** Determines *what* the authenticated user is allowed to do (granting or restricting access based on roles/permissions).

---

## Round 3: Fitment & Technical HR

### Q: What is the latest version of Java available, and which one are you currently using?
**A:** *(Answer based on your resume).* Usually, candidates mention using Java 8, 11, or 17 in production.

### Q: What are the key updates and differences in Java 17 compared to Java 8?
**A:** Java 17 is a Long-Term Support (LTS) version. It offers significantly better garbage collection performance, enhanced security, and modern language features like Records, Sealed Classes, Pattern Matching for `instanceof`, and Text Blocks. Java 8 lacks these modern features and optimizations, making it less efficient for modern cloud-native applications.

### Q: Which databases would you use for a quick-commerce application like Zepto?
**A:** For an app like Zepto, a polyglot persistence approach is best:
* **PostgreSQL / MySQL:** For structured, transactional data (like orders, payments, user accounts) requiring ACID consistency.
* **Redis:** For caching high-speed, frequently accessed data (like real-time inventory checks, user sessions, or cart items).
* **MongoDB:** For flexible data storage like product catalogs, which might have varying attributes. 

*(The round concluded with standard HR questions regarding the reason for a job switch, a 5-year career vision, and a discussion about the team's tech stack).*
