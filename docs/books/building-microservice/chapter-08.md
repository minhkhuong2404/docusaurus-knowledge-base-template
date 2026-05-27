---
sidebar_position: 9
title: 'Chapter 8: Deployment'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-08
---

# Chapter 8: Deployment

**Part I — Foundation**

> Deploying	a	single-process	monolithic	application	is	a	fairly	straightforward

---

## From Logical to Physical

Chapter 8. Deployment Deploying a single-process monolithic application is a fairly straightforward process. Microservices, with their interdependence and wealth of technology options, are a different kettle of fish altogether. When I wrote the first edition of this book, this chapter already had a lot to say about the huge variety of options available to you. Since then, Kubernetes has come to the fore, and Function as a Service (FaaS) platforms have given us even more ways to think about how t...

---

## Multiple Instances

Figure 8-1. A simple, logical view of two microservices This logical view of our microservices can hide a wealth of complexity when it comes to actually running them on real infrastructure. Let’s take a look at what sorts of details might be hidden by a diagram like this. Multiple Instances When we think about the deployment topology of the two microservices (in Figure 8-2 ), it’s not as simple as one thing talking to another. To start with, it seems quite likely that we’ll have more than one in...

---

## The Database

Figure 8-3. Distributing instances across multiple different data centers This might seem overly cautious—what are the chances of an entire data center being unavailable? Well, I can’t answer that question for every situation, but at least when dealing with the main cloud providers, this is absolutely something you have to take account of. When it comes to something like a managed virtual machine, neither AWS nor Azure nor Google will give you an SLA for a single machine, nor do they give you an...

---

## Environments

Figure 8-7. Each microservice making use of its own dedicated DB infrastructure Environments When you deploy your software, it runs in an environment. Each environment will typically serve different purposes, and the exact number of environments you might have will vary greatly based on how you develop software and how your software is deployed to your end user. Some environments will have production data, while others won’t. Some environments may have all services in them; others might have jus...

---

## Principles of Microservice Deployment

different numbers to be passed in as part of the deployment activity. So, to summarize, a single logical microservice can be deployed into multiple environments. From one environment to the next, the number of instances of each microservice can vary based on the requirements of each environment. Principles of Microservice Deployment With so many options before you for how to deploy your microservices, I think it’s important that I establish some core principles in this area. A solid understandin...

---

## Isolated Execution

Use a platform that maintains your microservice in a defined state, launching new instances if required in the event of outages or traffic increases. Isolated Execution You may be tempted, especially early on in your microservices journey, to just put all of your microservice instances on a single machine (which could be a single physical machine or a single VM), as shown in Figure 8-10 . Purely from a host management point of view, this model is simpler. In a world in which one team manages the...

---

## Focus on Automation

Focus on Automation As you add more microservices, you’ll have more moving parts to deal with— more processes, more things to configure, more instances to monitor. Moving to microservices pushes a lot of complexity into the operational space, and if you are managing your operational processes in a mostly manual way, this means that more services will require more and more people to do things. Instead, you need a relentless focus on automation. Select tooling and technology that allows for things...

---

## Infrastructure as Code (IAC)

microservices into production, with the development team taking full responsibility for the entire build, deployment, and support of the services. In the next three months, between 10 to 15 services went live in a similar manner. By the end of an 18-month period, REA had more than 70 services in production. This sort of pattern is also borne out by the experiences of Gilt, which we mentioned earlier. Again, automation, especially tooling to help developers, drove the explosion in Gilt’s use of m...

---

## Zero-Downtime Deployment

very successful in this space, and I’m excited to see the potential of Pulumi, which is aiming to do something similar, albeit by allowing people to use normal programming languages rather than the domain-specific languages that often get used by these tools. AWS CloudFormation and the AWS Cloud Development Kit (CDK) are examples of platform-specific tools, in this case supporting only AWS—although it’s worth noting that even if I was working only with AWS, I’d prefer the flexibility of a cross-...

---

## Desired State Management

deployment as being the single biggest benefit in terms of improving the speed of delivery. With the confidence that releases wouldn’t interrupt its users, the Financial Times was able to drastically increase the frequency of releases. In addition, a zero-downtime release can be much more easily done during working hours. Quite aside from the fact that doing so improves the quality of life of the people involved with the release (compared to working evenings and weekends), a well-rested team wor...

---

## Deployment Options

Master, you had a centralized system capable of pushing out changes dynamically when they were made. The shift with GitOps is that this tooling is making use of capabilities inside Kubernetes to help manage applications rather than just infrastructure. Tools like Flux are making it much easier to embrace these ideas. It’s worth noting, of course, that while tools can make it easier for you to change the way you work, they can’t force you into adopting new working approaches. Put differently, jus...

---

## Physical Machines

