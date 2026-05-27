---
sidebar_position: 17
title: 'Chapter 16: The Evolutionary Architect'
description: '**Part III — People**'
tags:
- books
- building-microservice
- chapter-16
---

# Chapter 16: The Evolutionary Architect

**Part III — People**

> As	we	have	seen	so	far,	microservices	give	us	a	lot	of	choices,	and	accordingly	a

---

## What’s in a Name?

Chapter 16. The Evolutionary Architect As we have seen so far, microservices give us a lot of choices, and accordingly a lot of decisions to make. For example, how many different technologies should we use, should we let different teams use different programming idioms, and should we split or merge a microservice? How do we go about making these decisions? With the faster pace of change and the more fluid environment that these architectures allow, the role of the architect also has to change. I...

---

## What Is Software Architecture?

oft-quoted statement is that it’s often used in isolation, without any understanding of the wider response in which Ralph shared it. Firstly, it’s clear that he is talking from the perspective of a software developer. He goes on to say: So, a better definition would be “In most successful software projects, the expert developers working on that project have a shared understanding of the system design. This shared understanding is called ‘architecture.’ This understanding includes how the system ...

---

## Making Change Possible

not really be there. It can be something that guides and helps achieve the right outcome. It can be suffocating and overbearing. It can delight without you realizing it is even a thing, and crush the spirit from you without any malice being intended. So whether or not architecture is “about the important stuff,” it’s certainly important . Another pithy quote that is often used to define software architecture comes from the same article where Martin shares Ralph’s views: “So you might end up defi...

---

## An Evolutionary Vision for the Architect

It’s interesting to note that the Seagram Building was developed using a process in which the design of the building evolved while the construction was carried out. Now where have we seen that idea before? The idea with this design was to deliver what Mies van der Rohe called “universal space”—a large, single-span volume that could be reconfigured to suit different needs. The use of buildings changes, so the idea was to deliver space that is as flexible as possible in terms of how it can be used...

---

## Defining System Boundaries

account future use. The way they influence how the city evolves, though, is interesting. They do not say, “Build this specific building there”; instead, they define zones that allow for local decision making within certain constraints. So, as in SimCity, you might designate part of your city as an industrial zone, and another part as a residential zone. It is then up to other people to decide what buildings get created, but there are restrictions: if you want to build a factory, it will need to ...

---

## A Social Construct

make local changes without breaking the wider system. Within each microservice or larger zone, you may be OK with the team that owns that zone picking a different technology stack or data store. Other concerns may kick in here, of course. Your inclination to let teams pick the right tool for the job may be tempered by the fact that it becomes harder to hire people or move them between teams if you have 10 different technology stacks to support. Similarly, if each team picks a completely differen...

---

## Habitability

modeled after a very successful standards body, the Internet Engineering Task Force (IETF) that defines many important Internet protocols. — Jon Moore, chief software architect at Comcast Cable Comcast’s approach has a level of formality that some organizations might find onerous, but it seems to work well for the company, given its size and distribution. Habitability Yet another concept that comes from the built environment and has resonance in the field of software development is habitability ...

---

## A Principled Approach

ideally actually spending time coding with the team. For those of you who practice pair programming, it becomes a simple matter for an architect to join a team for a short period as one member of a pair. Participating in ensemble programming exercises could also yield significant benefits, although an architect taking part in such a group activity needs to be aware how their presence may change the dynamic of the ensemble. Ideally, you should work on normal tasks to really understand what “norma...

---

## Strategic Goals

have to also define strategic goals! Strategic goals should speak to where your company is going and to how it sees itself as best making its customers happy. These will be high-level goals and may not include technology at all. They could be defined at a company level or a division level. They might be things like “Expand into Southeast Asia to unlock new markets,” or “Let the customer achieve as much as possible using self-service.” The key is that they define where your organization is headed...

---

## Principles

