---
sidebar_position: 13
title: 'Chapter 12: Resiliency'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-12
---

# Chapter 12: Resiliency

**Part I — Foundation**

> As	software	becomes	an	increasingly	vital	part	of	our	users’	lives,	we	need	to

---

## What Is Resiliency?

Chapter 12. Resiliency As software becomes an increasingly vital part of our users’ lives, we need to continually improve the quality of service we offer. Software failing can have a significant impact on people’s lives, even if the software doesn’t fall into the category of “safety critical” in the way that things like aircraft control systems do. During the COVID-19 pandemic, which was ongoing at the time of writing, services like online grocery shopping went from being a convenience to becomi...

---

## Robustness

think more widely about what resiliency actually means. These four concepts are: Robustness The ability to absorb expected perturbation Rebound The ability to recover after a traumatic event Graceful extensibility How well we deal with a situation that is unexpected Sustained adaptability The ability to continually adapt to changing environments, stakeholders, and demands Let’s look at each of these concepts in turn and examine how these ideas might (or might not) translate into our world of bui...

---

## Rebound

Robustness by definition requires prior knowledge—we are putting measures into place to deal with known perturbations. This knowledge could be based on foresight: we could draw on our understandings of the computer system we are building, its supporting services, and our people to consider what might go wrong. But robustness can also come from hindsight—we may improve the robustness of our system after something we didn’t expect happens. Perhaps we never considered the fact that our global files...

---

## Graceful Extensibility

place in advance. For example, having backups in place can allow us to better rebound in the aftermath of data loss (assuming our backups are tested, of course!). Improving our ability to rebound could also include having a playbook we can run through in the wake of a system outage: Do people understand what their role is when an outage occurs? Who will be the point person for handling the situation? How quickly do we need to let our users know what is happening? How will we communicate with our...

---

## Sustained Adaptability

Having sustained adaptability requires us to not be complacent. As David Woods puts it: “No matter how good we have done before, no matter how successful we’ve been, the future could be different, and we might not be well adapted. We might be precarious and fragile in the face of that new future.” That we haven’t yet suffered from a catastrophic outage doesn’t mean that it cannot happen. We need to challenge ourselves to make sure we are constantly adapting what we do as an organization to ensur...

---

## And Microservice Architecture

help us achieve the property of robustness, but it is not enough if you want resiliency . Taken more broadly, the ability to deliver resiliency is a property not of the software itself but of the people building and running the system. Given the focus of this book, much of what follows in this chapter will focus primarily on what a microservice architecture can help deliver in terms of resiliency—which is almost entirely limited to improving the robustness of applications. Failure Is Everywhere ...

---

## Failure Is Everywhere

help us achieve the property of robustness, but it is not enough if you want resiliency . Taken more broadly, the ability to deliver resiliency is a property not of the software itself but of the people building and running the system. Given the focus of this book, much of what follows in this chapter will focus primarily on what a microservice architecture can help deliver in terms of resiliency—which is almost entirely limited to improving the robustness of applications. Failure Is Everywhere ...

---

## How Much Is Too Much?

discussed how each server contains its own local power supply to ensure it can keep operating if the data center has an outage. As you’ll recall from Chapter 10 , the hard drives in these servers were attached with Velcro rather than screws to make it easy to replace drives—helping Google get the machine up and running quickly when a drive failed, and in turn helping that component of the system rebound more effectively. So let me repeat: at scale, even if you buy the best kit, the most expensiv...

---

## Degrading Functionality

requirements as a core part of your software delivery process. Degrading Functionality An essential part of building a resilient system, especially when your functionality is spread over a number of different microservices that may be up or down, is the ability to safely degrade functionality. Let’s imagine a standard web page on our ecommerce site. To pull together the various parts of that website, we might need several microservices to play a part. One microservice might display the details a...

---

## Stability Patterns

microservice that depends on multiple downstream collaborators, you need to ask yourself, “What happens if this is down?” and know what to do. By thinking about the criticality of each of our capabilities in terms of our cross- functional requirements, we’ll be much better positioned to know what we can do. Now let’s consider some things we can do from a technical point of view to make sure that when failure occurs, we can handle it gracefully. Stability Patterns There are a few patterns we can ...

---

## Time-Outs

