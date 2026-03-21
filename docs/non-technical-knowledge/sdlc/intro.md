---
id: intro
title: SDLC Knowledge Base
sidebar_label: Introduction
slug: /non-technical-knowledge/sdlc/
---

# Software Development Life Cycle (SDLC)

> A comprehensive guide covering all phases of the Software Development Life Cycle, testing strategies, deployment practices, and reporting standards used by our engineering teams.

## What is SDLC?

The **Software Development Life Cycle (SDLC)** is a structured process that defines the phases and activities required to plan, design, build, test, deploy, and maintain software systems. It provides a repeatable framework ensuring that software is delivered with consistent quality, on time, and within scope.

## Why SDLC Matters

Without a defined SDLC, software projects are prone to:

- Scope creep and changing requirements without control
- Poor communication between business and engineering teams
- Missed defects reaching production environments
- Unpredictable release timelines
- Difficulty rolling back failed deployments

A well-followed SDLC mitigates all of these risks by creating clear checkpoints, responsibilities, and quality gates at every stage.

---

## SDLC Phases at a Glance

| Phase | Goal | Key Output |
|---|---|---|
| [Planning](./phases/planning) | Define project scope, feasibility, and timeline | Project Charter, Resource Plan |
| [Requirements](./phases/requirements) | Gather and document what the system must do | BRD, User Stories, Acceptance Criteria |
| [System Design](./phases/system-design) | Architect the technical solution | HLD, LLD, API Contracts, DB Schema |
| [Development](./phases/development) | Build and code the software | Source Code, Unit Tests, Code Reviews |
| [Testing](./phases/testing) | Validate correctness and quality | Test Reports, Defect Logs |
| [Deployment](./phases/deployment) | Release software to production | Release Notes, Deployment Runbook |
| [Maintenance](./phases/maintenance) | Support, monitor, and improve | Incident Reports, Patches |

---

## Testing Types Quick Reference

| Test Type | Scope | When |
|---|---|---|
| [Unit Testing](./testing/unit-testing) | Single method/class | During development |
| [Integration Testing](./testing/integration-testing) | Service-to-service | Post-development |
| [Regression Testing](./testing/regression-testing) | Full existing functionality | Before every release |
| [End-to-End Testing](./testing/end-to-end-testing) | Full user journeys | Pre-deployment |
| [Inflight Testing](./testing/inflight-testing) | Live production traffic | During/after deployment |
| [Component Performance Testing](./testing/component-performance-testing) | Single service under load | Before scaling events |

---

## Deployment Strategy Quick Reference

| Strategy | Use When | Risk |
|---|---|---|
| [Roll-Forward](./deployment/roll-forward) | Bug is minor, fix is fast | Low — move forward with hotfix |
| [Roll-Backward](./deployment/roll-backward) | Critical defect, no quick fix | Medium — revert to previous version |

---

## How to Use This Documentation

Navigate using the **sidebar on the left**. Each phase and testing type has its own dedicated page with:

- Goals and objectives
- Step-by-step activities
- Team responsibilities
- Entry and exit criteria
- Tools and templates
- Java/Spring code examples where relevant

:::tip Getting Started
If you are new, start with [Planning](./phases/planning) and follow the phases in order to understand the full lifecycle.
:::
