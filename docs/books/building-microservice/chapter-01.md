---
sidebar_position: 2
title: 'Chapter 1: What Are Microservices?'
description: '**Part I — Foundation**'
tags:
- books
- building-microservice
- chapter-01
---

# Chapter 1: What Are Microservices?

**Part I — Foundation**

> Microservices	have	become	an	increasingly	popular	architecture	choice	in	the

---

## Microservices at a Glance

Chapter 1. What Are Microservices? Microservices have become an increasingly popular architecture choice in the half decade or more since I wrote the first edition of this book. I can’t claim credit for the subsequent explosion in popularity, but the rush to make use of microservice architectures means that while many of the ideas I captured previously are now tried and tested, new ideas have come into the mix at the same time that earlier practices have fallen out of favor. So it’s once again t...

---

## Key Concepts of Microservices

Many of the problems laid at the door of SOA are actually problems with things like communication protocols (e.g., SOAP), vendor middleware, a lack of guidance about service granularity, or the wrong guidance on picking places to split your system. A cynic might suggest that vendors co-opted (and in some cases drove) the SOA movement as a way to sell more products, and those selfsame products in the end undermined the goal of SOA. I’ve seen plenty of examples of SOA in which teams were striving ...

---

## Independent Deployability

Many of the problems laid at the door of SOA are actually problems with things like communication protocols (e.g., SOAP), vendor middleware, a lack of guidance about service granularity, or the wrong guidance on picking places to split your system. A cynic might suggest that vendors co-opted (and in some cases drove) the SOA movement as a way to sell more products, and those selfsame products in the end undermined the goal of SOA. I’ve seen plenty of examples of SOA in which teams were striving ...

---

## Modeled Around a Business Domain

TIP If you take only one thing from this book and from the concept of microservices in general, it should be this: ensure that you embrace the concept of independent deployability of your microservices. Get into the habit of deploying and releasing changes to a single microservice into production without having to deploy anything else. From this, many good things will follow. To ensure independent deployability, we need to make sure our microservices are loosely coupled : we must be able to chan...

---

## Owning Their Own State

Figure 1-2. A traditional three-tiered architecture We will come back to the interplay of domain-driven design and how it interacts with organizational design later in this chapter. Owning Their Own State One of the things I see people having the hardest time with is the idea that microservices should avoid the use of shared databases. If a microservice wants to access data held by another microservice, it should go and ask that second microservice for the data. This gives the microservices the ...

---

## Size

compatibility with upstream consumers, we will force them to change as well. Having a clean delineation between internal implementation detail and an external contract for a microservice can help reduce the need for backward- incompatible changes. Hiding internal state in a microservice is analogous to the practice of encapsulation in object-oriented (OO) programming. Encapsulation of data in OO systems is an example of information hiding in action. TIP Don’t share databases unless you really ne...

---

## Flexibility

Flexibility Another quote from James Lewis is that “microservices buy you options.” Lewis was being deliberate with his words—they buy you options . They have a cost, and you must decide whether the cost is worth the options you want to take up. The resulting flexibility on a number of axes—organizational, technical, scale, robustness—can be incredibly appealing. We don’t know what the future holds, so we’d like an architecture that can theoretically help us solve whatever problems we might face...

---

## Alignment of Architecture and Organization

Flexibility Another quote from James Lewis is that “microservices buy you options.” Lewis was being deliberate with his words—they buy you options . They have a cost, and you must decide whether the cost is worth the options you want to take up. The resulting flexibility on a number of axes—organizational, technical, scale, robustness—can be incredibly appealing. We don’t know what the future holds, so we’d like an architecture that can theoretically help us solve whatever problems we might face...

---

## The Monolith

case, we would expect the portion of the UI related to this functionality to still be owned by the Customer Profile Team, as Figure 1-4 indicates. This concept of a team owning an end-to-end slice of user-facing functionality is gaining traction. The book Team Topologies introduces the idea of a stream-aligned team, which embodies this concept: A stream-aligned team is a team aligned to a single, valuable stream of work... [T]he team is empowered to build and deliver customer or user value as qu...

---