have to also define strategic goals! Strategic goals should speak to where your company is going and to how it sees itself as best making its customers happy. These will be high-level goals and may not include technology at all. They could be defined at a company level or a division level. They might be things like “Expand into Southeast Asia to unlock new markets,” or “Let the customer achieve as much as possible using self-service.” The key is that they define where your organization is headed...

---

## Practices

are constraints to help highlight those things you really can’t change. Personally, I think there can be some value in keeping them in the same list, to encourage challenging constraints every now and then and see if they really are immovable! Practices Our practices are how we ensure our principles are being carried out. They are a set of detailed, practical guidelines for performing tasks. They will often be technology specific and should be low level enough that any developer can understand t...

---

## Combining Principles and Practices

are constraints to help highlight those things you really can’t change. Personally, I think there can be some value in keeping them in the same list, to encourage challenging constraints every now and then and see if they really are immovable! Practices Our practices are how we ensure our principles are being carried out. They are a set of detailed, practical guidelines for performing tasks. They will often be technology specific and should be low level enough that any developer can understand t...

---

## A Real-World Example

A Real-World Example An old colleague of mine, Evan Bottcher, developed the diagram shown in Figure 16-3 in the course of working with one of his clients. The figure shows the interplay of goals, principles, and practices in a very clear format. Over the course of a couple of years, the practices on the far right will change fairly regularly, whereas the principles remain fairly static. A diagram such as this can be printed nicely on a single sheet of paper and shared, and each idea is simple en...

---

## Guiding an Evolutionary Architecture

Guiding an Evolutionary Architecture So if our architecture is not static but is ever-changing and evolving, how do we make sure it is growing and changing in the way we want, rather than just mutating into some unmanageable giant blob of pain, suffering, and recriminations? In Building Evolutionary Architectures , the authors outline fitness functions to help collect information about the relative “fitness” of the architecture in order to help architects decide if they need to take action. From...

---

## Architecture in a Stream-Aligned Organization

whether or not your architecture is achieving “fitness” against that criteria. This could relate to system performance, code coupling, cycle time, or a host of other aspects. These fitness functions act as another source of information to help an architect understand where they might need to get involved. Please note, however, that for me, fitness functions work best when combined with close collaboration with the people building the system. Fitness functions should be a useful way to help you u...

---

## Building a Team

often the issues around technical debt were laid at the feet of the technical leaders. A shift was made to make the product owners also responsible for aspects of the software that were technical in nature—this meant that they had to take a more active role in understanding the more technical aspects of the system (security or performance, for example) and work more collaboratively with the technical experts in terms of prioritizing work to be done. The act of making nontechnical product owners ...

---

## The Required Standard

you need to make, one of the most important balances to find is how much variability to allow in your system. One of the key ways to identify what should be constant from microservice to microservice is to define what a well-behaved, good microservice looks like. What is a “good citizen” microservice in your system? What capabilities does it need to have to ensure that your system is manageable, and that one bad microservice doesn’t bring down the whole system? As with people, what a “good citiz...

---

## Monitoring

you need to make, one of the most important balances to find is how much variability to allow in your system. One of the key ways to identify what should be constant from microservice to microservice is to define what a well-behaved, good microservice looks like. What is a “good citizen” microservice in your system? What capabilities does it need to have to ensure that your system is manageable, and that one bad microservice doesn’t bring down the whole system? As with people, what a “good citiz...

---

## Interfaces

consumers. Having one standard is good. Two isn’t too bad, either. Having twenty different styles of integration is not good. This isn’t just about picking the technology and the protocol. If you pick HTTP/REST, for example, will you use verbs or nouns? How will you handle pagination of resources? How will you handle versioning of endpoints? Architectural Safety We cannot afford for one badly behaved microservice to ruin the party for everyone. We have to ensure that our microservices shield the...

---

## Architectural Safety

