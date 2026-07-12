---
id: web-security-fundamentals
title: "Web Security & Authentication Fundamentals"
sidebar_label: "Web Security Fundamentals"
description: "A beginner-friendly guide explaining Web Authentication, JWT, Bearer Tokens, Cookies, Access Tokens, CORS, CSRF, and the distinction between CSRF and CQRS."
tags: [security, authentication, jwt, cookies, cors, csrf, cqrs]
---

# Web Security & Authentication Fundamentals

import AuthNvsAuthZDiagram from '@site/src/components/AuthNvsAuthZDiagram';
import SessionAuthDiagram from '@site/src/components/SessionAuthDiagram';
import TokenAuthDiagram from '@site/src/components/TokenAuthDiagram';
import CorsDiagram from '@site/src/components/CorsDiagram';
import CsrfDiagram from '@site/src/components/CsrfDiagram';
import CqrsVsCsrfDiagram from '@site/src/components/CqrsVsCsrfDiagram';



For anyone building web applications, understanding how systems authenticate users, authorize actions, and defend against web vulnerabilities is a critical foundational skill. This guide breaks down these concepts step-by-step using clear analogies, workflows, and logical explanations designed specifically for new learners.

---

## 1. Authentication vs. Authorization

Although they sound similar, **Authentication** and **Authorization** serve two completely different security goals.

<AuthNvsAuthZDiagram />

### The Airport Analogy
* **Authentication (AuthN):** When you arrive at the airport, you show your **passport** to the security agent. The agent checks your photo and name to verify that **you are indeed who you claim to be**.
* **Authorization (AuthZ):** Once inside the airport, you attempt to board a plane. The gate agent checks your **boarding pass (ticket)**. Even though they know who you are (authenticated), your boarding pass determines if you are allowed to enter the First Class cabin or if you can board that specific flight (authorized).

| Metric | Authentication (AuthN) | Authorization (AuthZ) |
| :--- | :--- | :--- |
| **Question** | "Who are you?" | "What are you allowed to do?" |
| **Verification** | Passwords, Biometrics, OTP, OTP apps | Roles, Permissions, User attributes |
| **HTTP Errors** | `401 Unauthorized` (You must log in) | `403 Forbidden` (Logged in, but blocked) |

---

## 2. Session-Based Authentication (Cookies & Session IDs)

Historically, HTTP is a **stateless** protocol — meaning the server forgets who you are the millisecond a request finishes. To keep you logged in, applications use session management.

### What is a Cookie?
A cookie is a tiny text file that a server asks your web browser to store. Once stored, the web browser **automatically attaches** this cookie to every subsequent request sent to that same domain.

### How Session-Based Auth Works
In session-based authentication, the user's logged-in state is saved **on the server**.

<SessionAuthDiagram />

### Key Characteristics
* **State Location:** Server-side (Session database, Redis cache, or memory).
* **Client Side:** Opaque string (e.g. `SESSION_ID=abc123`) containing no user information.
* **When to Use:** Monolithic web applications, server-rendered layouts, or websites where immediate session revocation (e.g. forcing logout instantly) is mandatory.

---

## 3. Token-Based Authentication (JWT & Bearer Tokens)

In modern web development, particularly with **Single Page Applications (SPAs)** (React, Vue) and **Microservices**, token-based authentication is preferred because it is **stateless**. The server does not store session logs in a database.

### What is a JWT (JSON Web Token)?
A JWT is a self-contained string that holds encrypted or signed user data (claims). It has three parts separated by dots:

`Header.Payload.Signature`

1. **Header:** Details the token type and the hashing algorithm used (e.g., HMAC-SHA256 or RSA).
2. **Payload:** Holds the actual user details (claims), such as `userId`, `username`, and `roles`.
3. **Signature:** Formed by hashing the Header and Payload together with a secret key held only by the server. This signature guarantees the token hasn't been tampered with.

:::danger[Payload is public]
The payload is simply Base64Url-encoded, NOT encrypted. Anyone can decode it. **Never** put sensitive passwords, database keys, or credit card numbers inside the payload of a standard JWT.
:::

### What is a Bearer Token?
A "Bearer Token" is an access token format where the holder (the "bearer") of the token is granted access simply by presenting it. The client attaches this token inside the HTTP `Authorization` header like this:

`Authorization: Bearer <your_jwt_token_here>`

<TokenAuthDiagram />

### Access Tokens vs. Refresh Tokens
Because JWT verification is stateless, a stolen JWT can be used by an attacker until it naturally expires. To limit this risk, we use two tokens:

1. **Access Token:**
   * **Purpose:** Authorizes API requests.
   * **Lifespan:** Very short-lived (e.g., 5 to 15 minutes).
   * **Transmission:** Attached to every API request header.