## The Single-Process Monolith

more clearly distinguish the microservice architecture, and to help you better understand whether microservices are worth considering, I should also discuss what exactly I mean by monoliths . When I talk about monoliths throughout this book, I am primarily referring to a unit of deployment. When all functionality in a system must be deployed together, I consider it a monolith. Arguably, multiple architectures fit this definition, but I’m going to discuss those I see most often: the single-proces...

---

## The Modular Monolith

The Modular Monolith As a subset of the single-process monolith, the modular monolith is a variation in which the single process consists of separate modules. Each module can be worked on independently, but all still need to be combined together for deployment, as shown in Figure 1-7 . The concept of breaking software into modules is nothing new; modular software has its roots in work done around structured programming in the 1970s, and even further back than that. Nonetheless, this is an approa...

---

## The Distributed Monolith

— Leslie Lamport A distributed monolith is a system that consists of multiple services, but for whatever reason, the entire system must be deployed together. A distributed monolith might well meet the definition of an SOA, but all too often, it fails to deliver on the promises of SOA. In my experience, a distributed monolith has all the disadvantages of a distributed system, and the disadvantages of a single- process monolith, without having enough of the upsides of either. Encountering a number...

---

## Monoliths and Delivery Contention

— Leslie Lamport A distributed monolith is a system that consists of multiple services, but for whatever reason, the entire system must be deployed together. A distributed monolith might well meet the definition of an SOA, but all too often, it fails to deliver on the promises of SOA. In my experience, a distributed monolith has all the disadvantages of a distributed system, and the disadvantages of a single- process monolith, without having enough of the upsides of either. Encountering a number...

---

## Advantages of Monoliths

simpler developer workflows, and monitoring, troubleshooting, and activities like end-to-end testing can be greatly simplified as well. Monoliths can also simplify code reuse within the monolith itself. If we want to reuse code within a distributed system, we need to decide whether we want to copy code, break out libraries, or push the shared functionality into a service. With a monolith, our choices are much simpler, and many people like that simplicity—all the code is there; just use it! Unfor...

---

## Enabling Technology

simpler developer workflows, and monitoring, troubleshooting, and activities like end-to-end testing can be greatly simplified as well. Monoliths can also simplify code reuse within the monolith itself. If we want to reuse code within a distributed system, we need to decide whether we want to copy code, break out libraries, or push the shared functionality into a service. With a monolith, our choices are much simpler, and many people like that simplicity—all the code is there; just use it! Unfor...

---

## Log Aggregation and Distributed Tracing

We’ll be exploring a lot of this technology in detail in subsequent chapters, but before that, let’s briefly introduce some of the enabling technology that might help you if you decide to make use of microservices. Log Aggregation and Distributed Tracing With the increasing number of processes you are managing, it can be difficult to understand how your system is behaving in a production setting. This can in turn make troubleshooting much more difficult. We’ll be exploring these ideas in more de...

---

## Containers and Kubernetes

source tools can provide some of these features. One example is Jaeger , which focuses on the distributed tracing side of the equation. But products like Lightstep and Honeycomb (shown in Figure 1-9 ) take these ideas further. They represent a new generation of tools that move beyond traditional monitoring approaches, making it much easier to explore the state of your running system. You might already have more conventional tools in place, but you really should look at the capabilities these pro...

---

## Streaming

times for new container instances, along with being much more cost effective for many architectures. After you begin playing around with containers, you’ll also realize that you need something to allow you to manage these containers across lots of underlying machines. Container orchestration platforms like Kubernetes do exactly that, allowing you to distribute container instances in such a way as to provide the robustness and throughput your service needs, while allowing you to make efficient us...

---

## Public Cloud and Serverless

helping ensure that traditional datasources can become part of a stream-based architecture. In Chapter 4 we’ll look at how streaming technology can play a part in microservice integration. Public Cloud and Serverless Public cloud providers, or more specifically the main three providers—Google Cloud, Microsoft Azure, and Amazon Web Services (AWS)—offer a huge array of managed services and deployment options for managing your application. As your microservice architecture grows, more and more work...

---

## Advantages of Microservices

