---
sidebar_position: 12
title: 'Chapter 11: Security'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-11
---

# Chapter 11: Security

**Part I — Foundation**

> I	want	to	preface	this	chapter	by	saying	that	I	do	not	consider	myself	to	be	an

---

## Core Principles

Fundamental concepts that are useful to embrace when looking to build more secure software The five functions of cybersecurity Identify, protect, detect, respond, and recover—an overview of the five key function areas for application security Foundations of application security Some specific fundamental concepts of application security and how they apply to microservices, including credentials and secrets, patching, backups, and rebuild Implicit trust versus zero trust Different approaches for t...

---

## Principle of Least Privilege

Thus, there are some fundamental aspects of application security that we need to look at, however briefly, to highlight the plethora of issues you need to be aware of. We will look at how these core issues are made more (or less) complex in the context of microservices, but they should also be generally applicable to software development as a whole. For those of you who want to jump ahead to all that “good stuff,” please just make sure you aren’t focusing too much on securing your front door whi...

---

## Defense in Depth

Thus, there are some fundamental aspects of application security that we need to look at, however briefly, to highlight the plethora of issues you need to be aware of. We will look at how these core issues are made more (or less) complex in the context of microservices, but they should also be generally applicable to software development as a whole. For those of you who want to jump ahead to all that “good stuff,” please just make sure you aren’t focusing too much on securing your front door whi...

---

## Automation

Responsive Helping you respond during/after an attack. Having an automated mechanism to rebuild your system, working backups to recover data, and a proper comms plan in place in the wake of an incident can be vital. A combination of all three will be required to properly secure a system, and you may have multiples of each type. Coming back to our castle example, we might have multiple walls, which represent multiple preventative controls. We could have watchtowers in place and a beacon system so...

---

## Build Security into the Delivery Process

Like so many other aspects of software delivery, security is all too often considered an afterthought. Historically at least, addressing security aspects of a system is something that is done after the code has been written, potentially leading to significant reworking later on. Security has often been looked at as something of a blocker to getting software out the door. Over the last 20 years, we’ve seen similar issues with testing, usability, and operations. These aspects of software delivery ...

---

## The Five Functions of Cybersecurity

vulnerabilities. Where these tools can be easily integrated into normal CI builds, integrating them into your standard check-ins is a great place to start. Of course, it’s worth noting that many of these types of tools can address only local issues —for example, a vulnerability in a specific piece of code. They don’t replace the need to understand the security of your system at a wider, systemic level. The Five Functions of Cybersecurity With those core principles at the back of our minds, let’s...

---

## Identify

be after our stuff and what exactly they might be looking for. It’s often hard to put ourselves into the mindset of an attacker, but that’s exactly what we need to do to ensure that we focus our efforts in the right place. Threat modeling is the first thing you should look at when addressing this aspect of application security. As human beings, we are quite bad at understanding risk. We often fixate on the wrong things while ignoring the bigger problems that can be just out of sight. This of cou...

---

## Protect

and understand just where your biggest risks are, you may well end up missing the places where your time is better spent. The goal of threat modeling is about helping you understand what an attacker might want from your system. What are they after? Will different types of malicious actors want to gain access to different assets? Threat modeling, when done right, is largely about putting yourself in the mind of the attacker, thinking from the outside in. This outsider view is important, and it’s ...

---

## Detect

Detect With a microservice architecture, detecting an incident can be more complex. We have more networks to monitor and more machines to keep an eye on. The sources of information are greatly increased, which can make detecting problems all the more difficult. Many of the techniques we explored in Chapter 10 , such as log aggregation, can help us gather information that will help us detect that something bad might be happening. In addition to those, there are special tools like intrusion detect...

---

## Respond

Detect With a microservice architecture, detecting an incident can be more complex. We have more networks to monitor and more machines to keep an eye on. The sources of information are greatly increased, which can make detecting problems all the more difficult. Many of the techniques we explored in Chapter 10 , such as log aggregation, can help us gather information that will help us detect that something bad might be happening. In addition to those, there are special tools like intrusion detect...

---

## Recover

organization that focuses on openness and safety will be best placed to learn the lessons that ensure that similar incidents are less likely to happen. We’ll come back to this in “Blame” . Recover Recovery refers to our ability to get the system up and running again in the wake of an attack, and also our ability to implement what we have learned to ensure problems are less likely to happen again. With a microservice architecture, we have many more moving parts, which can make recovery more compl...

---

## Foundations of Application Security