consumers. Having one standard is good. Two isn’t too bad, either. Having twenty different styles of integration is not good. This isn’t just about picking the technology and the protocol. If you pick HTTP/REST, for example, will you use verbs or nouns? How will you handle pagination of resources? How will you handle versioning of endpoints? Architectural Safety We cannot afford for one badly behaved microservice to ruin the party for everyone. We have to ensure that our microservices shield the...

---

## Governance and the Paved Road

consumers. Having one standard is good. Two isn’t too bad, either. Having twenty different styles of integration is not good. This isn’t just about picking the technology and the protocol. If you pick HTTP/REST, for example, will you use verbs or nouns? How will you handle pagination of resources? How will you handle versioning of endpoints? Architectural Safety We cannot afford for one badly behaved microservice to ruin the party for everyone. We have to ensure that our microservices shield the...

---

## Exemplars

Written documentation is good and useful. I clearly see the value in it; after all, I’ve written this book. But developers also like code—code they can run and explore. If you have a set of standards or best practices you would like to encourage, then having exemplars you can point people to is useful. The idea is that people can’t go far wrong just by imitating some of the better parts of your system. Ideally, these should be real-world microservices running in your system that get things right...

---

## Tailored Microservice Template

Written documentation is good and useful. I clearly see the value in it; after all, I’ve written this book. But developers also like code—code they can run and explore. If you have a set of standards or best practices you would like to encourage, then having exemplars you can point people to is useful. The idea is that people can’t go far wrong just by imitating some of the better parts of your system. Ideally, these should be real-world microservices running in your system that get things right...

---

## The Paved Road at Scale

commonly a task for the platform team. They might, for example, provide a template for each supported language, ensuring that when using the template the resulting microservices work well with the platform itself. This can cause challenges, however. I have seen many a team’s morale and productivity destroyed by having a mandated framework thrust upon it. In a drive to improve code reuse, more and more work is placed into a centralized framework until it becomes an overwhelming monstrosity. If yo...

---

## Technical Debt

own needs becomes more difficult. If you were to embrace multiple disparate technology stacks, you’d need a matching microservice template for each. This could be a way you subtly constrain language choices in your teams, though. If the in-house microservice template supports only the JVM, then people may be discouraged from picking alternative stacks if they have to do lots more work themselves. Netflix, for example, is especially concerned with aspects like fault tolerance to ensure that the o...

---

## Exception Handling

Sometimes technical debt isn’t just something we cause by taking shortcuts. What happens if our vision for the system changes, but not all of our system matches? In this situation, too, we have created new sources of technical debt. The architect’s job is to look at the bigger picture and understand this balance. Having some view as to the level of debt and where to get involved is important. Depending on your organization, you might be able to provide gentle guidance, but have the teams themsel...

---

## Summary

Summary To summarize this chapter, here are what I see as the core responsibilities of the evolutionary architect: Vision Ensure there is a clearly communicated technical vision for the system that will help it meet the requirements of your customers and organization. Empathy Understand the impact of your decisions on your customers and colleagues. Collaboration Engage with as many of your peers and colleagues as possible to help define, refine, and execute the vision Adaptability Make sure that...

---

## Afterword: Bringing It All Together

Afterword: Bringing It All Together This book has covered a lot of ground, and I’ve shared a lot of advice along the way. Given the breadth of coverage, I thought it sensible to summarize some of my key advice regarding microservice architectures. For those of you who have read the whole book, this should be a great refresher. For those of you who are impatient and jumped to the end, be aware that there is a lot of detail behind this advice, and I’d urge you read up on the detail behind some of ...

---

## What Are Microservices?

Afterword: Bringing It All Together This book has covered a lot of ground, and I’ve shared a lot of advice along the way. Given the breadth of coverage, I thought it sensible to summarize some of my key advice regarding microservice architectures. For those of you who have read the whole book, this should be a great refresher. For those of you who are impatient and jumped to the end, be aware that there is a lot of detail behind this advice, and I’d urge you read up on the detail behind some of ...

---

## Moving to Microservices

