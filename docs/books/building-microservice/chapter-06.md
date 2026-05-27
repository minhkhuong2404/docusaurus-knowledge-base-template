---
sidebar_position: 7
title: 'Chapter 6: Workflow'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-06
---

# Chapter 6: Workflow

**Part I — Foundation**

> In	the	previous	two	chapters,	we’ve	looked	at	aspects	of	microservices	related	to

---

## Database Transactions

Chapter 6. Workflow In the previous two chapters, we’ve looked at aspects of microservices related to how one microservice talks to another. But what happens when we want multiple microservices to collaborate, perhaps to implement a business process? How we model and implement these sorts of workflows in distributed systems can be a tricky thing to get right. In this chapter, we’ll look at the pitfalls associated with using distributed transactions to solve this problem, and we’ll also look at s...

---

## ACID Transactions

isolation, and durability , and here is what these properties give us: Atomicity Ensures that the operations attempted within the transaction either all complete or all fail. If any of the changes we’re trying to make fail for some reason, then the whole operation is aborted, and it’s as though no changes were ever made. Consistency When changes are made to our database, we ensure it is left in a valid, consistent state. Isolation Allows multiple transactions to operate at the same time without ...

---

## Still ACID, but Lacking Atomicity?

Still ACID, but Lacking Atomicity? I want to be clear that we can still use ACID-style transactions when using microservices. A microservice is free to use an ACID transaction for operations to its own database, for example. It’s just that the scope of these transactions is reduced to state change that happens locally within that single microservice. Consider Figure 6-1 . Here, we are keeping track of the process involved in onboarding a new customer to MusicCorp. We’ve reached the end of the pr...

---

## Distributed Transactions—Two-Phase Commits

see, distributed transactions may not be the right way forward. Let’s look at one of the most common algorithms for implementing distributed transactions, the two-phase commit, as a way of exploring the challenges associated with distributed transactions as a whole. Distributed Transactions—Two-Phase Commits The two-phase commit algorithm (sometimes shortened to 2PC ) is frequently used in an attempt to give us the ability to make transactional changes in a distributed system, where multiple sep...

---

## Distributed Transactions—Just Say No

with the transaction but then not responding when asked to commit. What should we do then? Some of these failure modes can be handled automatically, but some can leave the system in such a state that things need to be fixed manually by an operator. The more participants you have, and the more latency you have in the system, the more issues a two-phase commit will have. 2PC can be a quick way to inject huge amounts of latency into your system, especially if the scope of locking is large, or if th...

---

## Sagas

state change across microservices. In such situations, each microservice is managing its own local durable state (e.g., in its database). Distributed transactional algorithms are being used successfully for some large-scale databases, Google’s Spanner being one such system. In this situation, the distributed transaction is being applied transparently from an application’s point of view by the underling database, and the distributed transaction is just being used to coordinate state changes withi...

---

## Saga Failure Modes

Figure 6-5. An example order fulfillment flow, along with the services responsible for carrying out the operation Saga Failure Modes With a saga being broken into individual transactions, we need to consider how to handle failure—or, more specifically, how to recover when a failure happens. The original saga paper describes two types of recovery: backward recovery and forward recovery. Backward recovery involves reverting the failure and cleaning up afterwards—a rollback. For this to work, we ne...

---

## Implementing Sagas

place. These changes, if they can be accommodated, can make your life much easier, avoiding the need to even create compensating transactions for some steps. This can be especially important if implementing a compensating transaction is difficult. You may be able to move a step later in the process to a stage at which it never needs to be rolled back. Mixing fail-backward and fail-forward situations It is totally appropriate to have a mix of failure recovery modes. Some failures may require a ro...

---

## Sagas Versus Distributed Transactions

Should I use choreography or orchestration (or a mix)? The implementation of choreographed sagas can bring with it ideas that may be unfamiliar to you and your team. They typically assume heavy use of event- driven collaboration, which isn’t widely understood. However, in my experience, the extra complexity associated with tracking the progress of a saga is almost always outweighed by the benefits associated with having a more loosely coupled architecture. Stepping aside from my own personal tas...

---

## Summary

down. When flying an airplane that needs all of its engines to work, adding an engine reduces the availability of the airplane. In my experience, explicitly modeling business processes as a saga avoids many of the challenges of distributed transactions, while having the added benefit of making what might otherwise be implicitly modeled processes much more explicit and obvious to your developers. Making the core business processes of your system a first-class concept will have a host of advantage...

---
