---
sidebar_position: 5
title: 'Chapter 4: Microservice Communication Styles'
description: '**Part I — Foundation**'
tags:
- books
- building-microservice
- chapter-04
---

# Chapter 4: Microservice Communication Styles

**Part I — Foundation**

> Getting	communication	between	microservices	right	is	problematic	for	many

---

## From In-Process to Inter-Process

Chapter 4. Microservice Communication Styles Getting communication between microservices right is problematic for many due in great part, I feel, to the fact that people gravitate toward a chosen technological approach without first considering the different types of communication they might want. In this chapter, I’ll try and tease apart the different styles of communication to help you understand the pros and cons of each, as well as which approach will best fit your problem space. We’ll be lo...

---

## Performance

The performance of an in-process call is fundamentally different from that of an inter-process call. When I make an in-process call, the underlying compiler and runtime can carry out a whole host of optimizations to reduce the impact of the call, including inlining the invocation so it’s as though there was never a call in the first place. No such optimizations are possible with inter-process calls. Packets have to be sent. Expect the overhead of an inter-process call to be significant compared ...

---

## Changing Interfaces

aware if they are doing something that will result in a network call; otherwise, you should not be surprised if you end up with some nasty performance bottlenecks further down the line caused by odd inter-service interactions that weren’t visible to the developer writing the code. Changing Interfaces When we consider changes to an interface inside a process, the act of rolling out the change is straightforward. The code implementing the interface and the code calling the interface are all packag...

---

## Error Handling

aware if they are doing something that will result in a network call; otherwise, you should not be surprised if you end up with some nasty performance bottlenecks further down the line caused by odd inter-service interactions that weren’t visible to the developer writing the code. Changing Interfaces When we consider changes to an interface inside a process, the act of rolling out the change is straightforward. The code implementing the interface and the code calling the interface are all packag...

---

## Technology for Inter-Process Communication: So Many Choices

service is telling the client that there is something wrong with the original request. As such, it’s probably something you should give up on—is there any point retrying a 404 Not Found , for example? The 500 series response codes relate to downstream issues, a subset of which indicate to the client that the issue might be temporary. A 503 Service Unavailable , for example, indicates that the downstream server is unable to handle the request, but it may be a temporary state, in which case an ups...

---

## Styles of Microservice Communication

considering whether it actually fits their problem. Thus when it comes to the bewildering array of technology available to us for communication between microservices, I think it’s important to talk first about the style of communication you want, and only then look for the right technology to implement that style. With that in mind, let’s take a look at a model I’ve been using for several years to help distinguish between the different approaches for microservice-to-microservice communication, w...

---

## Mix and Match

Mix and Match It’s important to note that a microservice architecture as a whole may have a mix of styles of collaboration, and this is typically the norm. Some interactions just make sense as request-response, while others make sense as event-driven. In fact, it’s common for a single microservice to implement more than one form of collaboration. Consider an Order microservice that exposes a request-response API that allows for orders to be placed or changed and then fires events when these chan...

---

## Pattern: Synchronous Blocking

Mix and Match It’s important to note that a microservice architecture as a whole may have a mix of styles of collaboration, and this is typically the norm. Some interactions just make sense as request-response, while others make sense as event-driven. In fact, it’s common for a single microservice to implement more than one form of collaboration. Consider an Order microservice that exposes a request-response API that allows for orders to be placed or changed and then fires events when these chan...

---

## Advantages

Advantages There is something simple and familiar about a blocking, synchronous call. Many of us learned to program in a fundamentally synchronous style—reading a piece of code like a script, with each line executing in turn, and with the next line of code waiting its turn to do something. Most of the situations in which you would have used inter-process calls were probably done in a synchronous, blocking style—running a SQL query on a database, for example, or making an HTTP request of a downst...

---

## Disadvantages