organization that focuses on openness and safety will be best placed to learn the lessons that ensure that similar incidents are less likely to happen. We’ll come back to this in “Blame” . Recover Recovery refers to our ability to get the system up and running again in the wake of an attack, and also our ability to implement what we have learned to ensure problems are less likely to happen again. With a microservice architecture, we have many more moving parts, which can make recovery more compl...

---

## Credentials

organization that focuses on openness and safety will be best placed to learn the lessons that ensure that similar incidents are less likely to happen. We’ll come back to this in “Blame” . Recover Recovery refers to our ability to get the system up and running again in the wake of an attack, and also our ability to implement what we have learned to ensure problems are less likely to happen again. With a microservice architecture, we have many more moving parts, which can make recovery more compl...

---

## Patching

things such that each instance of Inventory gets a different set of credentials. This means that we could rotate each credential independently, or just revoke the credential for one of the instances if that is what becomes compromised. Moreover, with more specific credentials it can be easier to find out from where and how the credential was obtained. There are obviously other benefits that come from having a uniquely identifiable username for a microservice instance here; it might be easier to ...

---

## Backups

A bug in a third-party library can leave our application vulnerable to attack. In the case of the Equifax breach, the unpatched vulnerability was actually in Struts —a Java web framework. At scale, working out which microservices are linking to libraries with known vulnerabilities can be incredibly difficult. This is an area in which I strongly recommend the use of tools like Snyk or GitHub code scanning, which is able to automatically scan your third-party dependencies and alert you if you are ...

---

## Rebuild

AVOID THE SCHRÖDINGER BACKUP When creating backups, you want to avoid what I call the Schrödinger backup. This is a backup that may or may not actually be a backup. Until you actually try and restore it, you really don’t know if it’s actually a backup use, or if it’s just a bunch of 1s and 0s written to disk. The best way to avoid this problem is to ensure that the backup is real by actually restoring it. Find ways to build regular restoration of backups into your software development process—fo...

---

## Implicit Trust Versus Zero Trust

activities. Implicit Trust Versus Zero Trust Our microservice architecture consists of lots of communication between things. Human users interact with our system via user interfaces. These user interfaces in turn make calls to microservices, and microservices end up calling yet more microservices. When it comes to application security, we need to consider the issue of trust among all those points of contact. How do we establish an acceptable level of trust? We’ll explore this topic shortly in te...

---

## Implicit Trust

activities. Implicit Trust Versus Zero Trust Our microservice architecture consists of lots of communication between things. Human users interact with our system via user interfaces. These user interfaces in turn make calls to microservices, and microservices end up calling yet more microservices. When it comes to application security, we need to consider the issue of trust among all those points of contact. How do we establish an acceptable level of trust? We’ll explore this topic shortly in te...

---

## Zero Trust

— When a Stranger Calls When operating in a zero-trust environment, you have to assume that you are operating in an environment that has already been compromised—the computers you are talking to could have been compromised, the inbound connections could be from hostile parties, the data you are writing could be read by bad people. Paranoid? Yes! Welcome to zero trust. Zero trust, fundamentally, is a mindset. It’s not something you can magically implement using a product or tool; it’s an idea and...

---

## It’s a Spectrum

It’s a Spectrum I don’t mean to imply that you have a stark choice between implicit and zero trust. The extent to which you trust (or don’t) other parties in your system could change based on the sensitivity of the information being accessed. You might decide, for example, to adopt a concept of zero trust for any microservices handling PII but be more relaxed in other areas. Again, the cost of any security implementation should be justified (and driven) by your threat model. Let your understandi...

---

## Securing Data

Figure 11-5. Deploying microservices into different zones based on the sensitivity of the data they handle Microservices within each zone could communicate with each other but were unable to directly reach across to access data or functionality in the lower, more secure zones. Microservices in the more secure zones could reach up to access functionality running in the less secure zones, though. Here, MedicalCo has given itself the flexibility to vary its approach in each zone. The less secure pu...

---

## Data in Transit

nightmare when it comes to securing our application, if we aren’t careful. Let’s look in more detail at how we can protect our data as it moves over networks, and as it sits at rest. Data in Transit The nature of the protections you have will depend largely on the nature of the communication protocols you have picked. If you are using HTTP, for example, it would be natural to look at using HTTP with Transport Layer Security (TLS), a topic we’ll expand on more in the next section; but if you’re u...

---

## Data at Rest