database . If a microservice needs to store state in a database, this should be entirely hidden from the outside world. Internal databases should not be directly exposed to external consumers, as this causes too much coupling between the two, which undermines independent deployability. In general, avoid situations in which multiple microservices all access the same database. Microservices work very well with domain-driven design (DDD). DDD gives us concepts that help us find our microservice bou...

---

## Communication Styles

perhaps it will suggest to you that microservices might not be the way forward after all! Communication Styles We summarized the main forms of inter-microservice communication in Chapter 4 , shared again in Figure E-1 . This isn’t meant to be a universal model but is intended to just give an overview of the different types of communication that are most common. Figure E-1. Different styles of inter-microservice communication along with example implementing technologies With request-response comm...

---

## Workflow

Workflow When looking to get multiple microservices collaborating to perform some overarching operation, look to explicitly model the process using sagas , a topic we explored in Chapter 6 . In general, distributed transactions should be avoided in situations where you can use a saga instead. Distributed transactions add significant complexity to systems, have problematic failure modes, and often don’t deliver what you expect even when they work. Sagas are in virtually all cases a better fit for...

---

## Build

Workflow When looking to get multiple microservices collaborating to perform some overarching operation, look to explicitly model the process using sagas , a topic we explored in Chapter 6 . In general, distributed transactions should be avoided in situations where you can use a saga instead. Distributed transactions add significant complexity to systems, have problematic failure modes, and often don’t deliver what you expect even when they work. Sagas are in virtually all cases a better fit for...

---

## Deployment

For reasons outlined in Chapter 7 , I am not a fan of monorepos. If you really want to use them, then please understand the challenges they cause around clear lines of ownership and potential complexity of builds. But definitely make sure that, whether you use a monorepo or a multirepo approach, each microservice has its own CI build process that can be triggered independently of any other builds. Deployment Microservices are normally deployed as a process. This process can be deployed onto a ph...

---

## Testing

opportunity to roll out your software in different ways—for example, by using canary releases or parallel runs. All of this and more is covered in depth in Chapter 8 . Testing It makes a lot of sense to have a suite of automated functional tests to give you fast feedback on the quality of your software before the users see it, and this is absolutely something you should do. Microservices give you a lot of options in terms of the different types of tests you can write, as we explored in Chapter 9...

---

## Monitoring and Observability

opportunity to roll out your software in different ways—for example, by using canary releases or parallel runs. All of this and more is covered in depth in Chapter 8 . Testing It makes a lot of sense to have a suite of automated functional tests to give you fast feedback on the quality of your software before the users see it, and this is absolutely something you should do. Microservices give you a lot of options in terms of the different types of tests you can write, as we explored in Chapter 9...

---

## Security

that can help you interrogate these external outputs in ways that you cannot expect becomes increasingly important. I suggest that you look at tools like Lightstep and Honeycomb that were built with this thinking in mind. Finally, as your system grows in scale, it becomes more and more likely that there will always be an error somewhere. But in a large-scale system, one machine having a problem isn’t necessarily cause for everyone to jump into action, nor should this necessarily result in a rude...

---

## Resiliency

Resiliency In Chapter 12 , we looked at resiliency as a whole, and I shared with you the four key concepts that need to be considered when thinking about resiliency: Robustness The ability to absorb expected perturbation Rebound The ability to recover after a traumatic event Graceful extensibility How well we deal with a situation that is unexpected Sustained adaptability The ability to continually adapt to changing environments, stakeholders, and demands Taken as a whole, microservice architect...

---

## Scaling

Vertical scaling In a nutshell, this means getting a bigger machine. Horizontal duplication Having multiple things capable of doing the same work. Data partitioning Dividing work based on some attribute of the data, e.g., customer group. Functional decomposition Separation of work based on the type, e.g., microservice decomposition. With scaling, do the easy stuff first. Vertical scaling and horizontal duplication are quick and easy compared with the other two axes presented here. If they work, ...

---

## User Interfaces

