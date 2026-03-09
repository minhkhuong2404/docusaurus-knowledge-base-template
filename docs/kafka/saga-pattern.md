
---
title: Saga Pattern
---

# Saga Pattern

Saga pattern manages distributed transactions in microservices.

Typical flow:

1. Service A creates order
2. Event sent to Kafka
3. Service B processes payment
4. Compensation triggered if failure occurs
