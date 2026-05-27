---
sidebar_position: 16
title: 'Chapter 15: Organizational Structures'
description: '**Part III — People**'
tags:
- books
- building-microservice
- chapter-15
---

# Chapter 15: Organizational Structures

**Part III — People**

> While	much	of	the	book	so	far	has	focused	on	the	technical	challenges	in

---

## Loosely Coupled Organizations

Chapter 15. Organizational Structures While much of the book so far has focused on the technical challenges in moving toward a fine-grained architecture, we’ve also looked at the interplay between our microservice architecture and how we organize our teams. In “Toward Stream-Aligned Teams” , we looked at the concept of stream-aligned teams, which have end-to-end responsibility for delivery of user-facing functionality, and at how microservices can help make such team structures a reality. We now...

---

## Conway’s Law

architecture a bit more. Conway’s Law Our industry is young and seems to be constantly reinventing itself. And yet a few key “laws” have stood the test of time. Moore’s law, for example, states that the density of transistors on integrated circuits doubles every two years, and it has proved to be uncannily accurate (although that trend has been slowing). One law that I have found to be almost universally true, and to be far more useful in my day-to-day work, is Conway’s law. Melvin Conway’s pape...

---

### Evidence

architecture a bit more. Conway’s Law Our industry is young and seems to be constantly reinventing itself. And yet a few key “laws” have stood the test of time. Moore’s law, for example, states that the density of transistors on integrated circuits doubles every two years, and it has proved to be uncannily accurate (although that trend has been slowing). One law that I have found to be almost universally true, and to be far more useful in my day-to-day work, is Conway’s law. Melvin Conway’s pape...

---

## Team Size

(or breakfast!), nor how big the pizzas are—but again, the general idea is that the optimum team size is 8–10 people, and that this team should be customer facing. This driver for small teams owning the whole life cycle of their services is a major reason why Amazon developed Amazon Web Services. It needed to create the tooling to allow its teams to be self-sufficient. Netflix learned from this example and ensured that from the beginning it structured itself around small, independent teams, so t...

---

## Understanding Conway’s Law

to coordinate on work. I do have an (untested) hypothesis that being geographically dispersed or having large time-zone differences among team members will cause challenges that might further limit the optimum team size, but that thinking is likely better explored by someone other than me. So small teams good, large teams bad. That seems pretty straightforward. Now, if you can do all the work you need to do with a single team, then great! Your world is a simple one, and you could probably skip m...

---

## Small Teams, Large Organization

organization can react is significantly blunted. This is compounded as the organization grows—the bigger it becomes, the more its centralized nature reduces the efficiency of decision making and the speed of action. Organizations have increasingly recognized that if you want to scale your organization but still want to move quickly, you need to distribute responsibility more effectively, breaking down central decision making and pushing decisions into parts of the organization that can operate w...

---

## On Autonomy

— John Timpson Having lots of small teams isn’t by itself going to help if these teams just become more silos that are still dependent on other teams to get things done. We need to ensure that each of these small teams has the autonomy to do the job it is responsible for. This means we need to give the teams more power to make decisions, and the tools to ensure they can get as much done as possible without having to constantly coordinate work with other teams. So enabling autonomy is key. Many o...

---

## Strong Versus Collective Ownership

pizza team model, or the “Spotify model” that popularized the concept of guilds and chapters. I should sound a note of caution here, of course—by all means, learn from what other organizations do, but understand that copying what someone else does and expecting the same results, without actually understanding why the other organization does the things it does, may not result in the outcome you want. If done right, team autonomy can empower people, help them step up and grow, and get the job done...

---

### Strong Ownership

Strong Ownership With strong ownership, the team owning the microservice calls the shots. At the most basic level, it is in full control of what code changes are made. Taken further, the team may be able to decide on coding standards, programming idioms, when to deploy the software, what technology is used to build the microservice, the deployment platform, and more. By having more responsibility for the changes that happen to the software, teams with strong ownership will have a higher degree o...

---

### Collective Ownership

change. Of course, throwing people at a problem doesn’t always make you go faster, but with collective ownership you certainly do have more flexibility in this regard. With teams—and people—moving more frequently from microservice to microservice, we require a higher degree of consistency about how things are done. You can’t afford a broad range of technology choices or different types of deployment models if you expect a developer to work on a different microservice each week. To get any degree...

