---
sidebar_position: 4
title: 'Chapter 3: Splitting the Monolith'
description: '**Part I — Foundation**'
tags:
- books
- building-microservice
- chapter-03
---

# Chapter 3: Splitting the Monolith

**Part I — Foundation**

> Many	of	you	reading	this	book	likely	don’t	have	a	blank	slate	on	which	to	design

---

## Have a Goal

Chapter 3. Splitting the Monolith Many of you reading this book likely don’t have a blank slate on which to design your system, and even if you did, starting with microservices might not be a great idea, for reasons we explored in Chapter 1 . Many of you will already have an existing system, perhaps some form of monolithic architecture, which you are looking to migrate to a microservice architecture. In this chapter I’ll outline some first steps, patterns, and general tips to help you navigate t...

---

## Incremental Migration

Microservices aren’t easy. Try the simple stuff first. Finally, without a clear goal, it becomes difficult to know where to start. Which microservice should you create first? Without an overarching understanding of what you are trying to achieve, you’re flying blind. So be clear about what change you are trying to achieve, and consider easier ways to achieve that end goal before considering microservices. If microservices really are the best way to move forward, then track your progress against ...

---

## The Monolith Is Rarely the Enemy

microservices: if you think microservices are a good idea, start somewhere small. Choose one or two areas of functionality, implement them as microservices, get them deployed into production, and then reflect on whether creating your new microservices helped you get closer to your end goal. WARNING You won’t appreciate the true horror, pain, and suffering that a microservice architecture can bring until you are running in production. The Monolith Is Rarely the Enemy While I already made the case...

---

## The Dangers of Premature Decomposition

requirement. In my experience, this is often limited to situations in which the existing monolith is based on dead or dying technology, is tied to infrastructure that needs to be retired, or is perhaps an expensive third-party system that you want to ditch. Even in these situations, an incremental approach to decomposition is warranted for the reasons I’ve outlined. The Dangers of Premature Decomposition There is danger in creating microservices when you have an unclear understanding of the doma...

---

## What to Split First?

requirement. In my experience, this is often limited to situations in which the existing monolith is based on dead or dying technology, is tied to infrastructure that needs to be retired, or is perhaps an expensive third-party system that you want to ditch. Even in these situations, an incremental approach to decomposition is warranted for the reasons I’ve outlined. The Dangers of Premature Decomposition There is danger in creating microservices when you have an unclear understanding of the doma...

---

## Decomposition by Layer

With a few successes and some lessons learned, you’ll be much better placed to tackle more complex extractions, which may also be operating in more critical areas of functionality. Decomposition by Layer So you’ve identified your first microservice to extract; what next? Well, we can break that decomposition down into further, smaller steps. If we consider the traditional three tiers of a web-based services stack, then we can look at the functionality we want to extract in terms of its user inte...

---

## Code First

Figure 3-3. Moving the wishlist code into a new microservice first, leaving the data in the monolithic database In my experience, this tends to be the most common first step. The main reason for this is that it tends to deliver more short-term benefit. If we left the data in the monolithic database, we’re storing up lots of pain for the future, so that does need to be addressed too, but we have gained a lot from our new microservice. Extracting the application code tends to be easier than extrac...

---

## Data First

see this approach less often, but it can be useful in situations in which you are unsure whether the data can be separated cleanly. Here, you prove that this can be done before moving on to the hopefully easier application code extraction. Figure 3-4. The tables associated with the wishlist functionality are extracted first The main benefit of this approach in the short term is in derisking the full extraction of the microservice. It forces you to deal up front with issues like loss of enforced ...

---

## Useful Decompositional Patterns

Many of these are explored in detail in my book Monolith to Microservices ; rather than repeat them all here, I will share an overview of some of them to give you an idea of what is possible. Strangler Fig Pattern A technique that has seen frequent use during system rewrites is the strangler fig pattern , a term coined by Martin Fowler . Inspired by a type of plant, the pattern describes the process of wrapping an old system with the new system over time, allowing the new system to take over mor...

