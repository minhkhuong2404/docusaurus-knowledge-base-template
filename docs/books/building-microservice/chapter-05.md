---
sidebar_position: 6
title: 'Chapter 5: Implementing Microservice Communication'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-05
---

# Chapter 5: Implementing Microservice Communication

**Part I — Foundation**

> As	we	discussed	in	the	previous	chapter,	your	choice	of	technology	should	be

---

## Looking for the Ideal Technology

Chapter 5. Implementing Microservice Communication As we discussed in the previous chapter, your choice of technology should be driven in large part by the style of communication you want. Deciding between blocking synchronous or nonblocking asynchronous calls, request-response or event-driven collaboration, will help you whittle down what might otherwise be a very long list of technology. In this chapter, we’re going to look at some of the technology commonly used for microservice communication...

---

## Make Backward Compatibility Easy

Chapter 5. Implementing Microservice Communication As we discussed in the previous chapter, your choice of technology should be driven in large part by the style of communication you want. Deciding between blocking synchronous or nonblocking asynchronous calls, request-response or event-driven collaboration, will help you whittle down what might otherwise be a very long list of technology. In this chapter, we’re going to look at some of the technology commonly used for microservice communication...

---

## Make Your Interface Explicit

for external parties—we want to avoid a situation in which a change to a microservice causes an accidental breakage in compatibility. Explicit schemas can go a long way in helping ensure that the interface a microservice exposes is explicit. Some of the technology we can look at requires the use of a schema; for other technology, the use of a schema is optional. Either way, I strongly encourage the use of an explicit schema, as well as there being enough supporting documentation to be clear abou...

---

## Keep Your APIs Technology Agnostic

for external parties—we want to avoid a situation in which a change to a microservice causes an accidental breakage in compatibility. Explicit schemas can go a long way in helping ensure that the interface a microservice exposes is explicit. Some of the technology we can look at requires the use of a schema; for other technology, the use of a schema is optional. Either way, I strongly encourage the use of an explicit schema, as well as there being enough supporting documentation to be clear abou...

---

## Make Your Service Simple for Consumers

for external parties—we want to avoid a situation in which a change to a microservice causes an accidental breakage in compatibility. Explicit schemas can go a long way in helping ensure that the interface a microservice exposes is explicit. Some of the technology we can look at requires the use of a schema; for other technology, the use of a schema is optional. Either way, I strongly encourage the use of an explicit schema, as well as there being enough supporting documentation to be clear abou...

---

## Hide Internal Implementation Detail

Hide Internal Implementation Detail We don’t want our consumers to be bound to our internal implementation, as it leads to increased coupling; that in turn means that if we want to change something inside our microservice, we can break our consumers by requiring them to also change. That increases the cost of change—exactly what we are trying to avoid. It also means we are less likely to want to make a change for fear of having to upgrade our consumers, which can lead to increased technical debt...

---

## Technology Choices

Hide Internal Implementation Detail We don’t want our consumers to be bound to our internal implementation, as it leads to increased coupling; that in turn means that if we want to change something inside our microservice, we can break our consumers by requiring them to also change. That increases the cost of change—exactly what we are trying to avoid. It also means we are less likely to want to make a change for fear of having to upgrade our consumers, which can lead to increased technical debt...

---

## Remote Procedure Calls

Remote Procedure Calls Remote procedure call (RPC) refers to the technique of making a local call and having it execute on a remote service somewhere. There are a number of different RPC implementations in use. Most of the technology in this space requires an explicit schema, such as SOAP or gRPC. In the context of RPC, the schema is often referred to as an interface definition language (IDL), with SOAP referring to its schema format as a web service definition language (WSDL). The use of a sepa...

---

## REST

In practice, objects used as part of binary serialization across the wire can be thought of as “expand-only” types. This brittleness results in the types being exposed over the wire and becoming a mass of fields, some of which are no longer used but can’t be safely removed. Where to use it Despite its shortcomings, I actually quite like RPC, and the more modern implementations, such as gRPC, are excellent, whereas other implementations have significant issues that would cause me to give them a w...

---

## GraphQL

Despite intellectually appreciating the goals behind HATEOAS, I haven’t seen much evidence that the additional work to implement this style of REST delivers worthwhile benefits in the long run, nor can I recall in the last few years talking to any teams implementing a microservice architecture that can speak to the value of using HATEOAS. My own experiences are obviously only one set of data points, and I don’t doubt that for some people HATEOAS may have worked well. But this concept does not se...

---

## Message Brokers

GraphQL. If you have an external API that often requires external clients to make multiple calls to get the information they need, then GraphQL can help make the API much more efficient and friendly. Fundamentally, GraphQL is a call aggregation and filtering mechanism, so in the context of a microservice architecture it would be used to aggregate calls over multiple downstream microservices. As such, it’s not something that would replace general microservice-to-microservice communication. An alt...

