---
sidebar_position: 11
title: 'Chapter 10: From Monitoring to Observability'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-10
---

# Chapter 10: From Monitoring to Observability

**Part I — Foundation**

> As	I’ve	shown	so	far,	I	hope,	breaking	our	system	up	into	smaller,	fine-grained

---

## Disruption, Panic, and Confusion

Chapter 10. From Monitoring to Observability As I’ve shown so far, I hope, breaking our system up into smaller, fine-grained microservices results in multiple benefits. It also, as we’ve also covered in some depth, adds significant sources of new complexity. In no situation is this increased complexity more evident than when it comes to understanding the behavior of our systems in a production environment. Very early on, you’ll find that the tools and techniques that worked well for relatively s...

---

## Single Microservice, Single Server

Figure 10-1. A single microservice instance on a single host First, we’ll want to get information from the host itself. CPU, memory—all of these things can be useful. Next, we’ll want to have access to the logs from the microservice instance itself. If a user reports an error, we should be able to see the error in these logs, hopefully giving us a way to work out what went wrong. At this point, with our single host, we can probably get by with just logging locally to the host and using command-l...

---

## Single Microservice, Multiple Servers

balancer. Things start to get a bit trickier now. We still want to monitor all the same things as before, but we need to do so in such a way that we can isolate the problem. When the CPU is high, is it a problem we are seeing on all hosts, which would point to an issue with the service itself? Or is it isolated to a single host, implying that the host itself has the problem—perhaps a rogue OS process? At this point, we still want to track the host-level metrics, and perhaps maybe even alert on t...

---

## Multiple Services, Multiple Servers

balancer for downstream calls to microservices. However, we also have to consider what happens if the load balancer is turning out to be the bottleneck in our system—capturing response times both at the load balancer and at the microservices themselves could be needed. At this point, we probably also care a lot more about what a healthy service looks like, as we’ll configure our load balancer to remove unhealthy nodes from our application. Hopefully by the time we get here, we have at least some...

---

## Observability Versus Monitoring

Figure 10-3. Multiple collaborating services distributed across multiple hosts Aggregation of information—metrics and logs—play a vital part in making this happen. But this is not the only thing we need to consider. We need to work out how to sift this huge influx of data and try to make sense of it all. Above all, this is largely about a mindset shift, from a fairly static landscape of monitoring to the more active world of observability and testing in production. Observability Versus Monitorin...

---

## The Pillars of Observability? Not So Fast

at least New Relic is trying. Although this simple model initially appealed to me greatly (and I’m a sucker for an acronym!), over time I’ve really moved away from this thinking as being overly reductive but also potentially missing the point. Firstly, reducing a property of a system to implementation details in this way seems backward to me. Observability is a property, and there are many ways I might be able to achieve that property. Focusing too much on specific implementation details runs th...

---

## Building Blocks for Observability

customer has logged in, or any number of things. We can project from this event stream a trace (assuming we can correlate these events), a searchable index, or an aggregation of numbers. Although at present we chose to collect this information in different ways, using different tools and different protocols, our current toolchains shouldn’t limit our thinking in terms of how best to get the information we need. When it comes to making your system observable, think about the outputs you need from...

---

## Log Aggregation

what went wrong and derive accurate latency information Are you doing OK? Looking at error budgets, SLAs, SLOs, and so on to see how they can be used as part of making sure our microservice is meeting the needs of its consumers Alerting What should you alert on? What does a good alert look like? Semantic monitoring Thinking differently about the health of our systems, and about what should wake us up at 3 a.m. Testing in production A summary of various testing in production techniques Let’s star...

---

## Metrics Aggregation