whole system down. Time out too quickly, and you’ll consider a call that might have worked as failed. Have no time-outs at all, and a downstream service being down could hang your whole system. In the case of AdvertCorp, we had two time-out related issues. Firstly, we had a missing time-out on the HTTP request pool, meaning that when asking for a worker to make a downstream HTTP request, the request thread would block forever until a worker became available. Secondly, when we finally had an HTTP...

---

## Retries

Don’t just think about the time-out for a single service call; also think about a time-out for the overall operation, and abort the operation if this overall time-out budget is exceeded. Retries Some issues with downstream calls are temporary. Packets can get misplaced, or gateways can have an odd spike in load, causing a time-out. Often, retrying the call can make a lot of sense. Coming back to what we just talked about, how often have you refreshed a web page that didn’t load, only to find the...

---

## Bulkheads

close the bulkhead doors. You lose part of the ship, but the rest of it remains intact. In software architecture terms, there are lots of different bulkheads we can consider. Returning to my own experience with AdvertCorp, we actually missed the chance to implement a bulkhead with regard to the downstream calls. We should have used different connection pools for each downstream connection. That way, if one connection pool got exhausted, the other connections wouldn’t be impacted, as we see in Fi...

---

## Circuit Breakers

in the first place. They can also give you the ability to reject requests in certain conditions to ensure that resources don’t become even more saturated; this is known as load shedding . Sometimes rejecting a request is the best way to stop an important system from becoming overwhelmed and being a bottleneck for multiple upstream services. Circuit Breakers In your own home, circuit breakers exist to protect your electrical devices from spikes in power. If a spike occurs, the circuit breaker get...

---

## Isolation

process could be a sensible next step. Circuit breakers help our application fail fast—and failing fast is always better than failing slow. The circuit breakers allow us to fail before wasting valuable time (and resources) waiting for an unhealthy downstream microservice to respond. Rather than waiting until we try to use the downstream microservice to fail, we could check the status of our circuit breakers earlier. If a microservice we will rely on as part of an operation is currently unavailab...

---

## Redundancy

their own ring-fenced operating system and computing resources is a sensible step—this is what we achieve when we run microservice instances in their own virtual machine or container. This kind of isolation, though, can have a cost. We can isolate our microservices from each other more effectively by running them on different machines. This means we need more infrastructure, and tooling to manage that infrastructure. This has a direct cost and can also add to the complexity of our system exposin...

---

## Middleware

Having more copies of something can help when it comes to implementing redundancy, but it can also be beneficial when it comes to scaling our applications to handle increased load. In the next chapter we’ll look at examples of system scaling, and see how scaling for redundancy or scaling for load can differ. Middleware In “Message Brokers” , we looked at the role of middleware in the form of message brokers to help with implementing both request-response and event- based interactions. One of the...

---

## Idempotency

In idempotent operations, the outcome doesn’t change after the first application, even if the operation is subsequently applied multiple times. If operations are idempotent, we can repeat the call multiple times without adverse impact. This is very useful when we want to replay messages that we aren’t sure have been processed, a common way of recovering from error. Let’s consider a simple call to add some points as a result of one of our customers placing an order. We might make a call with the ...

---

## Spreading Your Risk

Some people get quite caught up with this concept and assume it means that subsequent calls with the same parameters can’t have any impact, which then leaves us in an interesting position. We really would still like to record the fact that a call was received in our logs, for example. We want to record the response time of the call and collect this data for monitoring. The key point here is that it is the underlying business operation that we are considering idempotent, not the entire state of t...

---

## CAP Theorem

accordingly. If you need to ensure your services are down for no more than four hours every quarter, but your hosting provider can only guarantee a maximum downtime of eight hours per quarter, you have to change the SLA or else come up with an alternative solution. AWS, for example, is split into regions, which you can think of as distinct clouds. Each region is in turn split into two or more availability zones, as we discussed earlier. These availability zones are AWS’s equivalent of a data cen...

---

## Sacrificing Consistency

means any requests made to our inventory node in DC2 see potentially stale data. In other words, our system is still available in that both nodes are able to serve requests, and we have kept the system running despite the partition , but we have lost consistency ; we don’t get to keep all three traits. This is often called an AP system, because of its availability and partition tolerance. During this partition, if we keep accepting writes, then we accept the fact that at some point in the future...

---

## Sacrificing Availability