Advantages There is something simple and familiar about a blocking, synchronous call. Many of us learned to program in a fundamentally synchronous style—reading a piece of code like a script, with each line executing in turn, and with the next line of code waiting its turn to do something. Most of the situations in which you would have used inter-process calls were probably done in a synchronous, blocking style—running a SQL query on a database, for example, or making an HTTP request of a downst...

---

## Where to Use It

slowly. Thus the use of synchronous calls can make a system vulnerable to cascading issues caused by downstream outages more readily than can the use of asynchronous calls. Where to Use It For simple microservice architectures, I don’t have a massive problem with the use of synchronous, blocking calls. Their familiarity for many people is an advantage when coming to grips with distributed systems. For me, these types of calls begin to be problematic when you start having more chains of calls—in ...

---

## Pattern: Asynchronous Nonblocking

Figure 4-4. Moving Fraud Detection to a background process can reduce concerns around the length of the call chain Of course, we could also replace the use of blocking calls with some style of nonblocking interaction without changing the workflow here, an approach we’ll explore next. Pattern: Asynchronous Nonblocking With asynchronous communication, the act of sending a call out over the network doesn’t block the microservice issuing the call. It is able to carry on with any other processing wit...

---

## Advantages

Communication through common data The upstream microservice changes some common data, which one or more microservices later make use of. Request-response A microservice sends a request to another microservice asking it to do something. When the requested operation completes, whether successfully or not, the upstream microservice receives the response. Specifically, any instance of the upstream microservice should be able to handle the response. Event-driven interaction A microservice broadcasts ...

---

## Disadvantages

communication. Figure 4-5. The Order Processor kicks off the process to package and ship an order, which is done in an asynchronous fashion If we tried doing something similar with synchronous blocking calls, then we’d have to restructure the interactions between Order Processor and Warehouse —it wouldn’t be feasible for Order Processor to open a connection, send a request, block any further operations in calling the thread, and wait for a response for what might be hours or days. Disadvantages ...

---

## Where to Use It

Even though our exchange rates are being received in an asynchronous fashion, the use of await in this context means we are blocking until the state of latestRate is resolved. So even if the underlying technology we are using to get the rate could be considered asynchronous in nature (for example, waiting for the rate), from the point of our code, this is inherently a synchronous, blocking interaction. Where to Use It Ultimately, when considering whether asynchronous communication is right for y...

---

## Pattern: Communication Through Common Data

Even though our exchange rates are being received in an asynchronous fashion, the use of await in this context means we are blocking until the state of latestRate is resolved. So even if the underlying technology we are using to get the rate could be considered asynchronous in nature (for example, waiting for the rate), from the point of our code, this is inherently a synchronous, blocking interaction. Where to Use It Ultimately, when considering whether asynchronous communication is right for y...

---

## Implementation

Figure 4-6. One microservice writes out a file that other microservices make use of This pattern is in some ways the most common general inter-process communication pattern that you’ll see, and yet we sometimes fail to see it as a communication pattern at all—I think largely because the communication between processes is often so indirect as to be hard to spot. Implementation To implement this pattern, you need some sort of persistent store for the data. A filesystem in many cases can be enough....

---

## Advantages

technology. If you can read or write to a file or read and write to a database, you can use this pattern. The use of prevalent and well-understood technology also enables interoperability between different types of systems, including older mainframe applications or customizable off-the-shelf (COTS) software products. Data volumes are also less of a concern here—if you’re sending lots of data in one big go, this pattern can work well. Disadvantages Downstream consuming microservices will typicall...

---

## Disadvantages

technology. If you can read or write to a file or read and write to a database, you can use this pattern. The use of prevalent and well-understood technology also enables interoperability between different types of systems, including older mainframe applications or customizable off-the-shelf (COTS) software products. Data volumes are also less of a concern here—if you’re sending lots of data in one big go, this pattern can work well. Disadvantages Downstream consuming microservices will typicall...

---

## Where to Use It

