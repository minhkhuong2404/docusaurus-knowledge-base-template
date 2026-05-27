---
sidebar_position: 8
title: 'Chapter 7: Build'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-07
---

# Chapter 7: Build

**Part I — Foundation**

> We’ve	spent	a	lot	of	time	covering	the	design	aspects	of	microservices,	but	we

---

## A Brief Introduction to Continuous Integration

Chapter 7. Build We’ve spent a lot of time covering the design aspects of microservices, but we need to start getting a bit deeper into how your development process may need to change to accommodate this new style of architecture. In the following chapters, we’ll look at how we deploy and test our microservices, but before that we need to look at what comes first—what happens when a developer has a change ready to check in? We’ll start this exploration by reviewing some foundational concepts— co...

---

## Are You Really Doing CI?

This is so we can avoid doing the same thing over and over again, and so we can confirm that the artifacts we deploy are the ones we tested. To enable these artifacts to be reused, we place them in a repository of some sort, either provided by the CI tool itself or in a separate system. We’ll be looking at the role of artifacts in more depth shortly, and we’ll look in depth at testing in Chapter 9 . CI has a number of benefits. We get fast feedback as to the quality of our code, through the use ...

---

## Branching Models

least once a day. Do you have a suite of tests to validate your changes? Without tests, we just know that syntactically our integration has worked, but we don’t know if we have broken the behavior of the system. CI without some verification that our code behaves as expected isn’t CI. When the build is broken, is it the #1 priority of the team to fix it? A passing green build means our changes have safely been integrated. A red build means the last change possibly did not integrate. You need to s...

---

## Build Pipelines and Continuous Delivery

impact of “long lived” branches: Our research findings extend to open source development in some areas: Committing code sooner is better: In open source projects, many have observed that merging patches faster to prevent rebases helps developers move faster. Working in small batches is better: Large “patch bombs” are harder and slower to merge into a project than smaller, more readable patchsets since maintainers need more time to review the changes. Whether you are working on a closed-source co...

---

### Tooling

Tooling Ideally, you want a tool that embraces continuous delivery as a first-class concept. I have seen many people try to hack and extend CI tools to make them do CD, often resulting in complex systems that are nowhere near as easy to use as tools that build in CD from the beginning. Tools that fully support CD allow you to define and visualize these pipelines, modeling the entire path to production for your software. As a version of our code moves through the pipeline, if it passes one of the...

---

## Trade-Offs and Environments

Tooling Ideally, you want a tool that embraces continuous delivery as a first-class concept. I have seen many people try to hack and extend CI tools to make them do CD, often resulting in complex systems that are nowhere near as easy to use as tools that build in CD from the beginning. Tools that fully support CD allow you to define and visualize these pipelines, modeling the entire path to production for your software. As a version of our code moves through the pipeline, if it passes one of the...

---

## Artifact Creation

Figure 7-3. Balancing a build pipeline for fast feedback and production-like execution environments You get the fastest feedback on your development laptop—but that is far from production-like. You could roll out every commit to an environment that is a faithful reproduction of your actual production environment, but that will likely take longer and cost more. So finding the balance is key, and continuing to review the trade-off between fast feedback and the need for production-like environments...

---

## Mapping Source Code and Builds to Microservices

ARTIFACT CREATION TIPS Build a deployment artifact for your microservice once. Reuse this artifact everywhere you want to deploy that version of your microservice. Keep your deployment artifact environment- agnostic—store environment-specific configuration elsewhere. Mapping Source Code and Builds to Microservices We’ve already looked at one topic that can excite warring factions—feature branching versus trunk-based development—but it turns out that the controversy isn’t over for this chapter. A...

---

## One Giant Repo, One Giant Build

ARTIFACT CREATION TIPS Build a deployment artifact for your microservice once. Reuse this artifact everywhere you want to deploy that version of your microservice. Keep your deployment artifact environment- agnostic—store environment-specific configuration elsewhere. Mapping Source Code and Builds to Microservices We’ve already looked at one topic that can excite warring factions—feature branching versus trunk-based development—but it turns out that the controversy isn’t over for this chapter. A...

---

## Pattern: One Repository per Microservice (aka Multirepo)

deploying everything together, which we really want to avoid. Furthermore, if my one-line change to the User service breaks the build, no other changes can be made to the other services until that break is fixed. And think about a scenario in which you have multiple teams all sharing this giant build. Who is in charge? Arguably, this approach is a form of monorepo. In practice, however, most of the monorepo implementations I’ve seen map multiple builds to different parts of the repo, something w...

---

## Pattern: Monorepo

Pattern: Monorepo With a monorepo approach, code for multiple microservices (or other types of projects) is stored in the same source code repository. I have seen situations in which a monorepo is used just by one team to manage source control for all its services, although the concept has been popularized by some very large tech companies where multiple teams and hundreds if not thousands of developers can all work on the same source code repository. By having all the source code in the same re...

---

## Which Approach Would I Use?

arguably providing most of the advantages of a monorepo approach while sidestepping some of the challenges that occur at larger scale. This halfway house can make a lot of sense in terms of working within existing organizational ownership boundaries, and it can somewhat mitigate the concerns about the use of this pattern at larger scale. Where to use this pattern Some organizations working at very large scale have found the monorepo approach to work very well for them. We’ve already mentioned Go...

---

## Summary

after that rapid growth has occurred that the problems become evident, at which point the cost of migration to a multirepo approach looks too high. This can lead to the sunk cost fallacy: you’ve invested so much in making the monorepo work up to this point—just a bit more investment will make it work as well as it used to, right? Perhaps not—but it’s a brave soul who can recognize that they are throwing good money after bad and make a decision to change course. The concerns about ownership and m...

---