---

## Serialization Formats

implementations—make choices for you regarding how data is serialized and deserialized. With gRPC, for example, any data sent will be converted into protocol buffer format. Many of the technology options, though, give us a lot of freedom in terms of how we covert data for network calls. Pick Kafka as your broker of choice, and you can send messages in a variety of formats. So which format should you choose? Textual Formats The use of standard textual formats gives clients a lot of flexibility in...

---

## Textual Formats

implementations—make choices for you regarding how data is serialized and deserialized. With gRPC, for example, any data sent will be converted into protocol buffer format. Many of the technology options, though, give us a lot of freedom in terms of how we covert data for network calls. Pick Kafka as your broker of choice, and you can send messages in a variety of formats. So which format should you choose? Textual Formats The use of standard textual formats gives clients a lot of flexibility in...

---

## Binary Formats

nice and lightweight but then try to push concepts into it like hypermedia controls that already exist in XML. I accept, though, that I am probably in the minority here and that JSON is the format of choice for many people! Binary Formats While textual formats have benefits such as making it easy for humans to read them and provide a lot of interoperability with different tools and technologies, the world of binary serialization protocols is where you want to be if you start getting worried abou...

---

## Schemas

nice and lightweight but then try to push concepts into it like hypermedia controls that already exist in XML. I accept, though, that I am probably in the minority here and that JSON is the format of choice for many people! Binary Formats While textual formats have benefits such as making it easy for humans to read them and provide a lot of interoperability with different tools and technologies, the world of binary serialization protocols is where you want to be if you start getting worried abou...

---

## Structural Versus Semantic Contract Breakages

use JSON Schema. Some of the technology choices we’ve touched on (specifically, a sizable subset of the RPC options) require the use of explicit schemas, so if you picked those technologies you’d have to make use of schemas. SOAP works through the use of a WSDL, while gRPC requires the use of a protocol buffer specification. Other technology choices we’ve explored make the use of schemas optional, and this is where things get more interesting. As I’ve already discussed, I am in favor of having e...

---

## Should You Use Schemas?

spot. A semantic changes is more problematic. This is where the structure of the endpoint doesn’t change but the behavior of the endpoint does. Coming back to our calculate method, imagine that in the first version, the two provided integers are added together and the results returned. So far, so good. Now we change Hard Calculations so that the calculate method multiplies the integers together and returns the result. The semantics of the calculate method have changed in a way that could break e...

---

## Handling Change Between Microservices

and how that data should be structured. Your code that will handle the data will be written with a set of assumptions in mind as to how that data is structured. In such a case, I’d argue that you do have a schema, but it’s just totally implicit rather than explicit. A lot of my desire for an explicit schema is driven by the fact that I think it’s important to be as explicit as possible about what a microservice does (or doesn’t) expose. The main argument for schemaless endpoints seems to be that...

---

## Avoiding Breaking Changes

and how that data should be structured. Your code that will handle the data will be written with a set of assumptions in mind as to how that data is structured. In such a case, I’d argue that you do have a schema, but it’s just totally implicit rather than explicit. A lot of my desire for an explicit schema is driven by the fact that I think it’s important to be as explicit as possible about what a microservice does (or doesn’t) expose. The main argument for schemaless endpoints seems to be that...

---

## Expansion Changes

microservices to be changed independently from one another. Expansion changes Add new things to a microservice interface; don’t remove old things. Tolerant reader When consuming a microservice interface, be flexible in what you expect. Right technology Pick technology that makes it easier to make backward-compatible changes to the interface. Explicit interface Be explicit about what a microservice exposes. This makes things easier for the client and easier for the maintainers of the microservice...

---

## Tolerant Reader

How the consumer of a microservice is implemented can bring a lot to bear on making backward-compatible changes easy. Specifically, we want to avoid client code binding too tightly to the interface of a microservice. Let’s consider an Email microservice whose job it is to send out emails to our customers from time to time. It gets asked to send an “order shipped” email to a customer with the ID 1234; it goes off and retrieves the customer with that ID and gets back something like the response sh...

---

## Right Technology

`<lastname> Newman </lastname> <nickname> Magpiebrain </nickname> <fullname> Sam "Magpiebrain" Newman </fullname> </naming> <email> sam@magpiebrain.com </email> </customer>` The example of a client trying to be as flexible as possible in consuming a service demonstrates Postel’s law (otherwise known as the robustness principle ), which states: “Be conservative in what you do, be liberal in what you accept from others.” The original context for this piece of wisdom was the interaction of devices ov...

---

## Explicit Interface

break consumers. Put another way, an explicit schema goes a long way toward making the boundaries of information hiding more explicit—what’s exposed in the schema is by definition not hidden. Having an explicit schema for RPC is long established and is in fact a requirement for many RPC implementations. REST, on the other hand, has typically viewed the concept of a schema as optional, to the point that I find explicit schemas for REST endpoints to be vanishingly rare. This is changing, with thin...