We could imagine a number of situations in which manipulating data being sent could be bad—changing the amount of money being sent, for example. So in Figure 11-6 , we need to make sure the potential attacker is unable to change the request being sent to Payment from the Order Processor . Typically, the types of protections that make data invisible will also ensure that the data can’t be manipulated (HTTPS does that, for instance). However, we could decide to send data in the open but still want...

---

## Authentication and Authorization

Again, this stuff is complex. Avoid implementing your own encryption, and do some good research! TIP Encrypt data when you first see it. Only decrypt on demand, and ensure that data is never stored anywhere. Encrypt backups Backups are good. We want to back up our important data. And it may seem like an obvious point, but if the data is sensitive enough that we want it to be encrypted in our running production system, then we will probably also want to make sure that any backups of the same data...

---

## Service-to-Service Authentication

system. We don’t want everyone to have to log in separately to access different microservices, using a different username and password for each one. So we also need to look at how we can implement single sign-on (SSO) in a microservices environment. Service-to-Service Authentication Earlier we discussed mutual TLS, which, aside from protecting data in transit, also allows us to implement a form of authentication. When a client talks to a server using mutual TLS, the server is able to authenticat...

---

## Human Authentication

system. We don’t want everyone to have to log in separately to access different microservices, using a different username and password for each one. So we also need to look at how we can implement single sign-on (SSO) in a microservices environment. Service-to-Service Authentication Earlier we discussed mutual TLS, which, aside from protecting data in transit, also allows us to implement a form of authentication. When a client talks to a server using mutual TLS, the server is able to authenticat...

---

## Common Single Sign-On Implementations

be a must. Common Single Sign-On Implementations A common approach to authentication is to use some sort of single sign-on (SSO) solution to ensure that a user has only to authenticate themselves only once per session, even if during that session they may end up interacting with multiple downstream services or applications. For example, when you log in with your Google account, you are logged in on Google Calendar, Gmail, and Google Docs, even though these are separate systems. When a principal ...

---

## Single Sign-On Gateway

part to its relative simplicity and widespread support, it is the dominant mechanism for end-user SSO, and has gained significant inroads into enterprises. Single Sign-On Gateway We could decide to handle the redirection to, and handshaking with, the identity provider within each microservice, so that any unauthenticated request from an outside party is properly dealt with. Obviously, this could mean a lot of duplicated functionality across our microservices. A shared library could help, but we’...

---

## Fine-Grained Authorization

sure your developers can launch their services behind one without too much work. One final problem with this approach is that it can lull you into a false sense of security. Again, I like to return to the idea of defense in depth—from network perimeter to subnet, firewall, machine, operating system, and the underlying hardware. You have the ability to implement security measures at all of these points. I have seen some people put all their eggs in one basket, relying on the gateway to handle eve...

---

## The Confused Deputy Problem

These decisions need to be local to the microservice in question. I have seen people use the various attributes supplied by identity providers in horrible ways, using really fine-grained roles like CALL_CENTER_50_DOLLAR_REFUND , where they end up putting information specific to one piece of microservice functionality into their directory services. This is a nightmare to maintain and gives very little scope for our services to have their own independent life cycle, as suddenly a chunk of informat...

---

## Centralized, Upstream Authorization

user in question, we aren’t providing sufficient authorization . What we want is some part of our system to be able to judge that a request to see User A’s details can be granted only if it’s User A asking to see them. Where does this logic live, though? Centralized, Upstream Authorization One option for avoiding the confused deputy problem is to perform all required authorization as soon as the request is received in our system. In Figure 11-8 , this would mean that we would aim to authorize th...

---

## Decentralizing Authorization

so it would make logical sense for that service to decide if the call is valid. In this specific case, though, the Order microservice needs information about what human is making the request. So how do we get that information to the Order microservice? At the simplest level, we could just require that the identifier for the person making the request be sent to the Order microservice. If using HTTP, for example, we could just stick the username in a header. But in such a case, what’s to stop a ma...

---

## JSON Web Tokens

so it would make logical sense for that service to decide if the call is valid. In this specific case, though, the Order microservice needs information about what human is making the request. So how do we get that information to the Order microservice? At the simplest level, we could just require that the identifier for the person making the request be sent to the Order microservice. If using HTTP, for example, we could just stick the username in a header. But in such a case, what’s to stop a ma...

---

## Summary

my client worked out that for any given track it could potentially need up to 10,000 entries in a token to deal with the different scenarios. We realized, though, that at least in that domain, it was only one particular use case that needed this large amount of information, whereas the bulk of the system could make do with a simple token with fewer fields. In such a situation, it made sense to deal with the more complex rights management authorization process in a different way—essentially using...

---
