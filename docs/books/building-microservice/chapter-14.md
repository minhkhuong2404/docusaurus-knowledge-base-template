---
sidebar_position: 15
title: 'Chapter 14: User Interfaces'
description: '**Part II — People**'
tags:
- books
- building-microservice
- chapter-14
---

# Chapter 14: User Interfaces

**Part II — People**

> far,	we	haven’t	really	touched	on	the	world	of	the	user	interface.	A	few	of	you

---

## Toward Digital

thinking that web or mobile should be treated differently; they are instead thinking about digital more holistically. What is the best way for our customers to use the services we offer? And what does that do to our system architecture? The understanding that we cannot predict exactly how a customer might end up interacting with our products has driven adoption of more granular APIs, like those delivered by microservices. By combining the capabilities our microservices expose in different ways, ...

---

## Ownership Models

thinking that web or mobile should be treated differently; they are instead thinking about digital more holistically. What is the best way for our customers to use the services we offer? And what does that do to our system architecture? The understanding that we cannot predict exactly how a customer might end up interacting with our products has driven adoption of more granular APIs, like those delivered by microservices. By combining the capabilities our microservices expose in different ways, ...

---

## Drivers for Dedicated Frontend Teams

Figure 14-2. The UI is broken apart and is owned by a team that also manages the server-side functionality that supports the UI Drivers for Dedicated Frontend Teams The desire for dedicated frontend teams seems to come down to three key factors: scarcity of specialists, a drive for consistency, and technical challenges. Firstly, delivering a user interface requires a degree of specialized skills. There are the interaction and graphical design aspects, and then there is the technical know-how req...

---

## Toward Stream-Aligned Teams

ensure your UI has a consistent look and feel. You use a consistent set of controls to solve similar problems so that the user interface looks and feels like a single, cohesive entity. Finally, some user interface technology can be challenging to work with in a non-monolithic fashion. Here I’m thinking specifically of single-page applications (SPAs), which historically at least haven’t been easy to break apart. Traditionally, a web user interface would consist of multiple web pages, and you woul...

---

## Sharing Specialists

the software does or what the users need, which can cause all sorts of misunderstandings when it comes to implementing new functionality. On the other hand, the end-to-end teams will find it much easier to build a direct connection with the people using the software they create—they can be more focused on making sure that the people they are serving are getting what they need. As a concrete example, I spent some time working with FinanceCo, a successful and growing Fintech firm based in Europe. ...

---

## Ensuring Consistency

some dedicated time to help roll out a particularly difficult piece of work. So whether your specialists are embedded full-time in a given team, or work to enable others to do the same work, you can remove organizational silos and also help skill up your colleagues at the same time. Ensuring Consistency The second issue often cited as a reason for dedicated frontend teams is that of consistency. By having a single team responsible for a user interface, you ensure that the UI has a consistent loo...

---

## Working Through Technical Challenges

