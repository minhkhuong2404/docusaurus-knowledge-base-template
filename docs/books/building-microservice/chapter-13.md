---
sidebar_position: 14
title: 'Chapter 13: Scaling'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-13
---

# Chapter 13: Scaling

**Part I — Foundation**

> “You’re	gonna	need	a	bigger	boat.”

---

## The Four Axes of Scaling

Chapter 13. Scaling “You’re gonna need a bigger boat.” — Chief Brody, Jaws When we scale our systems, we do so for one of two reasons. Firstly, it allows us to improve the performance of our system, perhaps by allowing us to handle more load or by improving latency. Secondly, we can scale our system to improve its robustness. In this chapter, we’ll look at a model to describe the different types of scaling, and then we’ll look in detail at how each type of scaling can be implemented using a micr...

---

## Vertical Scaling

Vertical scaling In a nutshell, this means getting a bigger machine. Horizontal duplication Having multiple things capable of doing the same work. Data partitioning Dividing work based on some attribute of the data, e.g., customer group. Functional decomposition Separation of work based on the type, e.g., microservice decomposition. Understanding what combination of these scaling techniques is most appropriate will fundamentally come down to the nature of the scaling issue you are facing. To exp...

---

## Horizontal Duplication

we’ll look at, vertical scaling is unlikely to have much impact in improving your system’s robustness. Finally, as the machines get larger, they get more expensive—but not always in a way that is matched by the increased resources available to you. Sometimes this means it can be more cost effective to have a larger number of small machines, rather than a smaller number of large machines. Horizontal Duplication With horizontal duplication, you duplicate part of your system to handle more workload...

---

## Data Partitioning

experiencing scaling issues. Much of the work here is in implementing your load distribution mechanisms. These can range from the simple, such as HTTP load balancing, to the more complex, such as using a message broker or configuring database read replicas. You are relying on this load distribution mechanism to do its job—coming to grips with how it works and with any limitations of your specific choice will be key. Some systems might place additional requirements on the load distribution mechan...

---

## Functional Decomposition

We can also hit an issue with queries. Looking up an individual record is easy, as I can just apply the hashing function to find which instance the data should be on and then retrieve it from the correct shard. But what about queries that span the data in multiple nodes—for example, finding all the customers who are over 18? If you want to query all shards, you need to either query each individual shard and join in memory or else have an alternative read store where both data sets are available....

---

## Combining Models

to microservices potentially brings with it a host of other things that the organization is looking for. In the case of FoodCo, for example, its drive to grow its development team to both support more countries and deliver more features is key, so a migration toward microservices offers the company a chance to solve not only some of its system scaling issues but also its organizational scaling issues as well. Combining Models One of the main drivers behind the original Scale Cube was to stop us ...

---

## Start Small

optimization is the root of all evil (or at least most of it) in programming. Optimizing our system to solve problems we don’t have is a great way to waste time that could be better spent on other activities, and also to ensure that we have a system that is needlessly more complex. Any form of optimization should be driven by real need. As we talked about in “Robustness” , adding new complexity to our system can introduce new sources of fragility as well. By scaling one part of our application, ...

---

## Caching

Arguably, CQRS is doing something very similar in our application tier to what read replicas can do in the data tier, although due to the large number of different ways CQRS can be implemented, this is a simplification. Personally, although I see value in the CQRS pattern in some situations, it’s a complex pattern to execute well. I’ve spoken to very smart people who have hit not insignificant issues in making CQRS work. As such, if you are considering CQRS as a way to help scale your applicatio...

---

## For Performance

stock levels before recommending an item—there isn’t any point in recommending something we don’t have in stock! But we’ve decided to keep a local copy of stock levels in Recommendation (a form of client-side caching) to improve the latency of our operations—we avoid the need to check stock levels whenever we need to recommend something. The source of truth for stock levels is the Inventory microservice, which is considered to be the origin for the client cache in the Recommendation microservice...