---

### At a Team Level Versus an Organizational Level

The concepts of strong and collective ownership can be applied at different levels of an organization. Within a team, you want people to be on the same page, able to efficiently collaborate with each other, and you want to ensure a high degree of collective ownership as a result. As an example, this would manifest itself in terms of all members of a team being able to directly make changes to the codebase. A poly-skilled team focused on the end-to-end delivery of customer-facing software will ne...

---

### Balancing Models

The concepts of strong and collective ownership can be applied at different levels of an organization. Within a team, you want people to be on the same page, able to efficiently collaborate with each other, and you want to ensure a high degree of collective ownership as a result. As an example, this would manifest itself in terms of all members of a team being able to directly make changes to the codebase. A poly-skilled team focused on the end-to-end delivery of customer-facing software will ne...

---

## Enabling Teams

great deal of responsibility into the teams themselves, there can still be value in having a function in your delivery organization that can perform this balancing act. Enabling Teams We last looked at enabling teams in “Sharing Specialists” in the context of user interfaces, but they have broader applicability than that. As described in Team Topologies , these are the teams that work to support our stream-aligned teams. Wherever our microservice-owning, end-to-end focused stream-aligned teams a...

---

### Communities of Practice

Figure 15-3. Each team has picked a different programming language An enabling team can help identify problems that would be better fixed outside of the teams as well. Consider a scenario in which each team was finding it painful to spin up databases with test data in them. Each team had worked around this issue in different ways, but the issue was never important enough for any team to fix it properly. But then we look across multiple teams and find that many of them might benefit from a proper...

---

### The Platform

CoPs and enabling teams can work very effectively together, of course. Often, a CoP is able to provide valuable insights that can help an enabling team better understand what is needed. Consider a Kubernetes CoP sharing its experience of how painful it was to work on its company’s development cluster with the platform team that manages the cluster. On the subject of platform teams, that is a topic worth looking into in more detail. The Platform To return to our loosely coupled, stream-aligned te...

---

## Shared Microservices

still need to be clearly communicated, and the reasons for them made clear. The platform can then play a role in making these things easy to do. By using the platform, you are on the paved road—you’ll end up doing a lot of the right things without having to expend much effort. On the other hand, I see some organizations try to govern via the platform. Rather than clearly articulate what needs to be done and why, instead they simply say “you must use this platform.” The problem with this is that ...

---

### Too Hard to Split

still need to be clearly communicated, and the reasons for them made clear. The platform can then play a role in making these things easy to do. By using the platform, you are on the paved road—you’ll end up doing a lot of the right things without having to expend much effort. On the other hand, I see some organizations try to govern via the platform. Rather than clearly articulate what needs to be done and why, instead they simply say “you must use this platform.” The problem with this is that ...

---

### Cross-Cutting Changes

purposes shared by multiple teams, and the increased cost of working in this shared codebase was obvious. Cross-Cutting Changes Much of what we’ve discussed so far in this book regarding the interplay of organizational structure and architecture is aimed toward reducing the need for coordination between teams. Most of this is about trying to reduce cross-cutting changes as much as we can. We do, though, have to recognize that some cross- cutting changes may be unavoidable. FinanceCo hit one such...

---

### Delivery Bottlenecks

large backlog of changes that need to be made in a single service? Let’s return to MusicCorp, and let’s imagine that we are rolling out the ability for a customer to see the genre of a track across our products, as well as adding a brand new type of stock: virtual musical ringtones for the mobile phone. The website team needs to make a change to surface the genre information, with the mobile app team working to allow users to browse, preview, and buy the ringtones. Both changes need to be made t...

---

## Internal Open Source

Internal Open Source Many organizations have decided to implement some form of internal open source, both to help manage the issue of shared codebases, and to make it easier for people outside a team to contribute changes to a microservice they may be making use of. With normal open source, a small group of people are considered core committers. They are the custodians of the code. If you want a change to an open source project, either you ask one of the committers to make the change for you or ...

---

### Role of the Core Committers