---

## Catch Accidental Breaking Changes Early

Customer service. If a new feature is added, causing the Customer service to change to 1.3.0, our helpdesk application should see no change in behavior and shouldn’t be expected to make any changes. We couldn’t guarantee that we could work against version 1.1.0 of the Customer service, though, as we may rely on functionality added in the 1.2.0 release. We could also expect to have to make changes to our application if a new 2.0.0 release of the Customer service comes out. You may decide to have ...

---

## Managing Breaking Changes

backward compatibility. Although it was built to help as part of an ecosystem in which Kafka is being used, and needs Kafka to run, there is nothing to stop you from using it to store and validate schemas being used for non-Kafka-based communication. Schema comparison tools can help us catch structural breakages, but what about semantic breakages? Or what if you aren’t making use of schemas in the first place? Then we’re looking at testing. This is a topic we’ll explore in more detail in “Contra...

---

## Lockstep Deployment

interface. Lockstep Deployment Of course, lockstep deployment flies in the face of independent deployability. If we want to be able to deploy a new version of our microservice with a breaking change to its interface but still do this in an independent fashion, we need to give our consumers time to upgrade to the new interface. That leads us on to the next two options I’d consider. Coexist Incompatible Microservice Versions Another versioning solution often cited is to have different versions of ...

---

## Coexist Incompatible Microservice Versions

interface. Lockstep Deployment Of course, lockstep deployment flies in the face of independent deployability. If we want to be able to deploy a new version of our microservice with a breaking change to its interface but still do this in an independent fashion, we need to give our consumers time to upgrade to the new interface. That leads us on to the next two options I’d consider. Coexist Incompatible Microservice Versions Another versioning solution often cited is to have different versions of ...

---

## Emulate the Old Interface

endpoints in the same microservice rather than coexist entirely different versions. I remain unconvinced that this work is worthwhile for the average project. Emulate the Old Interface If we’ve done all we can to avoid introducing a breaking interface change, our next job is to limit the impact. The thing we want to avoid is forcing consumers to upgrade in lockstep with us, as we always want to maintain the ability to release microservices independently of each other. One approach I have used su...

---

## Which Approach Do I Prefer?

the number of consumers we had and the number of breaking changes we had made. This meant that we were actually coexisting three different versions of the endpoint. This is not something I’d recommend! Keeping all the code around and the associated testing required to ensure they all worked was absolutely an additional burden. To make this more manageable, we internally transformed all requests to the V1 endpoint to a V2 request, and then V2 requests to the V3 endpoint. This meant we could clear...

---

## The Social Contract

Coexisting different versions of the same microservice can be problematic, as we discussed. I’d consider doing this only in situations in which we planned to run the microservice versions side by side for only a short period of time. The reality is that when you need to give consumers time to upgrade, you could be looking at weeks or more. In other situations in which you might coexist microservice versions, perhaps as part of a blue-green deployment or canary release, the durations involved are...

---

## Tracking Usage

Who is expected to do the work to update the consumers? When the change is agreed on, how long will consumers have to shift over to the new interface before it is removed? Remember, one of the secrets to an effective microservice architecture is to embrace a consumer-first approach. Your microservices exist to be called by other consumers. The consumers’ needs are paramount, and if you are making changes to a microservice that are going to cause upstream consumers problems, this needs to be take...

---

## Extreme Measures

Perhaps you can lend them a hand to make the changes happen. If all else fails, and they still don’t upgrade even after agreeing to do so, there are some extreme techniques I’ve seen used. At one large tech company, we discussed how it handled this issue. Internally, the company had a very generous period of one year before old interfaces would be retired. I asked how it knew if consumers were still using the old interfaces, and the company replied that it didn’t really bother tracking that info...

---

## DRY and the Perils of Code Reuse in a Microservice World

Perhaps you can lend them a hand to make the changes happen. If all else fails, and they still don’t upgrade even after agreeing to do so, there are some extreme techniques I’ve seen used. At one large tech company, we discussed how it handled this issue. Internally, the company had a very generous period of one year before old interfaces would be retired. I asked how it knew if consumers were still using the old interfaces, and the company replied that it didn’t really bother tracking that info...

---

## Sharing Code via Libraries

behavior and knowledge . This is very sensible advice in general. Having lots of lines of code that do the same thing makes your codebase larger than needed and therefore harder to reason about. When you want to change behavior, and that behavior is duplicated in many parts of your system, it is easy to forget everywhere you need to make a change, which can lead to bugs. So using DRY as a mantra in general makes sense. DRY is what leads us to create code that can be reused. We pull duplicated co...

---

## Service Discovery