---

## For Scale

For Scale If you can divert reads to caches, you can avoid contention on parts of your system to allow it to better scale. An example of this that we’ve already covered in this chapter is the use of database read replicas. The read traffic is served by the read replicas, reducing the load on the primary database node and allowing reads to be scaled effectively. The reads on a replica are done against data that might be stale. The read replica will eventually get updated by the replication from p...

---

## For Robustness

For Scale If you can divert reads to caches, you can avoid contention on parts of your system to allow it to better scale. An example of this that we’ve already covered in this chapter is the use of database read replicas. The read traffic is served by the read replicas, reducing the load on the primary database node and allowing reads to be scaled effectively. The reads on a replica are done against data that might be stale. The read replica will eventually get updated by the replication from p...

---

## Where to Cache

For Scale If you can divert reads to caches, you can avoid contention on parts of your system to allow it to better scale. An example of this that we’ve already covered in this chapter is the use of database read replicas. The read traffic is served by the read replicas, reducing the load on the primary database node and allowing reads to be scaled effectively. The reads on a replica are done against data that might be stale. The read replica will eventually get updated by the replication from p...

---

## Invalidation

The benefits here are obvious. This is super efficient, for one thing. However, we need to recognize that this form of caching is highly specific. We’ve only cached the result of this specific request. This means that other operations that hit Sales or Catalog won’t be hitting a cache and thus won’t benefit in any way from this form of optimization. Invalidation There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton Invalidation is the process by...

---

## The Golden Rule of Caching

updated. Conceptually, you can think of the cache as a buffer. Writing into the cache is faster than updating the origin. So we write the result into the cache, allowing faster subsequent reads, and trust that the origin will be updated afterward. The main concern around write-behind caches is going to be the potential for data loss. If the cache itself isn’t durable, we could lose the data before the data is written to the origin. Additionally, we’re now in an interesting spot—what is the origi...

---

## Freshness Versus Optimization

request from Recommendation to Inventory to get an up-to-date stock level, but unbeknownst to us, our request hits the server-side cache, which at this point could also be up to one minute old. So we could end up storing a record in our client-side cache that is already up to one minute old from the start. This means that the stock levels Recommendation is using could potentially be up to two minutes out of date, even though from the point of view of Recommendation , we think they could be only ...

---

## Cache Poisoning: A Cautionary Tale

Balancing these forces is going to come down to understanding the requirements of the end user and of the wider system. Users will obviously always want to operate on the freshest data, but not if that means the system falls down under load. Likewise, sometimes the safest thing to do is to turn off features if a cache fails, in order to avoid an overload on the origin causing more serious issues. When it comes to fine-tuning what, where, and how to cache, you’ll often find yourself having to bal...

---

## Autoscaling

cache. However, that wasn’t enough. As we just discussed, you can cache in multiple places—but sometimes having lots of caches makes your life harder, not easier. When it comes to serving up content to users of a public-facing web application, you could have multiple caches between you and your customer. Not only might you be fronting your website with something like a content delivery network, but some ISPs make use of caching. Can you control those caches? And even if you could, there is one c...

---

## Starting Again

impact on the architecture of your system—vertical scaling and horizontal duplication, for example. At certain points, though, you need to do something pretty radical to change the architecture of your system to support the next level of growth. Recall the story of Gilt, which we touched on in “Isolated Execution” . A simple monolithic Rails application did well for Gilt for two years. Its business became increasingly successful, which meant more customers and more load. At a certain tipping poi...

---

## Summary

The scaling axes can be a useful model to use when considering what types of scaling are available to you: Vertical scaling In a nutshell, this means getting a bigger machine. Horizontal duplication Having multiple things capable of doing the same work. Data partitioning Dividing work based on some attribute of the data, e.g., customer group. Functional decomposition Separation of work based on the type, e.g., microservice decomposition. Key to a lot of this is understanding what it is you want—...

---

## III. People

Part III. People

---