Internal Open Source Many organizations have decided to implement some form of internal open source, both to help manage the issue of shared codebases, and to make it easier for people outside a team to contribute changes to a microservice they may be making use of. With normal open source, a small group of people are considered core committers. They are the custodians of the code. If you want a change to an open source project, either you ask one of the committers to make the change for you or ...

---

### Maturity

clear: either way takes time. When considering allowing untrusted committers to submit changes to your codebase, you have to decide if the overhead of being a gatekeeper is worth the trouble: could the core team be doing better things with the time it spends vetting patches? Maturity The less stable or mature a service is, the harder it will be to allow people outside the core team to submit patches. Before the key spine of a service is in place, the team may not know what “good” looks like and ...

---

### Tooling

clear: either way takes time. When considering allowing untrusted committers to submit changes to your codebase, you have to decide if the overhead of being a gatekeeper is worth the trouble: could the core team be doing better things with the time it spends vetting patches? Maturity The less stable or mature a service is, the harder it will be to allow people outside the core team to submit patches. Before the key spine of a service is in place, the team may not know what “good” looks like and ...

---

## Pluggable, Modular Microservices

clear: either way takes time. When considering allowing untrusted committers to submit changes to your codebase, you have to decide if the overhead of being a gatekeeper is worth the trouble: could the core team be doing better things with the time it spends vetting patches? Maturity The less stable or mature a service is, the harder it will be to allow people outside the core team to submit patches. Before the key spine of a service is in place, the team may not know what “good” looks like and ...

---

### Change Reviews

to run one service per country—we can run one central microservice that handles the custom functionality for each country. The challenge here is that the country teams aren’t in charge of deciding when their custom functionality goes live. They can make the change and request that this new change be deployed, but the central team would have to schedule this deployment. Furthermore, it’s possible that a bug in one of these country-specific libraries could cause a production issue that the central...

---

## The Orphaned Service

imbalances in the ensemble can further undermine the goal of collective problem solving. Not everyone is comfortable working in a group, and an ensemble is definitely that. Some people will thrive in such an environment, while others will feel totally unable to contribute. When I’ve raised this issue with some proponents of ensemble programming, I’ve gotten a variety of responses, many of which boil down to the belief that if you create the right ensemble environment, anyone will be able to “com...

---

## Case Study: realestate.com.au

Recommendation microservices. Even if the cart service hasn’t been changed in months, it would naturally fall to this team to make changes if required. One of the benefits of microservices, of course, is that if the team needs to change the microservice to add a new feature and does not find the feature to its liking, rewriting it shouldn’t take too long at all. That said, if you’ve adopted a truly polyglot approach and are making use of multiple technology stacks, then the challenges of making ...

---

## Geographical Distribution

team. This coarse-grained communication matched that which existed between the different parts of the business too. By insisting on it being batch, each LOB had a lot of freedom in how it acted and how it managed itself. It could afford to take its services down whenever it wanted, knowing that as long as it could satisfy the batch integration with other parts of the business and its own business stakeholders, no one would care. This structure allowed for significant autonomy not only among the ...

---

## Conway’s Law in Reverse

Conway’s Law in Reverse So far, we’ve spoken about how the organization impacts the system design. But what about the reverse? Namely, can a system design change the organization? While I haven’t been able to find the same quality of evidence to support the idea that Conway’s law works in reverse, I’ve seen it anecdotally. Probably the best example was a client I worked with many years ago. Back in the days when the web was fairly nascent, and the internet was seen as something that arrived on a...

---

## People

In the end we realized that whatever the shortcomings of the system design were, we would have to make changes to the organizational structure to make a shift. The company is now much changed, but it happened over a period of many years. People No matter how it looks at first, it’s always a people problem. — Gerry Weinberg, The Second Law of Consulting We have to accept that in a microservice environment, it is harder for a developer to think about writing code in their own little world. They ha...

---

## Summary

separate team handle frontline support or deployment for a short period, giving your developers time to adjust to new practices. You may, however, have to accept that you need different sorts of people in your organization to make this all work. You will likely need to change how you hire—in fact, it might be easier to show what is possible by bringing in new people from outside who already have experience in working the way you want. The right new hires may well go a long way toward showing oth...

---