2. **Refresh Token:**
   * **Purpose:** Requests a new Access Token once the old one expires.
   * **Lifespan:** Long-lived (e.g., 7 to 30 days).
   * **Transmission:** Kept secure (ideally in a `HttpOnly` cookie) and sent only to the `/auth/refresh` endpoint.

---

## 4. CORS (Cross-Origin Resource Sharing)

New developers frequently encounter the dreaded **CORS error** in their browser consoles. To understand CORS, you must first understand the **Same-Origin Policy**.

### Same-Origin Policy (SOP)
The Same-Origin Policy is a strict security mechanism built into all web browsers. It dictates that a script on a website (e.g., `http://attacker.com`) **cannot** read or write data to a different domain (e.g., `http://yourbank.com`). Without SOP, any open tab in your browser could steal data from your other open tabs.

### What is CORS?
CORS is a mechanism that allows a server to explicitly say: *"I trust website X, so please let X read my API data."*

Origins are defined by three parts: **Protocol + Domain + Port**. If any of these differ, it is a cross-origin request.

```
Same Origin Example:
- http://api.myapp.com/users
- http://api.myapp.com/products

Cross-Origin Example (CORS required):
- http://frontend.myapp.com (Origin A)  ──►  http://backend.myapp.com (Origin B)
```

### How CORS Works (Preflight Requests)
When your browser makes a cross-origin request that could modify data (like a `POST`, `PUT`, or `DELETE`), it sends an initial, automated check called a **Preflight Request**:

<CorsDiagram />

If the server fails to return the correct `Access-Control-Allow-Origin` header, the browser blocks the response, throwing a CORS error.

---

## 5. CSRF (Cross-Site Request Forgery)

<CsrfDiagram />

### How the Attack Works
1. You log into your banking application (`http://bank.com`).
2. The banking server saves a session cookie (`SESSION_ID=123`) in your browser.
3. In another tab, you click a link to a malicious site (`http://evil.com`).
4. `evil.com` contains a hidden script that submits a form to your bank:
   `POST http://bank.com/transfer?amount=1000&to=hacker`
5. **The browser security behavior:** Because you are logged in, your browser **automatically attaches** your bank cookie (`SESSION_ID=123`) to that request.
6. The bank receives the request, sees your valid cookie, and transfers your money.

### Why Bearer Tokens are Immune to CSRF
If your application uses **Bearer Tokens** stored in JavaScript memory instead of cookies:
* The malicious page (`evil.com`) has no way to read your application's memory.
* The browser does **not** automatically attach the `Authorization: Bearer <jwt>` header to cross-origin requests.
* Therefore, the forged request arrives at the bank server without authorization and is immediately blocked.

### Preventing CSRF
If you must use cookies for authentication, protect your application using:
1. **`SameSite` Cookie Flag:** Setting `SameSite=Strict` or `SameSite=Lax` ensures that the browser will **not** send the cookie along with cross-origin requests.
2. **CSRF Synchronizer Tokens:** The server generates a unique, single-use token for the page session. State-changing requests must include this token in a hidden form field or custom header. Since a malicious site cannot read the token from your page, it cannot forge the request.

---

## 6. CQRS vs. CSRF (A Critical Clarification)

Because their acronyms are similar, new learners sometimes confuse **CSRF** and **CQRS**. However, they belong to completely different disciplines in software development!

<CqrsVsCsrfDiagram />

### CSRF: A Security Concern
* **What it is:** An attack vector where a malicious site forces browsers to run state-changing commands on another application.
* **Focus:** Security, browser behavior, session cookies, CORS, headers.

### CQRS: An Architectural Pattern
* **What it is:** An architectural layout where you separate the code/database models used to **update data (Commands)** from the code/database models used to **read data (Queries)**.
* **Focus:** Database scaling, microservices, read-speed optimization, Event Sourcing.
* **Learn More:** Check out our specialized guide on [CQRS & Event Sourcing Guide](../system-design/cqrs.md).

---

## Summary Checklist for Beginners

* **Use Session Cookies** when building standard, server-rendered websites, but always set `HttpOnly` (stops JS token theft), `Secure` (requires HTTPS), and `SameSite=Lax` (stops CSRF).
* **Use JWTs & Bearer Tokens** when building scalable REST APIs for mobile apps or separated frontend single-page applications. Keep access tokens short-lived and implement refresh token rotation.
* **CORS is a Browser Guard:** Configuring CORS on your backend only tells the *browser* who is allowed to read API responses. It does not protect your backend from direct command line requests (like `curl` or Postman).
* **CQRS is NOT Security:** Do not confuse CQRS (reads vs. writes scaling) with CSRF (malicious cookie forgery).