Netflix in particular places special emphasis on the client library, but I worry that people view that purely through the lens of avoiding code duplication. In fact, the client libraries used by Netflix are as much if not more about ensuring reliability and scalability of their systems. The Netflix client libraries handle service discovery, failure modes, logging, and other aspects that aren’t actually about the nature of the service itself. Without these shared clients, it would be hard to ensu...

---

## Domain Name System (DNS)

they provide a way to find the service once it’s registered. Service discovery gets more complicated, though, when we are considering an environment in which we are constantly destroying and deploying new instances of services. Ideally, we’d want whatever solution we pick to cope with this. Let’s look at some of the most common solutions to service delivery and consider our options. Domain Name System (DNS) It’s nice to start simple. DNS lets us associate a name with the IP address of one or mor...

---

## Dynamic Service Registries

Figure 5-5. Using DNS to resolve to a load balancer to avoid stale DNS entries As mentioned, DNS is well understood and widely supported. But it does have one or two downsides. I would suggest you investigate whether it is a good fit for you before picking something more complex. For a situation in which you have only single nodes, having DNS refer directly to hosts is probably fine. But for those situations in which you need more than one instance of a host, have DNS entries resolve to load bal...

---

## Don’t Forget the Humans!

environment = production version = 154 I then used the AWS APIs to query all the instances associated with a given AWS account so I could find the machines I cared about. Here, AWS itself is handling the storing of the metadata associated with each instance and providing us with the ability to query it. I then built command-line tools for interacting with these instances and provided graphical interfaces to view instance status at a glance. All of this becomes quite a simple undertaking if you c...

---

## Service Meshes and API Gateways

environment = production version = 154 I then used the AWS APIs to query all the instances associated with a given AWS account so I could find the machines I cared about. Here, AWS itself is handling the storing of the metadata associated with each instance and providing us with the ability to query it. I then built command-line tools for interacting with these instances and provided graphical interfaces to view instance status at a glance. All of this becomes quite a simple undertaking if you c...

---

## API Gateways

between microservices. This can mean that they may be used to implement some microservice-agnostic behavior that might otherwise have to be done in code, such as service discovery or logging. If you are using an API gateway or a service mesh to implement shared, common behavior for your microservices, it’s essential that this behavior is totally generic—in other words, that the behavior in the proxy bears no relation to any specific behavior of an individual microservice. Now, after explaining t...

---

## Service Meshes

implementation of call aggregation inside API gateways is that we are violating the rule of keeping the pipes dumb, and the endpoints smart. The “smarts” in our system want to live in our code, where we can have full control over them. The API gateway in this example is a pipe—we want it as simple as possible. With microservices, we are pushing for a model in which changes can be made and more easily released through independent deployability. Keeping smarts in our microservices helps this. If w...

---

## What About Other Protocols?

more monolithic deployment model for its control plane). For much of the last five years, when I have been asked “Should we get a service mesh?” my advice has been “If you can afford to wait six months before making a choice, then wait six months.” I was sold on the idea but concerned about the stability. And something like a service mesh is not where I personally want to take a lot of risks—it’s so key, so essential to everything working well. You’re putting it on your critical path. It’s up th...

---

## Documenting Services

Documenting Services By decomposing our systems into finer-grained microservices, we’re hoping to expose lots of seams in the form of APIs that people can use to do many hopefully wonderful things. If you get our discovery right, we know where things are. But how do we know what those things do or how to use them? One option is obviously to have documentation about the APIs. Of course, documentation can often be out of date. Ideally, we’d ensure that our documentation is always up to date with t...

---

## Explicit Schemas

Documenting Services By decomposing our systems into finer-grained microservices, we’re hoping to expose lots of seams in the form of APIs that people can use to do many hopefully wonderful things. If you get our discovery right, we know where things are. But how do we know what those things do or how to use them? One option is obviously to have documentation about the APIs. Of course, documentation can often be out of date. Ideally, we’d ensure that our documentation is always up to date with t...

---

## The Self-Describing System

In the past we’ve lacked good support for documenting event-based interfaces. Now at least we have options. The AsyncAPI format started off as an adaptation of OpenAPI, and we also now have CloudEvents, which is a CNCF project. I’ve not used either in anger (that is, in a real setting), but I’m more drawn to CloudEvents purely because it seems to have a wealth of integration and support, due in large part to its association with the CNCF. Historically, at least, CloudEvents seemed to be more res...

---

## Summary

cluster. Ambassador’s own Service Catalog is more narrowly focused on visibility of services in Kubernetes, which means it might not have as much general appeal as something like the FT’s Biz Ops , but it’s nonetheless good to see some new takes on this idea that are more generally available. Figure 5-9. An example of the Service Operability Score for a microservice at the Financial Times Summary So we’ve covered a lot of ground in this chapter—let’s break some of it down: To begin with, ensure ...

---