Vertical scaling In a nutshell, this means getting a bigger machine. Horizontal duplication Having multiple things capable of doing the same work. Data partitioning Dividing work based on some attribute of the data, e.g., customer group. Functional decomposition Separation of work based on the type, e.g., microservice decomposition. With scaling, do the easy stuff first. Vertical scaling and horizontal duplication are quick and easy compared with the other two axes presented here. If they work, ...

---

## Organization

GraphQL, you may be able to sidestep the use of BFFs. Organization In Chapter 15 , we looked at the shift away from horizontally aligned, siloed teams toward team structures that are organized around end-to-end slices of functionality. These stream-aligned teams, as the authors of Team Topologies describe them, are supported by enabling teams, as Figure E-3 shows. Enabling teams will often have a specific cross-cutting focus, such as focusing on security or usability, and support the stream-alig...

---

## Architecture

Architecture It’s important that we don’t see the architecture of our system as fixed and unchanging. Instead, we should view our system architecture as something that should be able to continually change as circumstances require. For you to get the most out of microservice architectures, moving to an organization where more autonomy is pushed into teams means that responsibility for the technical vision needs to become a more collaborative process. The architect sitting in an ivory tower will e...

---

## Further Reading

Architecture It’s important that we don’t see the architecture of our system as fixed and unchanging. Instead, we should view our system architecture as something that should be able to continually change as circumstances require. For you to get the most out of microservice architectures, moving to an organization where more autonomy is pushed into teams means that responsibility for the technical vision needs to become a more collaborative process. The architect sitting in an ivory tower will e...

---

## Looking Forward

Looking Forward In the future, I suspect the technology that makes microservices easier to build and run will continue to improve, and I am especially keen to see what the second- (and third-) generation FaaS products look like. Whether or not FaaS takes off, Kubernetes will become even more widespread, even if it will increasingly be hidden behind more developer-friendly abstraction layers. Kubernetes has won, but in a way that I think most application developers shouldn’t have to worry about. ...

---

## Final Words

system. Learn to embrace the concept of evolutionary architecture, in which your system bends and flexes and changes over time as you learn new things. Think not of big-bang rewrites, but instead of a series of changes made to your system over time to keep it supple. I hope by now I’ve shared with you enough information and experiences to help you decide whether microservices are for you. If they are, I hope you think of this as a journey, not a destination. Go incrementally. Break your system a...

---

## Bibliography

Bibliography 2020 Data Breach Investigations Report. Verizon, 2020. https://oreil.ly/ps0Cx . Abbott, Martin L., and Michael T. Fisher. The Art of Scalability: Scalable Web Architecture, Processes, and Organizations for the Modern Enterprise . 2nd ed. Boston: Addison-Wesley, 2015. Allspaw, John. “Blameless Post-Mortems and a Just Culture.” Code as Craft (blog). Etsy, May 22, 2012. https://oreil.ly/P1BcX . Bache, Emily. “End-to-End Automated Testing in a Microservice Architecture.” NDC Conferences...

---

## Glossary

Glossary aggregate A collection of objects that are managed as a single entity, typically referring to real-world concepts. A concept from DDD. Amazon Web Services (AWS) The public cloud offering from Amazon. API gateway A component that normally sits on the perimeter of a system and routes calls from external sources (such as user interfaces) to microservices, amongst many other things. authentication The process whereby a principal proves that they are who they say they are. This could be as s...

---

## Index

Index Symbols 2PC (two-phase commit algorithms) , Distributed Transactions—Two-Phase Commits - Distributed Transactions—Two-Phase Commits A A/B tests , A/B testing ACID (atomicity, consistency, isolation, and durability) , ACID Transactions Active Directory , Common Single Sign-On Implementations adaptability , Sustained Adaptability , Chaos Engineering , Summary , Summary aggregate , Aggregate - Aggregate , Mapping Aggregates and Bounded Contexts to Microservices , Glossary alarms, versus alert...

---