that this was something its developers built for—rather than maintaining an index, they focus on efficient and scalable ingestion of data with some smart solutions to try and keep query times down. Even if you do have a solution that can store the volume of logs you want, these logs can end up containing a lot of valuable and sensitive information. This means that you might have to limit access to the logs (which could further complicate your efforts to have collective ownership of your microser...

---

## Distributed Tracing

including the US Treasury’s network. Distributed Tracing So far, I’ve primarily been talking about collecting information in isolation. Yes, we’re aggregating that information, but understanding the wider context in which this information has been captured can be key. Fundamentally, a microservice architecture is a set of processes that work together to carry out some kind of task—we explored the various different ways we can coordinate these activities in Chapter 6 . Thus it makes sense, when w...

---

## Are We Doing OK?

on work done by the earlier OpenTracing and OpenConsensus APIs, this API now has broad industry support. Are We Doing OK? We’ve talked a lot about the things you could be doing as the operator of a system—the mindset you need, the information you might need to gather. But how do you know if you’re doing too much—or not enough? How do you know if you are doing a good enough job, or that your system is working well enough? Binary concepts of a system being “up” or “down” start to have less and les...

---

## Alerting

its SLOs, we would assume that all the SLAs have also been achieved, but SLOs can speak to other goals not outlined in the SLA—or they might be aspirational, they could be inward facing (trying to carry out some internal change). SLOs can often reflect something that the team itself wants to achieve that may have no relation to an SLA. Service-level indicators To determine if we are meeting our SLOs, we need to gather real data. This is what our service-level indicators (SLI) are. An SLI is a me...

---

## Semantic Monitoring

Help the operator understand what actions need to be taken. Focusing Draw attention to the most important issues. Looking back over my career to times when I’ve worked in production support, it’s depressing to think how rarely the alerts I’ve had to deal with follow any of these rules. All too often, unfortunately, the people providing information to our alerting systems and the people actually on the receiving ends of our alerts are different people. From Shorrock again: Understanding the natur...

---

## Testing in Production

locked away in a database somewhere, we may not be able to collect this information and act on it accordingly. This is why you may need to get better at exposing access to information that you would previously consider to be “business” metrics to your production tooling. If you can emit a CPU rate to your metrics store, and this metric store could be used to alert on this condition, then why can’t you also record a sale and a dollar value into this same store? One of the main drawbacks of real u...

---

## Standardization

pull off is where to allow for decisions to be made narrowly for a single microservice versus where you need to standardize across your system. In my opinion, monitoring and observability is one area in which standardization can be incredibly important. With microservices collaborating in lots of different ways to provide capabilities to users using multiple interfaces, you need to view the system in a holistic way. You should try to write your logs out in a standard format. You definitely want ...

---

## Selecting Tools

pull off is where to allow for decisions to be made narrowly for a single microservice versus where you need to standardize across your system. In my opinion, monitoring and observability is one area in which standardization can be incredibly important. With microservices collaborating in lots of different ways to provide capabilities to users using multiple interfaces, you need to view the system in a holistic way. You should try to write your logs out in a standard format. You definitely want ...

---

## Democratic

If you have tools that are so hard to work with only experienced operators can make use of them, then you limit the number of people who can participate in production activities. Likewise, if you pick tools that are so expensive as to prohibit their use in any situation other than critical production environments, then developers will not have exposure to these tools until it’s too late. Pick tools that consider the needs of all the people whom you will want using them. If you really want to mov...

---

## Easy to Integrate

If you have tools that are so hard to work with only experienced operators can make use of them, then you limit the number of people who can participate in production activities. Likewise, if you pick tools that are so expensive as to prohibit their use in any situation other than critical production environments, then developers will not have exposure to these tools until it’s too late. Pick tools that consider the needs of all the people whom you will want using them. If you really want to mov...

---

## Provide Context

If you have tools that are so hard to work with only experienced operators can make use of them, then you limit the number of people who can participate in production activities. Likewise, if you pick tools that are so expensive as to prohibit their use in any situation other than critical production environments, then developers will not have exposure to these tools until it’s too late. Pick tools that consider the needs of all the people whom you will want using them. If you really want to mov...

---

## Real-Time

How has this changed in relation to other things in the system? Relational context Is something depending on this? Is this depending on something else? Proportional context How bad is this? Is it large or small scoped? Who is impacted? Real-Time You can’t wait ages for this information. You need it now. Your definition of “now” can of course vary somewhat, but in the context of your systems, you need information quickly enough that you have a chance of spotting a problem before a user does, or a...

---

## Suitable for Your Scale

How has this changed in relation to other things in the system? Relational context Is something depending on this? Is this depending on something else? Proportional context How bad is this? Is it large or small scoped? Who is impacted? Real-Time You can’t wait ages for this information. You need it now. Your definition of “now” can of course vary somewhat, but in the context of your systems, you need information quickly enough that you have a chance of spotting a problem before a user does, or a...

---

## The Expert in the Machine

You also ideally want a tool that can scale as you scale. Again, cost effectiveness can come into play here. Even if your tool of choice can technically scale to support the expected growth of your system, can you afford to keep paying for it? The Expert in the Machine I’ve talked a lot about tools in this chapter, perhaps more than in any other chapter in the book. This is partly due to the fundamental shift from viewing the world purely in terms of monitoring to instead thinking about how to m...

---

## Getting Started

help see patterns in the data, showing odd clusters of patients that could be determined by correlating various facets of the data. The data scientists could say “these patients seem related” but had no awareness as to what the meaning of that relationship was. It took a clinician to explain that some of these clusters referred to patients who were, in general, more sick than others. It required expertise to identify the cluster, and a different expertise to understand what this cluster meant an...

---

## Summary

place. I’d hesitate to say that you need to start with a dedicated distributed tracing tool. If you have to run and host the tool yourself, this can add significant complexity. On the other hand, if you can make use of a fully managed service offering easily, instrumenting your microservices from the start can make a lot of sense. For key operations, strongly consider creating synthetic transactions as a way of better understanding if the vital aspects of your system are working properly. Build ...

---