for Amazon Web Services (AWS). Different products in AWS have massively different interaction models, making the user interface quite bewildering. This, however, seems to be a logical extension of Amazon’s drive to reduce internal coordination between teams. The increased autonomy of product teams in AWS appears to manifest itself in other ways as well, not just in terms of an often disjointed user experience. There frequently are multiple different ways to achieve the same task (by running a co...

---

## Pattern: Monolithic Frontend

Fundamentally, our users want to engage with our software in as seamless a way as possible. Be that through a browser on a desktop, or through a native or web mobile app, the result is the same—users interact with our software through a single pane of glass. They shouldn’t care whether the user interface is built in a modular or monolithic way. So we have to look at ways to break apart our user interface functionality and bring it all back together again, all while resolving the challenges cause...

---

## When to Use It

technology, we can change the layout of a screen to accommodate different device constraints, but this doesn’t necessarily extend to changing the calls being made to the supporting microservices. My mobile client may only be able to display 10 fields of an order, but if the microservice pulls back all one hundred fields of the order, we end up retrieving unnecessary data. One solution to this approach is for the user interface to specify what fields to pull back when it makes a request, but this...

---

## Pattern: Micro Frontends

technology, we can change the layout of a screen to accommodate different device constraints, but this doesn’t necessarily extend to changing the calls being made to the supporting microservices. My mobile client may only be able to display 10 fields of an order, but if the microservice pulls back all one hundred fields of the order, we end up retrieving unnecessary data. One solution to this approach is for the user interface to specify what fields to pull back when it makes a request, but this...

---

## Implementation

frontend functionality associated with their stream of work independent of the other teams. Implementation For web-based frontends, we can consider two key decompositional techniques that can aid implementation of the micro frontend pattern. Widget-based decomposition involves splicing different parts of a frontend together into a single screen. Page-based decomposition, on the other hand, has the frontend split apart into independent web pages. Both approaches are worthy of further exploration,...

---

## When to Use It

frontend functionality associated with their stream of work independent of the other teams. Implementation For web-based frontends, we can consider two key decompositional techniques that can aid implementation of the micro frontend pattern. Widget-based decomposition involves splicing different parts of a frontend together into a single screen. Page-based decomposition, on the other hand, has the frontend split apart into independent web pages. Both approaches are worthy of further exploration,...

---

## Pattern: Page-Based Decomposition

Pattern: Page-Based Decomposition In page-based decomposition, our UI is decomposed into multiple web pages. Different sets of pages can be served from different microservices. In Figure 14- , we see an example of this pattern for MusicCorp. Requests for pages in /albums/ are routed directly to the Albums microservice, which handles serving up those pages, and we do something similar with /artists/ . A common navigation is used to help stitch together these pages. These microservices in turn mig...

---

## Where to Use It

loaded into our browser. Our browsers were built to allow for navigation around these pages, with bookmarks to mark pages of interest and backward and forward controls to revisit previously accessed pages. You might all be rolling your eyes and thinking, “Of course I know how the web works!”; however, it is a style of user interface that seems to have fallen out of favor. Its simplicity is something I miss when I see our current web-based user interface implementations—we’ve lost a lot by automa...

---

## Pattern: Widget-Based Decomposition

loaded into our browser. Our browsers were built to allow for navigation around these pages, with bookmarks to mark pages of interest and backward and forward controls to revisit previously accessed pages. You might all be rolling your eyes and thinking, “Of course I know how the web works!”; however, it is a style of user interface that seems to have fallen out of favor. Its simplicity is something I miss when I see our current web-based user interface implementations—we’ve lost a lot by automa...

---

## Implementation

Figure 14-6. Interactions between the recommendation micro frontend and supporting microservices Generally speaking, you’ll need a “container” application that defines things like the core navigation for the interface and which widgets need to be included. If we were thinking in terms of end-to-end stream-oriented teams, we could imagine a single team providing the recommendation widget and also being responsible for a supporting Recommendations microservice. This pattern is found a lot in the r...

---

## When to Use It

Album Selected event. The recommendation and album details widgets both subscribe to the event and react accordingly, with the recommendations updating based on the selection, and the album details being loaded up. This interaction should of course already be familiar to us, as it mimics the event-driven interaction between microservices that we discussed in “Pattern: Event-Driven Communication” . The only real difference is that these event interactions happen inside the browser. WEB COMPONENTS...

---

## Constraints

techniques and supporting technology around this concept have improved markedly over the last few years, to the extent that, when building an SPA-based web interface, breaking down my UI into micro frontends would be my default approach. My main concerns around widget decomposition in the context of SPAs have to do with the work required to set up the separate bundling of components and the issues around payload size. The former issue is likely a one-time cost and just involves working out what ...

---

## Pattern: Central Aggregating Gateway

services. In some contexts, making it impossible for people to navigate a UI due to design decisions has led to legal action and fines—for example, the UK, with a number of other countries, rightly has legislation in place to ensure access to websites for people with disabilities. Mobile devices have brought a whole host of new constraints. The way our mobile applications communicate with a server can have an impact. It isn’t just about pure bandwidth concerns, where the limitations of mobile ne...

---

## Ownership

Figure 14-9. The server-side central gateway handles filtering and aggregation of calls to downstream microservices Such a gateway could also help batch calls as well. For example, rather than needing to look up 10 order IDs via separate calls, I could send one batch request to the aggregating gateway, and it could handle the rest. Fundamentally, having some sort of aggregating gateway can reduce the number of calls that the external client needs to make and reduce the amount of data that needs ...

---

## Different Types of User Interfaces

natural sense for the gateway to be owned by the team(s) creating the UI. Unfortunately, especially in an organization in which you have a dedicated frontend team, that team may not have the skills to build such a vital backend component. Regardless of who ends up owning the central gateway, it has the potential to become a bottleneck for delivery. If multiple teams need to make changes to the gateway, development on it will require coordination between those teams, slowing things down. If one t...

---

## Multiple Concerns

Figure 14-10. Supporting different aggregating calls for different devices This can lead to a lot of bloat in the gateway, especially if we consider different native mobile applications, customer-facing websites, internal administration interfaces, and the like. We also have the problem, of course, that while these different UIs might be owned by different teams, the gateway is a single unit— we have the same old problems of multiple teams having to work on the same deployed unit. Our single agg...

---

## When to Use It

If you do decide to adopt a single central aggregating gateway, please be careful to limit what functionality you put inside it. I’d be extremely wary of pushing this functionality into a more generic API gateway product, for example, for reasons outlined previously. The concept of doing some form of call filtering and aggregation on the backend can be really important, though, in terms of optimizing the user’s experience of our user interfaces. The issue is that in a delivery organization with ...

---

## Pattern: Backend for Frontend (BFF)

If you do decide to adopt a single central aggregating gateway, please be careful to limit what functionality you put inside it. I’d be extremely wary of pushing this functionality into a more generic API gateway product, for example, for reasons outlined previously. The concept of doing some form of call filtering and aggregation on the backend can be really important, though, in terms of optimizing the user’s experience of our user interfaces. The issue is that in a delivery organization with ...

---

## How Many BFFs?

How Many BFFs? When it comes to delivering the same (or similar) user experience on different platforms, I have seen two different approaches. The model I prefer (and the model I see most often) is to strictly have a single BFF for each different type of client—this is a model I saw used at REA, as outlined in Figure 14-12 . The Android and iOS applications, while covering similar functionality, each had their own BFF. Figure 14-12. The REA iOS and Android applications have different BFFs A vari...

---

## Reuse and BFFs

justify having a single BFF. If, however, they diverge greatly, then having separate BFFs makes more sense. In the case of REA, although there was overlap between the two experiences, different teams owned them and rolled out similar features in different ways. Sometimes the same feature might be deployed differently on a different mobile device—what amounts to a native experience for an Android application might need to be reworked to feel native on iOS. Another lesson from the REA story (and o...

---

## BFFs for Desktop Web and Beyond

calls is manageable. This can allow your web application to make multiple calls directly to downstream services without the need for a BFF. I have seen situations, though, in which the use of a BFF for the web too can be useful. When you are generating a larger portion of the web UI on the server side (e.g., using server-side templating), a BFF is the obvious place where this can be done. This approach can also simplify caching somewhat, as you can place a reverse proxy in front of the BFF, allo...

---

## When to Use

API backend, you may have to keep old versions of the API around just to satisfy a small subset of your outside parties unable to make a change; with a BFF, this problem is substantially reduced. It also limits the impact of breaking changes. You could change the API for Facebook in a way that would break compatibility with other parties, but as they use a different BFF, they aren’t impacted by this change. When to Use For an application that is only providing a web UI, I suspect a BFF will make...

---

## GraphQL

API backend, you may have to keep old versions of the API around just to satisfy a small subset of your outside parties unable to make a change; with a BFF, this problem is substantially reduced. It also limits the impact of breaking changes. You could change the API for Facebook in a way that would break compatibility with other parties, but as they use a different BFF, they aren’t impacted by this change. When to Use For an application that is only providing a web UI, I suspect a BFF will make...

---

## A Hybrid Approach

the order type, we could just add this to the query and the information would be returned. This is a significant advantage over BFF implementations that require changes in aggregation logic to also be applied to the BFF itself. The flexibility that GraphQL gives for the client device to dynamically change the queries being made without server-side changes means that there is less chance of your GraphQL server becoming a shared, contended resource, as we discussed with the general-purpose aggrega...

---

## Summary

the order type, we could just add this to the query and the information would be returned. This is a significant advantage over BFF implementations that require changes in aggregation logic to also be applied to the BFF itself. The flexibility that GraphQL gives for the client device to dynamically change the queries being made without server-side changes means that there is less chance of your GraphQL server becoming a shared, contended resource, as we discussed with the general-purpose aggrega...

---