helping ensure that traditional datasources can become part of a stream-based architecture. In Chapter 4 we’ll look at how streaming technology can play a part in microservice integration. Public Cloud and Serverless Public cloud providers, or more specifically the main three providers—Google Cloud, Microsoft Azure, and Amazon Web Services (AWS)—offer a huge array of managed services and deployment options for managing your application. As your microservice architecture grows, more and more work...

---

## Technology Heterogeneity

Technology Heterogeneity With a system composed of multiple, collaborating microservices, we can decide to use different technologies inside each one. This allows us to pick the right tool for each job rather than having to select a more standardized, one-size-fits-all approach that often ends up being the lowest common denominator. If one part of our system needs to improve its performance, we might decide to use a different technology stack that is better able to achieve the required performan...

---

## Robustness

organizations find this ability to more quickly absorb new technologies to be a real advantage. Embracing multiple technologies doesn’t come without overhead, of course. Some organizations choose to place some constraints on language choices. Netflix and Twitter, for example, mostly use the Java Virtual Machine (JVM) as a platform because those companies have a very good understanding of the reliability and performance of that system. They also develop libraries and tooling for the JVM that make...

---

## Scaling

Scaling With a large, monolithic service, we need to scale everything together. Perhaps one small part of our overall system is constrained in performance, but if that behavior is locked up in a giant monolithic application, we need to handle scaling everything as a piece. With smaller services, we can scale just those services that need scaling, allowing us to run other parts of the system on smaller, less powerful hardware, as illustrated in Figure 1-11 . Figure 1-11. You can target scaling at...

---

## Ease of Deployment

approach can be so closely correlated to an almost immediate cost savings. Ultimately, we can scale our applications in a multitude of ways, and microservices can be an effective part of this. We’ll look at the scaling of microservices in more detail in Chapter 13 . Ease of Deployment A one-line change to a million-line monolithic application requires the entire application to be deployed in order to release the change. That could be a large- impact, high-risk deployment. In practice, deployment...

---

## Organizational Alignment

approach can be so closely correlated to an almost immediate cost savings. Ultimately, we can scale our applications in a multitude of ways, and microservices can be an effective part of this. We’ll look at the scaling of microservices in more detail in Chapter 13 . Ease of Deployment A one-line change to a million-line monolithic application requires the entire application to be deployed in order to release the change. That could be a large- impact, high-risk deployment. In practice, deployment...

---

## Composability

Composability One of the key promises of distributed systems and service-oriented architectures is that we open up opportunities for reuse of functionality. With microservices, we allow for our functionality to be consumed in different ways for different purposes. This can be especially important when we think about how our consumers use our software. Gone is the time when we could think narrowly about either our desktop website or our mobile application. Now we need to think of the myriad ways ...

---

## Microservice Pain Points

Composability One of the key promises of distributed systems and service-oriented architectures is that we open up opportunities for reuse of functionality. With microservices, we allow for our functionality to be consumed in different ways for different purposes. This can be especially important when we think about how our consumers use our software. Gone is the time when we could think narrowly about either our desktop website or our mobile application. Now we need to think of the myriad ways ...

---

## Developer Experience

microservices that can be run on a single developer machine. I could probably run four or five JVM-based microservices as separate processes on my laptop, but could I run 10 or 20? Most likely not. Even with less taxing runtimes, there is a limit to the number of things you can run locally, which inevitably will start conversations about what to do when you can’t run the entire system on one machine. This can become even more complicated if you are using cloud services that you cannot run locall...

---

## Technology Overload

microservices that can be run on a single developer machine. I could probably run four or five JVM-based microservices as separate processes on my laptop, but could I run 10 or 20? Most likely not. Even with less taxing runtimes, there is a limit to the number of things you can run locally, which inevitably will start conversations about what to do when you can’t run the entire system on one machine. This can become even more complicated if you are using cloud services that you cannot run locall...

---

## Cost

