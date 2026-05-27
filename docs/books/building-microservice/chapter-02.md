---
sidebar_position: 3
title: 'Chapter 2: How to Model Microservices'
description: '**Part I — Foundation**'
tags:
- books
- building-microservice
- chapter-02
---

# Chapter 2: How to Model Microservices

**Part I — Foundation**

> My	opponent’s	reasoning	reminds	me	of	the	heathen,	who,	being	asked	on

---

## Introducing MusicCorp

Chapter 2. How to Model Microservices My opponent’s reasoning reminds me of the heathen, who, being asked on what the world stood, replied, “On a tortoise.” But on what does the tortoise stand? “On another tortoise.” — Rev. Joseph Frederick Berg (1854) So you know what microservices are and, I hope, have a sense of their key benefits. You’re probably eager now to go and start making them, right? But where to start? In this chapter, we’ll look at some foundational concepts such as information hid...

---

## What Makes a Good Microservice Boundary?

And while it may have just learned that Spotify is in fact a digital music service rather than some sort of skin treatment for teenagers, MusicCorp is pretty happy with its own focus and is sure all of this streaming business will blow over soon. Despite being a little behind the curve, MusicCorp has grand ambitions. Luckily, it has decided that its best chance of taking over the world is to make sure it can make changes as easily as possible. Microservices for the win! What Makes a Good Microse...

---

## Information Hiding

And while it may have just learned that Spotify is in fact a digital music service rather than some sort of skin treatment for teenagers, MusicCorp is pretty happy with its own focus and is sure all of this streaming business will blow over soon. Despite being a little behind the curve, MusicCorp has grand ambitions. Luckily, it has decided that its best chance of taking over the world is to make sure it can make changes as easily as possible. Microservices for the win! What Makes a Good Microse...

---

## Cohesion

callers won’t also have to change. This applies with microservices, as well, except that we also have the opportunity to deploy that changed microservice without having to deploy anything else, arguably amplifying the three desirable characteristics that Parnas describes of improved development time, comprehensibility, and flexibility. The implications of information hiding play out in so many ways, and I’ll pick up this theme throughout the book. Cohesion One of the most succinct definitions I’...

---

## Coupling

What sorts of things cause tight coupling? A classic mistake is to pick an integration style that tightly binds one service to another, causing changes inside the service to require a change to consumers. A loosely coupled service knows as little as it needs to about the services with which it collaborates. This also means we probably want to limit the number of different types of calls from one service to another, because beyond the potential performance problem, chatty communication can lead t...

---

## The Interplay of Coupling and Cohesion

What sorts of things cause tight coupling? A classic mistake is to pick an integration style that tightly binds one service to another, causing changes inside the service to require a change to consumers. A loosely coupled service knows as little as it needs to about the services with which it collaborates. This also means we probably want to limit the number of different types of calls from one service to another, because beyond the potential performance problem, chatty communication can lead t...

---

## Types of Coupling

find the right balance between these two ideas, one that makes the most sense for your given context and the problems you are currently facing. Remember, the world isn’t static—it’s possible that as your system requirements change, you’ll find reasons to revisit your decisions. Sometimes parts of your system may be going through so much change that stability might be impossible. We’ll look at an example of this in Chapter 3 when I share the experiences of the product development team behind Snap...

---

## Domain Coupling

Edward Yourdon, Structured Design , is considered one of the most important texts in this area. Meilir Page-Jones’s The Practical Guide to Structured Systems Design is also useful. Unfortunately, one thing these books have in common is how hard they can be to get hold of, as they are out of print and aren’t available in ebook format. Yet another reason to support your local library! Not all the ideas map cleanly, so I have done my best to synthesize a working model for the different types of cou...

---

## Pass-Through Coupling

Temporal coupling isn’t always bad; it’s just something to be aware of. As you have more microservices, with more complex interactions between them, the challenges of temporal coupling can increase to such a point that it becomes more difficult to scale your system and keep it working. One of the ways to avoid temporal coupling is to use some form of asynchronous communication, such as a message broker. Pass-Through Coupling “Pass-through coupling” describes a situation in which one microservice...

---

## Common Coupling

about the contents. Instead, it just sends it along. A change in the format of the the Shipping Manifest would still require a change to both the Order Processor and the Shipping microservice, but as the Warehouse doesn’t care about what is actually in the manifest, it doesn’t need to change. Common Coupling Common coupling occurs when two or more microservices make use of a common set of data. A simple and common example of this form of coupling would be multiple microservices making use of the...

---

## Content Coupling

So common coupling is sometimes OK, but often it’s not. Even when it’s benign, it means that we are limited in what changes can be made to the shared data, but it often speaks to a lack of cohesion in our code. It can also cause us problems in terms of operational contention. It’s for those reasons that we consider common coupling to be one of the least desirable forms of coupling—but it can get worse. Content Coupling Content coupling describes a situation in which an upstream service reaches i...

---

## Just Enough Domain-Driven Design

that doesn’t impact the contract your microservice exposes can be changed without concern. It’s certainly the case that the problems that occur with common coupling also apply with content coupling, but content coupling has some additional headaches that make it problematic enough that some people refer to it as pathological coupling . When you allow an outside party to directly access your database, the database in effect becomes part of that external contract, albeit one where you cannot easil...