Container A microservice instance runs as a separate container on a virtual or physical machine. That container runtime may be managed by a container orchestration tool like Kubernetes. Application container A microservice instance is run inside an application container that manages other application instances, typically on the same runtime. Platform as a Service (PaaS) A more highly abstracted platform is used to deploy microservice instances, often abstracting away all concepts of the underlyi...

---

## Virtual Machines

If you have direct access to physical hardware without the option for virtualization, the temptation is to then pack multiple microservices on the same machine—of course, this violates the principle we talked about regarding having an isolated execution environment for your services. You could use tools like Puppet or Chef to configure the machine—helping implement infrastructure as code. The problem is that if you are working only at the level of a single physical machine, implementing concepts...

---

## Containers

that many people are making use of managed VMs provided by traditional virtualization platforms like the ones provided by VMware, which, while they may theoretically allow for automation, are typically not used in this context. Instead these platforms tend to be under the central control of a dedicated operations team, and the ability to directly automate against them can be restricted as a result. Although containers are proving to be more popular in general for microservice workloads, many org...

---

## Application Containers

gives you benefits in terms of improved manageability, such as clustering support to handle grouping multiple instances together, monitoring tools, and the like. Figure 8-17. Multiple microservices per application container This setup can also yield benefits in terms of reducing overhead of language runtimes. Consider running five Java services in a single Java servlet container. I have the overhead of only a single JVM. Compare this with running five independent JVMs on the same host when using...

---

## Platform as a Service (PaaS)

Platform as a Service (PaaS) When using Platform as a Service (PaaS), you are working at a higher-level abstraction than a single host. Some of these platforms rely on taking a technology-specific artifact, such as a Java WAR file or Ruby gem, and automatically provisioning and running it for you. Some of these platforms will transparently attempt to handle scaling the system up and down for you; others will allow you some control over how many nodes your service might run on, but they handle th...

---

## Function as a Service (FaaS)

parts we like to build what we need. It is against this backdrop that Function as a Service, a specific type of serverless product, has been getting a lot of traction. Assessing the suitability of PaaS offerings for microservices is difficult, as they come in many shapes and sizes. Heroku looks quite different from Netlify, for example, but both could work for you as a deployment platform for your microservices, depending on the nature of your application. Function as a Service (FaaS) In the las...

---

## Which Deployment Option Is Right for You?

managing a single aggregate that could easily be handled by a single function. The way forward I remain convinced that the future for most developers is using a platform that hides much of the underlying detail from them. For many years, Heroku was the closest thing I could point to in terms of something that found the right balance, but now we have FaaS and the wider ecosystem of turnkey serverless offerings that chart a different path. There are still issues to be ironed out with FaaS, but I f...

---

## Kubernetes and Container Orchestration

are even less likely to come into contact with these tools than they were in the past. The concept of infrastructure as code is still vitally important. It’s just that the type of tools developers are likely to use has changed. For those working with the cloud, for example, things like Terraform can be very useful for provisioning cloud infrastructure. Recently, I’ve become a big fan of Pulumi , which eschews the use of domain-specific languages (DSLs) in favor of using normal programming langua...

---

## The Case for Container Orchestration

are even less likely to come into contact with these tools than they were in the past. The concept of infrastructure as code is still vitally important. It’s just that the type of tools developers are likely to use has changed. For those working with the cloud, for example, things like Terraform can be very useful for provisioning cloud infrastructure. Recently, I’ve become a big fan of Pulumi , which eschews the use of domain-specific languages (DSLs) in favor of using normal programming langua...

---

## A Simplified View of Kubernetes Concepts

software be defined on multiple machines, perhaps to handle sufficient load, or to ensure that the system has redundancy in place to tolerate the failure of a single node. Container orchestration platforms handle how and where container workloads are run. The term “scheduling” starts to make more sense in this context. The operator says, “I want this thing to run,” and the orchestrator works out how to schedule that job—finding available resources, reallocating them if necessary, and handling th...

---

## Multitenancy and Federation

running pods using a deployment . It seems easy when I say that, doesn’t it? Let’s just say I’ve left out quite a bit of stuff here for the sake of brevity. Multitenancy and Federation From an efficiency point of view, you’d want to pool all the computing resources available to you in a single Kubernetes cluster and have all workloads run there from all across your organization. This would likely give you a higher utilization of the underlying resources, as unused resources could be freely reall...

---

## The Cloud Native Computing Federation

Moreover, concerns regarding the cost of migration from one provider to another meant that such a position of market dominance would be hard to shift. And then along comes Kubernetes, with its promise of being able to deliver a standard platform for running container workloads that could be run by multiple vendors. The hope was that this would enable migration from one provider to another and avoid an AWS-only future. So you can see Kubernetes as a generous contribution from Google to the wider ...

---

## Platforms and Portability