technology, you’ll have a hard time of it. It’s also worth pointing out that the bandwidth taken up by trying to understand all of this new technology will reduce the time you have for actually shipping features to your users. As you (gradually) increase the complexity of your microservice architecture, look to introduce new technology as you need it. You don’t need a Kubernetes cluster when you have three services! In addition to ensuring that you’re not overloaded with the complexity of these ...

---

## Reporting

against a read replica, as shown in Figure 1-12 . Figure 1-12. Reporting carried out directly on the database of a monolith With a microservice architecture, we have broken up this monolithic schema. That doesn’t mean that the need for reporting across all our data has gone away; we’ve just made it much more difficult, because now our data is scattered across multiple logically isolated schemas. More modern approaches to reporting, such as using streaming to allow for real- time reporting on lar...

---

## Monitoring and Troubleshooting

to monitoring. We have a small number of machines to worry about, and the failure mode of the application is somewhat binary—the application is often either all up or all down. With a microservice architecture, do we understand the impact if just a single instance of a service goes down? With a monolithic system, if our CPU is stuck at 100% for a long time, we know it’s a big problem. With a microservice architecture with tens or hundreds of processes, can we say the same thing? Do we need to wa...

---

## Security

to monitoring. We have a small number of machines to worry about, and the failure mode of the application is somewhat binary—the application is often either all up or all down. With a microservice architecture, do we understand the impact if just a single instance of a service goes down? With a monolithic system, if our CPU is stuck at 100% for a long time, we know it’s a big problem. With a microservice architecture with tens or hundreds of processes, can we say the same thing? Do we need to wa...

---

## Testing

to monitoring. We have a small number of machines to worry about, and the failure mode of the application is somewhat binary—the application is often either all up or all down. With a microservice architecture, do we understand the impact if just a single instance of a service goes down? With a monolithic system, if our CPU is stuck at 100% for a long time, we know it’s a big problem. With a microservice architecture with tens or hundreds of processes, can we say the same thing? Do we need to wa...

---

## Latency

terms of the functionality they cover, and we are used to them being more problematic to write and maintain than smaller-scoped unit tests. Often this is worth it, though, because we want the confidence that comes from having an end-to-end test use our systems in the same way a user might. But with a microservice architecture, the scope of our end-to-end tests becomes very large. We would now need to run tests across multiple processes, all of which need to be deployed and appropriately configur...

---

## Data Consistency

Data Consistency Shifting from a monolithic system, in which data is stored and managed in a single database, to a much more distributed system, in which multiple processes manage state in different databases, causes potential challenges with respect to consistency of data. Whereas in the past you might have relied on database transactions to manage state changes, you’ll need to understand that similar safety cannot easily be provided in a distributed system. The use of distributed transactions ...

---

## Should I Use Microservices?

Data Consistency Shifting from a monolithic system, in which data is stored and managed in a single database, to a much more distributed system, in which multiple processes manage state in different databases, causes potential challenges with respect to consistency of data. Whereas in the past you might have relied on database transactions to manage state changes, you’ll need to understand that similar safety cannot easily be provided in a distributed system. The use of distributed transactions ...

---

## Whom They Might Not Work For

startups. In either case, the domain that you are working with is typically undergoing significant change as you iterate on the fundamentals of what you are trying to build. This shift in domain models will, in turn, result in more changes being made to service boundaries, and coordinating changes across service boundaries is an expensive undertaking . In general, I feel it’s more appropriate to wait until enough of the domain model has stabilized before looking to define service boundaries. I d...

---

## Where They Work Well

Finally, organizations creating software that will be deployed and managed by their customers may struggle with microservices. As we’ve already covered, microservice architectures can push a lot of complexity into the deployment and operational domain. If you are running the software yourself, you are able to offset this new complexity by adopting new technology, developing new skills, and changing working practices. This isn’t something you can expect your customers to do. If they are used to r...

---

## Summary

help you implement them. For example, you might decide to deploy one service as a set of functions, another as a managed virtual machine (VM), and another on a managed Platform as a Service (PaaS) platform. Although it’s worth noting that adopting a wide range of technology can often be a problem, being able to try out new technology easily is a good way to rapidly identify new approaches that might yield benefits. The growing popularity of FaaS platforms is one such example. For the appropriate...

---