---

## Ubiquitous Language

A collection of objects that are managed as a single entity, typically referring to real-world concepts. Bounded context An explicit boundary within a business domain that provides functionality to the wider system but that also hides complexity. Ubiquitous Language Ubiquitous language refers to the idea that we should strive to use the same terms in our code as the users use. The idea is that having a common language between the delivery team and the actual people will make it easier to model t...

---

## Aggregate

lot of work in helping translate. Our business analysts were often just spending their time explaining the same concepts over and over again as a result. By working the real-world language into the code, things became much easier. A developer picking up a story written using the terms that had come straight from the product owner was much more likely to understand their meaning and work out what needed to be done. Aggregate In DDD, an aggregate is a somewhat confusing concept, with many differen...

---

## Bounded Context

implementation, to reshape aggregates over time. I consider implementation concerns to be secondary, however; I begin by letting the mental model of the system users be my guiding light on initial design until other factors come into play. Bounded Context A bounded context typically represents a larger organizational boundary. Within the scope of that boundary, explicit responsibilities need to be carried out. That’s all a bit woolly, so let’s look at another specific example. At MusicCorp, our ...

---

## Mapping Aggregates and Bounded Contexts to Microservices

Both the aggregate and the bounded context give us units of cohesion with well- defined interfaces with the wider system. The aggregate is a self-contained state machine that focuses on a single domain concept in our system, with the bounded context representing a collection of associated aggregates, again with an explicit interface to the wider world. Both can therefore work well as service boundaries. When starting out, as I’ve already mentioned, you want to reduce the number of services you w...

---

## Event Storming

Figure 2-16. The Warehouse service internally has been split into Inventory and Shipping microservices This is another form of information hiding—we’ve hidden a decision about internal implementation in such a way that if this implementation detail changes again in the future, our consumers will be unaware. Another reason to prefer the nested approach could be to chunk up your architecture to simplify testing. For example, when testing services that consume the warehouse, I don’t have to stub ea...

---

## The Case for Domain-Driven Design for Microservices

summarize how this approach is useful to us. Firstly, a big part of what makes DDD so powerful is that bounded contexts, which are so important to DDD, are explicitly about hiding information— presenting a clear boundary to the wider system while hiding internal complexity that is able to change without impacting other parts of the system. This means that when we follow a DDD approach, whether we realize it or not, we are also adopting information hiding—and as we’ve seen, this is vital in helpi...

---

## Alternatives to Business Domain Boundaries

summarize how this approach is useful to us. Firstly, a big part of what makes DDD so powerful is that bounded contexts, which are so important to DDD, are explicitly about hiding information— presenting a clear boundary to the wider system while hiding internal complexity that is able to change without impacting other parts of the system. This means that when we follow a DDD approach, whether we realize it or not, we are also adopting information hiding—and as we’ve seen, this is vital in helpi...

---

## Volatility

As I’ve outlined, DDD can be incredibly useful when building microservice architectures, but it would be a mistake to think that this is the only technique you should consider when finding microservice boundaries. In fact, I often use multiple methods in conjunction with DDD to help identify how (and if) a system should be split. Let’s look at some of the other factors we might consider when finding boundaries. Volatility I’ve increasingly heard of pushback against domain-oriented decomposition,...

---

## Data

little more than an advert in a newspaper. Then online ordering became a thing, and the entire warehouse, which up until that point had just been handled with paper, had to be digitized. Who knows—perhaps MusicCorp will at some stage have to consider making music available digitally! Although you might consider that MusicCorp is behind the times, you can still appreciate the amount of upheaval that companies have been going through as they understand how changing technology and customer behavior...

---

## Technology

Figure 2-17. PaymentCo, which segregates processes based on its use of credit card information to limit the scope of PCI requirements Technology The need to make use of different technology can also be a factor in terms of finding a boundary. You can accommodate different databases in a single running microservice, but if you want to mix different runtime models, you may face a challenge. If you determine that part of your functionality needs to be implemented in a runtime like Rust, which enabl...

---

## Organizational

Figure 2-18. A traditional three-tiered architecture is often driven by technological boundaries Organizational As we established when I introduced Conway’s law back in Chapter 1 , there is an inherent interplay between organizational structure and the system architecture you end up with. Quite aside from the studies that have shown this link, in my own anecdotal experience I have seen this play out time and time again. How you organize yourself ends up driving your systems architecture, for goo...

---

## Mixing Models and Exceptions

Mixing Models and Exceptions As I hope is clear so far, I am not dogmatic in terms of how you find these boundaries. If you follow the guidelines of information hiding and appreciate the interplay of coupling and cohesion, then chances are you’ll avoid some of the worst pitfalls of whatever mechanism you pick. I happen to think that by focusing on these ideas you are more likely to end up with a domain-oriented architecture, but that is by the by. The fact is, though, that there can often be rea...

---

## Summary

boundary, and how to find seams in our problem space that give us the dual benefits of both low coupling and strong cohesion. Having a detailed understanding of our domain can be a vital tool in helping us find these seams, and by aligning our microservices to these boundaries we ensure that the resulting system has every chance of keeping those virtues intact. We’ve also gotten a hint about how we can subdivide our microservices further. The ideas presented in Eric Evans’s Domain-Driven Design ...

---