word regarding the usefulness of the projects it curates. It’s also acted as a place where the evolution of major projects can be discussed in the open, ensuring a lot of broad input. The CNCF has played a huge part in the success of Kubernetes—it’s easy to imagine that without it, we’d still have a fragmented landscape in this area. Platforms and Portability You’ll often hear Kubernetes described as a “platform.” It’s not really a platform in the sense that a developer would understand the term...

---

## Helm, Operators, and CRDs, Oh My!

One area of continuing confusion in the space of Kubernetes is how to manage the deployment and life cycle of third-party applications and subsystems. Consider the need to run Kafka on your Kubernetes cluster. You could create your own pod, service, and deployment specifications and run them yourself. But what about managing an upgrade to your Kafka setup? What about other common maintenance tasks you might want to deal with, like upgrading running stateful software? A number of tools have emerg...

---

## And Knative

Knative is an open source project that aims to provide FaaS-style workflows to developers, using Kubernetes under the hood. Fundamentally, Kubernetes isn’t terribly developer friendly, especially if we compare it to the usability of things like Heroku or similar platforms. The aim with Knative is to bring the developer experience of FaaS to Kubernetes, hiding the complexity of Kubernetes from developers. In turn, this should mean development teams are able to more easily manage the full life cyc...

---

## The Future

The Future Going forward, I see no signs that the rampaging juggernaut of Kubernetes will halt any time soon, and I fully expect to see more organizations implementing their own Kubernetes clusters for private clouds or making use of managed clusters in public cloud settings. However, I think what we’re seeing now, with developers having to learn how to use Kubernetes directly, will be a relatively short-lived blip. Kubernetes is great at managing container workloads and providing a platform for...

---

## Should You Use It?

The Future Going forward, I see no signs that the rampaging juggernaut of Kubernetes will halt any time soon, and I fully expect to see more organizations implementing their own Kubernetes clusters for private clouds or making use of managed clusters in public cloud settings. However, I think what we’re seeing now, with developers having to learn how to use Kubernetes directly, will be a relatively short-lived blip. Kubernetes is great at managing container workloads and providing a platform for...

---

## Progressive Delivery

Before you decide to start using Kubernetes, get some of your administrators and developers using it. The developers can get started running something lightweight locally, such as minikube or MicroK8s, giving them something pretty close to a full Kubernetes experience, but on their laptops. The people you’ll have managing the platform may need a deeper dive. Katacoda has some great online tutorials for coming to grips with the core concepts, and the CNCF helps put out a lot of training materials...

---

## Separating Deployment from Release

they think about releasing software. These organizations make use of techniques like feature toggles, canary releases, parallel runs, and more, which we’ll detail in this section. This shift in how we think about releasing functionality falls under the banner of what is called progressive delivery . Functionality is released to users in a controlled manner; instead of a big-bang deployment, we can be smart about who sees what functionality—for example, by rolling out a new version of our softwar...

---

## On to Progressive Delivery

James Governor, cofounder of developer-focused industry analyst firm RedMonk, first coined the term progressive delivery to cover a number of different techniques being used in this space. He has gone on to describe progressive delivery as “continuous delivery with fine-grained control over the blast radius” —so it’s an extension of continuous delivery but also a technique that gives us the ability to control the potential impact of our newly released software. Picking up this theme, Adam Zimman...

---

## Feature Toggles

James Governor, cofounder of developer-focused industry analyst firm RedMonk, first coined the term progressive delivery to cover a number of different techniques being used in this space. He has gone on to describe progressive delivery as “continuous delivery with fine-grained control over the blast radius” —so it’s an extension of continuous delivery but also a technique that gives us the ability to control the potential impact of our newly released software. Picking up this theme, Adam Zimman...

---

## Canary Release

discuss next. Fully managed solutions exist for managing feature toggles, including LaunchDarkly and Split . Impressive as these platforms are, I think you can get started with something much simpler—just a configuration file can do for a start, then look at these technologies as you start pushing how you want to use the toggles. For a much deeper dive into the world of feature toggles, I can heartily recommend Pete Hodgson’s writeup “Feature Toggles (aka Feature Flags)” , which goes into a lot ...

---

## Parallel Run

the like. Nowadays, it’s more common to see this process handled in an automated fashion. Tools like Spinnaker for example have the ability to automatically ramp up calls based on metrics, such as increasing the percentage of calls to a new microservice version if the error rates are at an acceptable level. Parallel Run With a canary release, a request to a piece of functionality will be served by either the old or the new version. This means we can’t compare how the two versions of functionalit...

---

## Summary

TIP With blue-green deployment, feature toggles, canary releases, and parallel runs we’ve just scratched the surface of the field of progressive delivery. These ideas can work well together (we’ve already touched on how you could use feature toggles to implement a canary rollout for example), but you probably want to ease yourself in. To start off, just remember to separate the two concepts of deployment and release. Next, start looking for ways to help you deploy your software more frequently, ...

---