means any requests made to our inventory node in DC2 see potentially stale data. In other words, our system is still available in that both nodes are able to serve requests, and we have kept the system running despite the partition , but we have lost consistency ; we don’t get to keep all three traits. This is often called an AP system, because of its availability and partition tolerance. During this partition, if we keep accepting writes, then we accept the fact that at some point in the future...

---

## Sacrificing Partition Tolerance?

As we’ve already discussed, distributed systems have to expect failure. Consider our transactional read across a set of consistent nodes. I ask a remote node to lock a given record while the read is initiated. I complete the read and ask the remote node to release its lock, but now I can’t talk to it. What happens now? Locks are really hard to get right even in a single process system and are significantly more difficult to implement well in a distributed system. Remember when we talked about di...

---

## AP or CP?

But we may not understand the business impact of this trade-off. For our inventory system, if a record is out of date by five minutes, is that OK? If the answer is yes, an AP system might be the answer. But what about the balance held for a customer in a bank? Can that be out of date? Without knowing the context in which the operation is being used, we can’t know the right thing to do. Knowing about the CAP theorem helps you understand that this trade-off exists and what questions to ask. It’s N...

---

## It’s Not All or Nothing

But we may not understand the business impact of this trade-off. For our inventory system, if a record is out of date by five minutes, is that OK? If the answer is yes, an AP system might be the answer. But what about the balance held for a customer in a bank? Can that be out of date? Without knowing the context in which the operation is being used, we can’t know the right thing to do. Knowing about the CAP theorem helps you understand that this trade-off exists and what questions to ask. It’s N...

---

## And the Real World

some are AP. The mathematical proof behind the CAP theorem holds. And the Real World Much of what we’ve talked about is the electronic world—bits and bytes stored in memory. We talk about consistency in an almost childlike fashion; we imagine that within the scope of the system we have created, we can stop the world and have it all make sense. And yet so much of what we build is just a reflection of the real world, and we don’t get to control that, do we? Let’s revisit our inventory system. This...

---

## Chaos Engineering

sustained adaptability, which we introduced earlier, this becomes clear. I think that when antifragility became, briefly, a hyped concept in IT, it did so against a backdrop of us thinking narrowly about resiliency—where we thought only about robustness, and maybe about rebound, but ignored the rest. With the field of resilience engineering now gaining more recognition and traction, it seems appropriate to move beyond the term antifragile , while still ensuring that we highlight some of the idea...

---

## Game Days

into creating our product. This means we should view chaos engineering more broadly than just “let’s turn off some machines and see what happens.” Game Days Well before chaos engineering had its name, people would run Game Day exercises to test people’s preparedness for certain events. Planned in advance but ideally launched in surprise (for the participants), this gives you the chance to test your people and processes in the wake of a realistic but fictional situation. During my time at Google,...

---

## Production Experiments

into creating our product. This means we should view chaos engineering more broadly than just “let’s turn off some machines and see what happens.” Game Days Well before chaos engineering had its name, people would run Game Day exercises to test people’s preparedness for certain events. Planned in advance but ideally launched in surprise (for the participants), this gives you the chance to test your people and processes in the wake of a realistic but fictional situation. During my time at Google,...

---

## From Robustness to Beyond

have to be prepared for it. Chaos Monkey is just one part of Netflix’s Simian Army of failure bots. Chaos Gorilla is used to take out an entire availability zone (the AWS equivalent of a data center), whereas Latency Monkey simulates slow network connectivity between machines. For many, the ultimate test of whether your system really is robust might be unleashing your very own Simian Army on your production infrastructure. From Robustness to Beyond Applied in its narrowest form, chaos engineerin...

---

## Blame

have to be prepared for it. Chaos Monkey is just one part of Netflix’s Simian Army of failure bots. Chaos Gorilla is used to take out an entire availability zone (the AWS equivalent of a data center), whereas Latency Monkey simulates slow network connectivity between machines. For many, the ultimate test of whether your system really is robust might be unleashing your very own Simian Army on your production infrastructure. From Robustness to Beyond Applied in its narrowest form, chaos engineerin...

---

## Summary

in the wake of the series of incidents, the COO resigned. For a more informed take on how to create an organization where you can get the best out of mistakes and create a nicer environment for your staff as well, John Allspaw’s “Blameless Post-Mortems and a Just Culture” is a great jumping-off point. Ultimately, as I’ve already highlighted numerous times in this chapter, resiliency requires a questioning mind—a drive to constantly examine the weaknesses in our system. This requires a culture of...

---