that might have restrictions on what technology they can use. Having an existing system talk to your microservice’s GRPC interface or subscribe to its Kafka topic might well be more convenient from the point of view of the microservice, but not from the point of view of a consumer. Older systems may have limitations on what technology they can support and may have high costs of change. On the other hand, even old mainframe systems should be able to read data out of a file. This does of course al...

---

## Pattern: Request-Response Communication

that might have restrictions on what technology they can use. Having an existing system talk to your microservice’s GRPC interface or subscribe to its Kafka topic might well be more convenient from the point of view of the microservice, but not from the point of view of a consumer. Older systems may have limitations on what technology they can support and may have high costs of change. On the other hand, even old mainframe systems should be able to read data out of a file. This does of course al...

---

## Implementation: Synchronous Versus Asynchronous

the request should be acted on. If the request it has been sent violates internal logic, the microservice should reject it. Although it’s a subtle difference, I don’t feel that the term command conveys the same meaning. I’ll stick to using request over command , but whatever term you decide to use, just remember that a microservice gets to reject the request/command if appropriate. Implementation: Synchronous Versus Asynchronous Request-response calls like this can be implemented in either a blo...

---

## Where to Use It

One last note: all forms of request-response interaction are likely going to require some form of time-out handling to avoid issues where the system gets blocked waiting for something that may never happen. How this time-out functionality is implemented can vary based on the implementation technology, but it will be needed. We’ll look at time-outs in more detail in Chapter 12 . PARALLEL VERSUS SEQUENTIAL CALLS When working with request-response interactions, you’ll often encounter a situation in...

---

## Pattern: Event-Driven Communication

implementation, with the same trade-offs we discussed earlier. Pattern: Event-Driven Communication Event-driven communication looks quite odd compared to request-response calls. Rather than a microservice asking some other microservice to do something, a microservice emits events that may or may not be received by other microservices. It is an inherently asynchronous interaction, as the event listeners will be running on their own thread of execution. An event is a statement about something that...

---

## Implementation

create more autonomous teams. Rather than holding all the responsibility centrally, we want to push it into the teams themselves to allow them to operate in a more autonomous fashion—a concept we will revisit in Chapter 15 . Here, we are pushing responsibility from Warehouse into Notifications and Payment —this can help us reduce the complexity of microservices like Warehouse and lead to a more even distribution of “smarts” in our system. We’ll explore that idea in more detail when we compare ch...

---

## What’s in an Event?

using it to handle publishing and subscribing to events. If you don’t already have one, give Atom a look, but be aware of the sunk cost fallacy. If you find yourself wanting more and more of the support that a message broker gives you, at a certain point you might want to change your approach. In terms of what we actually send over these asynchronous protocols, the same considerations apply as with synchronous communication. If you are currently happy with encoding requests and responses using J...

---

## Where to Use It

event, the more assumptions external parties will have about the event. My general rule is that I am OK putting information into an event if I’d be happy sharing the same data over a request-response API. Where to Use It Event-driven collaboration thrives in situations in which information wants to be broadcast, and in situations in which you are happy to invert intent. Moving away from a model of telling other things what to do and instead letting downstream microservices work this out for them...

---

## Proceed with Caution

Some of this asynchronous stuff seems fun, right? Event-driven architectures seem to lead to significantly more decoupled, scalable systems. And they can. But these communication styles do lead to an increase in complexity. This isn’t just the complexity required to manage publishing and subscribing to messages, as we just discussed, but also complexity in the other problems we might face. For example, when considering long-running async request-response, we have to think about what to do when t...

---

## Summary

immediately obvious if you are familiar only with synchronous point-to-point communication. The associated complexity with event-driven architectures and asynchronous programming in general leads me to believe that you should be cautious in how eagerly you start adopting these ideas. Ensure you have good monitoring in place, and strongly consider the use of correlation IDs, which allow you to trace requests across process boundaries, as we’ll cover in depth in Chapter 10 . I also strongly recomm...

---

## II. Implementation

Part II. Implementation

---