---

## Strangler Fig Pattern

Many of these are explored in detail in my book Monolith to Microservices ; rather than repeat them all here, I will share an overview of some of them to give you an idea of what is possible. Strangler Fig Pattern A technique that has seen frequent use during system rewrites is the strangler fig pattern , a term coined by Martin Fowler . Inspired by a type of plant, the pattern describes the process of wrapping an old system with the new system over time, allowing the new system to take over mor...

---

## Parallel Run

it has even been “wrapped” with a newer system. Parallel Run When switching from functionality provided by an existing tried and tested application architecture to a fancy new microservice-based one, there may be some nervousness, especially if the functionality being migrated is critical to your organization. One way to make sure the new functionality is working well without risking the existing system behavior is to make use of the parallel run pattern: running both your monolithic implementat...

---

## Feature Toggle

it has even been “wrapped” with a newer system. Parallel Run When switching from functionality provided by an existing tried and tested application architecture to a fancy new microservice-based one, there may be some nervousness, especially if the functionality being migrated is critical to your organization. One way to make sure the new functionality is working well without risking the existing system behavior is to make use of the parallel run pattern: running both your monolithic implementat...

---

## Data Decomposition Concerns

it has even been “wrapped” with a newer system. Parallel Run When switching from functionality provided by an existing tried and tested application architecture to a fancy new microservice-based one, there may be some nervousness, especially if the functionality being migrated is critical to your organization. One way to make sure the new functionality is working well without risking the existing system behavior is to make use of the parallel run pattern: running both your monolithic implementat...

---

## Performance

Performance Databases, especially relational databases, are good at joining data across different tables. Very good. So good, in fact, that we take this for granted. Often, though, when we split databases apart in the name of microservices, we end up having to move join operations from the data tier up into the microservices themselves. And try as we might, it’s unlikely to be as fast. Consider Figure 3-6 , which illustrates a situation we find ourselves in regarding MusicCorp. We’ve decided to ...

---

## Data Integrity

microservice in bulk, or perhaps even by caching the required album information locally. Data Integrity Databases can be useful in ensuring integrity of our data. Coming back to Figure 3-6 , with both the Album and Ledger tables being in the same database, we could (and likely would) define a foreign key relationship between the rows in the Ledger table and the Album table. This would ensure that we’d always be able to navigate from a record in the Ledger table back to information about the albu...

---

## Transactions

microservice in bulk, or perhaps even by caching the required album information locally. Data Integrity Databases can be useful in ensuring integrity of our data. Coming back to Figure 3-6 , with both the Album and Ledger tables being in the same database, we could (and likely would) define a foreign key relationship between the rows in the Ledger table and the Album table. This would ensure that we’d always be able to navigate from a record in the Ledger table back to information about the albu...

---

### Tooling

For people moving from a system in which all state changes could be managed in a single transactional boundary, the shift to distributed systems can be a shock, and often the reaction is to look to implement distributed transactions to regain the guarantees that ACID transactions gave us with simpler architectures. Unfortunately, as we’ll cover in depth in “Database Transactions” , distributed transactions are not only complex to implement, even when done well, but they also don’t actually give ...

---

## Reporting Database

interfaces, which make independent deployability possible. Unfortunately, this causes us issues when we do have legitimate use cases for accessing data from more than one microservice, or when that data is better made available in a database, rather than via something like a REST API. With a reporting database, we instead create a dedicated database that is designed for external access, and we make it the responsibility of the microservice to push data from internal storage to the externally acc...

---

## Summary

reporting database is the responsibility of the people who develop the microservice itself. Summary So, to distill things down, when embarking on work to migrate functionality from a monolithic architecture to a microservice architecture, you must have a clear understanding of what you expect to achieve. This goal will shape how you go about the work and will also help you understand whether you’re moving in the right direction. Migration should be incremental. Make a change, roll that change ou...

---
